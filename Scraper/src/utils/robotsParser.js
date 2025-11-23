/**
 * Robots.txt Parser and Compliance Checker
 * Ensures legal and ethical web scraping by respecting robots.txt rules
 */

const axios = require("axios");
const { URL } = require("url");

// Cache robots.txt rules to avoid repeated fetches
const robotsCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Our bot's identity (MUST be honest)
const USER_AGENT =
  "RealEstateScraper/1.0 (+https://github.com/Urz1/Real_State_Scraper)";

/**
 * Parse robots.txt content
 * @param {string} robotsTxt - Raw robots.txt content
 * @param {string} userAgent - User agent to check rules for
 * @returns {object} - Parsed rules { allowed, disallowed, crawlDelay, sitemaps }
 */
function parseRobotsTxt(robotsTxt, userAgent = USER_AGENT) {
  const rules = {
    allowed: [],
    disallowed: [],
    crawlDelay: null,
    sitemaps: [],
  };

  if (!robotsTxt) return rules;

  const lines = robotsTxt.split("\n");
  let currentUserAgent = null;
  let isRelevantSection = false;

  for (let line of lines) {
    line = line.trim();

    // Skip comments and empty lines
    if (line.startsWith("#") || line === "") continue;

    const [key, ...valueParts] = line.split(":");
    const value = valueParts.join(":").trim();

    const keyLower = key.toLowerCase();

    if (keyLower === "user-agent") {
      currentUserAgent = value.toLowerCase();
      // Check if this section applies to us
      isRelevantSection =
        currentUserAgent === "*" ||
        currentUserAgent.includes("realestatescraper") ||
        currentUserAgent === userAgent.toLowerCase();
    }

    if (!isRelevantSection) continue;

    if (keyLower === "disallow") {
      if (value === "") {
        // Empty disallow = allow everything
        rules.allowed.push("/*");
      } else {
        rules.disallowed.push(value);
      }
    } else if (keyLower === "allow") {
      rules.allowed.push(value);
    } else if (keyLower === "crawl-delay") {
      const delay = parseFloat(value);
      if (!isNaN(delay)) {
        rules.crawlDelay = delay * 1000; // Convert to milliseconds
      }
    } else if (keyLower === "sitemap") {
      rules.sitemaps.push(value);
    }
  }

  return rules;
}

/**
 * Check if a URL matches a robots.txt pattern
 * @param {string} path - URL path to check
 * @param {string} pattern - Robots.txt pattern (e.g., /admin/, /api/*)
 * @returns {boolean} - True if matches
 */
function matchesPattern(path, pattern) {
  // Convert robots.txt pattern to regex
  let regexPattern = pattern
    .replace(/\./g, "\\.") // Escape dots
    .replace(/\*/g, ".*") // * matches anything
    .replace(/\$/g, "\\$"); // Escape $

  // Pattern ending with $ means exact match
  if (pattern.endsWith("$")) {
    regexPattern = "^" + regexPattern;
  } else {
    regexPattern = "^" + regexPattern;
  }

  const regex = new RegExp(regexPattern, "i");
  return regex.test(path);
}

/**
 * Fetch and cache robots.txt for a domain
 * @param {string} urlString - Any URL from the target domain
 * @returns {object} - Parsed rules or null if unavailable
 */
async function fetchRobotsTxt(urlString) {
  try {
    const url = new URL(urlString);
    const domain = `${url.protocol}//${url.host}`;
    const robotsUrl = `${domain}/robots.txt`;

    // Check cache first
    const cached = robotsCache.get(domain);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`✅ Using cached robots.txt for ${domain}`);
      return cached.rules;
    }

    console.log(`🔍 Fetching robots.txt: ${robotsUrl}`);

    const response = await axios.get(robotsUrl, {
      timeout: 10000,
      headers: { "User-Agent": USER_AGENT },
      validateStatus: (status) => status < 500, // Accept 404 (no robots.txt)
    });

    if (response.status === 404) {
      console.log(`ℹ️  No robots.txt found for ${domain} (assuming allowed)`);
      const defaultRules = {
        allowed: ["/*"],
        disallowed: [],
        crawlDelay: null,
        sitemaps: [],
      };

      // Cache the result
      robotsCache.set(domain, {
        rules: defaultRules,
        timestamp: Date.now(),
      });

      return defaultRules;
    }

    const rules = parseRobotsTxt(response.data, USER_AGENT);

    // Cache the result
    robotsCache.set(domain, {
      rules,
      timestamp: Date.now(),
    });

    console.log(`✅ Parsed robots.txt for ${domain}`);
    console.log(`   - Disallowed patterns: ${rules.disallowed.length}`);
    console.log(
      `   - Crawl delay: ${rules.crawlDelay ? rules.crawlDelay + "ms" : "none"}`
    );
    console.log(`   - Sitemaps: ${rules.sitemaps.length}`);

    return rules;
  } catch (error) {
    console.error(
      `❌ Failed to fetch robots.txt for ${urlString}:`,
      error.message
    );
    console.log(
      `⚠️  No robots.txt found - assuming scraping IS allowed (permissive mode)`
    );

    // Permissive: if robots.txt doesn't exist or can't be fetched, assume allowed
    return {
      allowed: ["/*"],
      disallowed: [],
      crawlDelay: 1000, // Standard 1 second delay
      sitemaps: [],
    };
  }
}

/**
 * Check if we're allowed to scrape a specific URL
 * @param {string} urlString - URL to check
 * @returns {object} - { allowed: boolean, reason: string, crawlDelay: number }
 */
async function canScrape(urlString) {
  const url = new URL(urlString);
  const path = url.pathname + url.search;

  const rules = await fetchRobotsTxt(urlString);

  // Check disallow rules first (more restrictive)
  for (const pattern of rules.disallowed) {
    if (matchesPattern(path, pattern)) {
      return {
        allowed: false,
        reason: `Matches disallowed pattern: ${pattern}`,
        crawlDelay: rules.crawlDelay || 5000,
      };
    }
  }

  // Check allow rules (explicit permission)
  for (const pattern of rules.allowed) {
    if (matchesPattern(path, pattern)) {
      return {
        allowed: true,
        reason: `Matches allowed pattern: ${pattern}`,
        crawlDelay: rules.crawlDelay || 1000, // Default 1s if no crawl-delay
      };
    }
  }

  // If no rules match and disallowed is empty, assume allowed
  if (rules.disallowed.length === 0) {
    return {
      allowed: true,
      reason: "No robots.txt restrictions found",
      crawlDelay: rules.crawlDelay || 1000,
    };
  }

  // If we have disallow rules but nothing matched, assume allowed
  return {
    allowed: true,
    reason: "Path not explicitly disallowed",
    crawlDelay: rules.crawlDelay || 1000,
  };
}

/**
 * Get recommended crawl delay for a domain
 * @param {string} urlString - URL from the domain
 * @returns {number} - Recommended delay in milliseconds
 */
async function getCrawlDelay(urlString) {
  const rules = await fetchRobotsTxt(urlString);
  return rules.crawlDelay || 1000; // Default 1 second
}

/**
 * Get sitemaps for a domain (useful for discovering URLs)
 * @param {string} urlString - URL from the domain
 * @returns {Array<string>} - Array of sitemap URLs
 */
async function getSitemaps(urlString) {
  const rules = await fetchRobotsTxt(urlString);
  return rules.sitemaps || [];
}

/**
 * Clear robots.txt cache (useful for testing)
 */
function clearCache() {
  robotsCache.clear();
  console.log("✅ Robots.txt cache cleared");
}

/**
 * Get our bot's user agent string
 * @returns {string} - User agent
 */
function getUserAgent() {
  return USER_AGENT;
}

module.exports = {
  parseRobotsTxt,
  fetchRobotsTxt,
  canScrape,
  getCrawlDelay,
  getSitemaps,
  clearCache,
  getUserAgent,
};
