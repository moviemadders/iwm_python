# AWS S3 Setup Guide

## Step 1: Create an S3 Bucket

1.  Log in to the **AWS Console** and navigate to **S3**.
2.  Click **Create bucket**.
3.  **Bucket name**: Enter a unique name (e.g., `movie-madders-assets-yourname`).
4.  **Region**: Select the same region as your EC2 instance (e.g., `us-east-1`).
5.  **Object Ownership**: Select **ACLs enabled** and **Bucket owner preferred** (This is the easiest way to make objects public for a simple app, though Bucket Policies are more secure).
6.  **Block Public Access settings**: Uncheck **Block all public access**. Acknowledge the warning.
7.  Click **Create bucket**.

## Step 2: Create an IAM User

1.  Navigate to **IAM** in the AWS Console.
2.  Click **Users** -> **Create user**.
3.  **User name**: `movie-madders-s3-user`.
4.  **Permissions**:
    - Select **Attach policies directly**.
    - Search for `AmazonS3FullAccess` (or create a custom policy for just your bucket).
    - Select it and click **Next** -> **Create user**.
5.  Click on the newly created user.
6.  Go to **Security credentials** -> **Create access key**.
7.  Select **Application running outside AWS** (or Local code).
8.  Copy the **Access key ID** and **Secret access key**.

## Step 3: Configure Backend

Update your `.env` file on EC2 (and locally):

```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your_bucket_name
```

## Step 4: Configure CORS (Optional)

If you upload directly from the frontend (not doing that currently), you'd need CORS. Since we upload via backend, this is not strictly required for uploads, but might be needed for _viewing_ if you use advanced features.

1.  Go to your Bucket -> **Permissions** -> **Cross-origin resource sharing (CORS)**.
2.  Edit and paste:
    ```json
    [
      {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": []
      }
    ]
    ```
