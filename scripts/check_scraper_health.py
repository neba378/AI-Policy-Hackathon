"""
Scraper Health Check & Data Validation
Verifies MongoDB connection and available model data before integration
"""

import os
import sys
from pathlib import Path
from pymongo import MongoClient
from dotenv import load_dotenv
from tabulate import tabulate

# Load environment
load_dotenv()

# Target models (same as integration script)
TARGET_MODELS = {
    "gpt-4o": {
        "company": "OpenAI",
        "variants": ["GPT-4o", "GPT-4o mini", "gpt-4o"],
    },
    "claude-3.5-sonnet": {
        "company": "Anthropic",
        "variants": ["Claude 3.5 Sonnet", "Claude 3.5", "claude-3-5-sonnet"],
    },
    "llama-3-70b": {
        "company": "Meta",
        "variants": ["Llama 3.1 70B", "Llama 3 70B", "llama-3-70b", "Llama 3.1"],
    }
}


def check_mongodb_connection() -> MongoClient:
    """Test MongoDB connection."""
    mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
    
    try:
        client = MongoClient(mongodb_uri, serverSelectionTimeoutMS=5000)
        # Test connection
        client.admin.command('ping')
        print(f"✅ MongoDB Connected: {mongodb_uri}\n")
        return client
    except Exception as e:
        print(f"❌ MongoDB Connection Failed: {e}")
        print("\nPlease ensure:")
        print("  1. MongoDB is running")
        print("  2. MONGODB_URI is set in .env file")
        print("  3. Scraper has been run (npm start)")
        sys.exit(1)


def check_scraper_databases(client: MongoClient):
    """Check which scraper databases exist."""
    print("📚 Available Databases:")
    print("-" * 60)
    
    all_dbs = client.list_database_names()
    scraper_dbs = [db for db in all_dbs if db.startswith("ai_docs_")]
    
    if not scraper_dbs:
        print("⚠️  No scraper databases found!")
        print("\nRun the scraper first:")
        print("  cd Scraper")
        print("  npm start")
        return False
    
    for db_name in scraper_dbs:
        db = client[db_name]
        chunks_count = db.chunks.count_documents({})
        print(f"  ✓ {db_name}: {chunks_count:,} chunks")
    
    print()
    return True


def check_model_availability(client: MongoClient):
    """Check if target models have data available."""
    print("🎯 Target Model Data Availability:")
    print("-" * 60)
    
    model_data = []
    total_chunks = 0
    
    for model_key, model_info in TARGET_MODELS.items():
        company = model_info["company"]
        db_name = f"ai_docs_{company.lower()}"
        
        if db_name not in client.list_database_names():
            model_data.append([model_key, company, "❌ No database", 0])
            continue
        
        db = client[db_name]
        
        # Query for model variants
        query = {"model": {"$in": model_info["variants"]}}
        count = db.chunks.count_documents(query)
        
        status = "✅ Available" if count > 0 else "⚠️  No data"
        model_data.append([model_key, company, status, count])
        total_chunks += count
    
    # Print table
    headers = ["Model", "Company", "Status", "Chunks"]
    print(tabulate(model_data, headers=headers, tablefmt="grid"))
    print(f"\nTotal chunks available: {total_chunks:,}")
    
    if total_chunks == 0:
        print("\n⚠️  No data found for target models!")
        print("\nRun scraper for specific companies:")
        print("  cd Scraper")
        print("  npm run start:openai")
        print("  npm run start:anthropic")
        print("  npm run start:meta")
        return False
    
    print()
    return True


def check_chromadb():
    """Check ChromaDB status."""
    print("🔍 ChromaDB Status:")
    print("-" * 60)
    
    try:
        from app.services.database import get_chroma_collection
        collection = get_chroma_collection()
        
        count = collection.count()
        print(f"  ✓ ChromaDB connected")
        print(f"  ✓ Current embeddings: {count:,}")
        
        # Check for existing model data
        for model_key in TARGET_MODELS.keys():
            model_count = collection.count(where={"model": model_key})
            if model_count > 0:
                print(f"  • {model_key}: {model_count} chunks")
        
        print()
        return True
        
    except Exception as e:
        print(f"  ❌ ChromaDB Error: {e}")
        print()
        return False


def main():
    """Run health checks."""
    print("\n" + "="*60)
    print("SCRAPER INTEGRATION HEALTH CHECK")
    print("="*60 + "\n")
    
    # Check MongoDB
    client = check_mongodb_connection()
    
    # Check databases
    has_dbs = check_scraper_databases(client)
    
    # Check model data
    has_models = check_model_availability(client)
    
    # Check ChromaDB
    has_chroma = check_chromadb()
    
    # Summary
    print("="*60)
    if has_dbs and has_models and has_chroma:
        print("✅ ALL CHECKS PASSED - Ready for integration!")
        print("\nRun integration script:")
        print("  python scripts/integrate_scraper_data.py")
    else:
        print("⚠️  SOME CHECKS FAILED - Fix issues above")
        print("\nCommon fixes:")
        print("  1. Run scraper: cd Scraper && npm start")
        print("  2. Check .env has MONGODB_URI")
        print("  3. Ensure ChromaDB is initialized")
    print("="*60 + "\n")
    
    client.close()


if __name__ == "__main__":
    main()
