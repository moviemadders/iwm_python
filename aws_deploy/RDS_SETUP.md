# AWS RDS PostgreSQL Setup Guide

This guide shows you how to set up Amazon RDS PostgreSQL for the Movie Madders backend.

## 📋 What We'll Create

1. **RDS PostgreSQL Database** (Free Tier)
2. **Security Group** for RDS (allows EC2 to connect)
3. **IAM User** for RDS management (optional)

---

## Step 1: Create RDS Security Group

Security groups control who can access your database.

### 1.1 Navigate to Security Groups

1. AWS Console → **EC2** → **Security Groups** (left sidebar)
2. Click **Create security group**

### 1.2 Configure Security Group

- **Name**: `movie-madders-rds-sg`
- **Description**: `Security group for Movie Madders RDS PostgreSQL`
- **VPC**: Select your default VPC

### 1.3 Add Inbound Rules

Click **Add rule**:

- **Type**: PostgreSQL
- **Protocol**: TCP
- **Port**: 5432
- **Source**: Custom → Select the **EC2 security group** (movie-madders-backend-sg)
  - This ensures ONLY your EC2 instance can access the database

### 1.4 Outbound Rules

Leave default (Allow all outbound traffic)

Click **Create security group**

---

## Step 2: Create RDS PostgreSQL Database

### 2.1 Navigate to RDS

1. AWS Console → **RDS**
2. Click **Create database**

### 2.2 Database Creation Method

- Select **Standard create**

### 2.3 Engine Options

- **Engine type**: PostgreSQL
- **Version**: PostgreSQL 15.x (or latest)

### 2.4 Templates

- Select **Free tier** ✅

### 2.5 Settings

- **DB instance identifier**: `movie-madders-db`
- **Master username**: `postgres`
- **Master password**: `YourSecurePassword123!` (SAVE THIS!)
- **Confirm password**: Re-enter password

### 2.6 Instance Configuration

- **DB instance class**: db.t3.micro (Free tier eligible) - Auto-selected

### 2.7 Storage

- **Storage type**: General Purpose SSD (gp2)
- **Allocated storage**: 20 GB (Free tier limit)
- ❌ **Uncheck** "Enable storage autoscaling" (to stay in free tier)

### 2.8 Connectivity

- **VPC**: Default VPC
- **Subnet group**: default
- **Public access**: **No** ⚠️ (Keep database private)
- **VPC security group**:
  - Remove default
  - Select **movie-madders-rds-sg** (the one we created)

### 2.9 Database Authentication

- Select **Password authentication**

### 2.10 Additional Configuration

Click **Additional configuration** to expand:

- **Initial database name**: `moviemadders` ✅ (Important!)
- **Backup retention**: 7 days (Free tier allows up to 7 days)
- ❌ **Uncheck** "Enable encryption" (not needed for free tier)
- ✅ **Check** "Enable automated backups"

### 2.11 Create Database

- Review settings
- Click **Create database**
- ⏳ Wait 5-10 minutes for database to be created

---

## Step 3: Get Database Connection Details

### 3.1 Find Your Database

1. Go to **RDS** → **Databases**
2. Click on `movie-madders-db`

### 3.2 Copy Endpoint

Under **Connectivity & security**:

- **Endpoint**: `movie-madders-db.xxxxxxxxx.us-east-1.rds.amazonaws.com`
- **Port**: 5432

**SAVE THIS ENDPOINT!** You'll need it for the backend.

---

## Step 4: Configure Backend Connection

### 4.1 Update .env File

On your EC2 instance (or locally for testing):

```bash
DATABASE_URL=postgresql+asyncpg://postgres:YourSecurePassword123!@movie-madders-db.xxxxxxxxx.us-east-1.rds.amazonaws.com:5432/moviemadders
```

Replace:

- `YourSecurePassword123!` with your actual password
- `movie-madders-db.xxxxxxxxx.us-east-1.rds.amazonaws.com` with your actual endpoint

### 4.2 Test Connection

From your EC2 instance, install PostgreSQL client:

```bash
sudo apt-get install postgresql-client
```

Test connection:

```bash
psql -h movie-madders-db.xxxxxxxxx.us-east-1.rds.amazonaws.com -U postgres -d moviemadders
```

Enter your password when prompted.

If successful, you'll see:

```
moviemadders=>
```

Type `\q` to exit.

---

## Step 5: Run Database Migrations

On your EC2 instance:

```bash
cd ~/backend
# Make sure virtual environment is activated or use Docker
docker compose run backend alembic upgrade head
```

This creates all your tables in RDS.

---

## 🔒 Security Best Practices

### ✅ What We Did Right

- ✅ Database is **NOT publicly accessible**
- ✅ Security group only allows EC2 to connect
- ✅ Password authentication enabled
- ✅ Automated backups enabled

### 🚨 Important Security Notes

1. **Never commit .env files** with passwords to Git
2. **Use strong passwords** (at least 16 characters)
3. **Rotate passwords** every 90 days
4. **Monitor RDS logs** in CloudWatch

---

## 📊 Free Tier Limits

| Resource           | Free Tier Limit            |
| ------------------ | -------------------------- |
| **Instance Hours** | 750 hours/month (t3.micro) |
| **Storage**        | 20 GB                      |
| **Backup Storage** | 20 GB                      |
| **Data Transfer**  | Free within same region    |

**⚠️ Important**: 750 hours = 31.25 days, so one instance running 24/7 is FREE for 12 months!

---

## 🔧 Common Issues

### Issue: Can't connect from EC2

**Solution**:

1. Check RDS security group allows EC2 security group
2. Verify EC2 and RDS are in same VPC
3. Check DATABASE_URL format

### Issue: "database does not exist"

**Solution**:

1. Ensure you created initial database during RDS setup
2. Check database name in connection string

### Issue: Authentication failed

**Solution**:

1. Verify password is correct
2. Check username is `postgres`

---

## 🎯 Next Steps

1. ✅ RDS is created
2. Update EC2 backend to use RDS
3. Run migrations
4. Test your application

Your database is now production-ready! 🚀
