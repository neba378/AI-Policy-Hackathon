"""
Alternative Integration: Use Scraper Analysis Data
Since MongoDB Atlas has connection restrictions, we'll use the scraped analysis data
"""

import os
import sys
import json
from pathlib import Path
import pandas as pd
from typing import Dict, List

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.ingestion import initialize_vector_store

# Paths
SCRAPER_OUTPUTS = Path(__file__).parent.parent / "Scraper" / "data_analysis" / "outputs"
MODEL_DOCS = Path(__file__).parent.parent / "data" / "model_docs"

# Model mapping
MODEL_MAPPING = {
    "Gpt 4": "gpt4o_sample.txt",
    "Gpt 4O": "gpt4o_sample.txt",
    "GPT-4o": "gpt4o_sample.txt",
    "Claude 4": "claude_3_5_sonnet.txt",
    "Claude 3.5": "claude_3_5_sonnet.txt",
    "Llama 3": "llama3_70b.txt",
    "Llama 3.1": "llama3_70b.txt",
    "Llama 3 1": "llama3_70b.txt",
}


def load_scraped_data() -> pd.DataFrame:
    """Load the comprehensive compliance data from scraper analysis."""
    compliance_file = SCRAPER_OUTPUTS / "compliance_data.csv"
    
    if not compliance_file.exists():
        print(f"❌ Compliance data not found at: {compliance_file}")
        print("\nPlease run the scraper analysis first:")
        print("  cd Scraper")
        print("  python run_analysis.py")
        return None
    
    df = pd.read_csv(compliance_file)
    print(f"✓ Loaded {len(df)} compliance assessments")
    return df


def load_detailed_reports() -> tuple:
    """Load detailed model and category reports."""
    model_report = SCRAPER_OUTPUTS / "model_detailed_report.csv"
    category_report = SCRAPER_OUTPUTS / "category_detailed_report.csv"
    
    model_df = None
    category_df = None
    
    if model_report.exists():
        model_df = pd.read_csv(model_report)
        print(f"✓ Loaded model report: {len(model_df)} models")
    
    if category_report.exists():
        category_df = pd.read_csv(category_report)
        print(f"✓ Loaded category report: {len(category_df)} categories")
    
    return model_df, category_df


def generate_enhanced_docs(compliance_df: pd.DataFrame, model_df: pd.DataFrame) -> Dict[str, str]:
    """Generate enhanced documentation for each model."""
    enhanced_docs = {}
    
    for original_name, filename in MODEL_MAPPING.items():
        # Get all data for this model (case insensitive)
        model_data = compliance_df[compliance_df['Model'].str.strip() == original_name]
        
        if len(model_data) == 0:
            print(f"⚠ No data for {original_name}, skipping...")
            continue
        
        # Get model summary
        model_summary = model_df[model_df['Model'].str.strip() == original_name].iloc[0] if model_df is not None and len(model_df[model_df['Model'].str.strip() == original_name]) > 0 else None
        
        # Build enhanced document
        doc_sections = []
        
        # Header
        doc_sections.append(f"{'='*80}")
        doc_sections.append(f"{original_name} - Enhanced Documentation")
        doc_sections.append(f"Source: AI Documentation Scraper Analysis")
        doc_sections.append(f"{'='*80}\n")
        
        # Model Summary
        if model_summary is not None:
            doc_sections.append("COMPLIANCE SUMMARY")
            doc_sections.append("-" * 80)
            doc_sections.append(f"Overall Compliance Score: {model_summary.get('Confidence_mean', 'N/A'):.1f}%")
            doc_sections.append(f"Pass Rate: {model_summary.get('Status_mean', 0)*100:.1f}%")
            doc_sections.append(f"Categories Analyzed: {model_summary.get('Status_count', 'N/A')}")
            doc_sections.append(f"Company: {model_data.iloc[0]['Company']}")
            doc_sections.append("")
        
        # Category Breakdown
        doc_sections.append("POLICY CATEGORY COMPLIANCE")
        doc_sections.append("-" * 80)
        
        for _, row in model_data.iterrows():
            category = row['Category']
            confidence = row['Confidence']
            status = row['Status']
            has_coverage = row['Has_Coverage']
            
            doc_sections.append(f"\n{category}:")
            doc_sections.append(f"  Status: {'✓ PASS' if status == 1 else '✗ FAIL'}")
            doc_sections.append(f"  Confidence: {confidence:.1f}%")
            doc_sections.append(f"  Coverage: {'Available' if has_coverage else 'No documentation found'}")
            doc_sections.append(f"  Chunks Analyzed: {row['Chunk_Count']}")
            
            if has_coverage:
                doc_sections.append(f"  Avg Text Length: {row['Avg_Text_Length']} chars")
        
        # Overall Statistics
        doc_sections.append(f"\n{'='*80}")
        doc_sections.append("OVERALL STATISTICS")
        doc_sections.append("="*80)
        doc_sections.append(f"Total Categories: {len(model_data)}")
        doc_sections.append(f"Passed: {(model_data['Status'] == 1).sum()}")
        doc_sections.append(f"Failed: {(model_data['Status'] == 0).sum()}")
        doc_sections.append(f"Average Confidence: {model_data['Confidence'].mean():.1f}%")
        doc_sections.append(f"Documentation Coverage: {model_data['Has_Coverage'].sum()}/{len(model_data)} categories")
        
        enhanced_docs[filename] = "\n".join(doc_sections)
    
    return enhanced_docs


def update_model_files(enhanced_docs: Dict[str, str]):
    """Update model documentation files."""
    print("\n📝 Updating model documentation files...")
    
    for filename, content in enhanced_docs.items():
        file_path = MODEL_DOCS / filename
        
        # Backup original
        if file_path.exists():
            backup_path = MODEL_DOCS / f"{filename}.backup"
            with open(file_path, 'r', encoding='utf-8') as f:
                original = f.read()
            with open(backup_path, 'w', encoding='utf-8') as f:
                f.write(original)
        
        # Write enhanced version
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"  ✓ Updated {filename} ({len(content):,} chars)")


def update_chromadb(enhanced_docs: Dict[str, str]):
    """Skip ChromaDB update - it will be rebuilt automatically on backend start."""
    print("\n🔍 Skipping ChromaDB update...")
    print("  ℹ ChromaDB will be automatically rebuilt when backend restarts")
    print("  ℹ The updated model docs will be ingested automatically")


def main():
    """Main integration workflow."""
    print("\n" + "="*80)
    print("SCRAPER DATA INTEGRATION (Alternative Method)")
    print("Using scraped analysis outputs instead of MongoDB")
    print("="*80 + "\n")
    
    # Load scraped data
    print("📊 Loading scraper analysis data...\n")
    compliance_df = load_scraped_data()
    
    if compliance_df is None:
        return
    
    model_df, category_df = load_detailed_reports()
    
    # Generate enhanced docs
    print("\n🔧 Generating enhanced documentation...\n")
    enhanced_docs = generate_enhanced_docs(compliance_df, model_df)
    
    if not enhanced_docs:
        print("❌ No enhanced docs generated. Check model name mappings.")
        return
    
    print(f"✓ Generated docs for {len(enhanced_docs)} models")
    
    # Update files
    update_model_files(enhanced_docs)
    
    # Update ChromaDB
    update_chromadb(enhanced_docs)
    
    print("\n" + "="*80)
    print("✅ INTEGRATION COMPLETE!")
    print("="*80)
    print("\nYour model documentation has been enhanced with:")
    print("  • Compliance scores by category")
    print("  • Confidence percentages")
    print("  • Detailed evidence from scraper analysis")
    print("\nNext Steps:")
    print("  1. Delete data/chroma_db/ directory to force rebuild")
    print("  2. Restart backend: uvicorn app.main:app --reload")
    print("  3. ChromaDB will auto-ingest new model docs on startup")
    print("  4. Run a test audit to see improved results!")
    print()


if __name__ == "__main__":
    main()
