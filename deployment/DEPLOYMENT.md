# Deployment Guide - Policy Sentinel

## 🚀 Backend Deployment

### Option 1: Railway / Render / Heroku

#### 1. Prepare for Deployment

Create `Procfile`:

```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Create `runtime.txt`:

```
python-3.11
```

#### 2. Environment Variables

Set these in your deployment platform:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
GROQ_API_KEY=your_groq_api_key
PORT=8000
```

#### 3. Deploy

**Railway:**

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

**Render:**

1. Connect your GitHub repository
2. Select "Web Service"
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Option 2: Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:

```bash
docker build -t policy-sentinel-backend .
docker run -p 8000:8000 --env-file .env policy-sentinel-backend
```

### Option 3: AWS EC2

```bash
# SSH into EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Python and dependencies
sudo apt update
sudo apt install python3-pip python3-venv nginx

# Clone repository
git clone your-repo-url
cd MIT_2

# Create virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Install PM2 for process management
sudo npm install -g pm2

# Create ecosystem.config.js
pm2 start "uvicorn app.main:app --host 0.0.0.0 --port 8000" --name policy-sentinel

# Configure Nginx
sudo nano /etc/nginx/sites-available/policy-sentinel
```

Nginx config:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site and restart Nginx
sudo ln -s /etc/nginx/sites-available/policy-sentinel /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🎨 Frontend Deployment

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod
```

Environment variables in Vercel:

```env
VITE_API_URL=https://your-backend-url.com
```

### Option 2: Netlify

```bash
# Build the frontend
cd frontend
npm run build

# Deploy via Netlify CLI
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

Create `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Option 3: Static Hosting (S3, GitHub Pages)

```bash
cd frontend
npm run build

# Upload dist/ folder to your hosting service
```

Update environment variables:

- Create `.env.production` with production API URL
- Rebuild: `npm run build`

## 📊 Database Setup

### MongoDB Atlas (Recommended)

1. Create account at mongodb.com/cloud/atlas
2. Create a new cluster (Free tier available)
3. Add database user
4. Whitelist IP addresses (0.0.0.0/0 for all IPs in production - not recommended for security)
5. Get connection string
6. Update `MONGODB_URI` in environment variables

### Local MongoDB (Development)

```bash
# Install MongoDB locally
# Windows: Download from mongodb.com/try/download/community
# Linux: sudo apt install mongodb
# Mac: brew install mongodb-community

# Start MongoDB
mongod --dbpath ./data/db
```

## 🔐 Production Checklist

- [ ] Set strong environment variables
- [ ] Enable CORS only for your frontend domain
- [ ] Set up HTTPS (Let's Encrypt for free SSL)
- [ ] Configure MongoDB Atlas IP whitelist
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Enable rate limiting on API endpoints
- [ ] Set up backup strategy for MongoDB
- [ ] Configure CDN for frontend (CloudFlare)
- [ ] Test all endpoints in production
- [ ] Set up CI/CD pipeline (GitHub Actions)

## 🔍 Health Checks

Add to `app/main.py`:

```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }
```

## 📈 Monitoring

### Backend Monitoring

Install Sentry:

```bash
pip install sentry-sdk[fastapi]
```

Add to `app/main.py`:

```python
import sentry_sdk

sentry_sdk.init(
    dsn="your-sentry-dsn",
    traces_sample_rate=1.0,
)
```

### Frontend Monitoring

Install Sentry:

```bash
npm install @sentry/react
```

Add to `main.tsx`:

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

## 🚦 CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        run: |
          npm i -g @railway/cli
          railway up

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        run: |
          cd frontend
          npm install
          npm run build
          npx vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

## 🎯 Performance Optimization

### Backend

- Enable Gzip compression
- Use Redis for caching (optional)
- Implement connection pooling for MongoDB
- Use async operations where possible

### Frontend

- Enable code splitting
- Lazy load routes
- Optimize images (use WebP)
- Enable CDN caching

## 📞 Support

For deployment issues:

1. Check logs: `railway logs` or platform-specific log viewer
2. Verify environment variables are set correctly
3. Test database connectivity
4. Check CORS configuration

---

**Ready to deploy!** Choose your preferred platform and follow the steps above.
