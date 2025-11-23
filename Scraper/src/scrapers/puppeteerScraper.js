/**
 * Puppeteer Scraper for JavaScript-rendered sites
 * Falls back to this when Cheerio fails or for known JS-heavy sites
 */

const puppeteer = require('puppeteer');
const { getUserAgent } = require('../utils/robotsParser');

// Cache browser instance for reuse
let browserInstance = null;
let pagePool = [];
const MAX_PAGES = 5;

/**
 * Get or create browser instance
 * @returns {Promise<Browser>}
 */
async function getBrowser() {
    if (!browserInstance) {
        console.log('🚀 Launching Puppeteer browser...');
        try {
            browserInstance = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu',
                    '--disable-extensions',
                ],
                timeout: 30000, // 30 second timeout for browser launch
            });

            // Set up error handlers
            browserInstance.on('disconnected', () => {
                console.warn('⚠️  Browser disconnected, will reconnect on next request');
                browserInstance = null;
                pagePool = [];
            });

            console.log('✅ Browser launched');
        } catch (error) {
            console.error('❌ Failed to launch browser:', error.message);
            browserInstance = null;
            throw error;
        }
    }
    return browserInstance;
}

/**
 * Get a page from the pool or create new one
 * @returns {Promise<Page>}
 */
async function getPage() {
    if (pagePool.length > 0) {
        return pagePool.pop();
    }

    try {
        const browser = await getBrowser();
        const page = await browser.newPage();

        // Set viewport and user agent (honest identification)
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent(getUserAgent());

        // Set default navigation timeout (60 seconds for slow sites)
        page.setDefaultNavigationTimeout(60000);
        page.setDefaultTimeout(60000);

        // Handle page errors
        page.on('error', error => {
            console.error('Page error:', error.message);
        });

        page.on('pageerror', error => {
            console.warn('Page JavaScript error:', error.message);
        });

        return page;
    } catch (error) {
        console.error('Failed to create page:', error.message);
        throw error;
    }
}

/**
 * Return page to pool for reuse
 * @param {Page} page 
 */
async function releasePage(page) {
    if (pagePool.length < MAX_PAGES) {
        // Clear page state
        await page.goto('about:blank');
        pagePool.push(page);
    } else {
        await page.close();
    }
}

/**
 * Wait for lazy-loaded images to appear
 * @param {Page} page - Puppeteer page
 */
async function waitForLazyImages(page) {
    try {
        // Scroll to bottom to trigger lazy loading (with timeout protection)
        await page.evaluate(async () => {
            await new Promise((resolve) => {
                let totalHeight = 0;
                const distance = 200;
                let scrollAttempts = 0;
                const maxScrolls = 20; // Max 20 scrolls (4000px)

                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;
                    scrollAttempts++;

                    if (totalHeight >= scrollHeight || scrollAttempts >= maxScrolls) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 50); // Faster scrolling
            });
        });

        // Wait a bit for images to start loading
        await new Promise(resolve => setTimeout(resolve, 800));

        // Convert data-src to src for compatibility
        await page.evaluate(() => {
            const lazyImages = document.querySelectorAll('[data-src], [data-lazy]');
            lazyImages.forEach(img => {
                const src = img.getAttribute('data-src') || img.getAttribute('data-lazy');
                if (src && !img.getAttribute('src')) {
                    img.setAttribute('src', src);
                }
            });
        });

        console.log('✓ Waited for lazy-loaded images');
    } catch (error) {
        console.warn('⚠️  Could not wait for lazy images:', error.message);
    }
}

/**
 * Fetch HTML using Puppeteer (for JavaScript-rendered sites)
 * @param {string} url - URL to fetch
 * @param {object} options - Fetch options
 * @returns {Promise<string>} - HTML content
 */
async function fetchHtmlWithPuppeteer(url, options = {}) {
    const {
        waitFor = 'networkidle2', // or 'domcontentloaded', 'load', 'networkidle0'
        timeout = 60000,  // Increased default timeout
        waitForSelector = null,
        waitForImages = true, // NEW: Wait for lazy-loaded images
    } = options;

    let page = null;
    const startTime = Date.now();

    try {
        page = await getPage();

        // Reduced logging
        if (Math.random() < 0.3) { // Log 30% of requests
            console.log(`🌐 Fetching with Puppeteer: ${url}`);
        }

        // Set timeout for this specific navigation
        page.setDefaultNavigationTimeout(timeout);
        page.setDefaultTimeout(timeout);

        // Navigate to page with timeout
        await page.goto(url, {
            waitUntil: waitFor,
            timeout,
        });

        // Wait for specific selector if provided
        if (waitForSelector) {
            await page.waitForSelector(waitForSelector, { timeout: 10000 });
        }

        // Wait for lazy-loaded images (NEW)
        if (waitForImages) {
            await waitForLazyImages(page);
        }

        // Get HTML content
        const html = await page.content();

        const duration = Date.now() - startTime;
        // Reduced logging
        if (duration > 5000 || Math.random() < 0.2) { // Log slow requests or 20% of requests
            console.log(`✅ Fetched ${html.length} characters with Puppeteer (${duration}ms)`);
        }

        // Return page to pool
        await releasePage(page);

        return html;

    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`❌ Puppeteer fetch failed after ${duration}ms: ${error.message}`);

        // Force close page if error occurred
        if (page) {
            try {
                await page.close();
            } catch (closeError) {
                console.warn('Failed to close page after error:', closeError.message);
            }
        }

        throw new Error(`Puppeteer fetch failed for ${url}: ${error.message}`);
    }
}

/**
 * Execute JavaScript on page and extract data
 * @param {string} url - URL to visit
 * @param {Function} extractorFn - Function to run in browser context
 * @returns {Promise<any>} - Extracted data
 */
async function executeOnPage(url, extractorFn) {
    let page = null;

    try {
        page = await getPage();

        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 30000,
        });

        // Execute extractor function in browser context
        const data = await page.evaluate(extractorFn);

        await releasePage(page);

        return data;

    } catch (error) {
        if (page) {
            await page.close().catch(() => { });
        }
        throw new Error(`Page execution failed: ${error.message}`);
    }
}

/**
 * Check if a site requires Puppeteer (JavaScript rendering)
 * @param {string} url - URL to check
 * @returns {boolean} - True if Puppeteer is recommended
 */
function requiresPuppeteer(url) {
    // Known JS-heavy platforms
    const jsHeavySites = [
        'huurportaal.nl',
        'funda.nl',
        'kamernet.nl',
        'housinganywhere.com',
    ];

    return jsHeavySites.some(site => url.includes(site));
}

/**
 * Smart fetch: Try Cheerio first, fall back to Puppeteer if needed
 * @param {string} url - URL to fetch
 * @param {object} options - Fetch options
 * @returns {Promise<string>} - HTML content
 */
async function smartFetch(url, options = {}) {
    const { forcePuppeteer = false, tryCheerioFirst = true } = options;

    // Check if we should use Puppeteer
    if (forcePuppeteer || requiresPuppeteer(url)) {
        console.log(`🤖 Using Puppeteer (${forcePuppeteer ? 'forced' : 'auto-detected JS site'})`);
        return await fetchHtmlWithPuppeteer(url, options);
    }

    // Try Cheerio first (fast) if not disabled
    if (tryCheerioFirst) {
        try {
            const axios = require('axios');
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': getUserAgent(),
                },
                timeout: 15000,
                validateStatus: (status) => status < 500, // Accept 404, 403, etc
            });

            // Check if we got actual content
            const html = response.data;

            // Heuristic: If HTML is very small or looks like a JS redirect, use Puppeteer
            if (html.length < 1000 ||
                html.includes('window.location') ||
                html.includes('Please enable JavaScript') ||
                /<script[\s\S]*?<\/script>/.test(html) && !/<body[\s\S]*?<\/body>/.test(html)) {

                console.log(`⚠️  Cheerio got minimal HTML, switching to Puppeteer...`);
                return await fetchHtmlWithPuppeteer(url, options);
            }

            console.log(`✅ Fetched with Cheerio (fast): ${url}`);
            return html;

        } catch (error) {
            // Cheerio failed (network error, timeout, etc), fall back to Puppeteer
            console.log(`⚠️  Cheerio failed (${error.message}), trying Puppeteer...`);
            return await fetchHtmlWithPuppeteer(url, options);
        }
    } else {
        // Cheerio disabled, go straight to Puppeteer
        return await fetchHtmlWithPuppeteer(url, options);
    }
}

/**
 * Cleanup browser resources
 */
async function cleanup() {
    console.log('🧹 Cleaning up Puppeteer resources...');

    // Close all pages in pool
    for (const page of pagePool) {
        await page.close().catch(() => { });
    }
    pagePool = [];

    // Close browser
    if (browserInstance) {
        await browserInstance.close().catch(() => { });
        browserInstance = null;
    }

    console.log('✅ Puppeteer cleanup complete');
}

// Cleanup on process exit
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

module.exports = {
    fetchHtmlWithPuppeteer,
    smartFetch,
    executeOnPage,
    requiresPuppeteer,
    cleanup,
    getBrowser,
};
