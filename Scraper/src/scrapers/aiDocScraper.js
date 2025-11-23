/**
 * AI Documentation Scraper - Main orchestrator for AI model documentation
 * Handles the complete pipeline from source to vector database
 */

const PDFParser = require('../parsers/pdfParser');
const WebParser = require('../parsers/webParser');
const GitHubParser = require('../parsers/githubParser');
const TextChunker = require('../processors/textChunker');
const { getEmbedding } = require('../core/embeddingService');
const { getDatabase } = require('../core/database');
const logger = require('../utils/logger');

class AIDocScraper {
    constructor(options = {}) {
        this.options = {
            batchSize: 10,
            maxRetries: 3,
            enableEmbeddings: true,
            storeInDatabase: true,
            ...options
        };

        // Initialize components
        this.parsers = {
            pdf: new PDFParser(),
            web: new WebParser(),
            github: new GitHubParser(),
            arxiv: null    // TODO: Implement arXiv parser
        };

        this.chunker = new TextChunker();
    }

    /**
     * Scrape AI documentation from sources
     * @param {Array} sources - Array of source configurations
     * @returns {Promise<Object>} Scraping results
     */
    async scrapeDocumentation(sources) {
        logger.info(`Starting AI documentation scrape for ${sources.length} sources`);

        const results = {
            totalSources: sources.length,
            successful: 0,
            failed: 0,
            totalChunks: 0,
            errors: [],
            sources: []
        };

        // Process sources in batches
        for (let i = 0; i < sources.length; i += this.options.batchSize) {
            const batch = sources.slice(i, i + this.options.batchSize);
            logger.info(`Processing batch ${Math.floor(i / this.options.batchSize) + 1}/${Math.ceil(sources.length / this.options.batchSize)}`);

            const batchPromises = batch.map(source => this.processSource(source));
            const batchResults = await Promise.allSettled(batchPromises);

            // Process batch results
            for (let index = 0; index < batchResults.length; index++) {
                const result = batchResults[index];
                const source = batch[index];
                const sourceResult = {
                    source: source,
                    success: false,
                    chunks: 0,
                    error: null
                };

                if (result.status === 'fulfilled') {
                    const chunks = result.value;
                    sourceResult.success = true;
                    sourceResult.chunks = chunks.length;
                    results.successful++;
                    results.totalChunks += chunks.length;

                    // Store chunks if enabled - WAIT for completion
                    if (this.options.storeInDatabase && chunks.length > 0) {
                        try {
                            await this.storeChunks(chunks);
                            logger.info(`✅ Stored ${chunks.length} chunks for ${source.url}`);
                        } catch (error) {
                            logger.error(`Failed to store chunks for ${source.url}:`, error.message);
                            throw error; // Re-throw to mark job as failed
                        }
                    } else if (chunks.length === 0) {
                        logger.warn(`⚠️ No chunks generated for ${source.url}`);
                    }
                } else {
                    sourceResult.error = result.reason.message;
                    results.failed++;
                    results.errors.push({
                        source: source.url,
                        error: result.reason.message
                    });
                    logger.error(`Failed to process ${source.url}:`, result.reason);
                }

                results.sources.push(sourceResult);
            }

            // Rate limiting between batches
            if (i + this.options.batchSize < sources.length) {
                await this.delay(1000);
            }
        }

        logger.info(`AI documentation scrape completed: ${results.successful}/${results.totalSources} successful, ${results.totalChunks} total chunks`);
        return results;
    }

    /**
     * Process a single documentation source
     * @param {Object} source - Source configuration
     * @returns {Promise<Array>} Array of processed chunks
     */
    async processSource(source) {
        const { url, format, metadata } = source;

        logger.debug(`Processing ${format} source: ${url}`);

        // Select appropriate parser
        const parser = this.getParserForFormat(format);
        if (!parser) {
            throw new Error(`No parser available for format: ${format}`);
        }

        // Parse the document
        const chunks = await parser.parse(url, {
            sourceId: this.generateSourceId(source),
            company: source.company,
            model: source.model,
            documentType: source.documentType,
            policyCategories: source.policyCategories,
            ...metadata
        });

        // Generate embeddings if enabled
        if (this.options.enableEmbeddings) {
            await this.addEmbeddingsToChunks(chunks);
        }

        logger.debug(`Generated ${chunks.length} chunks for ${url}`);

        // Store chunks in database if enabled
        if (this.options.storeInDatabase && chunks.length > 0) {
            await this.storeChunks(chunks);
            logger.info(`✅ Stored ${chunks.length} chunks to database for ${source.company}/${source.model}`);
        } else if (!this.options.storeInDatabase) {
            logger.warn(`⚠️ Database storage disabled - ${chunks.length} chunks NOT stored`);
        }

        return chunks;
    }

    /**
     * Get appropriate parser for document format
     * @param {string} format - Document format
     * @returns {Object} Parser instance
     */
    getParserForFormat(format) {
        switch (format.toLowerCase()) {
            case 'pdf':
                return this.parsers.pdf;
            case 'html':
            case 'web':
                return this.parsers.web;
            case 'github':
                return this.parsers.github;
            case 'arxiv':
                return this.parsers.arxiv;
            default:
                return this.parsers.web; // Default fallback
        }
    }

    /**
     * Generate unique source ID
     * @param {Object} source - Source configuration
     * @returns {string} Source ID
     */
    generateSourceId(source) {
        const { company, model, documentType, url } = source;
        const cleanCompany = company.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const cleanModel = model.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const cleanDocType = documentType.toLowerCase().replace(/[^a-z0-9]/g, '_');

        return `${cleanCompany}_${cleanModel}_${cleanDocType}_${Date.now()}`;
    }

    /**
     * Add embeddings to chunks
     * @param {Array} chunks - Text chunks
     * @returns {Promise<void>}
     */
    async addEmbeddingsToChunks(chunks) {
        logger.debug(`Generating embeddings for ${chunks.length} chunks`);

        // Process in smaller batches to avoid memory issues
        const embeddingBatchSize = 5;

        for (let i = 0; i < chunks.length; i += embeddingBatchSize) {
            const batch = chunks.slice(i, i + embeddingBatchSize);
            const texts = batch.map(chunk => chunk.text);

            try {
                const embeddings = await getEmbedding(texts);

                // Add embeddings to chunks
                batch.forEach((chunk, index) => {
                    chunk.embedding = embeddings[index];
                    chunk.metadata.embeddingGenerated = true;
                    chunk.metadata.embeddingModel = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';
                });

            } catch (error) {
                logger.error(`Failed to generate embeddings for batch ${i / embeddingBatchSize + 1}:`, error);
                // Continue without embeddings for this batch
                batch.forEach(chunk => {
                    chunk.metadata.embeddingGenerated = false;
                    chunk.metadata.embeddingError = error.message;
                });
            }
        }
    }

    /**
     * Store chunks in database
     * @param {Array} chunks - Chunks to store
     * @returns {Promise<void>}
     */
    async storeChunks(chunks) {
        if (chunks.length === 0) return;

        // Group chunks by company and model
        const chunksByModel = {};
        chunks.forEach(chunk => {
            const company = chunk.metadata.company;
            const model = chunk.metadata.model;
            const key = `${company}_${model}`;

            if (!chunksByModel[key]) {
                chunksByModel[key] = {
                    company,
                    model,
                    chunks: []
                };
            }
            chunksByModel[key].chunks.push(chunk);
        });

        // Store each model's chunks in separate collection
        const db = getDatabase();
        const promises = Object.values(chunksByModel).map(async ({ company, model, chunks: modelChunks }) => {
            try {
                await db.storeChunks(company, model, modelChunks);
                logger.info(`Stored ${modelChunks.length} chunks for ${company}/${model}`);
            } catch (error) {
                logger.error(`Failed to store chunks for ${company}/${model}:`, error);
                throw error;
            }
        });

        await Promise.all(promises);
        logger.info(`Successfully stored all chunks in separate model collections`);
    }

    /**
     * Utility delay function
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise<void>}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get scraping statistics
     * @param {Array} sources - Sources to analyze
     * @returns {Object} Statistics
     */
    getScrapingStats(sources) {
        const stats = {
            totalSources: sources.length,
            byCompany: {},
            byFormat: {},
            byModel: {},
            policyCategories: new Set()
        };

        sources.forEach(source => {
            // By company
            stats.byCompany[source.company] = (stats.byCompany[source.company] || 0) + 1;

            // By format
            stats.byFormat[source.format] = (stats.byFormat[source.format] || 0) + 1;

            // By model
            stats.byModel[source.model] = (stats.byModel[source.model] || 0) + 1;

            // Policy categories
            if (source.policyCategories) {
                source.policyCategories.forEach(cat => stats.policyCategories.add(cat));
            }
        });

        stats.policyCategories = Array.from(stats.policyCategories);
        return stats;
    }
}

module.exports = AIDocScraper;