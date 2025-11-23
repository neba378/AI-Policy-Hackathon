/**
 * Compliance Engine - Query interface for AI compliance documentation
 * Allows searching and filtering by policy categories, companies, models
 */

const logger = require('../utils/logger');
const { generateEmbedding, calculateSimilarity } = require('./embeddingService');
const { getDatabase } = require('./database');

class ComplianceEngine {
    constructor(options = {}) {
        this.options = {
            enableEmbeddings: true,
            similarityThreshold: 0.7,
            maxResults: 50,
            ...options
        };

        this.db = getDatabase();
    }

    /**
     * Add documents to the compliance database
     * @param {Array} documents - Array of document chunks
     */
    async addDocuments(documents) {
        logger.info(`Adding ${documents.length} documents to compliance engine`);

        // Group documents by company and model
        const docsByModel = {};
        documents.forEach(doc => {
            const company = doc.metadata.company;
            const model = doc.metadata.model;
            const key = `${company}_${model}`;

            if (!docsByModel[key]) {
                docsByModel[key] = {
                    company,
                    model,
                    documents: []
                };
            }

            // Ensure embedding is available
            let embedding = doc.embedding || null;
            if (this.options.enableEmbeddings && !embedding) {
                // Note: We'll generate embeddings when storing via aiDocScraper
                logger.warn(`No embedding provided for document ${doc.id}`);
            }

            docsByModel[key].documents.push({
                id: doc.id,
                text: doc.text,
                metadata: doc.metadata,
                embedding
            });
        });

        // Store each model's documents in separate collection
        const promises = Object.values(docsByModel).map(async ({ company, model, documents: modelDocs }) => {
            try {
                await this.db.storeChunks(company, model, modelDocs);
                logger.info(`Stored ${modelDocs.length} documents for ${company}/${model}`);
            } catch (error) {
                logger.error(`Failed to store documents for ${company}/${model}:`, error);
                throw error;
            }
        });

        await Promise.all(promises);
        logger.info(`Successfully stored all documents in separate model collections`);
    }

    /**
     * Query documents by policy categories
     * @param {Array|string} categories - Policy categories to search for
     * @param {Object} filters - Additional filters (company, model, etc.)
     * @returns {Array} Matching documents
     */
    async queryByCategories(categories, filters = {}) {
        if (typeof categories === 'string') {
            categories = [categories];
        }

        logger.info(`Querying for categories: ${categories.join(', ')}`);

        const { company, model } = filters;
        if (!company || !model) {
            throw new Error('Company and model filters are required for database queries');
        }

        try {
            const results = await this.db.getChunksByCategories(company, model, categories);

            // Apply additional filters
            const filteredResults = results.filter(doc => {
                if (filters.format && doc.metadata.format !== filters.format) return false;
                return true;
            });

            logger.info(`Found ${filteredResults.length} documents matching criteria`);
            return filteredResults.slice(0, this.options.maxResults);
        } catch (error) {
            logger.error('Failed to query by categories:', error);
            throw error;
        }
    }

    /**
     * Query documents by text content
     * @param {string} query - Text query
     * @param {Object} filters - Additional filters
     * @returns {Array} Matching documents
     */
    async queryByText(query, filters = {}) {
        logger.info(`Text query: "${query}"`);

        const { company, model } = filters;
        if (!company || !model) {
            throw new Error('Company and model filters are required for database queries');
        }

        try {
            const results = await this.db.searchChunksByText(company, model, query);

            // Apply additional filters
            const filteredResults = results.filter(doc => {
                if (filters.format && doc.metadata.format !== filters.format) return false;
                return true;
            });

            logger.info(`Found ${filteredResults.length} documents containing query text`);
            return filteredResults.slice(0, this.options.maxResults);
        } catch (error) {
            logger.error('Failed to query by text:', error);
            throw error;
        }
    }

    /**
     * Semantic search using embeddings
     * @param {string} query - Semantic query
     * @param {Object} filters - Additional filters
     * @returns {Array} Matching documents with similarity scores
     */
    async queryBySemantic(query, filters = {}) {
        if (!this.options.enableEmbeddings) {
            logger.warn('Embeddings disabled, falling back to text search');
            return this.queryByText(query, filters);
        }

        logger.info(`Semantic query: "${query}"`);

        const { company, model } = filters;
        if (!company || !model) {
            throw new Error('Company and model filters are required for database queries');
        }

        try {
            // Generate embedding for query
            const queryEmbedding = await generateEmbedding(query);

            // Get all chunks for the model
            const allChunks = await this.db.getChunks(company, model);

            // Calculate similarity for all documents
            const similarities = allChunks.map(doc => {
                if (!doc.embedding) return { doc, similarity: 0 };

                const similarity = calculateSimilarity(queryEmbedding, doc.embedding);
                return { doc, similarity };
            });

            // Filter and sort by similarity
            const results = similarities
                .filter(item => {
                    const doc = item.doc;

                    // Apply similarity threshold
                    if (item.similarity < this.options.similarityThreshold) return false;

                    // Apply additional filters
                    if (filters.format && doc.metadata.format !== filters.format) return false;

                    return true;
                })
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, this.options.maxResults);

            logger.info(`Found ${results.length} semantically similar documents`);
            return results.map(item => ({
                ...item.doc,
                similarity: item.similarity
            }));

        } catch (error) {
            logger.error('Semantic search failed, falling back to text search:', error);
            return this.queryByText(query, filters);
        }
    }

    /**
     * Get compliance summary for a company/model
     * @param {string} company - Company name
     * @param {string} model - Model name (optional)
     * @returns {Object} Compliance summary
     */
    async getComplianceSummary(company, model = null) {
        if (!model) {
            throw new Error('Model parameter is required for database queries');
        }

        try {
            return await this.db.getComplianceSummary(company, model);
        } catch (error) {
            logger.error(`Failed to get compliance summary for ${company}/${model}:`, error);
            throw error;
        }
    }

    /**
     * Group array by key
     * @param {Array} array - Array to group
     * @param {string} key - Key to group by
     * @returns {Object} Grouped object
     */
    groupBy(array, key) {
        return array.reduce((groups, item) => {
            const value = key.split('.').reduce((obj, k) => obj?.[k], item);
            groups[value] = (groups[value] || 0) + 1;
            return groups;
        }, {});
    }

    /**
     * Get all available companies
     * @returns {Array} List of companies
     */
    async getCompanies() {
        try {
            return await this.db.getCompanies();
        } catch (error) {
            logger.error('Failed to get companies:', error);
            throw error;
        }
    }

    /**
     * Get all available models for a company
     * @param {string} company - Company name
     * @returns {Array} List of models
     */
    async getModels(company) {
        try {
            return await this.db.getModels(company);
        } catch (error) {
            logger.error(`Failed to get models for ${company}:`, error);
            throw error;
        }
    }

    /**
     * Get all available policy categories for a company/model
     * @param {string} company - Company name
     * @param {string} model - Model name
     * @returns {Array} List of categories
     */
    async getPolicyCategories(company, model) {
        try {
            const chunks = await this.db.getChunks(company, model);
            const categories = new Set();
            chunks.forEach(doc => {
                (doc.metadata.policyCategories || []).forEach(cat => categories.add(cat));
            });
            return [...categories];
        } catch (error) {
            logger.error(`Failed to get policy categories for ${company}/${model}:`, error);
            throw error;
        }
    }

    /**
     * Export compliance data for a specific model
     * @param {string} company - Company name
     * @param {string} model - Model name
     * @param {string} format - Export format (json, csv)
     * @returns {string} Exported data
     */
    async exportData(company, model, format = 'json') {
        try {
            const documents = await this.db.getChunks(company, model);

            if (format === 'json') {
                return JSON.stringify(documents, null, 2);
            } else if (format === 'csv') {
                // Simple CSV export
                const headers = ['id', 'company', 'model', 'format', 'documentType', 'policyCategories', 'text'];
                const rows = documents.map(doc => [
                    doc.id,
                    doc.metadata.company,
                    doc.metadata.model,
                    doc.metadata.format,
                    doc.metadata.documentType,
                    (doc.metadata.policyCategories || []).join(';'),
                    doc.text.replace(/"/g, '""').substring(0, 1000) // Truncate and escape
                ]);

                return [headers, ...rows].map(row =>
                    row.map(cell => `"${cell}"`).join(',')
                ).join('\n');
            }

            throw new Error(`Unsupported export format: ${format}`);
        } catch (error) {
            logger.error(`Failed to export data for ${company}/${model}:`, error);
            throw error;
        }
    }
}

module.exports = ComplianceEngine;