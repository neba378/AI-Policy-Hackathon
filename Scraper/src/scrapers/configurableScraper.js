/**
 * Configurable Scraper
 * Generic scraper that reads site configurations from JSON files
 * Eliminates need to write code for each new site
 */

const {
  fetchHtml,
  loadHtml,
  extractText,
  extractImages,
  parsePrice,
  parseArea,
  parseRoomCount,
  generateExternalId,
} = require('./baseScraper');

/**
 * Create a scraper instance from configuration
 * @param {object} config - Scraper configuration
 * @returns {object} - Scraper object with name, urlPattern, and extract function
 */
function createScraperFromConfig(config) {
  return {
    name: config.name,
    urlPattern: new RegExp(config.urlPattern, config.patternFlags || 'i'),

    /**
     * Extract listing data using configuration
     * @param {string} url - Listing URL
     * @returns {object} - Raw extracted data
     */
    async extract(url) {
      // Use Puppeteer if config specifies it's required
      const fetchOptions = config.requiresPuppeteer ? { forcePuppeteer: true } : {};
      const html = await fetchHtml(url, fetchOptions);
      const $ = loadHtml(html);

      // Extract basic information using configured selectors
      let title = extractField($, config.selectors.title);
      let description = extractField($, config.selectors.description);

      // Fallback: if title is empty, try common selectors
      if (!title) {
        title = extractField($, ['h1', 'h2', '.title', '[class*="title"]']);
      }

      // Fallback: if description is empty, try common selectors
      if (!description) {
        description = extractField($, ['p', '.description', '[class*="description"]', '.content']);
      }
      const price = extractPriceField($, config.selectors.price);
      const location = extractLocationField($, config.selectors.location);
      const specifications = extractSpecificationsField($, config.selectors.specifications);
      const images = extractImagesField($, config.selectors.images, url);
      const features = extractFeaturesField($, config.selectors.features);

      return {
        externalId: generateExternalId(url, config.name),
        url,
        title,
        description,
        price,
        location,
        specifications,
        images,
        features,
        source: config.name,
      };
    },
  };
}

/**
 * Extract a single text field using selector config
 * @param {CheerioAPI} $ - Cheerio instance
 * @param {object|string|array} selectorConfig - Selector configuration
 * @returns {string} - Extracted text
 */
function extractField($, selectorConfig) {
  if (!selectorConfig) return '';

  // Handle array of selectors (try each until one works)
  if (Array.isArray(selectorConfig)) {
    for (const selector of selectorConfig) {
      const value = extractField($, selector);
      if (value) return value;
    }
    return '';
  }

  if (typeof selectorConfig === 'string') {
    return extractText($(selectorConfig));
  }

  // Handle label-value matching pattern (for key-value pair layouts)
  if (selectorConfig.labelMatch) {
    const { selector, labelMatch, valueSelector, default: defaultValue = '' } = selectorConfig;
    const labelPatterns = labelMatch.split('|');

    // Find the row that contains the matching label
    let matchedValue = '';
    $(selector).each((i, elem) => {
      const labelText = $(elem).find('.object-properties-label').text().trim();

      // Check if label matches any pattern
      for (const pattern of labelPatterns) {
        if (labelText.toLowerCase().includes(pattern.toLowerCase())) {
          matchedValue = $(elem).find(valueSelector).text().trim();
          return false; // Break the each loop
        }
      }
    });

    return matchedValue || defaultValue;
  }

  // Advanced selector config
  const { selector, attribute, regex, fallbackRegex, default: defaultValue = '' } = selectorConfig;

  let value = '';
  if (attribute) {
    value = $(selector).attr(attribute) || '';
  } else {
    value = extractText($(selector));
  }

  // Apply regex if specified
  if (regex && value) {
    try {
      const match = value.match(new RegExp(regex));
      value = match ? match[1] || match[0] : '';
    } catch (regexError) {
      console.warn(`⚠️  Invalid regex pattern "${regex}": ${regexError.message}`);
      // Continue without applying regex
    }
  }

  // If still no value, try fallback regex on full HTML
  if (!value && fallbackRegex) {
    try {
      const htmlText = $.root().text();
      const match = htmlText.match(new RegExp(fallbackRegex, 'i'));
      value = match ? match[1] || match[0] : '';
    } catch (regexError) {
      console.warn(`⚠️  Invalid fallback regex pattern "${fallbackRegex}": ${regexError.message}`);
      // Continue without applying regex
    }
  }

  return value || defaultValue;
}

/**
 * Extract price field with parsing
 * @param {CheerioAPI} $ - Cheerio instance
 * @param {object|string} selectorConfig - Price selector config
 * @returns {number|null} - Parsed price
 */
function extractPriceField($, selectorConfig) {
  const priceText = extractField($, selectorConfig);
  return parsePrice(priceText);
}

/**
 * Extract location information
 * @param {CheerioAPI} $ - Cheerio instance
 * @param {object} locationConfig - Location selector config
 * @returns {object} - Location object
 */
function extractLocationField($, locationConfig) {
  if (!locationConfig) {
    return { street: null, city: null, postalCode: null };
  }

  if (typeof locationConfig === 'string') {
    // Simple location string
    const locationText = extractText($(locationConfig));
    return parseLocation(locationText);
  }

  // Advanced location config
  const { combined, street, city, postalCode } = locationConfig;

  if (combined) {
    const locationText = extractField($, combined);
    return parseLocation(locationText);
  }

  return {
    street: extractField($, street),
    city: extractField($, city),
    postalCode: extractField($, postalCode),
  };
}

/**
 * Parse location text into components (Dutch format)
 * @param {string} text - Location text
 * @returns {object} - Parsed location
 */
function parseLocation(text) {
  if (!text) return { street: null, city: null, postalCode: null };

  // Common Dutch format: "Straatnaam 123, 1234 AB Amsterdam"
  const match = text.match(/^([^,]+),?\s*(\d{4}\s*[A-Z]{2})?\s*(.*)$/i);

  if (match) {
    return {
      street: match[1]?.trim() || null,
      city: match[3]?.trim() || null,
      postalCode: match[2]?.replace(/\s/g, '') || null,
    };
  }

  return { street: text, city: null, postalCode: null };
}

/**
 * Extract specifications
 * @param {CheerioAPI} $ - Cheerio instance
 * @param {object} specsConfig - Specifications selector config
 * @returns {object} - Specifications object
 */
function extractSpecificationsField($, specsConfig) {
  const specs = {
    bedrooms: null,
    bathrooms: null,
    area: null,
    furnished: 'unknown',
  };

  if (!specsConfig) return specs;

  // Extract from list items or specific selectors
  if (specsConfig.list) {
    $(specsConfig.list).each((i, elem) => {
      const text = $(elem).text().toLowerCase();

      if (text.match(/slaapkamer|bedroom/)) {
        specs.bedrooms = parseRoomCount(text);
      } else if (text.match(/badkamer|bathroom/)) {
        specs.bathrooms = parseRoomCount(text);
      } else if (text.match(/m²|m2/)) {
        specs.area = parseArea(text);
      } else if (text.match(/gemeubileerd|furnished/)) {
        specs.furnished = 'furnished';
      } else if (text.match(/ongemeubileerd|unfurnished/)) {
        specs.furnished = 'unfurnished';
      }
    });
  }

  // Override with specific selectors if provided
  if (specsConfig.bedrooms) {
    specs.bedrooms = parseRoomCount(extractField($, specsConfig.bedrooms));
  }
  if (specsConfig.bathrooms) {
    specs.bathrooms = parseRoomCount(extractField($, specsConfig.bathrooms));
  }
  if (specsConfig.area) {
    specs.area = parseArea(extractField($, specsConfig.area));
  }
  if (specsConfig.furnished) {
    const furnishedText = extractField($, specsConfig.furnished);
    if (furnishedText.match(/gemeubileerd|furnished/i)) {
      specs.furnished = 'furnished';
    } else if (furnishedText.match(/ongemeubileerd|unfurnished/i)) {
      specs.furnished = 'unfurnished';
    }
  }

  return specs;
}

/**
 * Extract images
 * @param {CheerioAPI} $ - Cheerio instance
 * @param {object|string} imagesConfig - Images selector config
 * @param {string} baseUrl - Base URL for relative paths
 * @returns {Array<object>} - Images array
 */
function extractImagesField($, imagesConfig, baseUrl) {
  if (!imagesConfig) return [];

  if (typeof imagesConfig === 'string') {
    return extractImages($, imagesConfig, baseUrl);
  }

  // Advanced config
  const { selector, attribute = 'src', container } = imagesConfig;
  const targetSelector = container ? `${container} ${selector}` : selector;

  return extractImages($, targetSelector, baseUrl);
}

/**
 * Extract features
 * @param {CheerioAPI} $ - Cheerio instance
 * @param {object|string} featuresConfig - Features selector config
 * @returns {Array<string>} - Features array
 */
function extractFeaturesField($, featuresConfig) {
  const features = [];

  if (!featuresConfig) return features;

  if (typeof featuresConfig === 'string') {
    $(featuresConfig).each((i, elem) => {
      const feature = $(elem).text().trim();
      if (feature && feature.length > 2) {
        features.push(feature);
      }
    });
  } else {
    // Advanced config
    const { selector, container } = featuresConfig;
    const targetSelector = container ? `${container} ${selector}` : selector;

    $(targetSelector).each((i, elem) => {
      const feature = $(elem).text().trim();
      if (feature && feature.length > 2) {
        features.push(feature);
      }
    });
  }

  return features;
}

module.exports = {
  createScraperFromConfig,
};