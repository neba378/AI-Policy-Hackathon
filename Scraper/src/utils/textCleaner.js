/**
 * Text Cleaner Utility
 * Functions for cleaning and normalizing text content
 */

/**
 * Clean and normalize text
 * @param {string} text - Raw text
 * @returns {string} - Cleaned text
 */
function cleanText(text) {
    if (!text || typeof text !== 'string') {
        return '';
    }

    return text
        .replace(/\r\n/g, '\n')          // Normalize line endings
        .replace(/\s+/g, ' ')            // Collapse multiple spaces
        .replace(/\n{3,}/g, '\n\n')      // Limit consecutive newlines
        .replace(/\t+/g, ' ')            // Convert tabs to spaces
        .replace(/&nbsp;/g, ' ')         // Replace HTML entities
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim();
}

/**
 * Remove HTML tags from text
 * @param {string} html - HTML string
 * @returns {string} - Plain text
 */
function stripHtmlTags(html) {
    if (!html) return '';

    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')   // Remove styles
        .replace(/<[^>]+>/g, '')                                             // Remove HTML tags
        .replace(/&[a-z]+;/gi, ' ')                                          // Remove HTML entities
        .trim();
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix to add (default: '...')
 * @returns {string} - Truncated text
 */
function truncateText(text, maxLength, suffix = '...') {
    if (!text || text.length <= maxLength) {
        return text;
    }

    return text.slice(0, maxLength - suffix.length).trim() + suffix;
}

/**
 * Remove extra whitespace and normalize
 * @param {string} text - Text to normalize
 * @returns {string} - Normalized text
 */
function normalizeWhitespace(text) {
    if (!text) return '';

    return text
        .replace(/[\s\uFEFF\xA0]+/g, ' ')  // Normalize all whitespace
        .trim();
}

/**
 * Remove URLs from text
 * @param {string} text - Text containing URLs
 * @returns {string} - Text without URLs
 */
function removeUrls(text) {
    if (!text) return '';

    return text.replace(/https?:\/\/[^\s]+/gi, '').trim();
}

/**
 * Remove email addresses from text
 * @param {string} text - Text containing emails
 * @returns {string} - Text without emails
 */
function removeEmails(text) {
    if (!text) return '';

    return text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '').trim();
}

/**
 * Remove phone numbers from text
 * @param {string} text - Text containing phone numbers
 * @returns {string} - Text without phone numbers
 */
function removePhoneNumbers(text) {
    if (!text) return '';

    return text
        .replace(/\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g, '')
        .trim();
}

/**
 * Clean description text (remove contact info, excessive whitespace, etc.)
 * @param {string} description - Raw description
 * @returns {string} - Cleaned description
 */
function cleanDescription(description) {
    if (!description) return '';

    let cleaned = description;

    // Strip HTML if present
    cleaned = stripHtmlTags(cleaned);

    // Remove contact information
    cleaned = removeUrls(cleaned);
    cleaned = removeEmails(cleaned);
    cleaned = removePhoneNumbers(cleaned);

    // Normalize whitespace
    cleaned = normalizeWhitespace(cleaned);

    // Remove common boilerplate phrases
    const boilerplatePatterns = [
        /for more information please contact/gi,
        /neem contact op met/gi,
        /bel ons op/gi,
        /call us at/gi,
    ];

    boilerplatePatterns.forEach(pattern => {
        cleaned = cleaned.replace(pattern, '');
    });

    // Final cleanup
    cleaned = cleanText(cleaned);

    return cleaned;
}

/**
 * Extract first N sentences from text
 * @param {string} text - Text to extract from
 * @param {number} count - Number of sentences
 * @returns {string} - Extracted sentences
 */
function extractSentences(text, count = 3) {
    if (!text) return '';

    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    return sentences.slice(0, count).join(' ').trim();
}

/**
 * Capitalize first letter of each word
 * @param {string} text - Text to capitalize
 * @returns {string} - Capitalized text
 */
function capitalizeWords(text) {
    if (!text) return '';

    return text.replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Remove duplicate lines from text
 * @param {string} text - Text with potential duplicates
 * @returns {string} - Text without duplicate lines
 */
function removeDuplicateLines(text) {
    if (!text) return '';

    const lines = text.split('\n');
    const uniqueLines = [...new Set(lines)];
    return uniqueLines.join('\n');
}

module.exports = {
    cleanText,
    stripHtmlTags,
    truncateText,
    normalizeWhitespace,
    removeUrls,
    removeEmails,
    removePhoneNumbers,
    cleanDescription,
    extractSentences,
    capitalizeWords,
    removeDuplicateLines,
};
