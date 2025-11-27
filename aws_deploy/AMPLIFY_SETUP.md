# AWS Amplify Frontend Deployment Guide

Deploy your Movie Madders frontend to AWS Amplify (alternative to Vercel).

## 📋 Prerequisites

- AWS Account
- GitHub repository with latest code pushed

---

## Step 1: Create Amplify App

### 1.1 Navigate to AWS Amplify

1. AWS Console → Search for "Amplify"
2. Click **Get Started** under "Amplify Hosting"

### 1.2 Connect to GitHub

1. Select **GitHub** as your repository service
2. Click **Continue**
3. Authorize AWS Amplify to access your GitHub account
4. Select your repository: `movie-madders` (or your repo name)
5. Select branch: `main`
6. Click **Next**

---

## Step 2: Configure Build Settings

### 2.1 App Name

- **App name**: `movie-madders-frontend`

### 2.2 Build Settings

Amplify should auto-detect Next.js. The build settings should look like:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: frontend/.next
    files:
      - "**/*"
  cache:
    paths:
      - frontend/node_modules/**/*
```

**⚠️ Important**: Since your Next.js app is in a subdirectory, make sure:

- All commands have `cd frontend` first
- `baseDirectory` is `frontend/.next`
- Cache path includes `frontend/`

### 2.3 Advanced Settings

Click **Advanced settings** to expand:

#### Environment Variables

Add these variables:

| Variable              | Value                       |
| --------------------- | --------------------------- |
| `NEXT_PUBLIC_API_URL` | `http://<YOUR_EC2_IP>:8000` |

**Note**: Replace `<YOUR_EC2_IP>` with your actual EC2 public IP.

You'll update this to HTTPS with a domain later.

---

## Step 3: Deploy

1. Click **Next**
2. Review settings
3. Click **Save and deploy**
4. ⏳ Wait 5-10 minutes for first build

---

## Step 4: Get Your URL

Once deployed:

1. You'll see a URL like: `https://main.d1234abcd5678.amplifyapp.com`
2. **Copy this URL** - you'll need it for backend CORS

---

## Step 5: Update Backend CORS

### 5.1 SSH into EC2

```bash
ssh -i "movie-madders-key.pem" ubuntu@<EC2_IP>
```

### 5.2 Update .env

```bash
cd ~/backend
nano .env
```

Update `CORS_ORIGINS`:

```
CORS_ORIGINS=["https://main.d1234abcd5678.amplifyapp.com"]
```

(Replace with your actual Amplify URL)

Save: `Ctrl+O`, `Enter`, `Ctrl+X`

### 5.3 Restart Backend

```bash
docker compose down
docker compose up -d
```

---

## Step 6: Test Your App

1. Visit your Amplify URL
2. Try logging in, browsing movies, etc.
3. Check that API calls work

---

## 🔧 Automatic Deployments

Every time you push to the `main` branch on GitHub, Amplify will:

1. Automatically build your app
2. Deploy the new version
3. You'll see the build progress in AWS Amplify console

---

## 🌐 Custom Domain (Optional)

### Option A: Use an Amplify Subdomain

1. Amplify Console → App settings → Domain management
2. Click **Add domain**
3. Enter your domain (e.g., `example.com`)
4. Amplify will guide you through DNS setup

### Option B: Keep the Amplify Default URL

The default `*.amplifyapp.com` URL works great and already has HTTPS!

---

## 📊 Free Tier Limits

| Resource          | Free Tier   |
| ----------------- | ----------- |
| **Build minutes** | 1,000/month |
| **Data served**   | 15 GB/month |
| **Requests**      | Unlimited   |

**Note**: After free tier:

- $0.01 per build minute
- $0.15 per GB served

For a small app, you'll likely stay within free tier! ✅

---

## 🔄 Rollback (if needed)

If a deployment breaks:

1. Amplify Console → Your app
2. Click on a previous successful deployment
3. Click **Redeploy this version**

---

## 🎯 Next Steps

1. ✅ Frontend deployed to Amplify
2. Update backend CORS with Amplify URL
3. Test end-to-end functionality
4. (Optional) Set up custom domain

Your frontend is now live! 🚀
