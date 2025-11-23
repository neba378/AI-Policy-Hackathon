/**
 * MongoDB Database Module for AI Documentation
 * Provides separate collections for each AI model/company
 */

const { MongoClient } = require('mongodb');
const logger = require('../utils/logger');

class AIDatabase {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.databases = new Map(); // Cache for different company databases
    }

    /**
     * Connect to MongoDB
     * @param {string} uri - MongoDB connection URI
     */
    async connect(uri = process.env.MONGODB_URI) {
        if (!uri) {
            throw new Error('MONGODB_URI environment variable is required');
        }

        try {
            // MongoDB Atlas connection with TLS settings
            this.client = new MongoClient(uri, {
                serverSelectionTimeoutMS: 30000,
                socketTimeoutMS: 45000,
                maxPoolSize: 10,
                minPoolSize: 2,
                retryWrites: true,
                retryReads: true,
                tls: true,
                tlsAllowInvalidCertificates: false,
                tlsAllowInvalidHostnames: false
            });
            await this.client.connect();
            this.isConnected = true;
            logger.info('Connected to MongoDB Atlas successfully');

            // Test the connection
            await this.client.db('admin').command({ ping: 1 });
            logger.info('MongoDB ping successful');
        } catch (error) {
            logger.error('Failed to connect to MongoDB:', error.message);
            throw error; // Don't fall back, fail fast in production
        }
    }

    /**
     * Get database instance for a specific company
     * @param {string} company - Company name
     * @returns {Db} MongoDB database instance
     */
    getCompanyDatabase(company) {
        if (!this.isConnected) {
            throw new Error('Database not connected');
        }

        if (this.useMock) {
            return {
                collection: (name) => this.getMockCollection(company, name)
            };
        }

        const dbName = this.getDatabaseName(company);
        if (!this.databases.has(dbName)) {
            this.databases.set(dbName, this.client.db(dbName));
        }
        return this.databases.get(dbName);
    }

    /**
     * Get mock collection for development/demo mode
     * @param {string} company - Company name
     * @param {string} collectionName - Collection name
     * @returns {Object} Mock collection interface
     */
    getMockCollection(company, collectionName) {
        const key = `${company}_${collectionName}`;
        if (!this.mockData.has(key)) {
            this.mockData.set(key, []);
        }

        const data = this.mockData.get(key);

        return {
            insertMany: async (documents) => {
                data.push(...documents);
                logger.info(`Mock stored ${documents.length} documents in ${key}`);
                return { insertedCount: documents.length };
            },
            find: (query) => ({
                toArray: async () => {
                    let results = [...data];
                    // Simple mock filtering
                    if (query && query['metadata.policyCategories']) {
                        const categories = query['metadata.policyCategories'].$in;
                        results = results.filter(doc =>
                            categories.some(cat => doc.metadata.policyCategories?.includes(cat))
                        );
                    }
                    return results;
                }
            }),
            deleteMany: async () => {
                const count = data.length;
                data.length = 0;
                logger.info(`Mock deleted ${count} documents from ${key}`);
                return { deletedCount: count };
            },
            countDocuments: async () => data.length
        };
    }

    /**
     * Disconnect from MongoDB
     */
    async disconnect() {
        if (this.client && !this.useMock) {
            await this.client.close();
            this.isConnected = false;
            logger.info('Disconnected from MongoDB');
        } else if (this.useMock) {
            this.isConnected = false;
            logger.info('Mock database disconnected');
        }
    }

    /**
     * Get database name for a specific company
     * @param {string} company - Company name
     * @returns {string} Database name
     */
    getDatabaseName(company) {
        return company.toLowerCase().replace(/[^a-z0-9]/g, '_');
    }

    /**
     * Get collection name for a specific model
     * @param {string} model - Model name
     * @returns {string} Collection name
     */
    getCollectionName(model) {
        const cleanModel = model.toLowerCase().replace(/[^a-z0-9]/g, '_');
        return `${cleanModel}_chunks`;
    }

    /**
     * Store document chunks for a specific model
     * @param {string} company - Company name
     * @param {string} model - Model name
     * @param {Array} chunks - Document chunks to store
     */
    async storeChunks(company, model, chunks) {
        const db = this.getCompanyDatabase(company);
        const collectionName = this.getCollectionName(model);
        const collection = db.collection(collectionName);

        try {
            // Add metadata to chunks
            const chunksWithMetadata = chunks.map(chunk => ({
                ...chunk,
                metadata: {
                    ...chunk.metadata,
                    company,
                    model,
                    storedAt: new Date(),
                    version: '1.0'
                }
            }));

            const result = await collection.insertMany(chunksWithMetadata);
            const msg = `✅ Stored ${result.insertedCount} chunks for ${company}/${model} in DB: ${this.getDatabaseName(company)}`;
            logger.info(msg);
            // logger.info(msg); // Only log to logger in production
            return result;
        } catch (error) {
            logger.error(`Failed to store chunks for ${company}/${model}:`, error);
            throw error;
        }
    }

    /**
     * Get all chunks for a specific model
     * @param {string} company - Company name
     * @param {string} model - Model name
     * @param {Object} filters - Additional filters
     * @returns {Array} Document chunks
     */
    async getChunks(company, model, filters = {}) {
        if (this.useMock) {
            const collection = this.getMockCollection(company, this.getCollectionName(model));
            const chunks = await collection.find(filters).toArray();
            logger.debug(`Mock retrieved ${chunks.length} chunks for ${company}/${model}`);
            return chunks;
        }

        const db = this.getCompanyDatabase(company);
        const collectionName = this.getCollectionName(model);
        const collection = db.collection(collectionName);

        try {
            const query = { ...filters };
            const chunks = await collection.find(query).toArray();
            logger.debug(`Retrieved ${chunks.length} chunks for ${company}/${model} from database ${this.getDatabaseName(company)}`);
            return chunks;
        } catch (error) {
            logger.error(`Failed to retrieve chunks for ${company}/${model}:`, error);
            throw error;
        }
    }

    /**
     * Get chunks by policy categories
     * @param {string} company - Company name
     * @param {string} model - Model name
     * @param {Array} categories - Policy categories
     * @returns {Array} Matching chunks
     */
    async getChunksByCategories(company, model, categories) {
        const filters = {
            'metadata.policyCategories': {
                $in: categories
            }
        };
        return this.getChunks(company, model, filters);
    }

    /**
     * Search chunks by text content
     * @param {string} company - Company name
     * @param {string} model - Model name
     * @param {string} query - Text query
     * @returns {Array} Matching chunks
     */
    async searchChunksByText(company, model, query) {
        const db = this.getCompanyDatabase(company);
        const collectionName = this.getCollectionName(model);
        const collection = db.collection(collectionName);

        try {
            const regex = new RegExp(query, 'i');
            const chunks = await collection.find({
                text: { $regex: regex }
            }).toArray();

            logger.debug(`Found ${chunks.length} chunks matching text query "${query}" for ${company}/${model}`);
            return chunks;
        } catch (error) {
            logger.error(`Failed to search chunks for ${company}/${model}:`, error);
            throw error;
        }
    }

    /**
     * Get compliance summary for a model
     * @param {string} company - Company name
     * @param {string} model - Model name
     * @returns {Object} Compliance summary
     */
    async getComplianceSummary(company, model) {
        const chunks = await this.getChunks(company, model);

        const summary = {
            company,
            model,
            totalChunks: chunks.length,
            policyCategories: {},
            documentTypes: {},
            formats: {},
            lastUpdated: null
        };

        chunks.forEach(chunk => {
            // Count policy categories
            (chunk.metadata.policyCategories || []).forEach(cat => {
                summary.policyCategories[cat] = (summary.policyCategories[cat] || 0) + 1;
            });

            // Count document types
            const docType = chunk.metadata.documentType;
            summary.documentTypes[docType] = (summary.documentTypes[docType] || 0) + 1;

            // Count formats
            const format = chunk.metadata.format;
            summary.formats[format] = (summary.formats[format] || 0) + 1;

            // Track last updated
            const storedAt = chunk.metadata.storedAt;
            if (!summary.lastUpdated || storedAt > summary.lastUpdated) {
                summary.lastUpdated = storedAt;
            }
        });

        return summary;
    }

    /**
     * Get all available companies
     * @returns {Array} List of companies
     */
    async getCompanies() {
        if (!this.isConnected) {
            throw new Error('Database not connected');
        }

        if (this.useMock) {
            // Extract companies from mock data keys
            const companies = new Set();
            for (const key of this.mockData.keys()) {
                const company = key.split('_')[0];
                if (company) companies.add(company);
            }
            return Array.from(companies);
        }

        try {
            // Get all database names
            const adminDb = this.client.db('admin');
            const dbs = await adminDb.admin().listDatabases();
            const companies = dbs.databases
                .map(db => db.name)
                .filter(name => name !== 'admin' && name !== 'config' && name !== 'local')
                .map(dbName => {
                    // Convert back from normalized name to original
                    // This is a simple reverse mapping - in production you'd want a proper mapping
                    return dbName.charAt(0).toUpperCase() + dbName.slice(1);
                });
            return companies;
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
        const db = this.getCompanyDatabase(company);

        try {
            const collections = await db.listCollections().toArray();
            const models = collections
                .filter(col => col.name.endsWith('_chunks'))
                .map(col => {
                    const modelName = col.name.replace('_chunks', '').replace(/_/g, ' ');
                    // Convert back from normalized name to original
                    return modelName.split(' ').map(word =>
                        word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ');
                });

            return [...new Set(models)];
        } catch (error) {
            logger.error(`Failed to get models for ${company}:`, error);
            throw error;
        }
    }

    /**
     * Delete all chunks for a specific model
     * @param {string} company - Company name
     * @param {string} model - Model name
     */
    async deleteModelData(company, model) {
        const db = this.getCompanyDatabase(company);
        const collectionName = this.getCollectionName(model);
        const collection = db.collection(collectionName);

        try {
            const result = await collection.deleteMany({});
            logger.info(`Deleted ${result.deletedCount} chunks for ${company}/${model} from database ${this.getDatabaseName(company)}`);
            return result;
        } catch (error) {
            logger.error(`Failed to delete data for ${company}/${model}:`, error);
            throw error;
        }
    }

    /**
     * Get database statistics for all companies
     * @returns {Object} Database stats
     */
    async getStats() {
        if (!this.isConnected) {
            throw new Error('Database not connected');
        }

        // Handle mock mode
        if (this.useMock) {
            const stats = {
                totalDatabases: 0,
                databases: [],
                totalCollections: 0,
                totalDocuments: 0,
                mockMode: true
            };

            // Count mock data
            const companyCollections = new Map();
            for (const [key, data] of this.mockData.entries()) {
                const [company, ...collectionParts] = key.split('_');
                const collection = collectionParts.join('_');

                if (!companyCollections.has(company)) {
                    companyCollections.set(company, []);
                }

                companyCollections.get(company).push({
                    name: collection,
                    documentCount: data.length
                });

                stats.totalDocuments += data.length;
                stats.totalCollections++;
            }

            // Build database stats
            for (const [company, collections] of companyCollections.entries()) {
                const totalDocs = collections.reduce((sum, col) => sum + col.documentCount, 0);
                stats.databases.push({
                    name: this.getDatabaseName(company),
                    company: company,
                    collections: collections,
                    totalDocuments: totalDocs
                });
                stats.totalDatabases++;
            }

            return stats;
        }

        try {
            const companies = await this.getCompanies();
            const stats = {
                totalDatabases: companies.length,
                databases: [],
                totalCollections: 0,
                totalDocuments: 0,
                mockMode: false
            };

            for (const company of companies) {
                const db = this.getCompanyDatabase(company);
                const collections = await db.listCollections().toArray();
                const dbStats = {
                    name: this.getDatabaseName(company),
                    company: company,
                    collections: [],
                    totalDocuments: 0
                };

                for (const col of collections) {
                    if (col.name.startsWith('system.')) continue;

                    const collection = db.collection(col.name);
                    const count = await collection.countDocuments();
                    dbStats.totalDocuments += count;
                    stats.totalDocuments += count;
                    stats.totalCollections++;

                    dbStats.collections.push({
                        name: col.name,
                        documentCount: count
                    });
                }

                stats.databases.push(dbStats);
            }

            return stats;
        } catch (error) {
            logger.error('Failed to get database stats:', error);
            throw error;
        }
    }
}

// Singleton instance
let dbInstance = null;

/**
 * Get database instance (singleton)
 * @returns {AIDatabase} Database instance
 */
function getDatabase() {
    if (!dbInstance) {
        dbInstance = new AIDatabase();
    }
    return dbInstance;
}

/**
 * Connect to database
 * @param {string} uri - MongoDB URI
 */
async function connectToDatabase(uri) {
    const db = getDatabase();
    await db.connect(uri);
    return db;
}

module.exports = {
    AIDatabase,
    getDatabase,
    connectToDatabase
};