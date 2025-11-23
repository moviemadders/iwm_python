"""Critic Hub - Critic Reviews API Router"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field
from typing import List, Optional

from ..db import get_session
from ..repositories.critic_reviews import CriticReviewRepository
from ..repositories.critics import CriticRepository
from ..dependencies.auth import get_current_user
from ..models import User


router = APIRouter(prefix="/critic-reviews", tags=["critic-reviews"])


# --- Pydantic Models ---
class WatchLink(BaseModel):
    platform: str
    url: str
    is_affiliate: bool = False


class CriticReviewCreate(BaseModel):
    movie_id: int
    content: str = Field(..., min_length=100)
    rating_type: Optional[str] = Field(None, max_length=50)
    rating_value: Optional[str] = Field(None, max_length=20)
    numeric_rating: Optional[float] = Field(None, ge=0, le=10)
    title: Optional[str] = Field(None, max_length=500)
    youtube_embed_url: Optional[str] = Field(None, max_length=500)
    image_gallery: Optional[List[str]] = []
    watch_links: Optional[List[WatchLink]] = []
    is_draft: bool = False
    meta_description: Optional[str] = None


class CriticReviewUpdate(BaseModel):
    content: Optional[str] = Field(None, min_length=100)
    rating_type: Optional[str] = Field(None, max_length=50)
    rating_value: Optional[str] = Field(None, max_length=20)
    numeric_rating: Optional[float] = Field(None, ge=0, le=10)
    title: Optional[str] = Field(None, max_length=500)
    youtube_embed_url: Optional[str] = Field(None, max_length=500)
    image_gallery: Optional[List[str]] = None
    watch_links: Optional[List[WatchLink]] = None
    is_draft: Optional[bool] = None
    meta_description: Optional[str] = None


class CriticInfoResponse(BaseModel):
    username: str
    display_name: str
    logo_url: Optional[str]
    is_verified: bool

    class Config:
        from_attributes = True


class MovieInfoResponse(BaseModel):
    id: int
    external_id: str
    title: str
    poster_url: Optional[str]
    year: Optional[str]

    class Config:
        from_attributes = True


class CriticReviewResponse(BaseModel):
    id: int
    external_id: str
    title: Optional[str]
    content: str
    rating_type: Optional[str]
    rating_value: Optional[str]
    numeric_rating: Optional[float]
    youtube_embed_url: Optional[str]
    image_gallery: List[str]
    watch_links: List[dict]
    published_at: str
    updated_at: Optional[str]
    is_draft: bool
    view_count: int
    like_count: int
    comment_count: int
    share_count: int
    slug: str
    meta_description: Optional[str]
    critic: CriticInfoResponse
    movie: MovieInfoResponse

    class Config:
        from_attributes = True


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
    parent_id: Optional[int] = None


class CommentResponse(BaseModel):
    id: int
    external_id: str
    content: str
    like_count: int
    created_at: str
    user_id: int
    parent_id: Optional[int]

    class Config:
        from_attributes = True


# --- Helper Functions ---
def _review_to_response(review) -> CriticReviewResponse:
    """Convert a CriticReview model to CriticReviewResponse"""
    return CriticReviewResponse(
        id=review.id,
        external_id=review.external_id,
        title=review.title,
        content=review.content,
        rating_type=review.rating_type,
        rating_value=review.rating_value,
        numeric_rating=review.numeric_rating,
        youtube_embed_url=review.youtube_embed_url,
        image_gallery=review.image_gallery or [],
        watch_links=review.watch_links or [],
        published_at=review.published_at.isoformat() if review.published_at else None,
        updated_at=review.updated_at.isoformat() if review.updated_at else None,
        is_draft=review.is_draft,
        view_count=review.view_count,
        like_count=review.like_count,
        comment_count=review.comment_count,
        share_count=review.share_count,
        slug=review.slug,
        meta_description=review.meta_description,
        critic=CriticInfoResponse.from_orm(review.critic),
        movie=MovieInfoResponse(
            id=review.movie.id,
            external_id=review.movie.external_id,
            title=review.movie.title,
            poster_url=review.movie.poster_url,
            year=review.movie.year
        )
    )


# --- Endpoints ---
@router.post("", response_model=CriticReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_critic_review(
    review_data: CriticReviewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Create a new critic review (only for verified critics)"""
    try:
        # Check if user has a critic profile
        critic_repo = CriticRepository(db)
        critic = await critic_repo.get_critic_by_user_id(current_user.id)

        if not critic:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is not a verified critic"
            )

        # Create review
        review_repo = CriticReviewRepository(db)
        review = await review_repo.create_review(
            critic_id=critic.id,
            movie_id=review_data.movie_id,
            content=review_data.content,
            rating_type=review_data.rating_type,
            rating_value=review_data.rating_value,
            numeric_rating=review_data.numeric_rating,
            title=review_data.title,
            youtube_embed_url=review_data.youtube_embed_url,
            image_gallery=review_data.image_gallery,
            watch_links=[link.dict() for link in review_data.watch_links] if review_data.watch_links else [],
            is_draft=review_data.is_draft,
            meta_description=review_data.meta_description
        )

        return _review_to_response(review)
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create review: {str(e)}\n{traceback.format_exc()}"
        )


@router.get("/{review_id}", response_model=CriticReviewResponse)
async def get_critic_review(
    review_id: str,
    db: AsyncSession = Depends(get_session)
):
    """Get a critic review by ID or external ID"""
    review_repo = CriticReviewRepository(db)
    
    # Try to get by external_id first
    review = await review_repo.get_review_by_external_id(review_id)
    
    # If not found, try by slug
    if not review:
        review = await review_repo.get_review_by_slug(review_id)
    
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    # Increment view count
    await review_repo.increment_view_count(review.id)

    return _review_to_response(review)


@router.put("/{review_id}", response_model=CriticReviewResponse)
async def update_critic_review(
    review_id: str,
    update_data: CriticReviewUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Update a critic review (only by the review author)"""
    review_repo = CriticReviewRepository(db)
    review = await review_repo.get_review_by_external_id(review_id)
    
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    # Check if current user owns this review
    if review.critic.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this review"
        )
    
    # Update review
    update_dict = update_data.dict(exclude_unset=True)
    if 'watch_links' in update_dict and update_dict['watch_links']:
        update_dict['watch_links'] = [link.dict() if isinstance(link, WatchLink) else link for link in update_dict['watch_links']]
    
    updated_review = await review_repo.update_review(review.id, **update_dict)

    return _review_to_response(updated_review)


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_critic_review(
    review_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Delete a critic review (only by the review author)"""
    review_repo = CriticReviewRepository(db)
    review = await review_repo.get_review_by_external_id(review_id)

    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )

    # Check if current user owns this review
    if review.critic.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this review"
        )

    await review_repo.delete_review(review.id)
    return None


@router.get("/critic/{username}", response_model=List[CriticReviewResponse])
async def list_reviews_by_critic(
    username: str,
    include_drafts: bool = False,
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_session)
):
    """List all reviews by a critic"""
    critic_repo = CriticRepository(db)
    critic = await critic_repo.get_critic_by_username(username)

    if not critic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Critic not found"
        )

    review_repo = CriticReviewRepository(db)
    reviews = await review_repo.list_reviews_by_critic(
        critic.id,
        include_drafts=include_drafts,
        limit=limit,
        offset=offset
    )

    return [_review_to_response(review) for review in reviews]


@router.get("/me", response_model=List[CriticReviewResponse])
async def list_my_reviews(
    status: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """List current user's critic reviews (drafts and published)"""
    # Check if user has a critic profile
    critic_repo = CriticRepository(db)
    critic = await critic_repo.get_critic_by_user_id(current_user.id)

    if not critic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User does not have a critic profile"
        )

    review_repo = CriticReviewRepository(db)

    # Determine include_drafts based on status parameter
    if status == "draft":
        # Only drafts
        reviews = await review_repo.list_reviews_by_critic(
            critic.id,
            include_drafts=True,
            limit=limit,
            offset=offset
        )
        reviews = [r for r in reviews if r.is_draft]
    elif status == "published":
        # Only published
        reviews = await review_repo.list_reviews_by_critic(
            critic.id,
            include_drafts=False,
            limit=limit,
            offset=offset
        )
    else:
        # All reviews (drafts and published)
        reviews = await review_repo.list_reviews_by_critic(
            critic.id,
            include_drafts=True,
            limit=limit,
            offset=offset
        )

    return [_review_to_response(review) for review in reviews]


@router.get("/movie/{movie_id}", response_model=List[CriticReviewResponse])
async def list_reviews_by_movie(
    movie_id: str,
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_session)
):
    """List all critic reviews for a movie (by internal ID or external_id)"""
    from ..repositories.movies import MovieRepository

    review_repo = CriticReviewRepository(db)
    movie_repo = MovieRepository(db)

    # Try to parse as int first (internal ID)
    try:
        try:
            movie_id_int = int(movie_id)
            reviews = await review_repo.list_reviews_by_movie(movie_id_int, limit=limit, offset=offset)
        except ValueError:
            # Try to lookup by external_id
            movie = await movie_repo.get_movie_by_external_id(movie_id)
            if not movie:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Movie not found: {movie_id}"
                )
            reviews = await review_repo.list_reviews_by_movie(movie.id, limit=limit, offset=offset)

        return [_review_to_response(review) for review in reviews]
    except Exception as e:
        import traceback
        with open("backend_error.log", "w") as f:
            f.write(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{review_id}/like")
async def like_review(
    review_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Like a critic review"""
    review_repo = CriticReviewRepository(db)
    review = await review_repo.get_review_by_external_id(review_id)

    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )

    # Check if already liked
    has_liked = await review_repo.has_liked_review(review.id, current_user.id)
    if has_liked:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already liked this review"
        )

    await review_repo.like_review(review.id, current_user.id)

    return {"message": "Review liked successfully"}


@router.delete("/{review_id}/like")
async def unlike_review(
    review_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Unlike a critic review"""
    review_repo = CriticReviewRepository(db)
    review = await review_repo.get_review_by_external_id(review_id)

    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )

    success = await review_repo.unlike_review(review.id, current_user.id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Review not liked"
        )

    return {"message": "Review unliked successfully"}


@router.post("/{review_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def add_comment(
    review_id: str,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Add a comment to a critic review"""
    review_repo = CriticReviewRepository(db)
    review = await review_repo.get_review_by_external_id(review_id)

    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )

    comment = await review_repo.add_comment(
        review.id,
        current_user.id,
        comment_data.content,
        comment_data.parent_id
    )

    return CommentResponse(
        **{
            **comment.__dict__,
            "created_at": comment.created_at.isoformat()
        }
    )


@router.get("/{review_id}/comments", response_model=List[CommentResponse])
async def get_comments(
    review_id: str,
    parent_id: Optional[int] = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_session)
):
    """Get comments for a critic review"""
    review_repo = CriticReviewRepository(db)
    review = await review_repo.get_review_by_external_id(review_id)

    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )

    comments = await review_repo.get_comments(
        review.id,
        parent_id=parent_id,
        limit=limit,
        offset=offset
    )

    return [
        CommentResponse(
            **{
                **comment.__dict__,
                "created_at": comment.created_at.isoformat()
            }
        )
        for comment in comments
    ]
