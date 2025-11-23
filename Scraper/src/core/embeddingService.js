/**
 * Semantic Embedding Service using @xenova/transformers
 * Generates vector embeddings for listings
 */

const { pipeline } = require("@xenova/transformers");

let embeddingPipeline = null;

/**
 * Initialize the embedding pipeline
 * @param {string} model - Model name (default: multilingual model for Dutch/English)
 */
async function initializeEmbeddingService(
  model = "Xenova/paraphrase-multilingual-MiniLM-L12-v2"
) {
  if (embeddingPipeline) {
    return embeddingPipeline;
  }

  console.log("🔄 Loading embedding model (multilingual)...");

  try {
    embeddingPipeline = await pipeline("feature-extraction", model);
    console.log("✅ Embedding model loaded successfully");
    return embeddingPipeline;
  } catch (error) {
    console.error("❌ Failed to load embedding model:", error);
    throw error;
  }
}

/**
 * Generate embeddings for text
 * @param {string} text - Text to embed
 * @returns {Array<number>} - Embedding vector
 */
async function generateEmbedding(text) {
  if (!embeddingPipeline) {
    await initializeEmbeddingService();
  }

  try {
    const result = await embeddingPipeline(text, {
      pooling: "mean",
      normalize: true,
    });

    // Convert to array
    const embedding = Array.from(result.data);

    // No console logging for embeddings (too verbose)
    return embedding;
  } catch (error) {
    console.error("❌ Failed to generate embedding:", error);
    throw error;
  }
}

/**
 * Generate embeddings for listing text (legacy)
 * @param {object} listing - Normalized listing data
 * @returns {Array<number>} - Embedding vector
 */
async function generateEmbeddingForListing(listing) {
  if (!embeddingPipeline) {
    await initializeEmbeddingService();
  }

  // Combine relevant fields into searchable text
  const searchableText = buildSearchableText(listing);

  return generateEmbedding(searchableText);
}

/**
 * Build searchable text from listing data
 * @param {object} listing - Normalized listing data
 * @returns {string} - Combined searchable text
 */
function buildSearchableText(listing) {
  const parts = [];

  // Location
  if (listing.location) {
    const { address, city, zipCode, neighborhood } = listing.location;
    if (address) parts.push(address);
    if (city) parts.push(city);
    if (zipCode) parts.push(zipCode);
    if (neighborhood) parts.push(neighborhood);
  }

  // Price
  if (listing.price && listing.price.amount) {
    const { amount, currency, period } = listing.price;
    parts.push(`${currency}${amount} per ${period}`);
  }

  // Specifications
  if (listing.specifications) {
    const specs = listing.specifications;
    if (specs.bedrooms) parts.push(`${specs.bedrooms} bedrooms`);
    if (specs.bathrooms) parts.push(`${specs.bathrooms} bathrooms`);
    if (specs.area) parts.push(`${specs.area}m²`);
    if (specs.furnished) parts.push(specs.furnished);
    if (specs.propertyType) parts.push(specs.propertyType);
    if (specs.pets) parts.push("pets allowed");
    if (specs.garden) parts.push("garden");
    if (specs.parking) parts.push("parking");
    if (specs.balcony) parts.push("balcony");
  }

  // Description (truncate if too long)
  if (listing.description) {
    const description = listing.description.slice(0, 500);
    parts.push(description);
  }

  // Features
  if (listing.features && listing.features.length > 0) {
    parts.push(listing.features.join(", "));
  }

  // Amenities
  if (listing.amenities) {
    const amenities = [];
    if (listing.amenities.garden) amenities.push("garden");
    if (listing.amenities.parking) amenities.push("parking");
    if (listing.amenities.balcony) amenities.push("balcony");
    if (listing.amenities.pets) amenities.push("pets allowed");

    if (amenities.length > 0) {
      parts.push(amenities.join(", "));
    }
  }

  return parts.join(" ").trim();
}

/**
 * Generate embeddings for multiple listings (batch processing)
 * @param {Array<object>} listings - Array of normalized listings
 * @returns {Array<Array<number>>} - Array of embedding vectors
 */
async function generateBatchEmbeddings(listings) {
  if (!embeddingPipeline) {
    await initializeEmbeddingService();
  }

  const embeddings = [];

  for (const listing of listings) {
    try {
      const embedding = await generateEmbedding(listing);
      embeddings.push(embedding);
    } catch (error) {
      console.error(
        `❌ Failed to generate embedding for ${listing.externalId}:`,
        error.message
      );
      embeddings.push(null);
    }
  }

  return embeddings;
}

/**
 * Calculate similarity between two embeddings (cosine similarity)
 * @param {Array<number>} embedding1 - First embedding
 * @param {Array<number>} embedding2 - Second embedding
 * @returns {number} - Similarity score (0-1)
 */
function calculateSimilarity(embedding1, embedding2) {
  if (embedding1.length !== embedding2.length) {
    throw new Error("Embeddings must have the same dimensions");
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }

  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

/**
 * Generate embedding from text or array of texts
 * @param {string|Array<string>} input - Text or array of texts to embed
 * @returns {Promise<Array|Array<Array>>} - Single embedding or array of embeddings
 */
async function getEmbedding(input) {
  if (!embeddingPipeline) {
    await initializeEmbeddingService();
  }

  try {
    if (Array.isArray(input)) {
      // Batch processing
      const embeddings = [];
      for (const text of input) {
        const embedding = await generateEmbedding(text);
        embeddings.push(embedding);
      }
      return embeddings;
    } else {
      // Single text
      return await generateEmbedding(input);
    }
  } catch (error) {
    console.error('❌ Failed to get embedding:', error);
    throw error;
  }
}

module.exports = {
  initializeEmbeddingService,
  generateEmbedding,
  generateEmbeddingForListing, // Legacy
  generateBatchEmbeddings,
  calculateSimilarity,
  getEmbedding,
};
