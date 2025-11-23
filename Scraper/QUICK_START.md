# 🚀 Quick Start Guide - AI Documentation Scraper

## ⚡ 5-Minute Setup

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure MongoDB
Create `.env` file in project root:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
NODE_ENV=production
```

### Step 3: View Available Sources
```bash
npm run sources
```

### Step 4: Test with Single Source
```bash
npm run start:test
```

### Step 5: Run Production Scraper
```bash
npm start
```

---

## 📋 Command Reference

| Command | Description | Use Case |
|---------|-------------|----------|
| `npm run sources` | List all 37 configured sources | View what's available |
| `npm run start:test` | Process 1 source (~30 sec) | Quick test/validation |
| `npm start` | Process high-priority sources (15) | **Recommended** for production |
| `npm run start:all` | Process ALL 37 sources (~2 hrs) | Complete documentation index |
| `npm run start:openai` | Process OpenAI sources only | Company-specific scraping |
| `npm run start:anthropic` | Process Anthropic sources only | Company-specific scraping |
| `npm run start:google` | Process Google sources only | Company-specific scraping |
| `npm run start:meta` | Process Meta sources only | Company-specific scraping |
| `npm run query` | Query stored data in MongoDB | View scraping results |

---

## 🗺️ System Navigation

### Main Entry Points

```
start-ai-scraper-direct.js     ← START HERE: Main scraper
│
├─→ src/core/processor.js      ← Orchestrates entire pipeline
│   ├─→ src/scrapers/aiDocScraper.js   ← Document scraping logic
│   │   ├─→ src/parsers/pdfParser.js   ← PDF extraction
│   │   ├─→ src/parsers/webParser.js   ← Web scraping
│   │   └─→ src/parsers/githubParser.js ← GitHub repos
│   │
│   ├─→ src/processors/textChunker.js  ← Text chunking
│   ├─→ src/core/embeddingService.js   ← Generate embeddings
│   └─→ src/core/database.js           ← MongoDB storage
│
├─→ show-sources.js            ← View configurations
└─→ query-database.js          ← Query results
```

### Configuration Files

```
src/config/aiDocsConfig.js     ← 37 AI model sources
.env                            ← MongoDB connection
package.json                    ← Scripts & dependencies
```

### Key Directories

```
src/
├── core/          ← Core processing logic
├── scrapers/      ← Scraping engines
├── parsers/       ← Document parsers (PDF, web, GitHub)
├── processors/    ← Text processing (chunking)
├── config/        ← Source configurations
└── utils/         ← Logging, retry logic
```

---

## 🔄 Processing Flow

```
1. Load Config
   ├─→ aiDocsConfig.js (37 sources)
   └─→ Select sources (--test, --all, --openai, etc.)

2. Connect MongoDB
   ├─→ .env MONGODB_URI
   └─→ Separate DB per company (openai, anthropic, google...)

3. Initialize Embeddings
   ├─→ Download model (~90MB, first run only)
   └─→ Load paraphrase-multilingual-MiniLM-L12-v2

4. Process Each Source
   ├─→ Parse document (PDF/Web/GitHub)
   ├─→ Chunk text (500-1000 tokens/chunk)
   ├─→ Generate embeddings (384-dim vectors)
   └─→ Store in MongoDB

5. Results
   ├─→ Separate collection per model
   ├─→ Full metadata preserved
   └─→ Query with npm run query
```

---

## 🎯 Common Workflows

### Test the System
```bash
# 1. Check what's configured
npm run sources

# 2. Test with 1 source
npm run start:test

# 3. Query results
npm run query
```

### Production Scraping
```bash
# Scrape high-priority sources (15 sources, ~30-45 min)
npm start

# Monitor progress in logs/
tail -f logs/combined.log
```

### Company-Specific Scraping
```bash
# Scrape all OpenAI docs (16 sources)
npm run start:openai

# Scrape all Anthropic docs (5 sources)
npm run start:anthropic

# Scrape specific company then query
npm run start:google && npm run query
```

### Complete Index
```bash
# Scrape everything (37 sources, ~1-2 hours)
npm run start:all

# Query all data
npm run query
```

---

## 📊 Understanding Output

### During Scraping
```bash
[INFO] Processing 1/15: OpenAI/GPT-4 - https://cdn.openai.com/papers/...
[INFO] ✅ Success: 256 chunks processed for OpenAI/GPT-4
[INFO] ✅ Stored 256 chunks to database for OpenAI/GPT-4
```

### After Completion
```bash
[INFO] ✅ Processing Complete!
[INFO] ⏱️  Duration: 1234s
[INFO] 📊 Total: 15
[INFO] ✅ Successful: 15
[INFO] ❌ Failed: 0
[INFO] 📊 Database Statistics:
[INFO]    Total chunks: 3842
[INFO]    Databases: 5
[INFO]    Collections: 15
```

---

## 🗄️ Database Structure

### After Running OpenAI Scraper
```
MongoDB Atlas
└── openai/                     # Database for OpenAI
    ├── gpt_4_chunks           # 256 chunks
    ├── gpt_4o_chunks          # 106 chunks
    ├── o1_chunks              # 198 chunks
    └── ...
```

### Query Results
```bash
npm run query

# Example output:
Company: openai
Model: gpt-4o
Total Chunks: 106
Policy Categories: safety, capabilities, performance
Document Type: System Card
Source: https://cdn.openai.com/gpt-4o-system-card.pdf
```

---

## 🛠️ Troubleshooting

### MongoDB Connection Failed
```bash
# Check .env file exists and has MONGODB_URI
cat .env

# Test connection
node -e "require('dotenv').config(); console.log(process.env.MONGODB_URI)"
```

### No Data After Scraping
```bash
# Check logs
cat logs/combined.log | grep "ERROR"

# Verify MongoDB connection
npm run query
```

### Embedding Model Download Slow
```bash
# First run downloads ~90MB model
# Progress shown:
# 🔄 Loading embedding model (multilingual)...
# ✅ Embedding model loaded successfully

# Subsequent runs use cached model (fast)
```

---

## 📁 File Locations

| File/Folder | Purpose | When to Check |
|-------------|---------|---------------|
| `logs/combined.log` | All logs | Debugging, monitoring |
| `logs/error.log` | Error logs only | When something fails |
| `.env` | MongoDB credentials | Connection issues |
| `src/config/aiDocsConfig.js` | Source configs | Add new sources |
| `node_modules/` | Downloaded model cache | After first run |

---

## 🎓 Learning Path

1. **Beginner**: `npm run start:test` → Understand basic flow
2. **Intermediate**: `npm run start:openai` → Company-specific scraping
3. **Advanced**: `npm run start:all` → Full production index
4. **Expert**: Modify `src/config/aiDocsConfig.js` → Add custom sources

---

## 💡 Pro Tips

- **Start small**: Always test with `npm run start:test` first
- **Monitor logs**: Keep `logs/combined.log` open during scraping
- **Check results**: Run `npm run query` after each scrape
- **Incremental**: Scrape by company instead of all at once
- **Backup**: Database auto-creates collections, no manual setup needed

---

## 🚨 Emergency Commands

```bash
# Stop scraping
Ctrl+C

# Clear logs
rm -rf logs/*.log

# Reinstall dependencies
rm -rf node_modules && npm install

# Reset everything except .env
git clean -fdx -e .env
npm install
```

---

## 📞 Need Help?

- Check logs: `logs/combined.log`
- View README: `README.md`
- Check sources: `npm run sources`
- Test connection: `npm run start:test`

---

**Ready to start?** Run:
```bash
npm run start:test
```

Then check results:
```bash
npm run query
```

🎉 **You're all set!**
