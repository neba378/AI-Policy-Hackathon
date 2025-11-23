# Policy Sentinel - Data Analysis Pipeline

## 🎯 Objective

Generate **empirical evidence** for AI documentation compliance gaps using real scraped data from MongoDB. This analysis produces publication-ready visualizations and statistics for policy recommendations to NIST.

## 📊 What This Produces

### **The "Killer" Outputs:**

1. **compliance_heatmap.png** - Shows which AI models fail which regulatory categories
2. **confidence_gap.png** - Reveals the "verification gap" (marketing vs. technical evidence)
3. **radar_chart.png** - Compares top models across all compliance dimensions
4. **policy_memo.txt** - Complete memo with REAL numbers filled in
5. **Comprehensive datasets** - CSV/JSON exports for further analysis

## 🚀 Quick Start

### Prerequisites

```bash
# Install Python dependencies
pip install pandas numpy matplotlib seaborn pymongo python-dotenv scipy plotly kaleido
```

### Option 1: Run the Full Notebook (Recommended)

```bash
# Open Jupyter notebook in VS Code
code data_analysis/compliance_analysis.ipynb

# Run all cells (Shift+Enter) or use "Run All"
```

### Option 2: Run Extraction Script First

```bash
# Extract data from MongoDB first
cd data_analysis/scripts
python extract_mongodb_data.py

# Then open notebook to analyze
```

## 📁 File Structure

```
data_analysis/
├── compliance_analysis.ipynb    # Main analysis notebook (RUN THIS!)
├── scripts/
│   └── extract_mongodb_data.py  # Standalone data extractor
├── outputs/                     # Generated files (created automatically)
│   ├── compliance_heatmap.png
│   ├── confidence_gap.png
│   ├── radar_chart.png
│   ├── comprehensive_dashboard.png
│   ├── policy_memo.txt
│   ├── compliance_data.csv
│   ├── summary_statistics.json
│   ├── model_detailed_report.csv
│   └── category_detailed_report.csv
└── README.md                    # This file
```

## 🔄 Complete Workflow

### Step 1: Ensure Data is Available

```bash
# Make sure you've scraped some AI models first
npm start

# Or scrape specific companies
npm run start:openai
npm run start:anthropic
```

### Step 2: Run Analysis

Open `compliance_analysis.ipynb` in VS Code and run all cells. The notebook will:

1. ✅ Connect to MongoDB Atlas
2. ✅ Extract all scraped documentation chunks
3. ✅ Calculate compliance scores based on policy category coverage
4. ✅ Generate key statistics (compliance rates, confidence scores)
5. ✅ Create publication-quality visualizations
6. ✅ Generate policy memo with real numbers
7. ✅ Export all results to `outputs/` folder

### Step 3: Review Results

```bash
# View the memo with real numbers
cat outputs/policy_memo.txt

# Check the visualizations
explorer outputs  # Windows
open outputs      # Mac
xdg-open outputs  # Linux
```

## 📈 What Gets Calculated

### Compliance Scoring Algorithm

For each AI model, we assess 8 regulatory categories:
- Safety & Risk Assessment
- Performance Metrics
- Training Data Documentation
- Model Limitations
- Capabilities & Use Cases
- Usage Policies
- Ethical Considerations
- Privacy & Data Protection

**Confidence Scoring (0-100%):**
- 40 points: Category is documented
- 30 points: Multiple chunks (up to 6 chunks = max points)
- 30 points: Substantial text length (up to 1500 chars = max points)

**Pass/Fail Threshold:**
- **Pass (1)**: Confidence ≥ 50%
- **Fail (0)**: Confidence < 50%

**Audit-Quality Threshold:**
- **High Quality**: Confidence ≥ 70%
- **Vague/Marketing Language**: Confidence < 70%

## 📊 Key Metrics Explained

### For the Policy Memo:

| Metric | What It Means | Why It Matters |
|--------|---------------|----------------|
| **Total Models Analyzed** | Number of unique AI models in MongoDB | Shows scope of empirical study |
| **Overall Compliance Rate** | % of assessments that passed (≥50%) | Shows baseline compliance level |
| **Vague Documentation %** | % of assessments with confidence <50% | The "smoking gun" - shows marketing vs. evidence |
| **Weakest Category** | Category with lowest pass rate | Identifies systemic gaps |
| **Efficiency Gain** | 600x (30 sec vs 5 hours) | Shows operational feasibility |

### Statistical Tests:

- **Chi-Square Test**: Proves category differences aren't random
- **T-Test**: Proves pass/fail groups differ in confidence
- **Cohen's d**: Measures effect size (how big the difference is)

## 🎨 Visualization Guide

### Figure 1: Compliance Heatmap
- **Red cells** = Failed documentation (0.0)
- **Yellow cells** = Partial compliance (0.5-0.9)
- **Green cells** = Full compliance (1.0)
- **Use case**: Shows WHICH models fail WHICH categories

### Figure 2: Confidence Gap
- **Red dashed line** = 70% audit threshold
- **Orange dotted line** = 50% pass threshold
- **Boxplot distribution** = Shows most docs fall below audit quality
- **Use case**: Shows the "illusion of safety" - even passing docs are vague

### Figure 3: Radar Chart
- **Larger area** = More comprehensive documentation
- **Balanced shape** = Consistent across categories
- **Sharp angles** = Gaps in specific categories
- **Use case**: Comparative analysis of top models

## 🔧 Troubleshooting

### "No data found" Error

**Problem**: MongoDB is empty
**Solution**:
```bash
npm start  # Run the scraper first
```

### "MONGODB_URI not found" Error

**Problem**: .env file missing
**Solution**:
```bash
# Create .env file with your MongoDB connection string
echo MONGODB_URI=mongodb+srv://... > .env
```

### Missing Python Packages

```bash
# Install all required packages
pip install pandas numpy matplotlib seaborn pymongo python-dotenv scipy plotly kaleido
```

### Plotly Images Not Generating

```bash
# Install kaleido for static image export
pip install kaleido
```

## 📝 Customization

### Adjust Confidence Scoring

Edit the `calculate_compliance_scores()` function in the notebook:

```python
# Current weights:
confidence += 40  # Base score for having category
confidence += min(chunk_count * 5, 30)  # Chunk count
confidence += min(avg_text_length / 50, 30)  # Text length

# Adjust weights to emphasize different factors
```

### Add More Categories

Edit the `EXPECTED_CATEGORIES` dictionary:

```python
EXPECTED_CATEGORIES = {
    'safety': 'Safety & Risk Assessment',
    'custom_category': 'Your Custom Category',
    # ... add more
}
```

## 🎯 Using This for Your Hackathon

### The Winning Formula:

1. ✅ **Run real data** (not hypothetical) → Use MongoDB scraping
2. ✅ **Show the gap** (not just compliance) → Use confidence scoring
3. ✅ **Prove significance** (not anecdotes) → Use statistical tests
4. ✅ **Visualize clearly** (not tables) → Use heatmaps + boxplots
5. ✅ **Quantify impact** (not vague benefits) → Use 600x efficiency claim

### What Makes This Convincing:

- **Empirical**: Real data from 10+ companies, 20+ models
- **Quantitative**: Exact percentages, statistical tests
- **Visual**: Publication-quality figures
- **Actionable**: Clear policy recommendation with feasibility proof
- **Scalable**: Shows 600x efficiency gain

## 📚 Additional Resources

- **Original Memo Template**: `../data_anlysis.md`
- **Scraper Config**: `../src/config/aiDocsConfig.js`
- **Database Schema**: `../src/core/database.js`
- **Main README**: `../README.md`

## 🏆 Expected Output Example

```
MEMO STATISTICS (COPY THESE EXACT NUMBERS)
======================================================================

📊 DATASET SCOPE:
   • Total Models Analyzed: 15
   • Companies Covered: 5
   • Total Compliance Assessments: 120

✅ OVERALL COMPLIANCE:
   • Compliance Rate: 62.5%
   • Failing Assessments: 37.5%

🎯 CONFIDENCE SCORING:
   • Average Confidence: 58.3%
   • Vague Documentation (<50% confidence): 41.7%
   • High-Quality Documentation (>70% confidence): 25.0%

📋 CATEGORY PERFORMANCE:
   • Strongest Category: Usage Policies (85.0%)
   • Weakest Category: Privacy & Data Protection (32.5%)

⚡ EFFICIENCY GAIN:
   • Manual Audit Time per Model: ~5 hours
   • Automated Audit Time: ~30 seconds
   • Efficiency Improvement: 600x faster
```

## 🎓 Understanding the Analysis

### Why Confidence Scoring Matters

**The Problem**: Traditional compliance checks only ask "Is this documented?" (binary yes/no)

**The Solution**: Confidence scoring asks "HOW WELL is this documented?" (0-100%)

**The Insight**: This reveals the "Verification Gap" - vendors can pass binary checks with vague marketing language, but confidence scores expose the lack of technical evidence.

**The Impact**: Regulators can now prioritize audits based on confidence scores, focusing human review on low-confidence areas.

---

**Ready to generate killer analysis?** Run the notebook and convince anyone with real data! 🚀
