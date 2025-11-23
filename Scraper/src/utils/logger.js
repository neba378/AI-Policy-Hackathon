/**
 * Structured Logging System
 * Production-ready logging with levels, context, and rotation
 */

const fs = require('fs');
const path = require('path');

// Log levels
const LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
};

// Current log level from environment (default: INFO)
const currentLevel = LEVELS[process.env.LOG_LEVEL?.toUpperCase() || 'INFO'] || LEVELS.INFO;

// Log directory
const logDir = path.join(__dirname, '../../logs');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Log file paths
const mainLogFile = path.join(logDir, 'app.log');
const errorLogFile = path.join(logDir, 'error.log');

/**
 * Write log entry to file and console
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {object} context - Additional context
 */
function writeLog(level, message, context = {}) {
    const timestamp = new Date().toISOString();

    const logEntry = {
        timestamp,
        level,
        message,
        ...context,
    };

    // Write to console (colored)
    const colors = {
        ERROR: '\x1b[31m', // Red
        WARN: '\x1b[33m',  // Yellow
        INFO: '\x1b[36m',  // Cyan
        DEBUG: '\x1b[90m', // Gray
    };
    const reset = '\x1b[0m';

    const consoleMessage = `${colors[level]}[${timestamp}] ${level}: ${message}${reset}`;
    console.log(consoleMessage);
    if (Object.keys(context).length > 0) {
        console.log('  Context:', JSON.stringify(context, null, 2));
    }

    // Write to file (JSON format)
    const jsonLog = JSON.stringify(logEntry) + '\n';

    try {
        fs.appendFileSync(mainLogFile, jsonLog);

        // Also write errors to separate file
        if (level === 'ERROR') {
            fs.appendFileSync(errorLogFile, jsonLog);
        }

        // Rotate logs if they exceed 100MB
        rotateLogs();
    } catch (err) {
        console.error('Failed to write log:', err.message);
    }
}

/**
 * Rotate log files if they exceed size limit
 */
function rotateLogs() {
    const maxSize = 100 * 1024 * 1024; // 100MB

    [mainLogFile, errorLogFile].forEach(logFile => {
        try {
            if (fs.existsSync(logFile)) {
                const stats = fs.statSync(logFile);
                if (stats.size > maxSize) {
                    const rotatedFile = `${logFile}.${Date.now()}`;
                    fs.renameSync(logFile, rotatedFile);
                    console.log(`📁 Rotated log file: ${path.basename(rotatedFile)}`);
                }
            }
        } catch (err) {
            // Ignore rotation errors
        }
    });
}

/**
 * Logger API
 */
const logger = {
    error: (message, context = {}) => {
        if (currentLevel >= LEVELS.ERROR) {
            writeLog('ERROR', message, context);
        }
    },

    warn: (message, context = {}) => {
        if (currentLevel >= LEVELS.WARN) {
            writeLog('WARN', message, context);
        }
    },

    info: (message, context = {}) => {
        if (currentLevel >= LEVELS.INFO) {
            writeLog('INFO', message, context);
        }
    },

    debug: (message, context = {}) => {
        if (currentLevel >= LEVELS.DEBUG) {
            writeLog('DEBUG', message, context);
        }
    },
};

module.exports = logger;
