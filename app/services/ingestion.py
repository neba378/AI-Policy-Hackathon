"""
Document ingestion service for Policy Sentinel.
Loads model documentation text files, chunks them, and stores in Chroma vector DB.
"""
import os
from pathlib import Path
from typing import List
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.schema import Document


DOCS_DIR = Path("data/model_docs")
CHROMA_PERSIST_DIR = "data/chroma_db"


def get_embedding_model():
    """Initialize the HuggingFace embedding model."""
    return HuggingFaceEmbeddings(
        model_name="all-MiniLM-L6-v2",
        model_kwargs={'device': 'cpu'},
        encode_kwargs={'normalize_embeddings': True}
    )


def load_model_documents() -> List[Document]:
    """
    Load all .txt files from the model_docs directory.
    Each file becomes a set of Documents with metadata.
    """
    if not DOCS_DIR.exists():
        raise FileNotFoundError(f"Model docs directory not found: {DOCS_DIR}")
    
    documents = []
    txt_files = list(DOCS_DIR.glob("*.txt"))
    
    if not txt_files:
        raise FileNotFoundError(f"No .txt files found in {DOCS_DIR}")
    
    print(f"📄 Found {len(txt_files)} model documentation files")
    
    for filepath in txt_files:
        model_name = filepath.stem  # filename without extension
        print(f"  Loading: {model_name}")
        
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Create a document with metadata
        doc = Document(
            page_content=content,
            metadata={"model_name": model_name, "source": str(filepath)}
        )
        documents.append(doc)
    
    return documents


def chunk_documents(documents: List[Document]) -> List[Document]:
    """
    Split documents into chunks while preserving metadata.
    """
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=["\n\n", "\n", ". ", " ", ""]
    )
    
    chunks = text_splitter.split_documents(documents)
    print(f"✂️  Created {len(chunks)} chunks from {len(documents)} documents")
    
    return chunks


def initialize_vector_store(force_reload: bool = False) -> Chroma:
    """
    Initialize or load the Chroma vector store.
    
    Args:
        force_reload: If True, recreate the vector store even if it exists.
    
    Returns:
        Chroma vector store instance.
    """
    embedding_model = get_embedding_model()
    persist_dir = Path(CHROMA_PERSIST_DIR)
    
    # Check if vector store already exists
    if persist_dir.exists() and not force_reload:
        print("📦 Loading existing vector store...")
        vectorstore = Chroma(
            persist_directory=str(persist_dir),
            embedding_function=embedding_model
        )
        
        # Verify it has data
        collection_count = vectorstore._collection.count()
        if collection_count > 0:
            print(f"✅ Vector store loaded with {collection_count} chunks")
            return vectorstore
        else:
            print("⚠️  Vector store exists but is empty. Recreating...")
    
    # Create new vector store
    print("🔨 Creating new vector store...")
    
    # Load and chunk documents
    documents = load_model_documents()
    chunks = chunk_documents(documents)
    
    # Create vector store
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embedding_model,
        persist_directory=str(persist_dir)
    )
    
    print(f"✅ Vector store created with {len(chunks)} chunks")
    return vectorstore


def get_available_models(vectorstore: Chroma) -> List[str]:
    """
    Get list of unique model names from the vector store metadata.
    """
    # Query all documents and extract unique model names
    all_docs = vectorstore.get()
    
    if not all_docs or 'metadatas' not in all_docs:
        return []
    
    model_names = set()
    for metadata in all_docs['metadatas']:
        if metadata and 'model_name' in metadata:
            model_names.add(metadata['model_name'])
    
    return sorted(list(model_names))
