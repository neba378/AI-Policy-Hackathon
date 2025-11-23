"""
MongoDB Data Extractor for Policy Sentinel Analysis
Extracts real scraped data from MongoDB for compliance analysis
"""

import os
import sys
from pymongo import MongoClient
import pandas as pd
from dotenv import load_dotenv
from datetime import datetime
import json

# Load environment
load_dotenv()

class DataExtractor:
    def __init__(self):
        self.client = None
        self.companies = ['openai', 'anthropic', 'google', 'meta', 'mistral', 
                         'xai', 'stability', 'cohere', 'ai21', 'alibaba']
        self.policy_categories = ['safety', 'performance', 'training', 'limitations', 
                                 'capabilities', 'usage', 'ethics', 'privacy']
        
    def connect(self):
        """Connect to MongoDB Atlas"""
        uri = os.getenv('MONGODB_URI')
        if not uri:
            print("ERROR: MONGODB_URI not found in .env file")
            sys.exit(1)
            
        try:
            self.client = MongoClient(uri, serverSelectionTimeoutMS=10000)
            # Test connection
            self.client.admin.command('ping')
            print("✅ Connected to MongoDB Atlas successfully")
            return True
        except Exception as e:
            print(f"❌ MongoDB connection failed: {e}")
            return False
    
    def get_available_databases(self):
        """Get list of databases with scraped data"""
        try:
            db_list = self.client.list_database_names()
            # Filter for company databases
            company_dbs = [db for db in db_list if db in self.companies]
            print(f"\n📊 Found {len(company_dbs)} company databases:")
            for db in company_dbs:
                print(f"   - {db}")
            return company_dbs
        except Exception as e:
            print(f"Error listing databases: {e}")
            return []
    
    def extract_company_data(self, company):
        """Extract all data from a company database"""
        try:
            db = self.client[company]
            collections = db.list_collection_names()
            
            all_chunks = []
            for collection_name in collections:
                if collection_name.endswith('_chunks'):
                    model = collection_name.replace('_chunks', '').replace('_', ' ').title()
                    coll = db[collection_name]
                    chunks = list(coll.find())
                    
                    for chunk in chunks:
                        all_chunks.append({
                            'company': company.title(),
                            'model': model,
                            'collection': collection_name,
                            'chunk_id': str(chunk.get('_id', '')),
                            'text': chunk.get('text', ''),
                            'url': chunk.get('metadata', {}).get('url', ''),
                            'documentType': chunk.get('metadata', {}).get('documentType', ''),
                            'policyCategories': chunk.get('metadata', {}).get('policyCategories', []),
                            'chunk_index': chunk.get('chunkIndex', 0),
                            'timestamp': chunk.get('timestamp', ''),
                            'embedding_dim': len(chunk.get('embedding', [])) if chunk.get('embedding') else 0
                        })
            
            return all_chunks
        except Exception as e:
            print(f"Error extracting {company} data: {e}")
            return []
    
    def extract_all_data(self):
        """Extract data from all available company databases"""
        if not self.connect():
            return None
        
        available_dbs = self.get_available_databases()
        if not available_dbs:
            print("\n⚠️  No company databases found. Run the scraper first:")
            print("   npm start")
            return None
        
        all_data = []
        for company in available_dbs:
            print(f"\n🔍 Extracting data from {company.upper()}...")
            chunks = self.extract_company_data(company)
            all_data.extend(chunks)
            print(f"   ✓ Extracted {len(chunks)} chunks")
        
        df = pd.DataFrame(all_data)
        print(f"\n✅ Total extracted: {len(df)} chunks from {len(available_dbs)} companies")
        
        return df
    
    def generate_compliance_metrics(self, df):
        """Generate compliance metrics from scraped data"""
        if df is None or len(df) == 0:
            return None
        
        metrics = {
            'timestamp': datetime.now().isoformat(),
            'total_chunks': len(df),
            'unique_companies': df['company'].nunique(),
            'unique_models': df['model'].nunique(),
            'companies': df['company'].value_counts().to_dict(),
            'models_per_company': df.groupby('company')['model'].nunique().to_dict(),
            'avg_chunks_per_model': df.groupby('model').size().mean(),
            'document_types': df['documentType'].value_counts().to_dict(),
            'embedding_coverage': (df['embedding_dim'] > 0).sum() / len(df) * 100,
        }
        
        # Policy category coverage
        all_categories = []
        for cats in df['policyCategories']:
            if isinstance(cats, list):
                all_categories.extend(cats)
        
        metrics['policy_category_coverage'] = pd.Series(all_categories).value_counts().to_dict()
        
        # Calculate "compliance score" based on policy category coverage
        category_scores = {}
        for model in df['model'].unique():
            model_chunks = df[df['model'] == model]
            model_categories = []
            for cats in model_chunks['policyCategories']:
                if isinstance(cats, list):
                    model_categories.extend(cats)
            
            # Score = percentage of expected categories covered
            unique_cats = set(model_categories)
            coverage = len(unique_cats) / len(self.policy_categories) * 100
            category_scores[model] = {
                'coverage_percent': round(coverage, 1),
                'categories_found': list(unique_cats),
                'missing_categories': list(set(self.policy_categories) - unique_cats)
            }
        
        metrics['model_compliance'] = category_scores
        
        return metrics
    
    def save_data(self, df, metrics):
        """Save extracted data and metrics"""
        output_dir = 'data_analysis/outputs'
        os.makedirs(output_dir, exist_ok=True)
        
        # Save raw data
        csv_path = f'{output_dir}/scraped_data.csv'
        df.to_csv(csv_path, index=False)
        print(f"\n💾 Saved raw data to: {csv_path}")
        
        # Save metrics
        json_path = f'{output_dir}/compliance_metrics.json'
        with open(json_path, 'w') as f:
            json.dump(metrics, f, indent=2)
        print(f"💾 Saved metrics to: {json_path}")
        
        return csv_path, json_path

def main():
    print("=" * 60)
    print("POLICY SENTINEL - DATA EXTRACTION ENGINE")
    print("=" * 60)
    
    extractor = DataExtractor()
    
    # Extract all data
    df = extractor.extract_all_data()
    
    if df is None or len(df) == 0:
        print("\n❌ No data found. Please run the scraper first:")
        print("   npm start")
        sys.exit(1)
    
    # Generate metrics
    print("\n📊 Calculating compliance metrics...")
    metrics = extractor.generate_compliance_metrics(df)
    
    # Save everything
    csv_path, json_path = extractor.save_data(df, metrics)
    
    # Print summary
    print("\n" + "=" * 60)
    print("EXTRACTION SUMMARY")
    print("=" * 60)
    print(f"Total Chunks: {metrics['total_chunks']}")
    print(f"Companies: {metrics['unique_companies']}")
    print(f"Models: {metrics['unique_models']}")
    print(f"Embedding Coverage: {metrics['embedding_coverage']:.1f}%")
    print("\nTop Companies by Volume:")
    for company, count in sorted(metrics['companies'].items(), key=lambda x: x[1], reverse=True)[:5]:
        print(f"   {company}: {count} chunks")
    
    print("\n✅ Data extraction complete! Ready for analysis.")
    print(f"\nNext step: Open the Jupyter notebook:")
    print(f"   data_analysis/compliance_analysis.ipynb")

if __name__ == '__main__':
    main()
