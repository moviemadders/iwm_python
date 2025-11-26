from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid

from sqlalchemy import select, desc, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..models import Conversation, ConversationParticipant, Message, User


class MessagesRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    # ==================== CONVERSATIONS ====================

    async def create_conversation(self, user_ids: List[int]) -> Dict[str, Any]:
        """Create a new conversation between users"""
        if len(user_ids) < 2:
            raise ValueError("Conversation requires at least 2 participants")
        
        # Check if conversation already exists between these users
        existing = await self._find_existing_conversation(user_ids)
        if existing:
            return self._conversation_to_dto(existing)
        
        # Create new conversation
        conversation = Conversation(
            external_id=str(uuid.uuid4()),
            created_at=datetime.utcnow(),
            last_message_at=datetime.utcnow()
        )
        self.session.add(conversation)
        await self.session.flush()
        
        # Add participants
        for user_id in user_ids:
            participant = ConversationParticipant(
                conversation_id=conversation.id,
                user_id=user_id,
                joined_at=datetime.utcnow(),
                last_read_at=datetime.utcnow()
            )
            self.session.add(participant)
        
        await self.session.flush()
        await self.session.refresh(conversation, ["participants", "messages"])
        
        return self._conversation_to_dto(conversation)

    async def _find_existing_conversation(self, user_ids: List[int]) -> Optional[Conversation]:
        """Find existing conversation between exact set of users"""
        # Get all conversations where first user is a participant
        stmt = (
            select(Conversation)
            .join(ConversationParticipant)
            .where(ConversationParticipant.user_id == user_ids[0])
            .options(selectinload(Conversation.participants))
        )
        result = await self.session.execute(stmt)
        conversations = result.scalars().all()
        
        # Check if any conversation has exactly the same participants
        user_ids_set = set(user_ids)
        for conv in conversations:
            conv_user_ids = {p.user_id for p in conv.participants}
            if conv_user_ids == user_ids_set:
                return conv
        
        return None

    async def get_conversation(self, conversation_id: str, user_id: int) -> Optional[Dict[str, Any]]:
        """Get conversation details if user is a participant"""
        stmt = (
            select(Conversation)
            .where(Conversation.external_id == conversation_id)
            .options(
                selectinload(Conversation.participants).selectinload(ConversationParticipant.user),
                selectinload(Conversation.messages).selectinload(Message.sender)
            )
        )
        result = await self.session.execute(stmt)
        conversation = result.scalar_one_or_none()
        
        if not conversation:
            return None
        
        # Check if user is a participant
        if not any(p.user_id == user_id for p in conversation.participants):
            return None
        
        return self._conversation_to_dto(conversation)

    async def list_conversations(
        self, 
        user_id: int, 
        page: int = 1, 
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """List all conversations for a user"""
        stmt = (
            select(Conversation)
            .join(ConversationParticipant)
            .where(ConversationParticipant.user_id == user_id)
            .options(
                selectinload(Conversation.participants).selectinload(ConversationParticipant.user),
                selectinload(Conversation.messages).selectinload(Message.sender)
            )
            .order_by(desc(Conversation.last_message_at))
            .limit(limit)
            .offset((page - 1) * limit)
        )
        result = await self.session.execute(stmt)
        conversations = result.scalars().all()
        
        return [self._conversation_to_dto(conv, user_id) for conv in conversations]

    async def delete_conversation(self, conversation_id: str, user_id: int) -> bool:
        """Delete conversation (removes participant, conversation auto-deletes if no participants)"""
        stmt = select(Conversation).where(Conversation.external_id == conversation_id)
        result = await self.session.execute(stmt)
        conversation = result.scalar_one_or_none()
        
        if not conversation:
            return False
        
        # Remove user as participant
        delete_stmt = (
            select(ConversationParticipant)
            .where(
                ConversationParticipant.conversation_id == conversation.id,
                ConversationParticipant.user_id == user_id
            )
        )
        result = await self.session.execute(delete_stmt)
        participant = result.scalar_one_or_none()
        
        if participant:
            await self.session.delete(participant)
            await self.session.flush()
            return True
        
        return False

    # ==================== MESSAGES ====================

    async def send_message(
        self, 
        conversation_id: str, 
        sender_id: int, 
        content: str,
        media_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send a message in a conversation"""
        # Get conversation
        stmt = select(Conversation).where(Conversation.external_id == conversation_id)
        result = await self.session.execute(stmt)
        conversation = result.scalar_one_or_none()
        
        if not conversation:
            raise ValueError("Conversation not found")
        
        # Verify sender is a participant
        participant_stmt = (
            select(ConversationParticipant)
            .where(
                ConversationParticipant.conversation_id == conversation.id,
                ConversationParticipant.user_id == sender_id
            )
        )
        result = await self.session.execute(participant_stmt)
        participant = result.scalar_one_or_none()
        
        if not participant:
            raise ValueError("User is not a participant in this conversation")
        
        # Create message
        message = Message(
            external_id=str(uuid.uuid4()),
            conversation_id=conversation.id,
            sender_id=sender_id,
            content=content,
            media_url=media_url,
            is_read=False,
            created_at=datetime.utcnow()
        )
        self.session.add(message)
        
        # Update conversation last_message_at
        conversation.last_message_at = datetime.utcnow()
        
        await self.session.flush()
        await self.session.refresh(message, ["sender"])
        
        return self._message_to_dto(message)

    async def get_messages(
        self, 
        conversation_id: str, 
        user_id: int,
        page: int = 1, 
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get messages from a conversation"""
        # Verify user is a participant
        conv_stmt = (
            select(Conversation)
            .where(Conversation.external_id == conversation_id)
            .options(selectinload(Conversation.participants))
        )
        result = await self.session.execute(conv_stmt)
        conversation = result.scalar_one_or_none()
        
        if not conversation:
            return []
        
        if not any(p.user_id == user_id for p in conversation.participants):
            return []
        
        # Get messages
        stmt = (
            select(Message)
            .where(Message.conversation_id == conversation.id)
            .options(selectinload(Message.sender))
            .order_by(desc(Message.created_at))
            .limit(limit)
            .offset((page - 1) * limit)
        )
        result = await self.session.execute(stmt)
        messages = result.scalars().all()
        
        return [self._message_to_dto(msg) for msg in reversed(messages)]  # Reverse to get chronological order

    async def mark_messages_read(self, conversation_id: str, user_id: int) -> int:
        """Mark all messages in a conversation as read for a user"""
        # Get conversation
        conv_stmt = select(Conversation).where(Conversation.external_id == conversation_id)
        result = await self.session.execute(conv_stmt)
        conversation = result.scalar_one_or_none()
        
        if not conversation:
            return 0
        
        # Update last_read_at for participant
        participant_stmt = (
            select(ConversationParticipant)
            .where(
                ConversationParticipant.conversation_id == conversation.id,
                ConversationParticipant.user_id == user_id
            )
        )
        result = await self.session.execute(participant_stmt)
        participant = result.scalar_one_or_none()
        
        if participant:
            participant.last_read_at = datetime.utcnow()
            await self.session.flush()
            return 1
        
        return 0

    async def delete_message(self, message_id: str, user_id: int) -> bool:
        """Delete a message (only sender can delete)"""
        stmt = (
            select(Message)
            .where(Message.external_id == message_id)
        )
        result = await self.session.execute(stmt)
        message = result.scalar_one_or_none()
        
        if not message:
            return False
        
        # Only sender can delete
        if message.sender_id != user_id:
            return False
        
        await self.session.delete(message)
        await self.session.flush()
        return True

    async def get_unread_count(self, user_id: int) -> int:
        """Get total unread message count for a user"""
        # Get all conversations where user is a participant
        participant_stmt = (
            select(ConversationParticipant)
            .where(ConversationParticipant.user_id == user_id)
        )
        result = await self.session.execute(participant_stmt)
        participants = result.scalars().all()
        
        total_unread = 0
        for participant in participants:
            # Count messages after last_read_at
            count_stmt = (
                select(func.count(Message.id))
                .where(
                    Message.conversation_id == participant.conversation_id,
                    Message.sender_id != user_id,  # Don't count own messages
                    Message.created_at > participant.last_read_at
                )
            )
            result = await self.session.execute(count_stmt)
            count = result.scalar() or 0
            total_unread += count
        
        return total_unread

    # ==================== HELPERS ====================

    def _conversation_to_dto(self, conversation: Conversation, current_user_id: Optional[int] = None) -> Dict[str, Any]:
        """Convert conversation to DTO"""
        participants = []
        for p in conversation.participants:
            participants.append({
                "userId": p.user.external_id,
                "username": p.user.username or p.user.email.split("@")[0],
                "displayName": p.user.name,
                "avatarUrl": p.user.avatar_url,
                "joinedAt": p.joined_at.isoformat() + "Z"
            })
        
        # Get last message
        last_message = None
        if conversation.messages:
            latest = max(conversation.messages, key=lambda m: m.created_at)
            last_message = {
                "content": latest.content[:100],  # Preview
                "senderId": latest.sender.external_id if latest.sender else None,
                "timestamp": latest.created_at.isoformat() + "Z"
            }
        
        # Calculate unread count for current user
        unread_count = 0
        if current_user_id:
            for p in conversation.participants:
                if p.user_id == current_user_id:
                    unread_count = sum(
                        1 for msg in conversation.messages
                        if msg.created_at > p.last_read_at and msg.sender_id != current_user_id
                    )
                    break
        
        return {
            "id": conversation.external_id,
            "participants": participants,
            "lastMessageAt": conversation.last_message_at.isoformat() + "Z",
            "lastMessage": last_message,
            "unreadCount": unread_count,
            "createdAt": conversation.created_at.isoformat() + "Z"
        }

    def _message_to_dto(self, message: Message) -> Dict[str, Any]:
        """Convert message to DTO"""
        return {
            "id": message.external_id,
            "conversationId": str(message.conversation_id),
            "sender": {
                "userId": message.sender.external_id,
                "username": message.sender.username or message.sender.email.split("@")[0],
                "displayName": message.sender.name,
                "avatarUrl": message.sender.avatar_url
            },
            "content": message.content,
            "mediaUrl": message.media_url,
            "isRead": message.is_read,
            "createdAt": message.created_at.isoformat() + "Z",
            "updatedAt": message.updated_at.isoformat() + "Z" if message.updated_at else None
        }
