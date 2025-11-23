# Policy Sentinel

**Evidence-Based AI Model Compliance Auditing System**

Policy Sentinel is an automated compliance auditing system that evaluates AI policies against model documentation using RAG (Retrieval-Augmented Generation) and LLM-based analysis.

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Node.js 16+
- MongoDB (local or Atlas)

### Backend Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Start the backend server
uvicorn app.main:app --reload --port 8000
```

Backend will be available at `http://localhost:8000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at `http://localhost:8080`

## 📁 Project Structure

```
MIT_2/
├── app/                    # FastAPI backend application
│   ├── routes/            # API endpoints
│   ├── services/          # Business logic (audit, database, ingestion)
│   ├── schemas.py         # Pydantic models
│   └── main.py            # Application entry point
├── frontend/              # React + Vite frontend
│   └── src/
│       ├── components/    # React components
│       ├── pages/         # Page components
│       └── App.tsx        # Main app component
├── data/
│   ├── model_docs/        # AI model documentation (TXT files)
│   └── chroma_db/         # Vector store database
├── scripts/               # Utility scripts
├── docs/                  # Documentation and guides
└── requirements.txt       # Python dependencies
```

## 🔑 Key Features

- **Automated Policy Auditing**: Upload policy documents and get instant compliance analysis
- **Multi-Model Support**: Compare policies against GPT-4, Claude, Llama, and more
- **Evidence-Based Scoring**: 0-100% confidence scores with source citations
- **Real-time Dashboard**: Track audit history and compliance metrics
- **Excel Export**: Generate detailed compliance reports

## 📊 API Endpoints

- `POST /api/audit` - Upload and audit a policy document
- `GET /api/models` - Get available AI models
- `GET /api/audits` - Get audit history
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/export` - Export results to Excel

## 🛠️ Technology Stack

**Backend:**

- FastAPI
- ChromaDB (Vector Store)
- Groq LLM API
- MongoDB
- LangChain

**Frontend:**

- React + TypeScript
- Vite
- TailwindCSS + shadcn/ui
- TanStack Query

## 📝 Environment Variables

Create a `.env` file in the root directory:

```env
MONGODB_URI=mongodb://localhost:27017/
GROQ_API_KEY=your_groq_api_key_here
```

## 🚢 Deployment

See `deployment/DEPLOYMENT.md` for production deployment instructions.

## 📖 Documentation

- [Deployment Guide](deployment/DEPLOYMENT.md)
- [Hackathon Presentation](docs/PRESENTATION_GUIDE.md)
- [Integration Details](docs/SCRAPER_INTEGRATION.md)

## 📄 License

MIT License

## 🤝 Contributing

This project was developed for the AI Safety Hackathon 2025.

---

**Policy Sentinel** - Making AI compliance auditing 600x faster
