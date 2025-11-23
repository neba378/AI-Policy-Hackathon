# 🚀 Quick Deploy to Railway (5 minutes)

## Step 1: Prepare Your Project

```bash
cd c:\Users\hp\Desktop\Study\Projects\StartUp\MIT_2
```

## Step 2: Install Railway CLI

```bash
npm install -g @railway/cli
```

## Step 3: Login to Railway

```bash
railway login
```

This will open your browser. Sign up/login with GitHub.

## Step 4: Initialize Railway Project

```bash
railway init
```

Select "Create a new project" and give it a name like `policy-sentinel`

## Step 5: Set Environment Variables

```bash
# Set MongoDB URI (use MongoDB Atlas)
railway variables set MONGODB_URI=mongodb+srv://your-connection-string

# Set Groq API Key
railway variables set GROQ_API_KEY=your_groq_api_key

# Set Port
railway variables set PORT=8000
```

Or set them via Railway Dashboard at railway.app

## Step 6: Deploy

```bash
railway up
```

This will:

1. Upload your code
2. Install dependencies from `requirements.txt`
3. Start the server using `Procfile`
4. Give you a URL like `policy-sentinel.railway.app`

## Step 7: Verify Deployment

Your backend will be live at: `https://your-project.railway.app`

Test endpoints:

- Health: `https://your-project.railway.app/health`
- API Docs: `https://your-project.railway.app/docs`
- Models: `https://your-project.railway.app/api/models`

## Step 8: Get Your Backend URL

```bash
railway domain
```

Copy this URL - you'll need it for frontend deployment.

## Important: MongoDB Atlas Setup

1. Go to mongodb.com/cloud/atlas
2. Create free cluster
3. Create database user
4. Network Access → Add IP: `0.0.0.0/0` (allows all - for Railway)
5. Get connection string
6. Update Railway environment variable

## Troubleshooting

**Deployment failed:**

```bash
railway logs
```

**Need to redeploy:**

```bash
railway up
```

**View all projects:**

```bash
railway list
```

**Open project dashboard:**

```bash
railway open
```

## Next: Deploy Frontend

Once backend is deployed:

1. Copy your Railway URL
2. Update `frontend/.env`:
   ```env
   VITE_API_URL=https://your-project.railway.app
   ```
3. Deploy frontend to Vercel:
   ```bash
   cd frontend
   vercel --prod
   ```

## Cost

- Railway: Free tier includes 500 hours/month
- MongoDB Atlas: Free tier (512MB storage)
- Groq API: Free tier available

---

**You're now deployed!** 🎉

Access your backend at the Railway URL and start auditing policies!
