/**
 * PDF Parser - Specialized parser for PDF documents
 * Handles OpenAI system cards and research papers
 */

const BaseParser = require('./baseParser');
const fs = require('fs');
const path = require('path');

// PDF parsing library - loaded on demand
let pdfParseLib = null;

try {
    pdfParseLib = require('pdf-parse');
} catch (error) {
    console.warn('pdf-parse library not available:', error.message);
}

class PDFParser extends BaseParser {
    constructor(options = {}) {
        super({
            ...options,
            // PDF specific options
            includePageNumbers: true,
            extractMetadata: true
        });

        // PDF parsing library will be loaded dynamically
        // PDF parsing library loaded at module level
    }

    /**
     * Check if PDF parsing is available
     */
    isAvailable() {
        return pdfParseLib !== null;
    }

    /**
     * Parse PDF document
     * @param {string} source - PDF file path or URL
     * @param {Object} metadata - Document metadata
     * @returns {Promise<Array>} Array of text chunks with metadata
     */
    async parse(source, metadata = {}) {
        if (!this.isAvailable()) {
            // Return a placeholder chunk indicating PDF parsing is not available
            const baseMetadata = {
                sourceId: metadata.sourceId || `pdf_${Date.now()}`,
                sourceUrl: source,
                documentType: metadata.documentType || 'PDF Document',
                company: metadata.company,
                model: metadata.model,
                format: 'pdf',
                policyCategories: metadata.policyCategories || [],
                parsingError: 'PDF parsing not yet implemented',
                parsingStatus: 'pending'
            };

            return [{
                id: `${baseMetadata.sourceId}_placeholder`,
                text: `PDF Document: ${source}\n\nNote: PDF parsing is currently disabled. This document contains important ${metadata.company} ${metadata.model} information related to: ${(metadata.policyCategories || []).join(', ')}.\n\nPlease implement PDF parsing to extract the full content.`,
                metadata: {
                    ...baseMetadata,
                    chunkIndex: 0,
                    totalChunks: 1,
                    charCount: 0,
                    wordCount: 0,
                    createdAt: new Date().toISOString()
                }
            }];
        }

        try {
            let pdfBuffer;

            // Handle different source types
            if (source.startsWith('http')) {
                // URL - fetch the PDF
                const axios = require('axios');
                try {
                    const response = await axios.get(source, {
                        responseType: 'arraybuffer',
                        timeout: 60000,  // Increased timeout for large PDFs
                        maxRedirects: 5,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                            'Accept': 'application/pdf,*/*'
                        },
                        // Add retry logic
                        validateStatus: (status) => status < 500
                    });

                    if (response.status === 404) {
                        throw new Error('PDF not found (404)');
                    }

                    pdfBuffer = Buffer.from(response.data);
                } catch (error) {
                    if (error.response && error.response.status === 404) {
                        // PDF not found, return placeholder
                        console.log(`PDF not found at ${source}, returning placeholder`);
                        return [{
                            id: `${metadata.sourceId || 'pdf_' + Date.now()}_placeholder`,
                            text: `PDF Document: ${source}\n\nNote: This system card PDF is not yet available or has been moved. This document should contain important ${metadata.company} ${metadata.model} information related to: ${(metadata.policyCategories || []).join(', ')}.\n\nPlease check for updated documentation links.`,
                            metadata: {
                                sourceId: metadata.sourceId || `pdf_${Date.now()}`,
                                sourceUrl: source,
                                documentType: metadata.documentType || 'PDF Document',
                                company: metadata.company,
                                model: metadata.model,
                                format: 'pdf',
                                policyCategories: metadata.policyCategories || [],
                                parsingError: 'PDF not found (404)',
                                parsingStatus: 'not_found'
                            }
                        }];
                    }
                    throw error;
                }
            } else if (fs.existsSync(source)) {
                // Local file path
                pdfBuffer = fs.readFileSync(source);
            } else {
                throw new Error(`Invalid PDF source: ${source}`);
            }

            // Parse PDF
            const pdfData = await pdfParseLib(pdfBuffer);

            // Extract text content
            const fullText = this.extractTextFromPDF(pdfData);

            // Create base metadata
            const baseMetadata = {
                sourceId: metadata.sourceId || path.basename(source, '.pdf'),
                sourceUrl: source,
                documentType: metadata.documentType || 'PDF',
                company: metadata.company,
                model: metadata.model,
                format: 'pdf',
                totalPages: pdfData.numpages,
                title: pdfData.info?.Title || metadata.title,
                author: pdfData.info?.Author || metadata.author,
                creationDate: pdfData.info?.CreationDate,
                policyCategories: metadata.policyCategories || []
            };

            // Chunk the text
            const chunks = this.chunkText(fullText, baseMetadata);

            // Add page-specific metadata to chunks
            const chunksWithPages = this.addPageMetadata(chunks, pdfData);

            return chunksWithPages;

        } catch (error) {
            console.error(`PDF parsing error for ${source}:`, error.message);
            throw error;
        }
    }

    /**
     * Extract text content from parsed PDF data
     * @param {Object} pdfData - Parsed PDF data from PDF.js
     * @returns {string} Extracted text content
     */
    extractTextFromPDF(pdfData) {
        // PDF.js provides text content
        let text = pdfData.text;

        // Clean up common PDF extraction artifacts
        text = text
            .replace(/-\s*\n/g, '')  // Remove hyphenated line breaks
            .replace(/\n+/g, '\n')   // Normalize line breaks
            .replace(/\f/g, '\n')    // Replace form feeds with newlines
            .trim();

        return this.cleanText(text);
    }

    /**
     * Add page-specific metadata to chunks
     * @param {Array} chunks - Text chunks
     * @param {Object} pdfData - PDF data
     * @returns {Array} Chunks with page metadata
     */
    addPageMetadata(chunks, pdfData) {
        // For now, distribute chunks across pages proportionally
        // In a more advanced implementation, we could track exact page boundaries
        const totalPages = pdfData.numpages;
        const chunksPerPage = Math.ceil(chunks.length / totalPages);

        return chunks.map((chunk, index) => {
            const pageNumber = Math.floor(index / chunksPerPage) + 1;
            return {
                ...chunk,
                metadata: {
                    ...chunk.metadata,
                    pageNumber: Math.min(pageNumber, totalPages),
                    estimatedPage: true  // Flag that this is an estimate
                }
            };
        });
    }

    /**
     * Extract text from PDF (implements base class method)
     * @param {*} rawData - PDF buffer or parsed data
     * @returns {Promise<string>} Extracted text
     */
    async extractText(rawData) {
        if (Buffer.isBuffer(rawData)) {
            const pdfData = await this.pdfParse(rawData);
            return this.extractTextFromPDF(pdfData);
        } else if (typeof rawData === 'string') {
            return rawData; // Already extracted text
        } else {
            return this.extractTextFromPDF(rawData);
        }
    }

    /**
     * Get PDF metadata
     * @param {string} source - PDF source
     * @returns {Promise<Object>} PDF metadata
     */
    async getPDFMetadata(source) {
        if (!this.isAvailable()) {
            throw new Error('PDF parsing library not available');
        }

        let pdfBuffer;
        if (source.startsWith('http')) {
            const axios = require('axios');
            const response = await axios.get(source, {
                responseType: 'arraybuffer',
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            pdfBuffer = Buffer.from(response.data);
        } else {
            pdfBuffer = fs.readFileSync(source);
        }

        const pdfData = await pdfParseLib(pdfBuffer);

        return {
            pages: pdfData.numpages,
            title: pdfData.info?.Title,
            author: pdfData.info?.Author,
            creator: pdfData.info?.Creator,
            producer: pdfData.info?.Producer,
            creationDate: pdfData.info?.CreationDate,
            modificationDate: pdfData.info?.ModDate
        };
    }
}

module.exports = PDFParser;