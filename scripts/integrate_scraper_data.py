"""
Integration Script: Scraper MongoDB → ChromaDB
Pulls enriched documentation for GPT-4o, Claude 3.5 Sonnet, and Llama 3 70B
"""

import os
import sys
from pathlib import Path
from typing import List, Dict
from pymongo import MongoClient
from dotenv import load_dotenv

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.database import get_chroma_collection

# Load environment variables
load_dotenv()

# Target models for integration
TARGET_MODELS = {
    "gpt-4o": {
        "company": "OpenAI",
        "variants": ["GPT-4o", "GPT-4o mini", "gpt-4o"],
        "output_file": "gpt4o_sample.txt",
        "display_name": "GPT-4o"
    },
    "claude-3.5-sonnet": {
        "company": "Anthropic",
        "variants": ["Claude 3.5 Sonnet", "Claude 3.5", "claude-3-5-sonnet"],
        "output_file": "claude_3_5_sonnet.txt",
        "display_name": "Claude 3.5 Sonnet"
    },
    "llama-3-70b": {
        "company": "Meta",
        "variants": ["Llama 3.1 70B", "Llama 3 70B", "llama-3-70b", "Llama 3.1"],
        "output_file": "llama3_70b.txt",
        "display_name": "Llama 3 70B"
    }
}


def connect_to_scraper_mongodb() -> MongoClient:
    """Connect to the Scraper's MongoDB database."""
    mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
    client = MongoClient(mongodb_uri)
    print(f"✓ Connected to MongoDB: {mongodb_uri}")
    return client


def fetch_model_chunks(mongo_client: MongoClient, company: str, model_variants: List[str]) -> List[Dict]:
    """
    Fetch all documentation chunks for a specific model from MongoDB.
    
    Args:
        mongo_client: MongoDB client instance
        company: Company name (e.g., "OpenAI", "Anthropic", "Meta")
        model_variants: List of possible model name variations
    
    Returns:
        List of document chunks with content and metadata
    """
    db = mongo_client[f"ai_docs_{company.lower()}"]
    collection = db.chunks
    
    # Query for any of the model variants
    query = {"model": {"$in": model_variants}}
    
    chunks = list(collection.find(query))
    print(f"  ✓ Found {len(chunks)} chunks for {company} models")
    
    return chunks


def merge_chunks_to_text(chunks: List[Dict]) -> str:
    """
    Merge MongoDB chunks into a comprehensive text document.
    
    Args:
        chunks: List of document chunks from MongoDB
    
    Returns:
        Merged text content
    """
    if not chunks:
        return ""
    
    # Group by document type and policy category
    grouped = {}
    for chunk in chunks:
        doc_type = chunk.get("documentType", "General")
        category = chunk.get("policyCategories", ["General"])[0] if chunk.get("policyCategories") else "General"
        key = f"{doc_type} - {category}"
        
        if key not in grouped:
            grouped[key] = []
        grouped[key].append(chunk.get("content", ""))
    
    # Build merged document
    merged_text = []
    for section, contents in grouped.items():
        merged_text.append(f"\n{'='*80}\n{section}\n{'='*80}\n")
        merged_text.append("\n\n".join(contents))
    
    return "\n".join(merged_text)


def update_model_docs(model_key: str, model_info: Dict, merged_text: str):
    """
    Update the model_docs directory with enriched content.
    
    Args:
        model_key: Model identifier key
        model_info: Model configuration dict
        merged_text: Merged documentation text
    """
    output_path = Path(__file__).parent.parent / "data" / "model_docs" / model_info["output_file"]
    
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(merged_text)
    
    print(f"  ✓ Updated {output_path.name} ({len(merged_text):,} chars)")


def update_chromadb(model_key: str, merged_text: str):
    """
    Update ChromaDB vector store with enriched documentation.
    
    Args:
        model_key: Model identifier
        merged_text: Documentation content
    """
    collection = get_chroma_collection()
    
    # Split into chunks (ChromaDB works better with smaller chunks)
    chunk_size = 1000
    chunks = [merged_text[i:i+chunk_size] for i in range(0, len(merged_text), chunk_size)]
    
    # Prepare documents for ChromaDB
    documents = []
    metadatas = []
    ids = []
    
    for idx, chunk in enumerate(chunks):
        documents.append(chunk)
        metadatas.append({
            "model": model_key,
            "source": "scraper_integration",
            "chunk_index": idx
        })
        ids.append(f"{model_key}_chunk_{idx}")
    
    # Delete existing chunks for this model
    try:
        existing_ids = collection.get(where={"model": model_key})["ids"]
        if existing_ids:
            collection.delete(ids=existing_ids)
            print(f"  ✓ Removed {len(existing_ids)} old chunks from ChromaDB")
    except Exception as e:
        print(f"  ℹ No existing chunks to remove: {e}")
    
    # Add new chunks
    collection.add(
        documents=documents,
        metadatas=metadatas,
        ids=ids
    )
    
    print(f"  ✓ Added {len(chunks)} new chunks to ChromaDB")


def main():
    """Main integration workflow."""
    print("\n" + "="*80)
    print("SCRAPER DATA INTEGRATION")
    print("="*80 + "\n")
    
    # Connect to MongoDB
    mongo_client = connect_to_scraper_mongodb()
    
    # Process each target model
    for model_key, model_info in TARGET_MODELS.items():
        print(f"\n📦 Processing {model_key}...")
        
        # Fetch chunks from MongoDB
        chunks = fetch_model_chunks(
            mongo_client,
            model_info["company"],
            model_info["variants"]
        )
        
        if not chunks:
            print(f"  ⚠ No data found for {model_key}. Skipping...")
            continue
        
        # Merge chunks
        merged_text = merge_chunks_to_text(chunks)
        
        # Update model_docs directory
        update_model_docs(model_key, model_info, merged_text)
        
        # Update ChromaDB
        update_chromadb(model_key, merged_text)
        
        print(f"  ✅ {model_key} integration complete!")
    
    # Close MongoDB connection
    mongo_client.close()
    
    print("\n" + "="*80)
    print("✅ INTEGRATION COMPLETE")
    print("="*80 + "\n")
    print("Next steps:")
    print("  1. Verify updated files in data/model_docs/")
    print("  2. Check ChromaDB has new embeddings")
    print("  3. Run a test audit to validate integration")
    print()


if __name__ == "__main__":
    main()
