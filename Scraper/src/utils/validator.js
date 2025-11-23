/**
 * Input Validation Utilities
 * Validate URLs, configs, and other inputs before processing
 */

const logger = require('./logger');

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid
 */
function isValidUrl(url) {
    if (!url || typeof url !== 'string') {
        return false;
    }

    try {
        const urlObj = new URL(url);
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch (error) {
        return false;
    }
}

/**
 * Validate scraper configuration
 * @param {object} config - Scraper config object
 * @returns {object} - { valid: boolean, errors: string[] }
 */
function validateScraperConfig(config) {
    const errors = [];

    // Required fields
    if (!config.name || typeof config.name !== 'string') {
        errors.push('Missing or invalid "name" field');
    }

    if (!config.urlPattern || typeof config.urlPattern !== 'string') {
        errors.push('Missing or invalid "urlPattern" field');
    } else {
        // Test if urlPattern is valid regex
        try {
            new RegExp(config.urlPattern, config.patternFlags || 'i');
        } catch (regexError) {
            errors.push(`Invalid urlPattern regex: ${regexError.message}`);
        }
    }

    // Validate selectors object
    if (!config.selectors || typeof config.selectors !== 'object') {
        errors.push('Missing or invalid "selectors" object');
    } else {
        const { selectors } = config;

        // Check for at least one selector
        const hasSomeSelectors =
            selectors.title ||
            selectors.price ||
            selectors.description ||
            selectors.location ||
            selectors.specifications;

        if (!hasSomeSelectors) {
            errors.push('Config has no usable selectors (need at least title, price, or description)');
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Sanitize URL (remove fragments, tracking params)
 * @param {string} url - URL to sanitize
 * @returns {string} - Sanitized URL
 */
function sanitizeUrl(url) {
    try {
        const urlObj = new URL(url);

        // Remove fragment
        urlObj.hash = '';

        // Remove common tracking parameters
        const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'ref', 'fbclid', 'gclid'];
        trackingParams.forEach(param => {
            urlObj.searchParams.delete(param);
        });

        return urlObj.toString();
    } catch (error) {
        logger.warn('Failed to sanitize URL', { url, error: error.message });
        return url; // Return original if sanitization fails
    }
}

/**
 * Validate environment variables
 * @returns {object} - { valid: boolean, missing: string[] }
 */
function validateEnvironment() {
    const required = ['MONGODB_URI', 'REDIS_HOST'];
    const missing = [];

    required.forEach(envVar => {
        if (!process.env[envVar]) {
            missing.push(envVar);
        }
    });

    return {
        valid: missing.length === 0,
        missing,
    };
}

/**
 * Validate extracted data quality
 * @param {object} data - Extracted listing data
 * @returns {object} - { valid: boolean, score: number, missing: string[] }
 */
function validateExtractedData(data) {
    const required = ['title', 'url'];
    const important = ['price', 'location', 'description'];

    const missing = [];
    const missingImportant = [];

    // Check required fields
    required.forEach(field => {
        if (!data[field]) {
            missing.push(field);
        }
    });

    // Check important fields
    important.forEach(field => {
        if (!data[field]) {
            missingImportant.push(field);
        }
    });

    // Calculate quality score (0-100)
    const totalFields = required.length + important.length;
    const presentFields = totalFields - missing.length - missingImportant.length;
    const score = Math.round((presentFields / totalFields) * 100);

    return {
        valid: missing.length === 0, // At least required fields must be present
        score,
        missing,
        missingImportant,
    };
}

module.exports = {
    isValidUrl,
    validateScraperConfig,
    sanitizeUrl,
    validateEnvironment,
    validateExtractedData,
};
