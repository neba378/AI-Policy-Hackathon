/**
 * Web Parser - Specialized parser for web pages and HTML content
 * Handles OpenAI API docs, system cards, and other web-based documentation
 */

const BaseParser = require('./baseParser');
const cheerio = require('cheerio');

class WebParser extends BaseParser {
    constructor(options = {}) {
        super({
            ...options,
            // Web specific options
            removeSelectors: [
                'nav', 'header', 'footer', '.navigation', '.sidebar',
                '.menu', '.footer', '.advertisement', '.ads',
                'script', 'style', '.hidden', '[style*="display: none"]'
            ],
            contentSelectors: [
                'main', 'article', '.content', '.main-content',
                '.documentation', '.docs-content', '#content'
            ]
        });
    }

    /**
     * Parse web page content
     * @param {string} source - URL or HTML content
     * @param {Object} metadata - Document metadata
     * @returns {Promise<Array>} Array of text chunks with metadata
     */
    async parse(source, metadata = {}) {
        try {
            let html, url;

            if (source.startsWith('http')) {
                // Check if it's an arXiv page - use axios instead of Puppeteer
                if (source.includes('arxiv.org/abs/')) {
                    // arXiv pages are simple HTML, use axios for speed
                    const axios = require('axios');
                    const response = await axios.get(source, {
                        timeout: 30000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                    });
                    html = response.data;
                } else {
                    // Fetch from URL
                    const { smartFetch } = require('../scrapers/puppeteerScraper');
                    html = await smartFetch(source, {
                        forcePuppeteer: true,  // Use Puppeteer for JS-rendered content
                        waitFor: 'domcontentloaded',
                        timeout: 45000,  // Increased timeout
                        waitForImages: false
                    });
                }
                url = source;
            } else {
                // Direct HTML content
                html = source;
                url = metadata.url || 'unknown';
            }

            // Extract text content
            const fullText = this.extractTextFromHTML(html);

            // Create base metadata
            const baseMetadata = {
                sourceId: metadata.sourceId || this.generateSourceId(url),
                sourceUrl: url,
                documentType: metadata.documentType || 'Web Page',
                company: metadata.company,
                model: metadata.model,
                format: 'html',
                title: this.extractTitle(html),
                policyCategories: metadata.policyCategories || []
            };

            // Chunk the text
            const chunks = this.chunkText(fullText, baseMetadata);

            return chunks;

        } catch (error) {
            console.error(`Web parsing error for ${source}:`, error.message);
            throw error;
        }
    }

    /**
     * Extract text content from HTML
     * @param {string} html - HTML content
     * @returns {string} Extracted text content
     */
    extractTextFromHTML(html) {
        const $ = cheerio.load(html);

        // Remove unwanted elements
        this.options.removeSelectors.forEach(selector => {
            $(selector).remove();
        });

        // Special handling for arXiv pages
        if (html.includes('arxiv.org')) {
            // Extract arXiv abstract and metadata
            const title = $('.title').text().replace('Title:', '').trim();
            const abstract = $('.abstract').text().replace('Abstract:', '').trim();
            const authors = $('.authors').text().replace('Authors:', '').trim();

            if (abstract && abstract.length > 100) {
                return this.cleanWebText(`${title}\n\n${authors}\n\n${abstract}`);
            }
        }

        // Try to find main content area
        let contentText = '';
        for (const selector of this.options.contentSelectors) {
            const content = $(selector);
            if (content.length > 0 && content.text().trim().length > 100) {
                contentText = content.text();
                break;
            }
        }

        // Fallback to body text
        if (!contentText) {
            contentText = $('body').text();
        }

        // Clean up the text
        return this.cleanWebText(contentText);
    }

    /**
     * Clean web-extracted text
     * @param {string} text - Raw web text
     * @returns {string} Cleaned text
     */
    cleanWebText(text) {
        return text
            .replace(/\s+/g, ' ')  // Normalize whitespace
            .replace(/\n+/g, ' ')  // Replace multiple newlines
            .replace(/\t+/g, ' ')  // Replace tabs
            .replace(/[^\x20-\x7E\n\r\t]/g, '')  // Remove non-printable chars except common whitespace
            .replace(/\s+/g, ' ')  // Final whitespace normalization
            .trim();
    }

    /**
     * Extract page title from HTML
     * @param {string} html - HTML content
     * @returns {string} Page title
     */
    extractTitle(html) {
        const $ = cheerio.load(html);
        const title = $('title').text().trim();
        if (title) return title;

        // Fallback to h1 or first heading
        const h1 = $('h1').first().text().trim();
        if (h1) return h1;

        return 'Untitled Document';
    }

    /**
     * Generate source ID from URL
     * @param {string} url - Source URL
     * @returns {string} Source ID
     */
    generateSourceId(url) {
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/').filter(p => p);
            const lastPart = pathParts[pathParts.length - 1] || 'index';
            return `${urlObj.hostname}_${lastPart}`.replace(/[^a-zA-Z0-9_]/g, '_');
        } catch (error) {
            return `web_${Date.now()}`;
        }
    }

    /**
     * Extract structured content from web page
     * @param {string} html - HTML content
     * @returns {Object} Structured content
     */
    extractStructuredContent(html) {
        const $ = cheerio.load(html);
        const structured = {
            title: this.extractTitle(html),
            headings: [],
            paragraphs: [],
            codeBlocks: [],
            links: []
        };

        // Extract headings
        $('h1, h2, h3, h4, h5, h6').each((i, el) => {
            const level = parseInt($(el).prop('tagName').charAt(1));
            const text = $(el).text().trim();
            if (text) {
                structured.headings.push({ level, text });
            }
        });

        // Extract paragraphs
        $('p').each((i, el) => {
            const text = $(el).text().trim();
            if (text && text.length > 20) {
                structured.paragraphs.push(text);
            }
        });

        // Extract code blocks
        $('code, pre').each((i, el) => {
            const text = $(el).text().trim();
            if (text) {
                structured.codeBlocks.push(text);
            }
        });

        // Extract important links
        $('a[href]').each((i, el) => {
            const href = $(el).attr('href');
            const text = $(el).text().trim();
            if (text && href && !href.startsWith('#') && !href.startsWith('javascript:')) {
                structured.links.push({ text, href });
            }
        });

        return structured;
    }

    /**
     * Extract text from HTML (implements base class method)
     * @param {string} html - HTML content
     * @returns {Promise<string>} Extracted text
     */
    async extractText(html) {
        return this.extractTextFromHTML(html);
    }
}

module.exports = WebParser;