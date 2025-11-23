/**
 * Simple robots.txt checker placeholder
 * Returns true for all URLs (permissive mode)
 */

async function isAllowed(url) {
  // For now, allow all URLs
  // TODO: Implement full robots.txt checking
  return true;
}

async function getCrawlDelay(url) {
  // Default 1 second delay
  return 1000;
}

module.exports = {
  isAllowed,
  getCrawlDelay,
};
