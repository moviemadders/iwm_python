# Vercel Deployment Guide

This guide walks you through deploying the "Movie Madders" frontend to Vercel.

## Prerequisites

- Vercel Account
- GitHub Repository (pushed with latest changes)

## Step 1: Push Code to GitHub

Ensure your latest code, including the `backend` Docker changes and `frontend` updates, is pushed to your GitHub repository.

## Step 2: Import Project in Vercel

1.  Log in to your Vercel Dashboard.
2.  Click **Add New...** -> **Project**.
3.  Select your GitHub repository (`movie-madders` or similar).
4.  Click **Import**.

## Step 3: Configure Project

1.  **Framework Preset**: Vercel should auto-detect **Next.js**.
2.  **Root Directory**: Click **Edit** and select `frontend`. This is crucial because your Next.js app is in a subdirectory.
3.  **Environment Variables**:
    Add the following variables:
    - `NEXT_PUBLIC_API_URL`: `http://<YOUR_EC2_IP>:8000` (or your domain if you set one up).

## Step 4: Deploy

1.  Click **Deploy**.
2.  Vercel will build your application.
3.  Once done, you will get a production URL (e.g., `https://movie-madders.vercel.app`).

## Step 5: Update Backend CORS

1.  Copy your new Vercel URL.
2.  SSH into your AWS EC2 instance.
3.  Edit the `.env` file in `backend`:
    ```bash
    nano .env
    ```
4.  Update `CORS_ORIGINS`:
    ```
    CORS_ORIGINS=["https://movie-madders.vercel.app"]
    ```
5.  Restart the backend:
    ```bash
    docker compose down
    docker compose up -d
    ```
