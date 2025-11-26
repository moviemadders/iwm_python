from __future__ import annotations

from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_session
from ..models import User
from ..dependencies.auth import get_current_user
from ..repositories.messages import MessagesRepository

router = APIRouter(prefix="/messages", tags=["messages"])


# ==================== REQUEST/RESPONSE MODELS ====================

class CreateConversationRequest(BaseModel):
    userIds: List[str]  # External IDs of users to include


class SendMessageRequest(BaseModel):
    content: str
    mediaUrl: Optional[str] = None


class ParticipantOut(BaseModel):
    userId: str
    username: str
    displayName: str
    avatarUrl: Optional[str] = None
    joinedAt: str


class LastMessageOut(BaseModel):
    content: str
    senderId: Optional[str] = None
    timestamp: str


class ConversationOut(BaseModel):
    id: str
    participants: List[ParticipantOut]
    lastMessageAt: str
    lastMessage: Optional[LastMessageOut] = None
    unreadCount: int
    createdAt: str


class MessageSenderOut(BaseModel):
    userId: str
    username: str
    displayName: str
    avatarUrl: Optional[str] = None


class MessageOut(BaseModel):
    id: str
    conversationId: str
    sender: MessageSenderOut
    content: str
    mediaUrl: Optional[str] = None
    isRead: bool
    createdAt: str
    updatedAt: Optional[str] = None


class UnreadCountOut(BaseModel):
    unreadCount: int


# ==================== CONVERSATION ENDPOINTS ====================

@router.post("/conversations", response_model=ConversationOut, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    request: CreateConversationRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Create a new conversation with specified users.
    
    The current user is automatically added as a participant.
    If a conversation already exists with the exact same participants, it will be returned.
    """
    try:
        repo = MessagesRepository(session)
        
        # Convert external IDs to internal IDs
        from sqlalchemy import select
        user_ids = [current_user.id]
        
        for external_id in request.userIds:
            stmt = select(User.id).where(User.external_id == external_id)
            result = await session.execute(stmt)
            user_id = result.scalar_one_or_none()
            
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"User not found: {external_id}"
                )
            
            user_ids.append(user_id)
        
        # Remove duplicates
        user_ids = list(set(user_ids))
        
        if len(user_ids) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Conversation requires at least 2 participants"
            )
        
        conversation = await repo.create_conversation(user_ids)
        await session.commit()
        
        return ConversationOut.model_validate(conversation)
    
    except ValueError as e:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create conversation")


@router.get("/conversations", response_model=List[ConversationOut])
async def list_conversations(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    List all conversations for the current user.
    
    Returns conversations ordered by last message timestamp (most recent first).
    """
    try:
        repo = MessagesRepository(session)
        conversations = await repo.list_conversations(current_user.id, page, limit)
        
        return [ConversationOut.model_validate(conv) for conv in conversations]
    
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch conversations")


@router.get("/conversations/{conversation_id}", response_model=ConversationOut)
async def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Get details of a specific conversation.
    
    Only participants can access the conversation.
    """
    try:
        repo = MessagesRepository(session)
        conversation = await repo.get_conversation(conversation_id, current_user.id)
        
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found or access denied"
            )
        
        return ConversationOut.model_validate(conversation)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch conversation")


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Delete a conversation (removes current user as participant).
    
    If all participants remove themselves, the conversation is automatically deleted.
    """
    try:
        repo = MessagesRepository(session)
        success = await repo.delete_conversation(conversation_id, current_user.id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        await session.commit()
        return None
    
    except HTTPException:
        await session.rollback()
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete conversation")


# ==================== MESSAGE ENDPOINTS ====================

@router.post("/conversations/{conversation_id}/messages", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
async def send_message(
    conversation_id: str,
    request: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Send a message in a conversation.
    
    Only participants can send messages.
    """
    try:
        repo = MessagesRepository(session)
        message = await repo.send_message(
            conversation_id=conversation_id,
            sender_id=current_user.id,
            content=request.content,
            media_url=request.mediaUrl
        )
        await session.commit()
        
        return MessageOut.model_validate(message)
    
    except ValueError as e:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to send message")


@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageOut])
async def get_messages(
    conversation_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Get messages from a conversation.
    
    Only participants can retrieve messages.
    Returns messages in chronological order (oldest first).
    """
    try:
        repo = MessagesRepository(session)
        messages = await repo.get_messages(conversation_id, current_user.id, page, limit)
        
        return [MessageOut.model_validate(msg) for msg in messages]
    
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch messages")


@router.put("/conversations/{conversation_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_messages_read(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Mark all messages in a conversation as read.
    
    Updates the last_read_at timestamp for the current user's participation.
    """
    try:
        repo = MessagesRepository(session)
        await repo.mark_messages_read(conversation_id, current_user.id)
        await session.commit()
        
        return None
    
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to mark messages as read")


@router.delete("/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_message(
    message_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Delete a message.
    
    Only the message sender can delete their own messages.
    """
    try:
        repo = MessagesRepository(session)
        success = await repo.delete_message(message_id, current_user.id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found or access denied"
            )
        
        await session.commit()
        return None
    
    except HTTPException:
        await session.rollback()
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete message")


# ==================== UTILITY ENDPOINTS ====================

@router.get("/unread-count", response_model=UnreadCountOut)
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Get total unread message count for the current user.
    
    Counts all unread messages across all conversations.
    """
    try:
        repo = MessagesRepository(session)
        count = await repo.get_unread_count(current_user.id)
        
        return UnreadCountOut(unreadCount=count)
    
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch unread count")
