# AWS Deployment Guide

Complete deployment documentation for the Movie Madders application using AWS services.

## 📁 Documentation Files

- **[RDS_SETUP.md](RDS_SETUP.md)** ⭐ - AWS RDS PostgreSQL database setup
- **[EC2_SETUP.md](EC2_SETUP.md)** - Backend deployment on AWS EC2
- **[S3_SETUP.md](S3_SETUP.md)** - AWS S3 for media storage
- **[AMPLIFY_SETUP.md](AMPLIFY_SETUP.md)** - Frontend deployment on AWS Amplify
- **[SECURITY_CONFIG.md](SECURITY_CONFIG.md)** - Security groups, IAM policies, and best practices
- **[env.example](env.example)** - Environment variables template
- **[VERCEL_SETUP.md](VERCEL_SETUP.md)** - Alternative: Deploy frontend to Vercel (optional)

---

## 🚀 Deployment Order

Follow these guides in this exact order:

### 1️⃣ **S3 Setup** (15 minutes)

Create your S3 bucket for media uploads.

- Create bucket
- Create IAM user
- Get access keys
- [Start here →](S3_SETUP.md)

### 2️⃣ **RDS Setup** (20 minutes)

Set up PostgreSQL database.

- Create security group
- Launch RDS instance
- Get connection endpoint
- [Start here →](RDS_SETUP.md)

### 3️⃣ **EC2 Setup** (30 minutes)

Deploy your Dockerized backend.

- Launch EC2 instance
- Install Docker
- Deploy backend container
- [Start here →](EC2_SETUP.md)

### 4️⃣ **Amplify Setup** (15 minutes)

Deploy your Next.js frontend.

- Connect GitHub
- Configure build
- Get Amplify URL
- Update CORS
- [Start here →](AMPLIFY_SETUP.md)

**Total time**: ~1.5 hours for complete deployment 🎯

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                        INTERNET                          │
└──────────────┬───────────────────────────────────────────┘
               │
               │
    ┌──────────▼──────────┐
    │   AWS Amplify       │  ← Frontend (Next.js)
    │                     │    • Auto-deploy from GitHub
    │   Port: HTTPS/443   │    • Free: 1000 build min/month
    └──────────┬──────────┘    • 15 GB served/month
               │
               │ HTTP/S API Calls
               │
    ┌──────────▼──────────┐
    │   AWS EC2           │  ← Backend (FastAPI + Docker)
    │   (t2.micro)        │    • Security Group: movie-madders-backend-sg
    │                     │    • Free: 750 hours/month
    │   Port: 8000        │    • Ports: 22, 80, 443, 8000
    └──────────┬──────────┘
               │
               ├──────────────┐
               │              │
    ┌──────────▼──────────┐  │
    │   AWS RDS           │  │  ← Database (PostgreSQL)
    │   (t3.micro)        │  │    • Security Group: movie-madders-rds-sg
    │                     │  │    • Free: 750 hours/month
    │   Port: 5432        │  │    • 20 GB storage
    └─────────────────────┘  │    • Private (EC2 only access)
                             │
                  ┌──────────▼──────────┐
                  │   AWS S3            │  ← Media Storage
                  │                     │    • Bucket: movie-madders-assets
                  │   IAM: s3-user      │    • Free: 5 GB storage
                  └─────────────────────┘    • 15 GB transfer/month
```

---

## 💰 Free Tier Summary

All services are in the **AWS Free Tier** for the first 12 months:

| Service     | Free Tier Limit         | Monthly Cost After |
| ----------- | ----------------------- | ------------------ |
| **EC2**     | 750 hours (t2.micro)    | ~$10               |
| **RDS**     | 750 hours (t3.micro)    | ~$15               |
| **S3**      | 5 GB + 15 GB transfer   | ~$0.50             |
| **Amplify** | 1000 build mins + 15 GB | ~$1-5              |
| **Total**   | **$0/month**            | **~$25-30/month**  |

**Note**: 750 hours = 31.25 days, so one instance running 24/7 is completely free!

---

## 🔒 Security Components

### Security Groups Created:

1. **movie-madders-backend-sg** (EC2)
   - Ports: 22 (SSH), 80 (HTTP), 443 (HTTPS), 8000 (FastAPI)
2. **movie-madders-rds-sg** (RDS)
   - Port: 5432 (PostgreSQL) - EC2 only

### IAM Users Created:

1. **movie-madders-s3-user** (S3 uploads)
   - Policy: CustomS3UploadPolicy

See [SECURITY_CONFIG.md](SECURITY_CONFIG.md) for complete details.

---

## 📝 Environment Variables

Copy [env.example](env.example) to create your `.env` file:

```bash
# On EC2
cd ~/backend
cp /path/to/env.example .env
nano .env
```

Required variables:

- `DATABASE_URL` - RDS endpoint
- `AWS_ACCESS_KEY_ID` - S3 user credentials
- `AWS_SECRET_ACCESS_KEY` - S3 user credentials
- `S3_BUCKET_NAME` - Your S3 bucket
- `CORS_ORIGINS` - Your Amplify URL

---

## ✅ Deployment Checklist

### Before You Start:

- [ ] AWS account created
- [ ] GitHub repository pushed
- [ ] Free tier eligibility confirmed

### Infrastructure:

- [ ] S3 bucket created & IAM user configured
- [ ] RDS instance created & security group configured
- [ ] EC2 instance launched & Docker installed
- [ ] Backend deployed & running
- [ ] RDS migrations completed

### Frontend:

- [ ] Amplify app connected to GitHub
- [ ] Build settings configured
- [ ] Environment variables set
- [ ] First deployment successful

### Final Steps:

- [ ] Backend CORS updated with Amplify URL
- [ ] Test end-to-end functionality
- [ ] Monitor AWS Free Tier usage
- [ ] Set up billing alerts (recommended)

---

## 🎯 Quick Start (If You're Experienced)

1. **S3**: Create bucket → IAM user → Get keys
2. **RDS**: Create `movie-madders-rds-sg` → Launch db.t3.micro → Get endpoint
3. **EC2**: Create `movie-madders-backend-sg` → Launch t2.micro → Install Docker → Deploy
4. **Amplify**: Connect GitHub → Configure build → Deploy
5. **CORS**: Update backend with Amplify URL

**Done in 1 hour!** ⚡

---

## 🆘 Troubleshooting

### Can't connect to RDS

- Check security group allows EC2
- Verify both in same VPC
- Test with `psql` client

### Backend returns CORS errors

- Update `CORS_ORIGINS` in `.env`
- Restart backend: `docker compose restart`

### Amplify build fails

- Check build settings have `cd frontend`
- Verify `package.json` exists in frontend/
- Check build logs in Amplify console

See individual guides for detailed troubleshooting.

---

## 📞 Support

- **AWS Documentation**: https://docs.aws.amazon.com/
- **Amplify Docs**: https://docs.amplify.aws/
- **RDS Docs**: https://docs.aws.amazon.com/rds/

---

## 🎉 You're Ready!

Start with [S3_SETUP.md](S3_SETUP.md) and work through each guide.

Good luck with your deployment! 🚀
