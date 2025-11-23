/**
 * Health Check and Monitoring Server
 * Provides /health endpoint and metrics for production monitoring
 */

const http = require('http');
const { scrapingQueue } = require('../core/queue');

// Health check state
const healthState = {
    startTime: Date.now(),
    lastCheck: Date.now(),
    status: 'starting',
    database: false,
    queue: false,
    errors: [],
};

/**
 * Update health state
 * @param {object} updates - State updates
 */
function updateHealth(updates) {
    Object.assign(healthState, updates);
    healthState.lastCheck = Date.now();
}

/**
 * Get system metrics
 * @returns {Promise<object>} - Metrics object
 */
async function getMetrics() {
    try {
        const uptime = Date.now() - healthState.startTime;

        // Get queue metrics
        let queueMetrics = {};
        try {
            const counts = await scrapingQueue.getJobCounts(
                'completed',
                'failed',
                'active',
                'waiting',
                'delayed'
            );
            queueMetrics = counts;
        } catch (queueError) {
            queueMetrics = { error: queueError.message };
        }

        // Get database metrics
        let dbMetrics = {};
        try {
            const { connectToDatabase } = require('../core/database');
            const db = await connectToDatabase();

            const listingsCount = await db.collection('listings').countDocuments({});
            const failedCount = await db.collection('failed_scrapes').countDocuments({});

            dbMetrics = {
                listings: listingsCount,
                failedScrapes: failedCount,
            };
        } catch (dbError) {
            dbMetrics = { error: dbError.message };
        }

        // Get memory usage
        const memUsage = process.memoryUsage();
        const memMetrics = {
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
            rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
        };

        return {
            status: healthState.status,
            uptime: Math.round(uptime / 1000) + 's',
            timestamp: new Date().toISOString(),
            database: dbMetrics,
            queue: queueMetrics,
            memory: memMetrics,
            errors: healthState.errors,
        };
    } catch (error) {
        return {
            status: 'error',
            error: error.message,
        };
    }
}

/**
 * Check if system is healthy
 * @returns {Promise<boolean>} - True if healthy
 */
async function isHealthy() {
    try {
        // Check database
        const { connectToDatabase } = require('../core/database');
        const db = await connectToDatabase();
        await db.command({ ping: 1 });

        // Check queue
        await scrapingQueue.getJobCounts('active');

        return true;
    } catch (error) {
        healthState.errors.push({
            timestamp: new Date().toISOString(),
            error: error.message,
        });
        // Keep only last 10 errors
        if (healthState.errors.length > 10) {
            healthState.errors = healthState.errors.slice(-10);
        }
        return false;
    }
}

/**
 * Start health check HTTP server
 * @param {number} port - Port to listen on
 */
function startHealthServer(port = 3000) {
    const server = http.createServer(async (req, res) => {
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');

        if (req.url === '/health') {
            const healthy = await isHealthy();
            const statusCode = healthy ? 200 : 503;

            res.writeHead(statusCode);
            res.end(JSON.stringify({
                status: healthy ? 'healthy' : 'unhealthy',
                timestamp: new Date().toISOString(),
            }));
        } else if (req.url === '/metrics') {
            const metrics = await getMetrics();
            res.writeHead(200);
            res.end(JSON.stringify(metrics, null, 2));
        } else if (req.url === '/') {
            res.writeHead(200);
            res.end(JSON.stringify({
                service: 'Real Estate Scraper',
                endpoints: ['/health', '/metrics'],
            }));
        } else {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Not found' }));
        }
    });

    server.listen(port, () => {
        console.log(`🏥 Health check server running on http://localhost:${port}`);
        console.log(`   GET http://localhost:${port}/health - Health status`);
        console.log(`   GET http://localhost:${port}/metrics - System metrics\n`);
    });

    return server;
}

module.exports = {
    updateHealth,
    getMetrics,
    isHealthy,
    startHealthServer,
};
