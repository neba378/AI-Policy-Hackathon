/**
 * Scraper Registry
 * Auto-loads and registers all available scrapers from JSON configuration files
 */

const fs = require('fs');
const path = require('path');
const { createScraperFromConfig } = require('../scrapers/configurableScraper');

// Load configurable scrapers from JSON files
const configDir = path.join(__dirname, 'scraperConfigs');
const configurableScrapers = loadConfigurableScrapers(configDir);

// Registry of all scrapers (JSON-based only)
const SCRAPERS = configurableScrapers;

/**
 * Load scraper configurations from JSON files with validation
 * @param {string} configDirectory - Path to config directory
 * @returns {Array} - Array of scraper objects
 */
function loadConfigurableScrapers(configDirectory) {
    const scrapers = [];
    let totalConfigs = 0;
    let validConfigs = 0;
    let invalidConfigs = 0;

    try {
        // Check if config directory exists
        if (!fs.existsSync(configDirectory)) {
            console.error(`❌ Config directory ${configDirectory} does not exist!`);
            throw new Error('Scraper configs directory not found');
        }

        // Read all JSON files in the config directory
        const configFiles = fs.readdirSync(configDirectory)
            .filter(file => file.endsWith('.json'))
            .map(file => path.join(configDirectory, file));

        totalConfigs = configFiles.length;
        console.log(`📋 Found ${totalConfigs} config files`);

        for (const configFile of configFiles) {
            try {
                const configData = fs.readFileSync(configFile, 'utf-8');
                const config = JSON.parse(configData);

                // Validate config structure
                if (!config.name || !config.urlPattern) {
                    console.error(`❌ Invalid config ${path.basename(configFile)}: missing name or urlPattern`);
                    invalidConfigs++;
                    continue;
                }

                // Test regex pattern
                try {
                    new RegExp(config.urlPattern, config.patternFlags || 'i');
                } catch (regexError) {
                    console.error(`❌ Invalid regex in ${config.name}: ${regexError.message}`);
                    invalidConfigs++;
                    continue;
                }

                // Validate selectors exist
                if (!config.selectors || typeof config.selectors !== 'object') {
                    console.error(`❌ Invalid config ${config.name}: missing selectors`);
                    invalidConfigs++;
                    continue;
                }

                // Create scraper from config
                const scraper = createScraperFromConfig(config);
                scrapers.push(scraper);
                validConfigs++;

                console.log(`✅ Loaded scraper: ${config.name}`);
            } catch (error) {
                console.error(`❌ Error loading ${path.basename(configFile)}:`, error.message);
                invalidConfigs++;
            }
        }

        // Summary
        console.log(`\n📊 Config Loading Summary:`);
        console.log(`   Total: ${totalConfigs}`);
        console.log(`   ✅ Valid: ${validConfigs}`);
        console.log(`   ❌ Invalid: ${invalidConfigs}\n`);

        // Fail if no valid configs
        if (scrapers.length === 0) {
            throw new Error('No valid scraper configurations loaded!');
        }

    } catch (error) {
        console.error('❌ Fatal error loading scrapers:', error.message);
        throw error; // Fail fast if configs can't be loaded
    }

    return scrapers;
}

/**
 * Get the appropriate scraper for a URL
 * @param {string} url - The URL to scrape
 * @returns {object|null} - Scraper object or null if not found
 */
function getScraper(url) {
    for (const scraper of SCRAPERS) {
        if (scraper.urlPattern && scraper.urlPattern.test(url)) {
            return scraper;
        }
    }

    console.warn(`⚠️ No scraper found for URL: ${url}`);
    return null;
}

/**
 * Get all available scrapers
 * @returns {Array<object>} - Array of scraper objects
 */
function getAllScrapers() {
    return SCRAPERS;
}

/**
 * Get scraper by name
 * @param {string} name - Scraper name
 * @returns {object|null} - Scraper object or null
 */
function getScraperByName(name) {
    return SCRAPERS.find(s => s.name === name) || null;
}

/**
 * Check if a URL is supported
 * @param {string} url - The URL to check
 * @returns {boolean} - True if supported
 */
function isUrlSupported(url) {
    return getScraper(url) !== null;
}

/**
 * Get list of supported domains
 * @returns {Array<string>} - Array of domain patterns
 */
function getSupportedDomains() {
    return SCRAPERS.map(s => ({
        name: s.name,
        pattern: s.urlPattern.toString(),
    }));
}

module.exports = {
    SCRAPERS,
    getScraper,
    getAllScrapers,
    getScraperByName,
    isUrlSupported,
    getSupportedDomains,
};
