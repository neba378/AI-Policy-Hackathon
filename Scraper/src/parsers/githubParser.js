/**
 * GitHub Parser - Specialized parser for GitHub repositories
 * Handles README files and documentation in GitHub repos
 */

const BaseParser = require('./baseParser');

class GitHubParser extends BaseParser {
    constructor(options = {}) {
        super({
            ...options,
            // GitHub specific options
            includeReadme: true,
            includeDocs: true,
            maxFiles: 10,
            fileExtensions: ['.md', '.txt', '.rst']
        });
    }

    /**
     * Parse GitHub repository
     * @param {string} source - GitHub URL
     * @param {Object} metadata - Document metadata
     * @returns {Promise<Array>} Array of text chunks with metadata
     */
    async parse(source, metadata = {}) {
        try {
            // For now, treat GitHub URLs as web pages
            // In a full implementation, this would use GitHub API or scraping
            console.log(`GitHub parsing not fully implemented yet for: ${source}`);

            const baseMetadata = {
                sourceId: metadata.sourceId || this.generateSourceId(source),
                sourceUrl: source,
                documentType: metadata.documentType || 'GitHub Repository',
                company: metadata.company,
                model: metadata.model,
                format: 'github',
                policyCategories: metadata.policyCategories || []
            };

            // Placeholder implementation - fetch the main README
            const readmeUrl = source.replace(/\/$/, '') + '/blob/main/README.md';
            const { smartFetch } = require('../scrapers/puppeteerScraper');

            try {
                const html = await smartFetch(readmeUrl, {
                    forcePuppeteer: true,
                    waitFor: 'domcontentloaded',
                    timeout: 15000,
                    waitForImages: false
                });

                // Extract text from GitHub's markdown viewer
                const $ = require('cheerio').load(html);
                const content = $('[data-target="readme-toc.content"]').text() ||
                               $('.markdown-body').text() ||
                               $('article').text();

                if (content && content.trim().length > 100) {
                    const chunks = this.chunkText(content, baseMetadata);
                    return chunks;
                }
            } catch (error) {
                console.log(`Failed to fetch README from ${readmeUrl}: ${error.message}`);
            }

            // Fallback: return placeholder
            return [{
                id: `${baseMetadata.sourceId}_placeholder`,
                text: `GitHub Repository: ${source}\n\nNote: GitHub parsing is under development. This repository contains ${metadata.company} ${metadata.model} documentation and code.\n\nPolicy categories: ${(metadata.policyCategories || []).join(', ')}`,
                metadata: {
                    ...baseMetadata,
                    chunkIndex: 0,
                    totalChunks: 1,
                    charCount: 0,
                    wordCount: 0,
                    createdAt: new Date().toISOString(),
                    parsingStatus: 'partial'
                }
            }];

        } catch (error) {
            console.error(`GitHub parsing error for ${source}:`, error.message);
            throw error;
        }
    }

    /**
     * Generate source ID from GitHub URL
     * @param {string} url - GitHub URL
     * @returns {string} Source ID
     */
    generateSourceId(url) {
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/').filter(p => p);
            if (pathParts.length >= 2) {
                return `github_${pathParts[0]}_${pathParts[1]}`.replace(/[^a-zA-Z0-9_]/g, '_');
            }
            return `github_${Date.now()}`;
        } catch (error) {
            return `github_${Date.now()}`;
        }
    }

    /**
     * Extract text from GitHub (implements base class method)
     * @param {string} html - GitHub page HTML
     * @returns {Promise<string>} Extracted text
     */
    async extractText(html) {
        const $ = require('cheerio').load(html);

        // Try to find the main content
        const contentSelectors = [
            '[data-target="readme-toc.content"]',
            '.markdown-body',
            'article',
            '.repository-content',
            'main'
        ];

        for (const selector of contentSelectors) {
            const content = $(selector);
            if (content.length > 0) {
                return this.cleanText(content.text());
            }
        }

        return this.cleanText($('body').text());
    }
}

module.exports = GitHubParser;