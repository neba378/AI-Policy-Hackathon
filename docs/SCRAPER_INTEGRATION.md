# Scraper Integration Guide

## Overview

This integration pulls comprehensive AI model documentation from the Scraper's MongoDB and enriches your ChromaDB vector store for more accurate policy audits.

## Target Models

- **GPT-4o** (OpenAI)
- **Claude 3.5 Sonnet** (Anthropic)
- **Llama 3 70B** (Meta)

## Setup Steps

### 1. Install Dependencies

```powershell
pip install -r requirements.txt
```

### 2. Configure MongoDB URI

Add to your root `.env` file (or create one):

```env
MONGODB_URI=mongodb://localhost:27017/
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
```

### 3. Run the Scraper (First Time)

```powershell
cd Scraper
npm install
npm start
```

This will scrape documentation for your 3 models (~5-10 minutes).

### 4. Health Check

```powershell
# Return to root directory
cd ..

# Run health check
python scripts/check_scraper_health.py
```

Expected output:

```
✅ MongoDB Connected
✅ Available Databases:
  ✓ ai_docs_openai: 245 chunks
  ✓ ai_docs_anthropic: 156 chunks
  ✓ ai_docs_meta: 189 chunks

✅ Target Model Data:
  gpt-4o         | OpenAI    | ✅ Available | 245
  claude-3.5... | Anthropic | ✅ Available | 156
  llama-3-70b   | Meta      | ✅ Available | 189
```

### 5. Run Integration

```powershell
python scripts/integrate_scraper_data.py
```

This will:

- Pull all chunks from MongoDB for your 3 models
- Merge them into comprehensive documentation
- Update `data/model_docs/` files
- Refresh ChromaDB embeddings

### 6. Verify Integration

```powershell
# Check updated files
ls data/model_docs/

# You should see larger file sizes:
# gpt4o_sample.txt (was ~3KB, now ~50KB+)
# claude_3_5_sonnet.txt (was ~5KB, now ~40KB+)
# llama3_70b.txt (was ~4KB, now ~45KB+)
```

## Workflow Diagram

```
┌─────────────┐
│   Scraper   │  npm start (scrapes model docs)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  MongoDB    │  Stores chunks with embeddings
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Integration │  python scripts/integrate_scraper_data.py
│   Script    │
└──────┬──────┘
       │
       ├──────────────────────┐
       │                      │
       ▼                      ▼
┌─────────────┐        ┌─────────────┐
│ model_docs/ │        │  ChromaDB   │
│  .txt files │        │  embeddings │
└─────────────┘        └──────┬──────┘
                              │
                              ▼
                       ┌─────────────┐
                       │ Audit RAG   │  Your policy audit system
                       └─────────────┘
```

## Updating Data

When you want to refresh with latest documentation:

```powershell
# 1. Re-run scraper (optional, if docs updated)
cd Scraper
npm start

# 2. Re-run integration
cd ..
python scripts/integrate_scraper_data.py
```

## Troubleshooting

### MongoDB Connection Failed

```powershell
# Check if MongoDB is running
mongod --version

# Start MongoDB (if local)
mongod

# Or check Atlas connection string
```

### No Scraper Data Found

```powershell
# Run scraper for specific companies
cd Scraper
npm run start:openai
npm run start:anthropic
npm run start:meta
```

### ChromaDB Errors

```powershell
# Reset ChromaDB (WARNING: deletes all embeddings)
rm -r data/chroma_db/
# Then restart backend to reinitialize
```

## Files Created

- `scripts/integrate_scraper_data.py` - Main integration script
- `scripts/check_scraper_health.py` - Health check utility
- `scripts/scraper_config.py` - Configuration mappings
- `SCRAPER_INTEGRATION.md` - This guide

## Next Steps

After integration:

1. Run a test audit to verify improved accuracy
2. Check audit confidence scores (should be higher)
3. Review evidence quotes (should be more specific)
