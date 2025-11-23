/**
 * AI Documentation Configuration
 * Source configurations for AI model documentation scraping
 * Based on custom/new-sites.md - Comprehensive coverage of all major LLMs
 */

const aiDocumentationSources = [
    // ===== OPENAI GPT-4 =====
    {
        company: 'OpenAI',
        model: 'GPT-4',
        documentType: 'System Card',
        format: 'pdf',
        url: 'https://cdn.openai.com/papers/gpt-4-system-card.pdf',
        policyCategories: ['safety', 'performance', 'training', 'limitations'],
        priority: 1,
        description: 'Comprehensive system card covering safety, capabilities, and limitations'
    },
    {
        company: 'OpenAI',
        model: 'GPT-4',
        documentType: 'Research Paper',
        format: 'web',
        url: 'https://arxiv.org/abs/2303.08774',
        policyCategories: ['training', 'performance', 'capabilities'],
        priority: 1,
        description: 'Original GPT-4 research paper with technical details'
    },

    // ===== OPENAI GPT-4V (Vision) =====
    {
        company: 'OpenAI',
        model: 'GPT-4V',
        documentType: 'System Card',
        format: 'pdf',
        url: 'https://cdn.openai.com/papers/GPTV_System_Card.pdf',
        policyCategories: ['safety', 'capabilities', 'limitations'],
        priority: 2,
        description: 'Vision-specific system card for GPT-4V'
    },

    // ===== OPENAI GPT-4 TURBO =====
    {
        company: 'OpenAI',
        model: 'GPT-4 Turbo',
        documentType: 'API Docs',
        format: 'web',
        url: 'https://platform.openai.com/docs/models/gpt-4-turbo',
        policyCategories: ['capabilities', 'performance', 'usage'],
        priority: 2,
        description: 'API documentation for GPT-4 Turbo model'
    },

    // ===== OPENAI GPT-4o =====
    {
        company: 'OpenAI',
        model: 'GPT-4o',
        documentType: 'System Card',
        format: 'web',
        url: 'https://openai.com/index/hello-gpt-4o/',
        policyCategories: ['safety', 'capabilities', 'performance'],
        priority: 1,
        description: 'GPT-4o announcement and system card'
    },
    {
        company: 'OpenAI',
        model: 'GPT-4o',
        documentType: 'System Card',
        format: 'pdf',
        url: 'https://cdn.openai.com/gpt-4o-system-card.pdf',
        policyCategories: ['safety', 'capabilities', 'performance'],
        priority: 1,
        description: 'Detailed GPT-4o system card PDF'
    },
    {
        company: 'OpenAI',
        model: 'GPT-4o',
        documentType: 'Research Paper',
        format: 'web',
        url: 'https://arxiv.org/abs/2404.09722',
        policyCategories: ['training', 'performance', 'capabilities'],
        priority: 1,
        description: 'GPT-4o research paper on arXiv'
    },

    // ===== OPENAI GPT-4o MINI =====
    {
        company: 'OpenAI',
        model: 'GPT-4o mini',
        documentType: 'API Docs',
        format: 'web',
        url: 'https://platform.openai.com/docs/models/gpt-4o-mini',
        policyCategories: ['capabilities', 'performance', 'usage'],
        priority: 2,
        description: 'API documentation for GPT-4o mini'
    },

    // ===== OPENAI GPT-3.5 TURBO =====
    {
        company: 'OpenAI',
        model: 'GPT-3.5 Turbo',
        documentType: 'API Docs',
        format: 'web',
        url: 'https://platform.openai.com/docs/models/gpt-3-5-turbo',
        policyCategories: ['capabilities', 'performance', 'usage'],
        priority: 2,
        description: 'API documentation for GPT-3.5 Turbo'
    },

    // ===== OPENAI GPT-3 =====
    {
        company: 'OpenAI',
        model: 'GPT-3',
        documentType: 'Model Card',
        format: 'github',
        url: 'https://github.com/openai/gpt-3',
        policyCategories: ['capabilities', 'training', 'performance'],
        priority: 3,
        description: 'GPT-3 model card and documentation on GitHub'
    },

    // ===== OPENAI O1 =====
    {
        company: 'OpenAI',
        model: 'o1',
        documentType: 'System Card',
        format: 'web',
        url: 'https://openai.com/index/learning-to-reason-with-llms/',
        policyCategories: ['safety', 'capabilities', 'performance'],
        priority: 1,
        description: 'O1 model system card and reasoning capabilities'
    },
    {
        company: 'OpenAI',
        model: 'o1',
        documentType: 'System Card',
        format: 'pdf',
        url: 'https://cdn.openai.com/o1-system-card.pdf',
        policyCategories: ['safety', 'capabilities', 'performance'],
        priority: 1,
        description: 'Detailed O1 system card PDF'
    },
    {
        company: 'OpenAI',
        model: 'o1',
        documentType: 'Research Paper',
        format: 'web',
        url: 'https://arxiv.org/abs/2410.12963',
        policyCategories: ['training', 'performance', 'capabilities'],
        priority: 1,
        description: 'O1 research paper on arXiv'
    },

    // ===== OPENAI O1-PREVIEW =====
    {
        company: 'OpenAI',
        model: 'o1-preview',
        documentType: 'System Card',
        format: 'pdf',
        url: 'https://cdn.openai.com/o1-system-card.pdf',
        policyCategories: ['safety', 'capabilities', 'performance'],
        priority: 2,
        description: 'O1-preview system card PDF'
    },

    // ===== OPENAI GPT-5 =====
    {
        company: 'OpenAI',
        model: 'GPT-5',
        documentType: 'System Card',
        format: 'web',
        url: 'https://openai.com/index/introducing-gpt-5/',
        policyCategories: ['safety', 'capabilities', 'performance'],
        priority: 1,
        description: 'GPT-5 system card and capabilities'
    },

    // ===== OPENAI DALL-E 3 =====
    {
        company: 'OpenAI',
        model: 'DALL-E 3',
        documentType: 'System Card',
        format: 'pdf',
        url: 'https://cdn.openai.com/papers/DALL_E_3_System_Card.pdf',
        policyCategories: ['safety', 'capabilities', 'limitations'],
        priority: 2,
        description: 'DALL-E 3 image generation system card'
    },

    // ===== ANTHROPIC CLAUDE =====
    {
        company: 'Anthropic',
        model: 'Claude 4',
        documentType: 'System Card',
        format: 'web',
        url: 'https://www.anthropic.com/claude-4-system-card',
        policyCategories: ['safety', 'capabilities', 'performance', 'alignment'],
        priority: 1,
        description: 'Claude 4 system card covering safety, capabilities, and limitations'
    },
    {
        company: 'Anthropic',
        model: 'Claude 4',
        documentType: 'Research Paper',
        format: 'web',
        url: 'https://www.anthropic.com/news/claude-4',
        policyCategories: ['training', 'performance', 'capabilities'],
        priority: 1,
        description: 'Claude 4 announcement and technical details'
    },
    {
        company: 'Anthropic',
        model: 'Claude 4 Opus',
        documentType: 'API Docs',
        format: 'web',
        url: 'https://docs.anthropic.com/claude/docs/models-overview#claude-4-opus',
        policyCategories: ['capabilities', 'performance', 'usage'],
        priority: 2,
        description: 'API documentation for Claude 4 Opus model'
    },
    {
        company: 'Anthropic',
        model: 'Claude 4 Sonnet',
        documentType: 'API Docs',
        format: 'web',
        url: 'https://docs.anthropic.com/claude/docs/models-overview#claude-4-sonnet',
        policyCategories: ['capabilities', 'performance', 'usage'],
        priority: 2,
        description: 'API documentation for Claude 4 Sonnet model'
    },
    {
        company: 'Anthropic',
        model: 'Claude 4 Haiku',
        documentType: 'API Docs',
        format: 'web',
        url: 'https://docs.anthropic.com/claude/docs/models-overview#claude-4-haiku',
        policyCategories: ['capabilities', 'performance', 'usage'],
        priority: 2,
        description: 'API documentation for Claude 4 Haiku model'
    },

    // ===== GOOGLE DEEPMIND GEMINI =====
    {
        company: 'Google',
        model: 'Gemini 1.5 Pro',
        documentType: 'API Docs',
        format: 'web',
        url: 'https://ai.google.dev/gemini-api/docs/models/gemini',
        policyCategories: ['capabilities', 'performance', 'usage'],
        priority: 1,
        description: 'Gemini 1.5 Pro API documentation and capabilities'
    },
    {
        company: 'Google',
        model: 'Gemini 1.5 Pro',
        documentType: 'Research Paper',
        format: 'web',
        url: 'https://arxiv.org/abs/2403.05530',
        policyCategories: ['training', 'performance', 'capabilities'],
        priority: 1,
        description: 'Gemini technical report'
    },

    // ===== META LLAMA =====
    {
        company: 'Meta',
        model: 'Llama 3.1',
        documentType: 'Model Card',
        format: 'github',
        url: 'https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/MODEL_CARD.md',
        policyCategories: ['capabilities', 'training', 'performance', 'safety'],
        priority: 1,
        description: 'Llama 3.1 model card (8B, 70B, 405B variants)'
    },
    {
        company: 'Meta',
        model: 'Llama 3.1',
        documentType: 'Research Paper',
        format: 'web',
        url: 'https://arxiv.org/abs/2407.21783',
        policyCategories: ['training', 'performance', 'capabilities'],
        priority: 1,
        description: 'Llama 3.1 technical report'
    },

    // ===== MISTRAL AI =====
    {
        company: 'Mistral',
        model: 'Mixtral 8x7B',
        documentType: 'Documentation',
        format: 'web',
        url: 'https://docs.mistral.ai/',
        policyCategories: ['capabilities', 'performance', 'usage'],
        priority: 2,
        description: 'Mistral AI documentation covering Mixtral and other models'
    },
    {
        company: 'Mistral',
        model: 'Mistral Large',
        documentType: 'Blog Post',
        format: 'web',
        url: 'https://mistral.ai/news/',
        policyCategories: ['capabilities', 'performance'],
        priority: 2,
        description: 'Mistral AI news and model announcements'
    },

    // ===== XAI GROK =====
    {
        company: 'xAI',
        model: 'Grok-1',
        documentType: 'GitHub Repository',
        format: 'github',
        url: 'https://github.com/xai-org/grok-1',
        policyCategories: ['capabilities', 'training', 'opensource'],
        priority: 2,
        description: 'Grok-1 open source release'
    },
    {
        company: 'xAI',
        model: 'Grok-2',
        documentType: 'Documentation',
        format: 'web',
        url: 'https://x.ai/',
        policyCategories: ['capabilities', 'performance'],
        priority: 2,
        description: 'xAI and Grok model information'
    },

    // ===== STABILITY AI =====
    {
        company: 'Stability AI',
        model: 'Stable Diffusion 3',
        documentType: 'Announcement',
        format: 'web',
        url: 'https://stability.ai/news/stable-diffusion-3',
        policyCategories: ['capabilities', 'performance'],
        priority: 2,
        description: 'Stable Diffusion 3 announcement and capabilities'
    },
    {
        company: 'Stability AI',
        model: 'Stable Diffusion 3',
        documentType: 'Model Card',
        format: 'web',
        url: 'https://huggingface.co/stabilityai/stable-diffusion-3-medium',
        policyCategories: ['capabilities', 'training', 'usage'],
        priority: 2,
        description: 'Stable Diffusion 3 Medium model card on Hugging Face'
    },

    // ===== COHERE =====
    {
        company: 'Cohere',
        model: 'Command R+',
        documentType: 'Documentation',
        format: 'web',
        url: 'https://docs.cohere.com/docs/command-r-plus',
        policyCategories: ['capabilities', 'performance', 'usage'],
        priority: 2,
        description: 'Command R+ model documentation'
    },
    {
        company: 'Cohere',
        model: 'Command',
        documentType: 'API Docs',
        format: 'web',
        url: 'https://docs.cohere.com/',
        policyCategories: ['capabilities', 'performance', 'usage'],
        priority: 2,
        description: 'Cohere API documentation'
    },

    // ===== AI21 LABS =====
    {
        company: 'AI21 Labs',
        model: 'Jamba 1.5',
        documentType: 'Blog Post',
        format: 'web',
        url: 'https://www.ai21.com/blog/announcing-jamba',
        policyCategories: ['capabilities', 'performance', 'architecture'],
        priority: 2,
        description: 'Jamba 1.5 announcement and technical details'
    },
    {
        company: 'AI21 Labs',
        model: 'Jamba 1.5',
        documentType: 'Model Card',
        format: 'web',
        url: 'https://huggingface.co/ai21labs',
        policyCategories: ['capabilities', 'usage'],
        priority: 2,
        description: 'AI21 Labs models on Hugging Face'
    },

    // ===== ALIBABA QWEN =====
    {
        company: 'Alibaba',
        model: 'Qwen 2.5',
        documentType: 'GitHub Repository',
        format: 'github',
        url: 'https://github.com/QwenLM/Qwen2.5',
        policyCategories: ['capabilities', 'training', 'opensource'],
        priority: 2,
        description: 'Qwen 2.5 open source repository'
    },
    {
        company: 'Alibaba',
        model: 'Qwen 2.5',
        documentType: 'Documentation',
        format: 'web',
        url: 'https://qwenlm.github.io/',
        policyCategories: ['capabilities', 'performance', 'usage'],
        priority: 2,
        description: 'Qwen model documentation and resources'
    }
];

/**
 * Get sources by company
 * @param {string} company - Company name
 * @returns {Array} Sources for the company
 */
function getSourcesByCompany(company) {
    return aiDocumentationSources.filter(source =>
        source.company.toLowerCase() === company.toLowerCase()
    );
}

/**
 * Get sources by model
 * @param {string} model - Model name
 * @returns {Array} Sources for the model
 */
function getSourcesByModel(model) {
    return aiDocumentationSources.filter(source =>
        source.model.toLowerCase() === model.toLowerCase()
    );
}

/**
 * Get sources by priority
 * @param {number} priority - Priority level (1=high, 2=medium, 3=low)
 * @returns {Array} Sources with the specified priority
 */
function getSourcesByPriority(priority) {
    return aiDocumentationSources.filter(source => source.priority === priority);
}

/**
 * Get OpenAI sources (for starting implementation)
 * @returns {Array} All OpenAI sources
 */
function getOpenAISources() {
    return getSourcesByCompany('OpenAI');
}

/**
 * Get Anthropic sources
 * @returns {Array} All Anthropic sources
 */
function getAnthropicSources() {
    return getSourcesByCompany('Anthropic');
}

/**
 * Get Google sources
 * @returns {Array} All Google sources
 */
function getGoogleSources() {
    return getSourcesByCompany('Google');
}

/**
 * Get Meta sources
 * @returns {Array} All Meta sources
 */
function getMetaSources() {
    return getSourcesByCompany('Meta');
}

/**
 * Get Mistral sources
 * @returns {Array} All Mistral sources
 */
function getMistralSources() {
    return getSourcesByCompany('Mistral');
}

/**
 * Get xAI sources
 * @returns {Array} All xAI sources
 */
function getXAISources() {
    return getSourcesByCompany('xAI');
}

/**
 * Get Stability AI sources
 * @returns {Array} All Stability AI sources
 */
function getStabilitySources() {
    return getSourcesByCompany('Stability AI');
}

/**
 * Get Cohere sources
 * @returns {Array} All Cohere sources
 */
function getCohereSources() {
    return getSourcesByCompany('Cohere');
}

/**
 * Get AI21 Labs sources
 * @returns {Array} All AI21 Labs sources
 */
function getAI21Sources() {
    return getSourcesByCompany('AI21 Labs');
}

/**
 * Get Alibaba sources
 * @returns {Array} All Alibaba sources
 */
function getAlibabaSources() {
    return getSourcesByCompany('Alibaba');
}

/**
 * Get all companies
 * @returns {Array} List of all companies
 */
function getAllCompanies() {
    return [...new Set(aiDocumentationSources.map(source => source.company))];
}

/**
 * Get all models
 * @returns {Array} List of all models
 */
function getAllModels() {
    return [...new Set(aiDocumentationSources.map(source => source.model))];
}

/**
 * Get high-priority sources for initial implementation
 * @returns {Array} High-priority sources
 */
function getHighPrioritySources() {
    return getSourcesByPriority(1);
}

/**
 * Get statistics about configured sources
 * @returns {Object} Statistics
 */
function getStats() {
    const companies = getAllCompanies();
    const models = getAllModels();

    return {
        totalSources: aiDocumentationSources.length,
        totalCompanies: companies.length,
        totalModels: models.length,
        companies: companies,
        byPriority: {
            high: getSourcesByPriority(1).length,
            medium: getSourcesByPriority(2).length,
            low: getSourcesByPriority(3).length
        }
    };
}

module.exports = {
    aiDocumentationSources,
    getSourcesByCompany,
    getSourcesByModel,
    getSourcesByPriority,
    getOpenAISources,
    getAnthropicSources,
    getGoogleSources,
    getMetaSources,
    getMistralSources,
    getXAISources,
    getStabilitySources,
    getCohereSources,
    getAI21Sources,
    getAlibabaSources,
    getAllCompanies,
    getAllModels,
    getHighPrioritySources,
    getStats
};