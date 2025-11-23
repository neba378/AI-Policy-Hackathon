/**
 * Base Scraper - Shared utilities for all site-specific scrapers
 * Contains common functions for text cleaning, data extraction, etc.
 * Now with hybrid Cheerio/Puppeteer support
 */

const axios = require('axios');
const cheerio = require('cheerio');
const { smartFetch } = require('./puppeteerScraper');
const { getUserAgent } = require('../utils/robotsParser');

/**
 * Fetch HTML content from a URL (Hybrid: Cheerio + Puppeteer fallback)
 * @param {string} url - The URL to fetch
 * @param {object} options - Fetch options
 * @returns {string} - HTML content
 */
async function fetchHtml(url, options = {}) {
    try {
        return await smartFetch(url, options);
    } catch (error) {
        console.error(`❌ Failed to fetch ${url}:`, error.message);
        throw error;
    }
}

/**
 * Load HTML into Cheerio for parsing
 * @param {string} html - HTML content
 * @returns {CheerioAPI} - Cheerio instance
 */
function loadHtml(html) {
    return cheerio.load(html);
}

/**
 * Clean and normalize text
 * @param {string} text - Raw text
 * @returns {string} - Cleaned text
 */
function cleanText(text) {
    if (!text) return '';

    return text
        .replace(/\s+/g, ' ')           // Normalize whitespace
        .replace(/\n+/g, '\n')          // Normalize newlines
        .replace(/\t+/g, ' ')           // Remove tabs
        .trim();
}

/**
 * Extract and clean text from a Cheerio element
 * @param {Cheerio} element - Cheerio element
 * @returns {string} - Cleaned text
 */
function extractText(element) {
    if (!element || !element.length) return '';
    return cleanText(element.text());
}

/**
 * Extract all image URLs from elements
 * @param {CheerioAPI} $ - Cheerio instance
 * @param {string} selector - CSS selector for images
 * @param {string} baseUrl - Base URL for relative paths
 * @returns {Array<object>} - Array of image objects with url and alt
 */
function extractImages($, selector, baseUrl = '') {
    const images = [];

    $(selector).each((i, elem) => {
        const $img = $(elem);
        // Support multiple image sources
        let url = $img.attr('src') || 
                  $img.attr('data-src') || 
                  $img.attr('data-lazy') ||
                  $img.attr('data-original');
        
        // Try srcset as fallback
        if (!url) {
            const srcset = $img.attr('srcset') || $img.attr('data-srcset');
            if (srcset) {
                // Get largest image from srcset
                const sources = srcset.split(',').map(s => s.trim().split(' ')[0]);
                url = sources[sources.length - 1];
            }
        }
        
        const alt = cleanText($img.attr('alt') || '');

        if (url) {
            // Handle relative URLs FIRST
            if (url.startsWith('//')) {
                url = 'https:' + url;
            } else if (url.startsWith('/')) {
                // If baseUrl provided, use it; otherwise construct from current domain
                if (baseUrl) {
                    url = new URL(url, baseUrl).href;
                }
                // Keep relative URL if no baseUrl (will be handled later)
            }

            // Enhanced filtering - reject common non-property images
            const urlLower = url.toLowerCase();
            const rejectPatterns = [
                'logo', 'avatar', 'badge',
                'button', 'hint', 'ui/', '/icons/', 'sprite',
                'banner', '/ad/', '/ads/', 'tracking', 'pixel', // Be specific: '/ad/' not 'ad'
                '.svg', // SVG files are usually UI elements
                'data:image', // Base64 encoded icons
                'map-marker', 'maps.googleapis', 'maps.gstatic', // Map images
                '/images/icons/', '/images/logo' // Icon folders
            ];
            
            const shouldReject = rejectPatterns.some(pattern => urlLower.includes(pattern));
            
            // Also check if URL is too short (likely data URI or icon) - AFTER converting relative URLs
            if (!shouldReject && url.length > 30) {
                images.push({ url, alt });
            }
        }
    });

    return images;
}

/**
 * Parse price from text
 * @param {string} text - Text containing price
 * @returns {number|null} - Parsed price or null
 */
function parsePrice(text) {
    if (!text) return null;

    // Remove common words and symbols
    const cleaned = text
        .replace(/per\s+(maand|month|mo|pm)/gi, '')
        .replace(/€|EUR|euro/gi, '')
        .replace(/huurprijs|price|rent/gi, '')
        .trim();

    // Match numbers with optional decimal separator
    const match = cleaned.match(/(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/);

    if (match) {
        // Remove thousand separators and convert to number
        const price = parseFloat(match[1].replace(/[.,](?=\d{3})/g, '').replace(',', '.'));
        return Math.round(price);
    }

    return null;
}

/**
 * Parse area from text (in m²)
 * @param {string} text - Text containing area
 * @returns {number|null} - Parsed area or null
 */
function parseArea(text) {
    if (!text) return null;

    const match = text.match(/(\d+(?:[.,]\d+)?)\s*(?:m²|m2|vierkante meters?|square meters?)/i);

    if (match) {
        return Math.round(parseFloat(match[1].replace(',', '.')));
    }

    return null;
}

/**
 * Parse number of rooms (bedrooms, bathrooms, etc.)
 * @param {string} text - Text containing room count
 * @returns {number|null} - Parsed room count or null
 */
function parseRoomCount(text) {
    if (!text) return null;

    const match = text.match(/(\d+)\s*(?:slaapkamer|bedroom|kamer|room|bad|bathroom)/i);

    if (match) {
        return parseInt(match[1], 10);
    }

    return null;
}

/**
 * Generate external ID from URL
 * @param {string} url - Listing URL
 * @param {string} source - Source name
 * @returns {string} - External ID
 */
function generateExternalId(url, source) {
    try {
        // Use the full path after domain for better uniqueness
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;

        // Remove common prefixes and create clean identifier
        const cleanPath = pathname
            .replace(/^\/(huur|rent|woning|property|aanbod|listing|detail|object|woningaanbod)\//gi, '')
            .replace(/^\/+|\/+$/g, '')  // Remove leading/trailing slashes
            .replace(/[^a-z0-9-]/gi, '-')  // Replace special chars with dashes
            .replace(/-+/g, '-')  // Collapse multiple dashes
            .toLowerCase();

        // For very short identifiers (just numbers), include more context
        if (/^\d+$/.test(cleanPath) && cleanPath.length < 6) {
            // Find a longer unique part from the URL
            const segments = pathname.split('/').filter(Boolean);
            const uniquePart = segments.slice(-2).join('-')
                .replace(/[^a-z0-9-]/gi, '-')
                .replace(/-+/g, '-')
                .toLowerCase();

            return `${source.toLowerCase()}-${uniquePart}`;
        }

        // Use first 100 chars to keep it reasonable
        const identifier = cleanPath.substring(0, 100);

        return `${source.toLowerCase()}-${identifier}`;

    } catch (error) {
        // Fallback: use hash of URL if parsing fails
        const crypto = require('crypto');
        const hash = crypto.createHash('md5').update(url).digest('hex').substring(0, 16);
        return `${source.toLowerCase()}-${hash}`;
    }
}

/**
 * Extract meta tags from page
 * @param {CheerioAPI} $ - Cheerio instance
 * @returns {object} - Meta tag data
 */
function extractMetaTags($) {
    const meta = {
        title: $('meta[property="og:title"]').attr('content') || $('title').text() || '',
        description: $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '',
        image: $('meta[property="og:image"]').attr('content') || '',
        url: $('meta[property="og:url"]').attr('content') || '',
    };

    return meta;
}

/**
 * Check if element contains any of the keywords (case-insensitive)
 * @param {string} text - Text to search
 * @param {Array<string>} keywords - Keywords to search for
 * @returns {boolean} - True if any keyword found
 */
function containsKeyword(text, keywords) {
    if (!text) return false;

    const lowerText = text.toLowerCase();
    return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

/**
 * Wait for specified milliseconds
 * @param {number} ms - Milliseconds to wait
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    fetchHtml,
    loadHtml,
    cleanText,
    extractText,
    extractImages,
    parsePrice,
    parseArea,
    parseRoomCount,
    generateExternalId,
    extractMetaTags,
    containsKeyword,
    sleep,
};
