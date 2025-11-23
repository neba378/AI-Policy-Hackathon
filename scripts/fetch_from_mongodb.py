"""
Direct MongoDB Integration - Fetch Raw Documentation Chunks
Pulls actual scraped text content from MongoDB and builds comprehensive model docs
"""

import os
import sys
from pathlib import Path
from pymongo import MongoClient
from dotenv import load_dotenv
from collections import defaultdict

# Load environment
load_dotenv()

# Model mapping
MODEL_MAPPING = {
    "gpt-4o": {
        "mongo_names": ["GPT-4o", "GPT-4o mini", "gpt-4o", "Gpt 4", "Gpt 4O"],
        "company": "OpenAI",
        "output_file": "gpt4o_sample.txt"
    },
    "claude-3.5-sonnet": {
        "mongo_names": ["Claude 3.5 Sonnet", "Claude 3.5", "claude-3-5-sonnet", "Claude 4"],
        "company": "Anthropic",
        "output_file": "claude_3_5_sonnet.txt"
    },
    "llama-3-70b": {
        "mongo_names": ["Llama 3.1 70B", "Llama 3 70B", "llama-3-70b", "Llama 3.1", "Llama 3 1"],
        "company": "Meta",
        "output_file": "llama3_70b.txt"
    }
}


def connect_mongodb():
    """Connect to MongoDB Atlas."""
    mongodb_uri = os.getenv("MONGODB_URI")
    if not mongodb_uri:
        print("❌ MONGODB_URI not found in .env file")
        return None
    
    try:
        client = MongoClient(mongodb_uri, serverSelectionTimeoutMS=10000)
        # Test connection
        client.admin.command('ping')
        print(f"✅ Connected to MongoDB Atlas\n")
        return client
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        print("\nTrying alternative: Check if data exists locally...")
        return None


def get_all_databases(client):
    """List all databases to find scraped data."""
    print("📚 Available Databases:")
    print("-" * 60)
    
    dbs = client.list_database_names()
    ai_dbs = [db for db in dbs if 'ai' in db.lower() or 'doc' in db.lower() or 'scraper' in db.lower()]
    
    for db in ai_dbs:
        collections = client[db].list_collection_names()
        print(f"  📂 {db}")
        for coll in collections:
            count = client[db][coll].count_documents({})
            print(f"     └─ {coll}: {count:,} documents")
    
    return ai_dbs


def fetch_model_documentation(client, model_config):
    """Fetch all documentation chunks for a model."""
    company = model_config["company"]
    model_names = model_config["mongo_names"]
    
    # Try different database naming patterns
    possible_dbs = [
        f"ai_docs_{company.lower()}",
        f"ai_{company.lower()}",
        f"{company.lower()}_docs",
        "ai_documentation",
        "scraped_docs"
    ]
    
    for db_name in possible_dbs:
        if db_name in client.list_database_names():
            db = client[db_name]
            
            # Try different collection names
            for coll_name in ["chunks", "documents", "content", "data"]:
                if coll_name in db.list_collection_names():
                    collection = db[coll_name]
                    
                    # Query for any model name variant
                    chunks = list(collection.find({"model": {"$in": model_names}}))
                    
                    if chunks:
                        print(f"  ✓ Found {len(chunks)} chunks in {db_name}.{coll_name}")
                        return chunks
    
    # Try searching all databases
    print(f"  ⚠ Searching all databases for {model_names}...")
    for db_name in client.list_database_names():
        if db_name in ['admin', 'local', 'config']:
            continue
        
        db = client[db_name]
        for coll_name in db.list_collection_names():
            collection = db[coll_name]
            chunks = list(collection.find({"model": {"$in": model_names}}).limit(1))
            if chunks:
                all_chunks = list(collection.find({"model": {"$in": model_names}}))
                print(f"  ✓ Found {len(all_chunks)} chunks in {db_name}.{coll_name}")
                return all_chunks
    
    print(f"  ✗ No chunks found for {model_names}")
    return []


def organize_chunks_by_category(chunks):
    """Organize chunks by policy category and document type."""
    organized = defaultdict(list)
    
    for chunk in chunks:
        # Get category (might be in different fields)
        categories = chunk.get('policyCategories', []) or chunk.get('categories', []) or ['general']
        doc_type = chunk.get('documentType', 'General')
        content = chunk.get('content', '') or chunk.get('text', '') or chunk.get('chunk', '')
        
        for category in categories:
            key = f"{doc_type} - {category}"
            organized[key].append(content)
    
    return organized


def build_comprehensive_doc(model_key, chunks, model_config):
    """Build comprehensive documentation from chunks."""
    if not chunks:
        return None
    
    doc_lines = []
    
    # Header
    doc_lines.append("=" * 80)
    doc_lines.append(f"{model_config['company']} - {model_key.upper()}")
    doc_lines.append(f"Comprehensive Documentation from Scraped Sources")
    doc_lines.append(f"Total Chunks: {len(chunks)}")
    doc_lines.append("=" * 80)
    doc_lines.append("")
    
    # Organize by category
    organized = organize_chunks_by_category(chunks)
    
    # Statistics
    doc_lines.append("DOCUMENTATION COVERAGE")
    doc_lines.append("-" * 80)
    doc_lines.append(f"Total Categories: {len(organized)}")
    doc_lines.append(f"Total Chunks: {len(chunks)}")
    
    # Calculate avg chunk size
    total_chars = sum(len(chunk.get('content', '') or chunk.get('text', '') or chunk.get('chunk', '')) for chunk in chunks)
    avg_size = total_chars / len(chunks) if chunks else 0
    doc_lines.append(f"Average Chunk Size: {avg_size:.0f} characters")
    doc_lines.append("")
    
    # Content by category
    for category, contents in sorted(organized.items()):
        doc_lines.append("")
        doc_lines.append("=" * 80)
        doc_lines.append(f"CATEGORY: {category}")
        doc_lines.append("=" * 80)
        doc_lines.append(f"Chunks in this category: {len(contents)}")
        doc_lines.append("")
        
        # Add content (limit to avoid huge files)
        for idx, content in enumerate(contents[:10]):  # Max 10 chunks per category
            doc_lines.append(f"--- Chunk {idx + 1} ---")
            doc_lines.append(content[:2000])  # Limit chunk size
            if len(content) > 2000:
                doc_lines.append(f"... [truncated, full length: {len(content)} chars]")
            doc_lines.append("")
    
    # Metadata section
    doc_lines.append("")
    doc_lines.append("=" * 80)
    doc_lines.append("METADATA")
    doc_lines.append("=" * 80)
    
    # Get unique document types and sources
    doc_types = set(chunk.get('documentType', 'Unknown') for chunk in chunks)
    sources = set(chunk.get('url', 'Unknown') for chunk in chunks)
    
    doc_lines.append(f"Document Types: {', '.join(sorted(doc_types))}")
    doc_lines.append(f"Sources: {len(sources)} unique URLs")
    doc_lines.append("")
    
    return "\n".join(doc_lines)


def main():
    """Main workflow."""
    print("\n" + "=" * 80)
    print("MONGODB DIRECT INTEGRATION - FETCH RAW DOCUMENTATION")
    print("=" * 80 + "\n")
    
    # Connect to MongoDB
    client = connect_mongodb()
    
    if not client:
        print("\n⚠️  Could not connect to MongoDB.")
        print("This is likely due to:")
        print("  1. IP whitelist restrictions on MongoDB Atlas")
        print("  2. Network/firewall blocking the connection")
        print("\nAlternative: Use the CSV-based integration we already ran.")
        return
    
    # Show available databases
    get_all_databases(client)
    print()
    
    # Process each model
    print("🔍 Fetching documentation for each model...")
    print("-" * 80)
    
    docs_updated = 0
    
    for model_key, model_config in MODEL_MAPPING.items():
        print(f"\n📦 Processing {model_key} ({model_config['company']})...")
        
        # Fetch chunks
        chunks = fetch_model_documentation(client, model_config)
        
        if not chunks:
            print(f"  ⚠ No data found, keeping existing doc")
            continue
        
        # Build comprehensive doc
        doc_content = build_comprehensive_doc(model_key, chunks, model_config)
        
        if doc_content:
            # Save to file
            output_path = Path(__file__).parent.parent / "data" / "model_docs" / model_config["output_file"]
            
            # Backup original
            if output_path.exists():
                backup_path = output_path.with_suffix('.txt.backup2')
                with open(output_path, 'r', encoding='utf-8') as f:
                    with open(backup_path, 'w', encoding='utf-8') as bf:
                        bf.write(f.read())
            
            # Write new content
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(doc_content)
            
            print(f"  ✅ Updated {output_path.name} ({len(doc_content):,} chars)")
            docs_updated += 1
    
    client.close()
    
    print("\n" + "=" * 80)
    if docs_updated > 0:
        print(f"✅ INTEGRATION COMPLETE - {docs_updated} models updated!")
        print("=" * 80)
        print("\nNext Steps:")
        print("  1. Delete data/chroma_db/ to force rebuild")
        print("  2. Restart backend: uvicorn app.main:app --reload")
        print("  3. Test with a policy upload")
    else:
        print("⚠️  NO UPDATES - MongoDB connection issue")
        print("=" * 80)
        print("\nThe CSV-based integration you already have is working.")
        print("The current model docs are already enhanced with scraped data.")
    print()


if __name__ == "__main__":
    main()
