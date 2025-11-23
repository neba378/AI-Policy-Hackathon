# Backend Deployment Checklist

## Pre-Deployment

- [ ] Update `.env` with production values
- [ ] Test all API endpoints locally
- [ ] Run `pip install -r requirements.txt` to verify dependencies
- [ ] Ensure MongoDB is accessible (Atlas recommended)
- [ ] Get Groq API key from console.groq.com
- [ ] Test vector store initialization

## Platform Setup (Choose One)

### Railway

- [ ] Create Railway account
- [ ] Install Railway CLI: `npm i -g @railway/cli`
- [ ] Login: `railway login`
- [ ] Initialize: `railway init`
- [ ] Set environment variables in Railway dashboard
- [ ] Deploy: `railway up`

### Render

- [ ] Create Render account
- [ ] Connect GitHub repository
- [ ] Create new Web Service
- [ ] Set build command: `pip install -r requirements.txt`
- [ ] Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- [ ] Add environment variables
- [ ] Deploy

### Docker

- [ ] Build image: `docker build -t policy-sentinel .`
- [ ] Test locally: `docker run -p 8000:8000 --env-file .env policy-sentinel`
- [ ] Push to registry
- [ ] Deploy to cloud provider

## Environment Variables

Set these in your deployment platform:

```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/
GROQ_API_KEY=gsk_your_api_key
PORT=8000
```

## Post-Deployment

- [ ] Test health endpoint: `GET /health`
- [ ] Test models endpoint: `GET /api/models`
- [ ] Upload test policy document
- [ ] Verify audit results
- [ ] Check dashboard stats
- [ ] Test Excel export
- [ ] Monitor logs for errors
- [ ] Set up monitoring (Sentry recommended)

## Database Setup

### MongoDB Atlas

- [ ] Create free cluster at mongodb.com/cloud/atlas
- [ ] Create database user
- [ ] Whitelist IP addresses (0.0.0.0/0 for development)
- [ ] Get connection string
- [ ] Update MONGODB_URI

## CORS Configuration

Update in `app/main.py` for production:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-domain.com"],  # Update this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Common Issues

**Port already in use:**

- Change PORT in environment variables
- Kill existing process

**MongoDB connection failed:**

- Check connection string format
- Verify network access in Atlas
- Ensure database user has correct permissions

**Vector store initialization failed:**

- Verify `data/model_docs/` contains .txt files
- Check file permissions
- Ensure ChromaDB dependencies installed

**Groq API errors:**

- Verify API key is correct
- Check rate limits
- Ensure sufficient credits

## Monitoring URLs

After deployment, bookmark these:

- Health check: `https://your-domain.com/health`
- API docs: `https://your-domain.com/docs`
- Models list: `https://your-domain.com/api/models`
- Dashboard stats: `https://your-domain.com/api/dashboard/stats`

## Quick Deploy Commands

```bash
# Railway
railway login
railway init
railway up

# Render (via GitHub)
# Just push to main branch and it auto-deploys

# Docker
docker build -t policy-sentinel .
docker run -p 8000:8000 policy-sentinel

# Manual server
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Next Steps

1. Deploy backend first
2. Get backend URL
3. Update frontend VITE_API_URL
4. Deploy frontend
5. Test end-to-end flow

---

**Ready to deploy!** ✅
