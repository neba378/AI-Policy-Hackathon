/**
 * AI Documentation Processor - Main processing pipeline
 * Orchestrates the scraping, parsing, and storage of AI documentation
 */

const AIDocScraper = require('../scrapers/aiDocScraper');
const { getDatabase } = require('./database');
const logger = require('../utils/logger');

// Singleton scraper instance
let scraperInstance = null;

/**
 * Get or create scraper instance
 * @returns {AIDocScraper} Scraper instance
 */
function getScraper() {
    if (!scraperInstance) {
        scraperInstance = new AIDocScraper({
            batchSize: 5,
            maxRetries: 3,
            enableEmbeddings: true,
            storeInDatabase: true
        });
    }
    return scraperInstance;
}

/**
 * Process AI documentation from a source configuration
 * @param {Object} sourceConfig - Source configuration from aiDocsConfig
 * @returns {Promise<Object>} Processing result
 */
async function processAIDocumentation(sourceConfig) {
    logger.info(`Processing AI documentation: ${sourceConfig.company}/${sourceConfig.model} - ${sourceConfig.url}`);

    try {
        const scraper = getScraper();
        const result = await scraper.processSource(sourceConfig);

        logger.info(`Successfully processed ${result.length} chunks from ${sourceConfig.url}`);
        return {
            success: true,
            source: sourceConfig,
            chunks: result.length,
            url: sourceConfig.url
        };
    } catch (error) {
        logger.error(`Failed to process ${sourceConfig.url}:`, error.message);

        // Store failure in database
        const db = getDatabase();
        if (db.isConnected) {
            try {
                // Create clean error object without circular references
                const failureData = {
                    url: sourceConfig.url,
                    company: sourceConfig.company,
                    model: sourceConfig.model,
                    documentType: sourceConfig.documentType,
                    error: error.message || String(error),
                    errorCode: error.code || 'UNKNOWN',
                    errorName: error.name || 'Error',
                    timestamp: new Date(),
                    attemptedAt: new Date()
                };

                // Store in failed_scrapes collection
                const failureDb = db.client ? db.client.db('ai_docs_scraper') : null;
                if (failureDb) {
                    await failureDb.collection('failed_scrapes').insertOne(failureData);
                    logger.info(`Stored failure record for ${sourceConfig.url}`);
                }
            } catch (dbError) {
                logger.error('Failed to store failure record:', dbError.message);
            }
        } return {
            success: false,
            source: sourceConfig,
            error: error.message,
            url: sourceConfig.url
        };
    }
}

/**
 * Process a listing URL (legacy compatibility for queue system)
 * This adapts the AI doc processing to work with the existing queue
 * @param {string} url - URL to process (can be direct or from config)
 * @returns {Promise<Object>} Processing result
 */
async function processListingUrl(url) {
    // Try to find matching source configuration
    const { aiDocumentationSources } = require('../config/aiDocsConfig');

    // Find source config for this URL
    const sourceConfig = aiDocumentationSources.find(source => source.url === url);

    if (!sourceConfig) {
        logger.warn(`No configuration found for URL: ${url}`);
        // Create a basic config
        const format = url.endsWith('.pdf') ? 'pdf' : 'web';
        return processAIDocumentation({
            url,
            company: 'Unknown',
            model: 'Unknown',
            documentType: 'Unknown',
            format,
            policyCategories: [],
            priority: 3
        });
    }

    return processAIDocumentation(sourceConfig);
}

/**
 * Process multiple sources in batch
 * @param {Array} sources - Array of source configurations
 * @returns {Promise<Object>} Batch processing results
 */
async function processBatch(sources) {
    logger.info(`Processing batch of ${sources.length} sources`);

    const results = {
        total: sources.length,
        successful: 0,
        failed: 0,
        results: []
    };

    for (const source of sources) {
        const result = await processAIDocumentation(source);

        if (result.success) {
            results.successful++;
        } else {
            results.failed++;
        }

        results.results.push(result);
    }

    logger.info(`Batch processing complete: ${results.successful}/${results.total} successful`);
    return results;
}

/**
 * Get processing statistics
 * @returns {Promise<Object>} Processing statistics
 */
async function getProcessingStats() {
    const db = getDatabase();

    if (!db.isConnected) {
        return {
            error: 'Database not connected'
        };
    }

    try {
        const stats = await db.getStats();
        return stats;
    } catch (error) {
        logger.error('Failed to get processing stats:', error);
        return {
            error: error.message
        };
    }
}

module.exports = {
    processAIDocumentation,
    processListingUrl,
    processBatch,
    getScraper,
    getProcessingStats
};
