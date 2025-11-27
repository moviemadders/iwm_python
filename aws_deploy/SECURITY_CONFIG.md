# AWS Security Configuration Guide

This guide documents all AWS security components for the Movie Madders application.

## 📋 Overview

We'll create:

1. **3 Security Groups** (EC2, RDS, optional ALB)
2. **2 IAM Users** (S3 access, optional RDS admin)
3. **IAM Policies** (S3 read/write)

---

## 🔒 Security Groups

### 1. EC2 Backend Security Group

**Name**: `movie-madders-backend-sg`

**Purpose**: Controls access to your EC2 instance (backend server)

#### Inbound Rules:

| Type       | Protocol | Port | Source    | Description                       |
| ---------- | -------- | ---- | --------- | --------------------------------- |
| SSH        | TCP      | 22   | My IP     | Your IP only (for SSH access)     |
| HTTP       | TCP      | 80   | 0.0.0.0/0 | Public access (if using Nginx)    |
| HTTPS      | TCP      | 443  | 0.0.0.0/0 | Public HTTPS (if using Nginx)     |
| Custom TCP | TCP      | 8000 | 0.0.0.0/0 | FastAPI direct access (temporary) |

#### Outbound Rules:

| Type        | Protocol | Port | Destination | Description        |
| ----------- | -------- | ---- | ----------- | ------------------ |
| All traffic | All      | All  | 0.0.0.0/0   | Allow all outbound |

**⚠️ Important**: Change SSH source from "My IP" to your actual IP for security.

---

### 2. RDS Database Security Group

**Name**: `movie-madders-rds-sg`

**Purpose**: Controls access to your RDS PostgreSQL database

#### Inbound Rules:

| Type       | Protocol | Port | Source                   | Description         |
| ---------- | -------- | ---- | ------------------------ | ------------------- |
| PostgreSQL | TCP      | 5432 | movie-madders-backend-sg | ONLY EC2 can access |

**✅ Best Practice**: Source is the EC2 security group, NOT an IP address. This means only your EC2 instance can connect to the database.

#### Outbound Rules:

| Type        | Protocol | Port | Destination | Description        |
| ----------- | -------- | ---- | ----------- | ------------------ |
| All traffic | All      | All  | 0.0.0.0/0   | Allow all outbound |

---

### 3. S3 Bucket Policy (Not a Security Group)

S3 doesn't use security groups. Instead, we use bucket policies and IAM.

**Bucket Policy** (allows public read for uploaded files):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

**To apply**:

1. Go to S3 → Your bucket → Permissions → Bucket policy
2. Paste the above JSON (replace `your-bucket-name`)
3. Save

---

## 👤 IAM Users & Policies

### IAM User 1: S3 Upload User

**Username**: `movie-madders-s3-user`

**Purpose**: Allows backend to upload files to S3

#### Policy: CustomS3UploadPolicy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::your-bucket-name"
    }
  ]
}
```

**How to create**:

1. IAM → Policies → Create policy
2. JSON tab → Paste above (replace `your-bucket-name`)
3. Name: `CustomS3UploadPolicy`
4. Create policy
5. IAM → Users → Create user
6. Username: `movie-madders-s3-user`
7. Attach `CustomS3UploadPolicy`
8. Create access key → Save credentials

---

### IAM User 2: RDS Admin (Optional)

**Username**: `movie-madders-rds-admin`

**Purpose**: Manage RDS from CLI (optional, not needed for application)

**Policy**: AWS managed policy `AmazonRDSFullAccess`

**Note**: Your application doesn't need IAM for RDS. It connects with username/password. This is only for manual RDS management.

---

## 🎯 Security Group Relationships

```
Internet
   │
   ├──> EC2 (movie-madders-backend-sg)
   │     └──> Ports: 22, 80, 443, 8000
   │
EC2 ──────> RDS (movie-madders-rds-sg)
            └──> Port: 5432 (PostgreSQL)

EC2 ──────> S3 (via IAM user credentials)
            └──> Bucket policy allows public read
```

---

## ✅ Security Checklist

### EC2 Security

- [ ] SSH only from your IP
- [ ] Disable root SSH login
- [ ] Use key-based authentication (not password)
- [ ] Keep system updated: `sudo apt update && sudo apt upgrade`
- [ ] Configure firewall (ufw)

### RDS Security

- [ ] NOT publicly accessible
- [ ] Security group allows ONLY EC2
- [ ] Strong password (16+ characters)
- [ ] Automated backups enabled
- [ ] Encryption at rest (optional, not free tier)

### S3 Security

- [ ] Bucket is NOT public (only objects)
- [ ] IAM user has minimal permissions
- [ ] Access keys stored in .env (not in code)
- [ ] CORS configured correctly

### Application Security

- [ ] .env file is in .gitignore
- [ ] JWT secret is random and strong
- [ ] CORS only allows your frontend domain
- [ ] HTTPS enabled (use Nginx + Let's Encrypt)

---

## 🚨 Common Security Mistakes

❌ **DON'T DO THIS**:

- Making RDS publicly accessible
- Allowing SSH from 0.0.0.0/0 (anywhere)
- Hardcoding passwords in code
- Using weak passwords
- Committing .env files to Git

✅ **DO THIS**:

- Keep RDS private
- SSH only from your IP
- Use environment variables
- Use strong, unique passwords
- Use .gitignore for sensitive files

---

## 📊 Summary

| Component | Security Mechanism  | Access Level                 |
| --------- | ------------------- | ---------------------------- |
| **EC2**   | Security Group      | Public (ports 80, 443, 8000) |
| **RDS**   | Security Group      | Private (EC2 only)           |
| **S3**    | Bucket Policy + IAM | Public read, IAM write       |

This setup balances security with functionality for a production application! 🔒
