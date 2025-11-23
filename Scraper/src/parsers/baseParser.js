/**
 * Base Parser - Abstract class for AI documentation parsers
 * Provides common functionality for parsing different document formats
 */

class BaseParser {
    constructor(options = {}) {
        this.options = {
            maxChunkSize: 1000,
            overlapSize: 200,
            preserveMetadata: true,
            ...options
        };
    }

    /**
     * Parse a document and return structured data
     * @param {string} source - Document source (URL, file path, etc.)
     * @param {Object} metadata - Document metadata
     * @returns {Promise<Array>} Array of document chunks with metadata
     */
    async parse(source, metadata = {}) {
        throw new Error('parse() method must be implemented by subclass');
    }

    /**
     * Extract text content from raw document data
     * @param {*} rawData - Raw document data
     * @returns {Promise<string>} Extracted text content
     */
    async extractText(rawData) {
        throw new Error('extractText() method must be implemented by subclass');
    }

    /**
     * Chunk text into manageable pieces with metadata preservation
     * @param {string} text - Full text content
     * @param {Object} baseMetadata - Base metadata for all chunks
     * @returns {Array} Array of text chunks with metadata
     */
    chunkText(text, baseMetadata = {}) {
        const chunks = [];
        const sentences = this.splitIntoSentences(text);
        let currentChunk = '';
        let chunkIndex = 0;

        for (const sentence of sentences) {
            if ((currentChunk + sentence).length > this.options.maxChunkSize && currentChunk.length > 0) {
                // Create chunk
                chunks.push({
                    id: `${baseMetadata.sourceId}_chunk_${chunkIndex}`,
                    text: currentChunk.trim(),
                    metadata: {
                        ...baseMetadata,
                        chunkIndex,
                        totalChunks: null, // Will be set after all chunks created
                        charCount: currentChunk.length,
                        wordCount: this.countWords(currentChunk)
                    }
                });

                // Start new chunk with overlap
                const overlapText = this.getOverlapText(currentChunk, sentence);
                currentChunk = overlapText + sentence;
                chunkIndex++;
            } else {
                currentChunk += sentence;
            }
        }

        // Add final chunk
        if (currentChunk.trim()) {
            chunks.push({
                id: `${baseMetadata.sourceId}_chunk_${chunkIndex}`,
                text: currentChunk.trim(),
                metadata: {
                    ...baseMetadata,
                    chunkIndex,
                    totalChunks: null,
                    charCount: currentChunk.length,
                    wordCount: this.countWords(currentChunk)
                }
            });
        }

        // Set total chunks count
        chunks.forEach(chunk => {
            chunk.metadata.totalChunks = chunks.length;
        });

        return chunks;
    }

    /**
     * Split text into sentences
     * @param {string} text - Text to split
     * @returns {Array<string>} Array of sentences
     */
    splitIntoSentences(text) {
        // Simple sentence splitting - can be enhanced with NLP libraries
        return text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    }

    /**
     * Get overlap text for chunk continuity
     * @param {string} currentChunk - Current chunk text
     * @param {string} nextSentence - Next sentence to add
     * @returns {string} Overlap text
     */
    getOverlapText(currentChunk, nextSentence) {
        if (this.options.overlapSize === 0) return '';

        const words = currentChunk.split(/\s+/);
        const overlapWords = words.slice(-Math.ceil(this.options.overlapSize / 6)); // Rough word count
        return overlapWords.join(' ') + ' ';
    }

    /**
     * Count words in text
     * @param {string} text - Text to count
     * @returns {number} Word count
     */
    countWords(text) {
        return text.trim().split(/\s+/).length;
    }

    /**
     * Clean and normalize text
     * @param {string} text - Raw text
     * @returns {string} Cleaned text
     */
    cleanText(text) {
        return text
            .replace(/\s+/g, ' ')  // Normalize whitespace
            .replace(/\n+/g, ' ')  // Replace newlines with spaces
            .trim();
    }

    /**
     * Validate parsing results
     * @param {Array} chunks - Parsed chunks
     * @returns {boolean} Validation result
     */
    validateChunks(chunks) {
        if (!Array.isArray(chunks) || chunks.length === 0) {
            return false;
        }

        for (const chunk of chunks) {
            if (!chunk.id || !chunk.text || !chunk.metadata) {
                return false;
            }
        }

        return true;
    }
}

module.exports = BaseParser;