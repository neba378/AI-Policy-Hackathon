/**
 * AI Documentation Scraper - Direct Processing (No Redis Required)
 * Processes sources directly without queue system
 */

require('dotenv').config();
const logger = require('./src/utils/logger');
const { connectToDatabase, getDatabase } = require('./src/core/database');
const { processAIDocumentation } = require('./src/core/processor');
const { initializeEmbeddingService } = require('./src/core/embeddingService');
const {
    aiDocumentationSources,
    getHighPrioritySources,
    getOpenAISources,
    getAnthropicSources,
    getGoogleSources,
    getMetaSources,
    getStats
} = require('./src/config/aiDocsConfig');

/**
 * Process sources sequentially
 */
async function processSources(sources) {
    const results = {
        total: sources.length,
        successful: 0,
        failed: 0,
        details: []
    };

    for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
        logger.info(`[${i + 1}/${sources.length}] Processing ${source.company}/${source.model} - ${source.url}`);

        try {
            const result = await processAIDocumentation(source);

            if (result.success) {
                logger.info(`✅ Success: ${result.chunks} chunks processed for ${source.company}/${source.model}`);
                results.successful++;
            } else {
                logger.error(`❌ Failed: ${result.error}`);
                results.failed++;
            }

            results.details.push(result);
        } catch (error) {
            logger.error(`❌ Error: ${error.message}`);
            results.failed++;
            results.details.push({
                success: false,
                source: source,
                error: error.message
            });
        }
    }

    return results;
}

/**
 * Main function
 */
async function main() {
    const startTime = Date.now();

    try {
        logger.info('🚀 AI Documentation Scraper (Direct Mode)');
        logger.info('No Redis/Queue required - processing directly');

        // Step 1: Connect to database
        logger.info('📊 Connecting to database...');
        await connectToDatabase();
        logger.info('✅ Database connected');

        // Step 2: Initialize embedding service
        logger.info('🤖 Initializing embedding model...');
        await initializeEmbeddingService();
        logger.info('✅ Embedding model ready');

        // Step 3: Select sources
        const args = process.argv.slice(2);
        let sources;

        if (args.includes('--all')) {
            sources = aiDocumentationSources;
            logger.info(`📋 Mode: ALL sources (${sources.length} total)`);
        } else if (args.includes('--openai')) {
            sources = getOpenAISources();
            logger.info(`📋 Mode: OpenAI only (${sources.length} total)`);
        } else if (args.includes('--anthropic')) {
            sources = getAnthropicSources();
            logger.info(`📋 Mode: Anthropic only (${sources.length} total)`);
        } else if (args.includes('--google')) {
            sources = getGoogleSources();
            logger.info(`📋 Mode: Google only (${sources.length} total)`);
        } else if (args.includes('--meta')) {
            sources = getMetaSources();
            logger.info(`📋 Mode: Meta only (${sources.length} total)`);
        } else if (args.includes('--test')) {
            // Just process first source for testing
            sources = [aiDocumentationSources[0]];
            logger.info('📋 Mode: TEST (1 source)');
        } else {
            sources = getHighPrioritySources();
            logger.info(`📋 Mode: High priority (${sources.length} total)`);
            logger.info('💡 Options: --all, --openai, --anthropic, --google, --meta, --test');
        }

        if (sources.length === 0) {
            logger.error('❌ No sources found!');
            process.exit(1);
        }

        // Step 4: Process sources
        logger.info('🔄 Starting processing...');
        logger.info('═'.repeat(60));

        const results = await processSources(sources);

        // Step 5: Show results
        const duration = Math.round((Date.now() - startTime) / 1000);

        logger.info('═'.repeat(60));
        logger.info('✅ Processing Complete!');
        logger.info(`⏱️  Duration: ${duration}s`);
        logger.info(`📊 Total: ${results.total}`);
        logger.info(`✅ Successful: ${results.successful}`);
        logger.info(`❌ Failed: ${results.failed}`);

        // Show database stats
        const db = getDatabase();
        const stats = await db.getStats();

        logger.info('📊 Database Statistics:');
        logger.info(`   Total chunks: ${stats.totalDocuments}`);
        logger.info(`   Databases: ${stats.totalDatabases}`);
        logger.info(`   Collections: ${stats.totalCollections}`);

        if (stats.mockMode) {
            logger.warn('⚠️  Running in MOCK MODE (in-memory) - connect to MongoDB for persistent storage');
        }

        process.exit(0);

    } catch (error) {
        logger.error('❌ Fatal Error:', error.message);
        logger.error(error.stack);
        process.exit(1);
    }
}

// Graceful shutdown
let shuttingDown = false;
process.on('SIGINT', () => {
    if (shuttingDown) {
        logger.warn('⚠️  Force quit...');
        process.exit(1);
    }
    shuttingDown = true;
    logger.info('🛑 Shutting down gracefully... Press Ctrl+C again to force quit');
    process.exit(0);
});

// Run
main();
