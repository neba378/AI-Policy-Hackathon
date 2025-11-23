/**
 * Notification Service
 * Sends desktop notifications for scraping completion
 */

const notifier = require('node-notifier');
const path = require('path');

/**
 * Send a desktop notification
 * @param {object} options - Notification options
 */
function sendNotification({ title, message, sound = true }) {
    notifier.notify({
        title: title || 'Real Estate Scraper',
        message: message || 'Task completed',
        sound: sound,
        wait: false,
        timeout: 10, // Auto-dismiss after 10 seconds
        icon: path.join(__dirname, '..', '..', 'icon.png'), // Optional: add icon.png to root
    });
}

/**
 * Send scraping completion notification
 * @param {object} stats - Scraping statistics
 */
function notifyScrapingComplete(stats) {
    const {
        total = 0,
        completed = 0,
        failed = 0,
        unprocessed = 0,
        duration = 0,
    } = stats;

    // Calculate REAL success rate (of what was actually processed)
    const actuallyProcessed = completed + failed;
    const successRate = actuallyProcessed > 0 ? Math.round((completed / actuallyProcessed) * 100) : 0;
    const notProcessed = unprocessed;

    // Determine overall status
    let statusEmoji = '🎉';
    let statusText = 'COMPLETED';

    if (failed > completed) {
        statusEmoji = '⚠️';
        statusText = 'COMPLETED WITH ISSUES';
    } else if (completed === 0) {
        statusEmoji = '❌';
        statusText = 'FAILED';
    }

    // Build detailed message
    const message = `
SCRAPING ${statusText}

ACTUAL RESULTS (From MongoDB):
✅ ${completed} properties successfully scraped
❌ ${failed} URLs failed to scrape
${notProcessed > 0 ? `⏸️ ${notProcessed} URLs not processed (stopped early)\n` : ''}
SUCCESS RATE: ${successRate}% (of ${actuallyProcessed} processed)
TIME TAKEN: ${formatDuration(duration)}

DATABASE: ${completed} rental listings stored
${failed > 0 ? `ERRORS: Run 'node scripts/diagnose-failures.js'` : ''}
${notProcessed > 0 ? `UNFINISHED: Run 'npm start' to retry remaining URLs` : ''}
    `.trim();

    sendNotification({
        title: `${statusEmoji} Real Estate Scraper ${statusText}`,
        message,
        sound: true,
    });

    console.log('\n' + '='.repeat(80));
    console.log(`${statusEmoji} SCRAPING ${statusText}!`);
    console.log('='.repeat(80));
    console.log('\n📊 ACTUAL RESULTS (From MongoDB, not misleading queue stats):\n');
    console.log(`   Total URLs in jobs file:  ${total}`);
    console.log(`   ✅ Successfully scraped:  ${completed} properties`);
    console.log(`   ❌ Failed to scrape:      ${failed} URLs`);
    if (notProcessed > 0) {
        console.log(`   ⏸️  Not processed:        ${notProcessed} URLs (stopped early or expired)`);
    }
    console.log(`\n   📈 Success rate:          ${successRate}% (of ${actuallyProcessed} actually processed)`);
    console.log(`   ⏱️  Total time:            ${formatDuration(duration)}`);

    if (completed > 0) {
        console.log(`\n   💾 DATABASE: ${completed} rental listings stored in MongoDB`);
    }

    if (failed > 0) {
        console.log(`\n   🔍 CHECK ERRORS: Run 'node scripts/diagnose-failures.js' for detailed error analysis`);
        console.log(`   🔧 Or check status: Run 'node check-actual-status.js'`);
    }

    if (notProcessed > 0) {
        console.log(`\n   ⚠️  INCOMPLETE: ${notProcessed} URLs were not processed`);
        console.log(`   � SOLUTION: Run 'npm start' again to process remaining URLs`);
        console.log(`   💡 TIP: Let it run longer, or check if worker crashed`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('📂 View your data in MongoDB Atlas');
    console.log('📊 Export data: node export-data.js');
    if (actuallyProcessed < total) {
        console.log('🔄 Continue scraping: npm start (will skip already scraped URLs)');
    }
    console.log('='.repeat(80) + '\n');
}

/**
 * Send error notification
 * @param {string} errorMessage - Error message
 */
function notifyError(errorMessage) {
    sendNotification({
        title: '❌ Scraping Error',
        message: errorMessage,
        sound: true,
    });
}

/**
 * Format duration in milliseconds to human-readable string
 * @param {number} ms - Duration in milliseconds
 * @returns {string} - Formatted duration
 */
function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
}

module.exports = {
    sendNotification,
    notifyScrapingComplete,
    notifyError,
};
