# Add to the end of pulse.py

# Comment DTOs
class CommentCreateBody(BaseModel):
    content: str = Field(..., min_length=1, max_length=500)


class CommentResponse(BaseModel):
    id: str
    pulseId: int
    content: str
    createdAt: str
    user: dict


# Comment Endpoints
@router.post("/{pulse_id}/comments", response_model=CommentResponse)
async def create_comment(
    pulse_id: str,
    body: CommentCreateBody,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Create a new comment on a pulse"""
    from ..repositories.pulse_comments import PulseCommentRepository
    from ..repositories.pulse import PulseRepository
    
    pulse_repo = PulseRepository(session)
    comment_repo = PulseCommentRepository(session)
    
    # Get pulse by external_id
    pulse = await pulse_repo.get_by_id(pulse_id)
    if not pulse:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pulse not found"
        )
    
    # Create comment using internal pulse ID
    comment = await comment_repo.create_comment(
        pulse_id=pulse["id"],  # Use internal ID
        user_id=current_user.id,
        content=body.content
    )
    
    await session.commit()
    return comment


@router.get("/{pulse_id}/comments")
async def list_comments(
    pulse_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
):
    """List comments for a pulse with pagination"""
    from ..repositories.pulse_comments import PulseCommentRepository
    from ..repositories.pulse import PulseRepository
    
    pulse_repo = PulseRepository(session)
    comment_repo = PulseCommentRepository(session)
    
    # Get pulse by external_id
    pulse = await pulse_repo.get_by_id(pulse_id)
    if not pulse:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pulse not found"
        )
    
    comments = await comment_repo.list_comments(
        pulse_id=pulse["id"],  # Use internal ID
        page=page,
        limit=limit
    )
    
    total = await comment_repo.get_comment_count(pulse["id"])
    
    return {
        "comments": comments,
        "total": total,
        "page": page,
        "limit": limit,
        "hasMore": (page * limit) < total
    }


@router.delete("/{pulse_id}/comments/{comment_id}")
async def delete_comment(
    pulse_id: str,
    comment_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Delete a comment (only by owner)"""
    from ..repositories.pulse_comments import PulseCommentRepository
    
    comment_repo = PulseCommentRepository(session)
    
    try:
        deleted = await comment_repo.delete_comment(
            comment_id=comment_id,
            user_id=current_user.id
        )
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Comment not found"
            )
        
        await session.commit()
        return {"success": True}
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
