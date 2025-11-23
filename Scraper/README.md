# AI Documentation Scraper 🤖

> Automated scraping and indexing system for AI model documentation with semantic embeddings and MongoDB vector storage

Comprehensive documentation scraper for major AI models (OpenAI, Anthropic, Google, Meta, and more) with semantic search capabilities.

---

## 🚀 Features

- **📚 Comprehensive Coverage**: 37+ sources across 10 AI companies and 26 models
- **🔍 Smart Parsing**: Handles PDFs, web pages, GitHub repos, and arXiv papers  
- **🧠 Semantic Embeddings**: 384-dimensional multilingual embeddings for vector search
- **💾 MongoDB Atlas**: Organized storage with separate databases per company
- **⚡ Direct Processing**: No Redis/queue required - simple and fast
- **🏷️ Policy Tagging**: Each source tagged with relevant policy categories
- **📊 Production Ready**: Clean logging, robust error handling, fail-fast design

---

## 📁 Project Structure

```
ai-docs-scraper/
├── src/
│   ├── core/                    # Core processing
│   │   ├── processor.js         # Main orchestrator
│   │   ├── database.js          # MongoDB operations
│   │   ├── embeddingService.js  # Semantic embeddings
│   │   └── queue.js             # Optional: BullMQ support
│   │
│   ├── scrapers/               # Scraping engines
│   │   ├── aiDocScraper.js    # Main AI doc scraper
│   │   ├── puppeteerScraper.js # Browser automation
│   │   └── baseScraper.js      # Base utilities
│   │
│   ├── parsers/                # Document parsers
│   │   ├── pdfParser.js        # PDF documents
│   │   ├── webParser.js        # Web pages
│   │   └── githubParser.js     # GitHub repos
│   │
│   ├── processors/             # Text processing
│   │   └── textChunker.js     # Smart text chunking
│   │
│   ├── config/                 # Configuration
│   │   └── aiDocsConfig.js    # 37 source configurations
│   │
│   └── utils/                  # Utilities
│       ├── logger.js           # Structured logging
│       └── retry.js            # Retry logic
│
├── custom/
│   └── new-sites.md           # Source reference list
│
├── logs/                       # Application logs
├── .env                        # Environment config
├── .env.example               # Example config
├── package.json               # Dependencies
├── start-ai-scraper-direct.js # Main entry point
├── show-sources.js            # View all sources
├── query-database.js          # Query tool
├── QUICKSTART.md              # Quick start guide
└── README.md                  # This file
```

---

## 🎯 Covered AI Models

### Companies (10)
- **OpenAI** (16 sources): GPT-4, GPT-4o, o1, DALL-E 3
- **Anthropic** (5 sources): Claude 4 (Opus, Sonnet, Haiku)
- **Google** (2 sources): Gemini 1.5 Pro
- **Meta** (2 sources): Llama 3.1 (8B, 70B, 405B)
- **Mistral** (2 sources): Mixtral 8x7B, Mistral Large
- **xAI** (2 sources): Grok-1, Grok-2
- **Stability AI** (2 sources): Stable Diffusion 3
- **Cohere** (2 sources): Command R+, Command
- **AI21 Labs** (2 sources): Jamba 1.5
- **Alibaba** (2 sources): Qwen 2.5

### Document Types
- System Cards (safety, capabilities, limitations)
- Research Papers (technical details, training)
- API Documentation (usage, performance)
- Model Cards (specifications, benchmarks)
- GitHub Repositories (code, documentation)

---

## 🚦 Quick Start

### 1. Prerequisites

```bash
# Node.js 18+ required
node --version

# Install dependencies
npm install
```

### 2. Configure Environment

Create `.env` file:

```env
# MongoDB Atlas (Required)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/

# Node Environment
NODE_ENV=production
```

### 3. Run the Scraper

**View all sources:**
```bash
node show-sources.js
```

**Test with single source:**
```bash
node start-ai-scraper-direct.js --test
```

**Run high-priority sources (recommended):**
```bash
node start-ai-scraper-direct.js
```

**Run by company:**
```bash
node start-ai-scraper-direct.js --openai
node start-ai-scraper-direct.js --anthropic
node start-ai-scraper-direct.js --google
node start-ai-scraper-direct.js --meta
```

**Run all sources:**
```bash
node start-ai-scraper-direct.js --all
```

### 4. Query the Database

```bash
node query-database.js
```

---

## 📊 Database Structure

Data is organized in MongoDB Atlas:

```
MongoDB Atlas
├── openai/                    # OpenAI database
│   ├── gpt_4_chunks          # GPT-4 documentation
│   ├── gpt_4o_chunks         # GPT-4o documentation
│   ├── o1_chunks             # o1 documentation
│   └── ...
├── anthropic/                 # Anthropic database
│   ├── claude_4_chunks       # Claude 4 documentation
│   └── ...
├── google/                    # Google database
│   ├── gemini_1_5_pro_chunks # Gemini documentation
│   └── ...
└── ...                        # Other companies
```

Each document contains:
- `text`: Extracted content
- `embedding`: 384-dim vector
- `metadata`: Company, model, URL, document type, policy categories
- `storedAt`: Timestamp

---

## 🏷️ Policy Categories

Each source is tagged with relevant categories:

- **safety**: Safety testing, red teaming, risk mitigation
- **capabilities**: Model abilities, benchmarks, performance
- **performance**: Speed, accuracy, evaluation metrics
- **training**: Training data, methods, compute
- **limitations**: Known issues, biases, failure modes
- **usage**: Intended use cases, API usage
- **alignment**: AI safety alignment approaches
- **governance**: Organizational policies, audits

---

## 🔧 Configuration

### Add New Sources

Edit `src/config/aiDocsConfig.js`:

```javascript
{
    company: 'CompanyName',
    model: 'ModelName',
    documentType: 'System Card',
    format: 'pdf', // or 'web', 'github'
    url: 'https://example.com/doc.pdf',
    policyCategories: ['safety', 'capabilities'],
    priority: 1, // 1=high, 2=medium, 3=low
    description: 'Brief description'
}
```

### Supported Formats

- **PDF**: Direct PDF parsing (e.g., system cards)
- **Web**: HTML parsing with Cheerio/Puppeteer
- **GitHub**: Repository and markdown parsing
- **arXiv**: Research paper extraction

---

## 📈 Performance

- **Processing Speed**: ~2-3 documents/minute
- **Embedding Generation**: ~1-2 seconds per chunk
- **Chunk Size**: ~500-1000 tokens per chunk
- **Expected Chunks**: 50-300 per document
- **Storage**: ~1-2 KB per chunk

**Example Run Times:**
- Single source (test): ~30-60 seconds
- High priority (15 sources): ~30-45 minutes
- All sources (37 sources): ~1-2 hours

---

## 🛠️ Troubleshooting

### MongoDB Connection Issues

```bash
# Verify MONGODB_URI is set
echo $MONGODB_URI

# Test connection
node -e "require('dotenv').config(); console.log(process.env.MONGODB_URI)"
```

### Embedding Model Download

First run downloads ~90MB model:
```
🔄 Loading embedding model (multilingual)...
✅ Embedding model loaded successfully
```

### Common Errors

| Error | Solution |
|-------|----------|
| `MONGODB_URI environment variable is required` | Add MONGODB_URI to `.env` |
| `Failed to connect to MongoDB` | Check MongoDB Atlas IP whitelist |
| `Failed to parse PDF` | URL may be invalid or blocked |
| `Timeout` | Increase timeout in parser settings |

---

## 📦 Dependencies

### Core
- `mongodb`: Database client
- `@xenova/transformers`: Embedding generation
- `dotenv`: Environment config

### Parsing
- `pdf-parse`: PDF extraction
- `cheerio`: HTML parsing
- `puppeteer`: Browser automation
- `axios`: HTTP requests

### Utilities
- `winston`: Structured logging
- `bullmq` (optional): Job queue
- `ioredis` (optional): Redis client

---

## 📊 Data Analysis & Policy Research

After scraping, use our comprehensive analysis pipeline to generate compliance insights:

### Quick Start

```bash
# Install Python dependencies
pip install pandas numpy matplotlib seaborn pymongo python-dotenv scipy plotly kaleido

# Run complete analysis
npm run analyze

# Or extract data only
npm run analyze:extract
```

### What You Get

The analysis pipeline generates:

1. **compliance_heatmap.png** - Visual matrix showing which models fail which regulatory categories
2. **confidence_gap.png** - Reveals "verification gap" (marketing language vs. technical evidence)
3. **radar_chart.png** - Comparative analysis across all compliance dimensions
4. **policy_memo.txt** - Complete policy memo with REAL empirical data
5. **Comprehensive datasets** - CSV/JSON exports for further research

### Analysis Features

- **Compliance Scoring**: Calculates 0-100% confidence scores based on documentation quality
- **Policy Categories**: Assesses 8 regulatory dimensions (Safety, Privacy, Ethics, etc.)
- **Statistical Testing**: Chi-square and t-tests prove significance
- **Publication-Ready**: High-resolution visualizations for papers/presentations
- **Real Numbers**: All statistics based on actual scraped data from MongoDB

**Full Documentation**: See `data_analysis/README.md` for detailed analysis guide.

---

## 📄 License

MIT

---

## 🤝 Contributing

1. Add new sources to `src/config/aiDocsConfig.js`
2. Test with `--test` flag
3. Submit PR with description

---

## 📞 Support

For issues or questions, please open a GitHub issue.

---

**Status**: Production Ready ✅  
**Last Updated**: November 2025
