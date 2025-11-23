/**
 * BullMQ Queue Setup and Job Processor
 * Handles scraping jobs with retry logic and error handling
 */

const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const { processListingUrl } = require('./processor');

// Redis connection
const connection = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: null,
});

// Create scraping queue
const scrapingQueue = new Queue('real-estate-scraping', {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 500, // Keep last 500 failed jobs for debugging
    },
});

/**
 * Add a scraping job to the queue
 * @param {string} url - The listing URL to scrape
 * @param {object} options - Additional options
 */
async function addScrapingJob(url, options = {}) {
    const job = await scrapingQueue.add('scrape-listing', {
        url,
        timestamp: Date.now(),
        ...options,
    });

    console.log(`✅ Added job ${job.id} for URL: ${url}`);
    return job;
}

/**
 * Add multiple URLs to the queue
 * @param {Array<string>} urls - Array of listing URLs
 */
async function addBulkScrapingJobs(urls) {
    const jobs = urls.map(url => ({
        name: 'scrape-listing',
        data: { url, timestamp: Date.now() },
    }));

    await scrapingQueue.addBulk(jobs);
    console.log(`✅ Added ${urls.length} jobs to the queue`);
}

/**
 * Worker to process scraping jobs
 * NOTE: Worker is created lazily to ensure database is connected first
 */
let worker = null;

function getWorker() {
    if (!worker) {
        worker = new Worker('real-estate-scraping', async (job) => {
            const { url } = job.data;

            console.log(`🔄 Processing job ${job.id}: ${url}`);

            try {
                const result = await processListingUrl(url);
                console.log(`✅ Successfully processed: ${url}`);
                return result;
            } catch (error) {
                console.error(`❌ Failed to process ${url}:`, error.message);
                throw error; // Will trigger retry
            }
        }, {
            connection,
            concurrency: 5, // Process 5 jobs concurrently
            limiter: {
                max: 10, // Max 10 jobs
                duration: 10000, // per 10 seconds (rate limiting)
            },
        });

        // Worker event listeners
        worker.on('completed', (job) => {
            console.log(`✅ Job ${job.id} completed successfully`);
        });

        worker.on('failed', (job, err) => {
            console.error(`❌ Job ${job.id} failed after ${job.attemptsMade} attempts:`, err.message);
        });

        worker.on('error', (err) => {
            console.error('Worker error:', err);
        });
    }

    return worker;
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🛑 Shutting down worker...');
    if (worker) {
        await worker.close();
    }
    await scrapingQueue.close();
    process.exit(0);
});

module.exports = {
    scrapingQueue,
    getWorker, // Export function instead of worker instance
    addScrapingJob,
    addBulkScrapingJobs,
};
