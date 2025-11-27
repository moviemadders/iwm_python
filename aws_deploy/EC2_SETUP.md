# AWS EC2 Setup & Deployment Guide

This guide walks you through deploying the "Movie Madders" backend to an AWS EC2 instance using Docker.

## Prerequisites

- AWS Account
- SSH Client (Terminal/PowerShell)

## Step 1: Launch an EC2 Instance

1.  **Login to AWS Console** and navigate to **EC2**.
2.  Click **Launch Instance**.
3.  **Name**: `movie-madders-backend`
4.  **OS Image**: **Ubuntu Server 24.04 LTS** (Free Tier eligible).
5.  **Instance Type**: `t2.micro` or `t3.micro` (Free Tier eligible).
6.  **Key Pair**: Create a new key pair (e.g., `movie-madders-key`). **Download the .pem file and keep it safe!**
7.  **Network Settings**:
    - Create security group.
    - Allow SSH traffic from **My IP**.
    - Allow HTTP traffic from the internet.
    - Allow HTTPS traffic from the internet.
    - **Custom TCP**: Add a rule for port `8000` (Source: `0.0.0.0/0` or `Anywhere`).
8.  Click **Launch Instance**.

## Step 2: Connect to Your Instance

1.  Open your terminal/PowerShell.
2.  Navigate to where you saved your `.pem` key.
3.  Connect via SSH:
    ```bash
    ssh -i "movie-madders-key.pem" ubuntu@<YOUR_EC2_PUBLIC_IP>
    ```
    _(Note: On Windows, you might need to adjust permissions for the key file if using WSL/Linux, but PowerShell usually handles it fine.)_

## Step 3: Install Docker on EC2

Run the following commands on your EC2 instance:

```bash
# Update packages
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add the repository to Apt sources
echo \
  "deb [arch=\"$(dpkg --print-architecture)\" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add ubuntu user to docker group (so you don't need sudo for docker commands)
sudo usermod -aG docker ubuntu
```

**Logout and log back in** for the group change to take effect.

## Step 4: Deploy the Application

1.  **Clone your repository** (or copy files). Since this is a private project, you might want to use a Personal Access Token (PAT) or just copy the `backend` folder using `scp`.

    **Option A: Copy files using SCP (from your local machine)**

    ```powershell
    # Run this from your local machine
    scp -i "movie-madders-key.pem" -r "path/to/backend" ubuntu@<EC2_IP>:~/backend
    ```

2.  **Create `.env` file on EC2**:

    ```bash
    cd ~/backend
    nano .env
    ```

    Paste your production environment variables here. Make sure to set:

    - `DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/moviemadders` (if using the docker-compose DB)
    - `AWS_ACCESS_KEY_ID=...`
    - `AWS_SECRET_ACCESS_KEY=...`
    - `AWS_REGION=us-east-1`
    - `S3_BUCKET_NAME=...`
    - `CORS_ORIGINS=["https://your-vercel-app.vercel.app"]` (Update this after deploying frontend)

3.  **Start the application**:

    ```bash
    docker compose up -d --build
    ```

4.  **Verify**:
    Visit `http://<EC2_PUBLIC_IP>:8000/docs` in your browser. You should see the Swagger UI.

## Step 5: (Optional but Recommended) Setup Nginx & SSL

For a real production app, you should use a domain name and HTTPS.

1.  Install Nginx: `sudo apt install nginx`
2.  Configure Nginx to proxy requests to `localhost:8000`.
3.  Use Certbot to get a free SSL certificate.
