/**
 * Text Chunker - Intelligent text chunking for AI documentation
 * Preserves semantic meaning and metadata across chunks
 */

const BaseParser = require('../parsers/baseParser');

class TextChunker extends BaseParser {
    constructor(options = {}) {
        super({
            maxChunkSize: 1000,  // Characters per chunk
            overlapSize: 200,     // Character overlap between chunks
            minChunkSize: 100,    // Minimum chunk size
            preserveSentences: true,  // Try to keep sentences intact
            preserveParagraphs: true, // Try to keep paragraphs intact
            ...options
        });
    }

    /**
     * Chunk text with semantic awareness
     * @param {string} text - Text to chunk
     * @param {Object} baseMetadata - Base metadata for chunks
     * @returns {Array} Array of text chunks with metadata
     */
    chunkText(text, baseMetadata = {}) {
        // First, split into paragraphs for better semantic grouping
        const paragraphs = this.splitIntoParagraphs(text);

        const chunks = [];
        let currentChunk = '';
        let chunkIndex = 0;
        let currentParagraphs = [];

        for (const paragraph of paragraphs) {
            const testChunk = currentChunk + (currentChunk ? '\n\n' : '') + paragraph;

            if (testChunk.length > this.options.maxChunkSize && currentChunk.length >= this.options.minChunkSize) {
                // Current chunk is full, create it
                chunks.push(this.createChunk(currentChunk, currentParagraphs, chunkIndex, baseMetadata));
                chunkIndex++;

                // Start new chunk with overlap if enabled
                if (this.options.overlapSize > 0) {
                    currentChunk = this.getOverlapText(currentChunk, paragraph);
                    currentParagraphs = [paragraph];
                } else {
                    currentChunk = paragraph;
                    currentParagraphs = [paragraph];
                }
            } else {
                // Add paragraph to current chunk
                currentChunk = testChunk;
                currentParagraphs.push(paragraph);
            }
        }

        // Add final chunk
        if (currentChunk.trim()) {
            chunks.push(this.createChunk(currentChunk, currentParagraphs, chunkIndex, baseMetadata));
        }

        // Set total chunks count
        chunks.forEach(chunk => {
            chunk.metadata.totalChunks = chunks.length;
        });

        return chunks;
    }

    /**
     * Split text into paragraphs
     * @param {string} text - Text to split
     * @returns {Array<string>} Array of paragraphs
     */
    splitIntoParagraphs(text) {
        return text
            .split(/\n\s*\n/)  // Split on double newlines
            .map(p => p.trim())
            .filter(p => p.length > 0);
    }

    /**
     * Create a chunk object with metadata
     * @param {string} text - Chunk text
     * @param {Array} paragraphs - Source paragraphs
     * @param {number} index - Chunk index
     * @param {Object} baseMetadata - Base metadata
     * @returns {Object} Chunk object
     */
    createChunk(text, paragraphs, index, baseMetadata) {
        return {
            id: `${baseMetadata.sourceId}_chunk_${index}`,
            text: text.trim(),
            metadata: {
                ...baseMetadata,
                chunkIndex: index,
                totalChunks: null, // Set later
                charCount: text.length,
                wordCount: this.countWords(text),
                paragraphCount: paragraphs.length,
                avgParagraphLength: Math.round(text.length / paragraphs.length),
                createdAt: new Date().toISOString()
            }
        };
    }

    /**
     * Get overlap text for semantic continuity
     * @param {string} currentChunk - Current chunk text
     * @param {string} nextParagraph - Next paragraph
     * @returns {string} Overlap text
     */
    getOverlapText(currentChunk, nextParagraph) {
        if (this.options.overlapSize === 0) return '';

        // Get last sentences from current chunk
        const sentences = this.splitIntoSentences(currentChunk);
        let overlapText = '';
        let charCount = 0;

        // Build overlap from end of sentences
        for (let i = sentences.length - 1; i >= 0; i--) {
            const sentence = sentences[i];
            if (charCount + sentence.length > this.options.overlapSize) {
                // Take partial sentence if needed
                const remainingChars = this.options.overlapSize - charCount;
                if (remainingChars > 0) {
                    overlapText = sentence.substring(0, remainingChars) + ' ' + overlapText;
                }
                break;
            } else {
                overlapText = sentence + ' ' + overlapText;
                charCount += sentence.length;
            }
        }

        return overlapText.trim();
    }

    /**
     * Enhanced sentence splitting with better boundary detection
     * @param {string} text - Text to split
     * @returns {Array<string>} Array of sentences
     */
    splitIntoSentences(text) {
        // More sophisticated sentence splitting
        const sentences = text
            .split(/(?<=[.!?])\s+(?=[A-Z])/)  // Split on period/question/exclamation followed by space and capital letter
            .map(s => s.trim())
            .filter(s => s.length > 0);

        // Handle abbreviations and edge cases
        const processed = [];
        let current = '';

        for (const sentence of sentences) {
            current += (current ? ' ' : '') + sentence;

            // Check if this looks like a complete sentence
            if (this.isCompleteSentence(current)) {
                processed.push(current);
                current = '';
            }
        }

        if (current) {
            processed.push(current);
        }

        return processed;
    }

    /**
     * Check if text appears to be a complete sentence
     * @param {string} text - Text to check
     * @returns {boolean} Whether it appears complete
     */
    isCompleteSentence(text) {
        const trimmed = text.trim();

        // Ends with sentence terminator
        if (/[.!?]$/.test(trimmed)) {
            return true;
        }

        // Contains common sentence structures
        if (/\b(is|are|was|were|has|have|had|will|would|can|could|should|may|might|must|do|does|did|make|makes|made|get|gets|got|take|takes|took|see|sees|saw|come|comes|came|go|goes|went|know|knows|knew|think|thinks|thought|say|says|said|tell|tells|told|work|works|worked|help|helps|helped|need|needs|needed|want|wants|wanted|use|uses|used|find|finds|found|give|gives|gave|look|looks|looked|ask|asks|asked|try|tries|tried|call|calls|called|start|starts|started|run|runs|ran|move|moves|moved|live|lives|lived|believe|believes|believed|bring|brings|brought|begin|begins|began|keep|keeps|kept|write|writes|wrote|sit|sits|sat|stand|stands|stood|leave|leaves|left|feel|feels|felt|put|puts|put|mean|means|meant|let|lets|let|set|sets|set|change|changes|changed|hear|hears|heard|show|shows|showed|follow|follows|followed|stop|stops|stopped|create|creates|created|open|opens|opened|close|closes|closed|love|loves|loved|like|likes|liked|hate|hates|hated|wait|waits|waited|serve|serves|served|die|dies|died|include|includes|included|continue|continues|continued|learn|learns|learned|achieve|achieves|achieved|succeed|succeeds|succeeded|fail|fails|failed|regard|regards|regarded|view|views|viewed|consider|considers|considered|appear|appears|appeared|seem|seems|seemed|provide|provides|provided|require|requires|required|remain|remains|remained|suggest|suggests|suggested|ensure|ensures|ensured|maintain|maintains|maintained|establish|establishes|established|develop|develops|developed|build|builds|built|support|supports|supported|offer|offers|offered|receive|receives|received|join|joins|joined|pay|pays|paid|suffer|suffers|suffered|accept|accepts|accepted|face|faces|faced|determine|determines|determined|reach|reaches|reached|realize|realizes|realized|understand|understands|understood|recognize|recognizes|recognized|allow|allows|allowed|contribute|contributes|contributed|base|bases|based|consist|consists|consisted|belong|belongs|belonged|result|results|resulted|produce|produces|produced|raise|raises|raised|develop|develops|developed|send|sends|sent|expect|expects|expected|build|builds|built|stay|stays|stayed|fall|falls|fell|cut|cuts|cut|reach|reaches|reached|kill|kills|killed|remain|remains|remained|question|questions|questioned|suddenly|slowly|quickly|carefully|easily|happily|badly|well|fast|hard|together|alone|recently|immediately|finally|soon|later|ago|before|after|during|while|since|until|through|across|around|behind|beside|between|beyond|inside|outside|under|above|near|far|close|next|last|first|second|third|other|another|such|several|many|much|little|few|some|any|every|all|both|each|either|neither|one|two|three|four|five|six|seven|eight|nine|ten)\s+\b(the|a|an|this|that|these|those|my|your|his|her|its|our|their|one|two|three|four|five|six|seven|eight|nine|ten|some|any|every|all|both|each|either|neither|many|much|few|little|several|another|other|such)\b/.test(trimmed)) {
            return true;
        }

        return false;
    }

    /**
     * Chunk text with section awareness (for documents with clear sections)
     * @param {string} text - Text to chunk
     * @param {Array} sections - Section boundaries
     * @param {Object} baseMetadata - Base metadata
     * @returns {Array} Section-aware chunks
     */
    chunkBySections(text, sections, baseMetadata = {}) {
        const chunks = [];
        let currentPosition = 0;

        for (const section of sections) {
            const sectionText = text.substring(section.start, section.end);
            const sectionChunks = this.chunkText(sectionText, {
                ...baseMetadata,
                section: section.title,
                sectionLevel: section.level
            });

            // Adjust chunk indices to be global
            sectionChunks.forEach(chunk => {
                chunk.metadata.globalChunkIndex = chunk.metadata.chunkIndex + currentPosition;
                chunks.push(chunk);
            });

            currentPosition += sectionChunks.length;
        }

        // Update total chunks
        chunks.forEach(chunk => {
            chunk.metadata.totalChunks = chunks.length;
        });

        return chunks;
    }

    /**
     * Validate chunk quality
     * @param {Array} chunks - Chunks to validate
     * @returns {Object} Validation results
     */
    validateChunks(chunks) {
        const results = {
            valid: true,
            issues: [],
            stats: {
                totalChunks: chunks.length,
                avgChunkSize: 0,
                minChunkSize: Infinity,
                maxChunkSize: 0,
                totalChars: 0
            }
        };

        chunks.forEach((chunk, index) => {
            const charCount = chunk.text.length;

            // Basic validation
            if (!chunk.id || !chunk.text || !chunk.metadata) {
                results.valid = false;
                results.issues.push(`Chunk ${index}: Missing required fields`);
            }

            if (charCount < this.options.minChunkSize) {
                results.issues.push(`Chunk ${index}: Too small (${charCount} chars)`);
            }

            if (charCount > this.options.maxChunkSize * 1.5) {
                results.issues.push(`Chunk ${index}: Too large (${charCount} chars)`);
            }

            // Update stats
            results.stats.totalChars += charCount;
            results.stats.minChunkSize = Math.min(results.stats.minChunkSize, charCount);
            results.stats.maxChunkSize = Math.max(results.stats.maxChunkSize, charCount);
        });

        results.stats.avgChunkSize = Math.round(results.stats.totalChars / chunks.length);

        return results;
    }
}

module.exports = TextChunker;