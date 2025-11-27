import cloudinary
import cloudinary.uploader
from src.config import settings

# Configure Cloudinary
if settings.cloudinary_cloud_name:
    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True
    )

class CloudinaryService:
    @staticmethod
    async def upload_image(file_content, folder: str = "movie-madders", resource_type: str = "image"):
        """
        Uploads an image to Cloudinary.
        
        Args:
            file_content: The file content (bytes or file-like object).
            folder: The folder in Cloudinary to upload to.
            resource_type: "image" or "video" or "auto".
            
        Returns:
            dict: The result from Cloudinary, including 'secure_url'.
        """
        try:
            # Run the upload in a thread pool since it's synchronous
            result = await cloudinary.uploader.upload_async(
                file_content,
                folder=folder,
                resource_type=resource_type
            )
            return result
        except Exception as e:
            print(f"Error uploading to Cloudinary: {e}")
            return None

    @staticmethod
    def get_optimized_url(public_id: str, width: int = None, height: int = None):
        """
        Generates an optimized URL for an image.
        """
        transformation = []
        if width:
            transformation.append({'width': width})
        if height:
            transformation.append({'height': height})
            
        return cloudinary.CloudinaryImage(public_id).build_url(transformation=transformation)
