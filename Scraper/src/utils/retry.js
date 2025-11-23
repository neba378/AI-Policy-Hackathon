/**
 * Retry Utility with Exponential Backoff
 * Handles transient failures gracefully
 */

const logger = require('./logger');

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {object} options - Retry options
 * @returns {Promise<any>} - Result of function
 */
async function retryWithBackoff(fn, options = {}) {
    const {
        maxAttempts = 3,
        initialDelay = 1000,
        maxDelay = 30000,
        backoffMultiplier = 2,
        onRetry = null,
        retryableErrors = null, // Array of error types/messages that are retryable
    } = options;

    let lastError;
    let delay = initialDelay;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Check if error is retryable
            if (retryableErrors) {
                const isRetryable = retryableErrors.some(retryableError => {
                    if (typeof retryableError === 'string') {
                        return error.message.includes(retryableError);
                    } else if (retryableError instanceof RegExp) {
                        return retryableError.test(error.message);
                    } else {
                        return error instanceof retryableError;
                    }
                });

                if (!isRetryable) {
                    logger.warn('Error is not retryable, failing immediately', {
                        error: error.message,
                        attempt,
                    });
                    throw error;
                }
            }

            // If this was the last attempt, throw
            if (attempt === maxAttempts) {
                logger.error('Max retry attempts reached', {
                    attempts: maxAttempts,
                    error: error.message,
                });
                throw error;
            }

            // Log retry attempt
            logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, {
                error: error.message,
                nextAttempt: attempt + 1,
                maxAttempts,
            });

            // Call retry callback if provided
            if (onRetry) {
                try {
                    await onRetry(error, attempt);
                } catch (callbackError) {
                    logger.error('Retry callback failed', { error: callbackError.message });
                }
            }

            // Wait before retrying
            await sleep(delay);

            // Calculate next delay (exponential backoff with jitter)
            delay = Math.min(delay * backoffMultiplier, maxDelay);
            // Add random jitter (±25%) to prevent thundering herd
            delay = delay * (0.75 + Math.random() * 0.5);
        }
    }

    throw lastError;
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry with timeout
 * @param {Function} fn - Async function
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {object} retryOptions - Retry options
 * @returns {Promise<any>}
 */
async function retryWithTimeout(fn, timeoutMs, retryOptions = {}) {
    return retryWithBackoff(async () => {
        return await withTimeout(fn(), timeoutMs, 'Operation timed out');
    }, retryOptions);
}

/**
 * Add timeout to a promise
 * @param {Promise} promise - Promise to add timeout to
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {string} errorMessage - Error message if timeout
 * @returns {Promise<any>}
 */
function withTimeout(promise, timeoutMs, errorMessage = 'Timeout exceeded') {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
        ),
    ]);
}

/**
 * Circuit breaker state
 */
const circuitBreakers = new Map();

/**
 * Circuit breaker implementation
 * Stops trying failed operations after threshold
 * @param {string} name - Circuit breaker name
 * @param {Function} fn - Function to protect
 * @param {object} options - Circuit breaker options
 * @returns {Promise<any>}
 */
async function withCircuitBreaker(name, fn, options = {}) {
    const {
        failureThreshold = 5,
        resetTimeout = 60000, // 1 minute
        halfOpenAttempts = 1,
    } = options;

    // Get or create circuit breaker state
    if (!circuitBreakers.has(name)) {
        circuitBreakers.set(name, {
            state: 'CLOSED', // CLOSED (normal), OPEN (failing), HALF_OPEN (testing)
            failures: 0,
            lastFailureTime: null,
            successCount: 0,
        });
    }

    const breaker = circuitBreakers.get(name);

    // Check if circuit is OPEN
    if (breaker.state === 'OPEN') {
        const timeSinceFailure = Date.now() - breaker.lastFailureTime;

        if (timeSinceFailure >= resetTimeout) {
            logger.info('Circuit breaker moving to HALF_OPEN', { name });
            breaker.state = 'HALF_OPEN';
            breaker.successCount = 0;
        } else {
            throw new Error(`Circuit breaker OPEN for ${name} (retry in ${resetTimeout - timeSinceFailure}ms)`);
        }
    }

    try {
        const result = await fn();

        // Success - reset failures
        if (breaker.state === 'HALF_OPEN') {
            breaker.successCount++;
            if (breaker.successCount >= halfOpenAttempts) {
                logger.info('Circuit breaker CLOSED (recovered)', { name });
                breaker.state = 'CLOSED';
                breaker.failures = 0;
            }
        } else {
            breaker.failures = 0;
        }

        return result;
    } catch (error) {
        breaker.failures++;
        breaker.lastFailureTime = Date.now();

        if (breaker.failures >= failureThreshold) {
            logger.error('Circuit breaker OPEN (threshold exceeded)', {
                name,
                failures: breaker.failures,
                threshold: failureThreshold,
            });
            breaker.state = 'OPEN';
        }

        throw error;
    }
}

/**
 * Reset a circuit breaker
 * @param {string} name - Circuit breaker name
 */
function resetCircuitBreaker(name) {
    if (circuitBreakers.has(name)) {
        circuitBreakers.delete(name);
        logger.info('Circuit breaker reset', { name });
    }
}

module.exports = {
    retryWithBackoff,
    retryWithTimeout,
    withTimeout,
    withCircuitBreaker,
    resetCircuitBreaker,
    sleep,
};
