
from __future__ import annotations

import uuid
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from pydantic import BaseModel

from ..dependencies.auth import get_current_user
from ..models import User
from ..services.s3_service import S3Service

router = APIRouter(prefix="/upload", tags=["upload"])

# Configuration
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
}


class UploadResponse(BaseModel):
    """Response model for file upload"""
    url: str
    filename: str
    size: int


def validate_image_file(file: UploadFile) -> None:
    """Validate uploaded image file"""
    # Check content type
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_CONTENT_TYPES)}",
        )

    # Check file extension
    if file.filename:
        ext = Path(file.filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file extension. Allowed extensions: {', '.join(ALLOWED_EXTENSIONS)}",
            )


@router.post("/avatar", response_model=UploadResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Upload user avatar image to S3.
    """
    validate_image_file(file)
    content = await file.read()
    file_size = len(content)

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE / (1024 * 1024):.1f}MB",
        )

    try:
        filename = f"avatars/avatar_{current_user.id}_{uuid.uuid4()}{Path(file.filename).suffix}"
        
        # Use S3Service
        url = await S3Service.upload_file(
            file.file,
            filename=filename,
            content_type=file.content_type
        )
        
        if not url:
             raise Exception("Upload failed")

        return UploadResponse(
            url=url,
            filename=filename,
            size=file_size,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload to S3: {str(e)}",
        )


@router.post("/banner", response_model=UploadResponse)
async def upload_banner(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Upload user banner/cover image to S3.
    """
    validate_image_file(file)
    content = await file.read()
    file_size = len(content)

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE / (1024 * 1024):.1f}MB",
        )

    try:
        filename = f"banners/banner_{current_user.id}_{uuid.uuid4()}{Path(file.filename).suffix}"
        
        url = await S3Service.upload_file(
            file.file,
            filename=filename,
            content_type=file.content_type
        )
        
        if not url:
             raise Exception("Upload failed")
             
        return UploadResponse(
            url=url,
            filename=filename,
            size=file_size,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload to S3: {str(e)}",
        )

@router.post("/media", response_model=UploadResponse)
async def upload_media(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Upload media file (image/video) to S3 for Pulse posts.
    """
    # Validate file type (allow videos too)
    ALLOWED_MEDIA_TYPES = {
        "image/jpeg", "image/png", "image/webp", "image/gif",
        "video/mp4", "video/webm", "video/quicktime"
    }
    if file.content_type not in ALLOWED_MEDIA_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_MEDIA_TYPES)}",
        )

    # Check file size (10MB limit for media)
    MAX_MEDIA_SIZE = 10 * 1024 * 1024
    content = await file.read()
    file_size = len(content)
    
    if file_size > MAX_MEDIA_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size is {MAX_MEDIA_SIZE / (1024 * 1024):.1f}MB",
        )

    try:
        # Determine folder based on type
        folder = "pulse_videos" if file.content_type.startswith("video/") else "pulse_images"
        filename = f"{folder}/media_{current_user.id}_{uuid.uuid4()}{Path(file.filename).suffix}"
        
        url = await S3Service.upload_file(
            file.file,
            filename=filename,
            content_type=file.content_type
        )
        
        if not url:
             raise Exception("Upload failed")

        return UploadResponse(
            url=url,
            filename=filename,
            size=file_size,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload to S3: {str(e)}",
        )
