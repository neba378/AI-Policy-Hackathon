"""
Quick Analysis Runner
Runs the complete analysis pipeline and generates all outputs
"""

import subprocess
import sys
import os

def check_dependencies():
    """Check if required Python packages are installed"""
    required = ['pandas', 'numpy', 'matplotlib', 'seaborn', 'pymongo', 'dotenv', 'scipy', 'plotly']
    missing = []
    
    for package in required:
        try:
            __import__(package)
        except ImportError:
            missing.append(package)
    
    if missing:
        print(f"❌ Missing packages: {', '.join(missing)}")
        print("\n📦 Install with:")
        print(f"   pip install {' '.join(missing)}")
        return False
    
    print("✅ All dependencies installed")
    return True

def run_extraction():
    """Run the data extraction script"""
    print("\n" + "=" * 70)
    print("STEP 1: EXTRACTING DATA FROM MONGODB")
    print("=" * 70)
    
    script_path = os.path.join('data_analysis', 'scripts', 'extract_mongodb_data.py')
    
    try:
        result = subprocess.run([sys.executable, script_path], check=True)
        print("\n✅ Data extraction complete")
        return True
    except subprocess.CalledProcessError:
        print("\n❌ Data extraction failed")
        return False

def run_notebook():
    """Open the Jupyter notebook"""
    print("\n" + "=" * 70)
    print("STEP 2: OPENING ANALYSIS NOTEBOOK")
    print("=" * 70)
    
    notebook_path = os.path.join('data_analysis', 'compliance_analysis.ipynb')
    
    print(f"\n📓 Opening notebook: {notebook_path}")
    print("\n🎯 IN VS CODE:")
    print("   1. Click 'Run All' at the top")
    print("   2. Wait for all cells to execute")
    print("   3. Check 'outputs/' folder for results")
    print("\n" + "=" * 70)
    
    # Try to open in VS Code
    try:
        subprocess.run(['code', notebook_path])
    except:
        print(f"\n💡 Manually open: {notebook_path}")

def main():
    print("=" * 70)
    print("POLICY SENTINEL - ANALYSIS PIPELINE")
    print("=" * 70)
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Run extraction
    if not run_extraction():
        print("\n⚠️  Extraction failed. Ensure MongoDB is populated.")
        print("   Run: npm start")
        choice = input("\n   Continue anyway? (y/n): ")
        if choice.lower() != 'y':
            sys.exit(1)
    
    # Open notebook
    run_notebook()
    
    print("\n✅ Setup complete! Follow the instructions above.")

if __name__ == '__main__':
    main()
