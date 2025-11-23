"""
Scraper Data Sync Configuration
Maps scraper model names to your audit system model names
"""

# Model name mappings between Scraper MongoDB and your system
MODEL_NAME_MAPPING = {
    # Scraper uses various naming conventions
    # Map them to your standardized names
    "GPT-4o": "gpt-4o",
    "GPT-4o mini": "gpt-4o",
    "gpt-4o": "gpt-4o",
    
    "Claude 3.5 Sonnet": "claude-3.5-sonnet",
    "Claude 3.5": "claude-3.5-sonnet",
    "claude-3-5-sonnet": "claude-3.5-sonnet",
    
    "Llama 3.1 70B": "llama-3-70b",
    "Llama 3 70B": "llama-3-70b",
    "llama-3-70b": "llama-3-70b",
    "Llama 3.1": "llama-3-70b",
}

# Policy category mappings
# Maps scraper policy categories to your audit rule categories
CATEGORY_MAPPING = {
    "safety": "Safety & Risk Management",
    "performance": "Performance & Accuracy",
    "training": "Training & Data Practices",
    "limitations": "Model Limitations",
    "capabilities": "Capabilities & Use Cases",
    "transparency": "Transparency & Documentation",
    "data_handling": "Data Handling & Privacy",
    "ethical_considerations": "Ethical Considerations",
}

# Companies and their MongoDB database names in Scraper
COMPANY_DATABASES = {
    "OpenAI": "ai_docs_openai",
    "Anthropic": "ai_docs_anthropic",
    "Meta": "ai_docs_meta",
    "Google": "ai_docs_google",
    "Mistral": "ai_docs_mistral",
}

# Document types priority (higher = more important for audits)
DOCUMENT_PRIORITY = {
    "System Card": 10,
    "Research Paper": 8,
    "Model Card": 7,
    "API Docs": 5,
    "GitHub": 3,
}
