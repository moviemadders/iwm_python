import boto3
from botocore.exceptions import NoCredentialsError
from src.config import settings
import asyncio
from functools import partial

class S3Service:
    _s3_client = None

    @classmethod
    def get_client(cls):
        if cls._s3_client is None:
            if settings.aws_access_key_id and settings.aws_secret_access_key:
                cls._s3_client = boto3.client(
                    's3',
                    aws_access_key_id=settings.aws_access_key_id,
                    aws_secret_access_key=settings.aws_secret_access_key,
                    region_name=settings.aws_region
                )
            else:
                # Fallback to environment variables or IAM role
                cls._s3_client = boto3.client('s3', region_name=settings.aws_region)
        return cls._s3_client

    @staticmethod
    async def upload_file(file_content, filename: str, content_type: str = None):
        """
        Uploads a file to S3.
        
        Args:
            file_content: The file content (bytes or file-like object).
            filename: The destination key (path) in the bucket.
            content_type: The MIME type of the file.
            
        Returns:
            str: The public URL of the uploaded file.
        """
        s3 = S3Service.get_client()
        bucket = settings.s3_bucket_name
        
        if not bucket:
            raise ValueError("S3_BUCKET_NAME is not configured")

        extra_args = {}
        if content_type:
            extra_args['ContentType'] = content_type
            # Optional: Set ACL to public-read if the bucket allows it, 
            # but usually better to use bucket policy or CloudFront.
            # extra_args['ACL'] = 'public-read' 

        try:
            # Run the synchronous boto3 upload in a thread pool
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                partial(
                    s3.upload_fileobj,
                    file_content,
                    bucket,
                    filename,
                    ExtraArgs=extra_args
                )
            )
            
            # Construct the URL
            # Assuming standard S3 URL format. If using CloudFront, this would be different.
            url = f"https://{bucket}.s3.{settings.aws_region}.amazonaws.com/{filename}"
            return url
            
        except NoCredentialsError:
            print("Credentials not available")
            return None
        except Exception as e:
            print(f"Error uploading to S3: {e}")
            return None
