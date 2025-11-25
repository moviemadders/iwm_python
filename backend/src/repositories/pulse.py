from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple
import json
import uuid

from sqlalchemy import select, desc, or_, and_, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Pulse, User, UserFollow, Movie, UserSettings, PulseReaction, PulseComment


def _slugify_username(name: str | None) -> str:
    if not name:
        return "user"
    return "".join(ch.lower() if ch.isalnum() else "" for ch in name) or "user"


def _parse_json_array(text: Optional[str]) -> List[Any]:
    if not text:
        return []
    try:
        return json.loads(text)
    except Exception:
        return []


def _parse_json_obj(text: Optional[str]) -> Dict[str, int]:
    if not text:
        return {}
    try:
        data = json.loads(text)
        if isinstance(data, dict):
            return {k: int(v) for k, v in data.items() if isinstance(v, (int, float))}
        return {}
    except Exception:
        return {}


from sqlalchemy.orm import selectinload, noload


class PulseRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    def _base_query(self):
        return (
            select(Pulse)
            .options(
                selectinload(Pulse.user),
                selectinload(Pulse.linked_movie),
                noload(Pulse.reactions),  # Don't load reactions - we use aggregated counts
                noload(Pulse.comments)   # Don't load comments - we use aggregated counts
            )
        )

    async def list_feed(
        self,
        filter_type: str = "latest",
        window: str = "7d",
        page: int = 1,
        limit: int = 20,
        viewer_external_id: Optional[str] = None,
        hashtag: Optional[str] = None,
        linked_movie_id: Optional[str] = None,
        linked_type: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        q = self._base_query()

        # Join UserSettings to check privacy
        # Use outer join because if no settings exist, default is public
        q = q.outerjoin(UserSettings, Pulse.user_id == UserSettings.user_id)

        # Determine viewer ID if logged in
        viewer_id = None
        if viewer_external_id:
            viewer_res = await self.session.execute(select(User.id).where(User.external_id == viewer_external_id))
            viewer_id = viewer_res.scalar_one_or_none()

        # Apply Privacy Filter:
        # Show post IF:
        # 1. It's the viewer's own post
        # 2. OR The author's profileVisibility is NOT 'private' (public or followers_only)
        #    (If UserSettings is NULL, it's public)
        
        privacy_condition = or_(
            UserSettings.user_id.is_(None),  # No settings = Public
            func.jsonb_extract_path_text(UserSettings.privacy, 'profileVisibility') != 'private'
        )

        # Filter out soft-deleted posts
        q = q.where(Pulse.deleted_at.is_(None))

        if viewer_id:
            # If viewer is logged in, they can also see their own private posts
            q = q.where(or_(
                Pulse.user_id == viewer_id,
                privacy_condition
            ))
        else:
            # Guest: only see public
            q = q.where(privacy_condition)

        # Hashtag filtering
        if hashtag:
            # Filter by hashtag in content.hashtags JSON array
            # Remove # prefix if present
            clean_hashtag = hashtag.lstrip('#').lower()
            q = q.where(func.jsonb_path_exists(
                Pulse.content,
                f'$.hashtags[*] ? (@ like_regex "{clean_hashtag}" flag "i")'
            ))

        # Filter by linked movie ID
        if linked_movie_id:
            q = q.where(Pulse.linked_movie_id == linked_movie_id)
        
        # Filter by linked content type
        if linked_type:
            q = q.where(Pulse.linked_type == linked_type)

        # Window handling
        now = datetime.utcnow()
        delta = timedelta(days=7)
        if window == "24h":
            delta = timedelta(hours=24)
        elif window == "30d":
            delta = timedelta(days=30)

        if filter_type == "latest":
            q = q.order_by(desc(Pulse.created_at))
        elif filter_type == "popular":
            q = q.order_by(desc(Pulse.reactions_total + Pulse.comments_count + Pulse.shares_count), desc(Pulse.created_at))
        elif filter_type == "trending":
            q = q.where(Pulse.created_at >= (now - delta)).order_by(desc(Pulse.reactions_total + Pulse.comments_count + Pulse.shares_count))
        elif filter_type == "following":
            if viewer_id:
                following_rows = (
                    await self.session.execute(select(UserFollow.following_id).where(UserFollow.follower_id == viewer_id))
                ).scalars().all()
                if following_rows:
                    q = q.where(Pulse.user_id.in_(following_rows)).order_by(desc(Pulse.created_at))
                else:
                    return []
            else:
                return []
        else:
            q = q.order_by(desc(Pulse.created_at))

        if limit is None or limit <= 0:
            limit = 20
        if page is None or page <= 0:
            page = 1

        q = q.limit(limit).offset((page - 1) * limit)
        rows = (await self.session.execute(q)).scalars().all()

        # Fetch user reactions if viewer is logged in
        user_reactions = {}
        if viewer_id and rows:
            pulse_ids = [p.id for p in rows]
            q_reactions = select(PulseReaction).where(
                PulseReaction.user_id == viewer_id,
                PulseReaction.pulse_id.in_(pulse_ids)
            )
            reactions_rows = (await self.session.execute(q_reactions)).scalars().all()
            for r in reactions_rows:
                user_reactions[r.pulse_id] = r.type

        return [self._to_dto(p, user_reactions.get(p.id)) for p in rows]

    async def trending_topics(self, window: str = "7d", limit: int = 10) -> List[Dict[str, Any]]:
        now = datetime.utcnow()
        delta = timedelta(days=7)
        if window == "24h":
            delta = timedelta(hours=24)
        elif window == "30d":
            delta = timedelta(days=30)

        q = self._base_query().where(Pulse.created_at >= (now - delta))
        rows = (await self.session.execute(q)).scalars().all()

        counts: Dict[str, int] = {}
        for p in rows:
            tags = _parse_json_array(p.hashtags)
            for tag in tags:
                if not isinstance(tag, str):
                    continue
                counts[tag] = counts.get(tag, 0) + 1

        items = sorted(counts.items(), key=lambda x: x[1], reverse=True)[:limit]
        # Add naive category inference based on tags
        def infer_category(tag: str) -> Optional[str]:
            lower = tag.lower()
            if "ipl" in lower or "cricket" in lower or "indv" in lower:
                return "cricket"
            if any(k in lower for k in ["oscar", "cannes", "festival"]):
                return "event"
            return "movie" if lower.startswith("#") else "general"

        out = [
            {"id": i + 1, "tag": tag, "count": cnt, "category": infer_category(tag)}
            for i, (tag, cnt) in enumerate(items)
        ]
        return out

    def _to_dto(self, p: Pulse, user_reaction: Optional[str] = None) -> Dict[str, Any]:
        user = p.user
        username = _slugify_username(getattr(user, "name", None))
        display_name = getattr(user, "name", "User")
        avatar_url = getattr(user, "avatar_url", None)  # Return None if no avatar

        media = _parse_json_array(p.content_media)
        reactions = _parse_json_obj(p.reactions_json)
        total = p.reactions_total or sum(reactions.values())

        linked: Optional[Dict[str, Any]] = None
        if p.linked_movie is not None:
            linked = {
                "type": "movie",
                "id": p.linked_movie.external_id,
                "title": p.linked_movie.title,
                "posterUrl": p.linked_movie.poster_url,
            }
        elif p.linked_type and p.linked_external_id and p.linked_title:
            linked = {
                "type": p.linked_type,
                "id": p.linked_external_id,
                "title": p.linked_title,
                "posterUrl": p.linked_poster_url,
            }

        # Determine if user posted with verified role
        is_verified = p.posted_as_role in ['critic', 'industry_pro', 'talent_pro'] if p.posted_as_role else False

        return {
            "id": p.external_id,
            "userId": user.external_id,
            "userInfo": {
                "username": username,
                "displayName": display_name,
                "avatarUrl": avatar_url,
                "isVerified": is_verified,
                "role": p.posted_as_role,  # 'critic', 'industry_pro', 'talent_pro', or None
            },
            "content": {
                "text": p.content_text,
                "media": media if media else None,
                "linkedContent": linked,
                "hashtags": _parse_json_array(p.hashtags),
                "starRating": p.star_rating,  # 1-5 stars or None
            },
            "engagement": {
                "reactions": {
                    **{"love": 0, "fire": 0, "mindblown": 0, "laugh": 0, "sad": 0, "angry": 0},
                    **reactions,
                    "total": total,
                },
                "userReaction": user_reaction,
                "comments": p.comments_count,
                "shares": p.shares_count,
                "hasCommented": False,
                "hasShared": False,
                "hasBookmarked": False,
            },
            "timestamp": p.created_at.replace(microsecond=0).isoformat() + "Z",
            "editedAt": p.edited_at.replace(microsecond=0).isoformat() + "Z" if p.edited_at else None,
        }

    async def create(
        self,
        user_id: int,
        content_text: str,
        content_media: Optional[List[str]] = None,
        linked_movie_id: Optional[str] = None,
        hashtags: Optional[List[str]] = None,
        posted_as_role: Optional[str] = None,
        star_rating: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Create a new pulse"""
        # Validate content length
        if len(content_text) > 280:
            raise ValueError("Content text must be 280 characters or less")

        # Validate role
        if posted_as_role and posted_as_role not in ['critic', 'industry_pro', 'talent_pro']:
            raise ValueError(f"Invalid role: {posted_as_role}. Must be 'critic', 'industry_pro', or 'talent_pro'")

        # Validate star rating
        if star_rating is not None:
            if not posted_as_role:
                raise ValueError("Star rating requires a professional role (critic, industry_pro, or talent_pro)")
            if star_rating < 1 or star_rating > 5:
                raise ValueError("Star rating must be between 1 and 5")
            if not linked_movie_id:
                raise ValueError("Star rating requires a linked movie")

        # Get linked movie if provided
        movie_id_db = None
        if linked_movie_id:
            movie_res = await self.session.execute(
                select(Movie).where(Movie.external_id == linked_movie_id)
            )
            movie = movie_res.scalar_one_or_none()
            if movie:
                movie_id_db = movie.id

        # Create pulse
        pulse = Pulse(
            external_id=str(uuid.uuid4()),
            user_id=user_id,
            content_text=content_text,
            content_media=json.dumps(content_media) if content_media else None,
            linked_movie_id=movie_id_db,
            hashtags=json.dumps(hashtags) if hashtags else None,
            posted_as_role=posted_as_role,
            star_rating=star_rating,
            reactions_json="{}",
            reactions_total=0,
            comments_count=0,
            shares_count=0,
            created_at=datetime.utcnow(),
        )
        self.session.add(pulse)
        await self.session.flush()
        await self.session.refresh(pulse, ["user", "linked_movie"])

        return self._to_dto(pulse)

    async def delete(self, pulse_id: str, user_id: int) -> bool:
        """Delete a pulse"""
        # Get pulse
        q = select(Pulse).where(Pulse.external_id == pulse_id)
        res = await self.session.execute(q)
        pulse = res.scalar_one_or_none()
        if not pulse:
            return False

        # Verify ownership
        if pulse.user_id != user_id:
            raise ValueError("User does not own this pulse")

        await self.session.delete(pulse)
        await self.session.flush()
        return True


    async def toggle_reaction(self, user_id: int, pulse_id: str, reaction_type: str) -> Dict[str, Any]:
        """Toggle a reaction on a pulse"""
        # Get pulse
        q = select(Pulse).where(Pulse.external_id == pulse_id)
        pulse = (await self.session.execute(q)).scalar_one_or_none()
        if not pulse:
            raise ValueError("Pulse not found")

        # Check existing reaction
        q_reaction = select(PulseReaction).where(
            PulseReaction.user_id == user_id,
            PulseReaction.pulse_id == pulse.id
        )
        existing = (await self.session.execute(q_reaction)).scalar_one_or_none()

        reactions_map = _parse_json_obj(pulse.reactions_json)
        
        if existing:
            if existing.type == reaction_type:
                # Remove reaction (toggle off)
                await self.session.delete(existing)
                reactions_map[reaction_type] = max(0, reactions_map.get(reaction_type, 0) - 1)
                pulse.reactions_total = max(0, pulse.reactions_total - 1)
                user_reaction = None
            else:
                # Change reaction type
                old_type = existing.type
                existing.type = reaction_type
                reactions_map[old_type] = max(0, reactions_map.get(old_type, 0) - 1)
                reactions_map[reaction_type] = reactions_map.get(reaction_type, 0) + 1
                user_reaction = reaction_type
        else:
            # Add new reaction
            new_reaction = PulseReaction(user_id=user_id, pulse_id=pulse.id, type=reaction_type)
            self.session.add(new_reaction)
            reactions_map[reaction_type] = reactions_map.get(reaction_type, 0) + 1
            pulse.reactions_total += 1
            user_reaction = reaction_type

        pulse.reactions_json = json.dumps(reactions_map)
        await self.session.flush()
        
        return {
            "reactions": {
                **{"love": 0, "fire": 0, "mindblown": 0, "laugh": 0, "sad": 0, "angry": 0},
                **reactions_map,
                "total": pulse.reactions_total,
            },
            "userReaction": user_reaction
        }

    async def add_comment(self, user_id: int, pulse_id: str, content: str) -> Dict[str, Any]:
        """Add a comment to a pulse"""
        # Get pulse
        q = select(Pulse).where(Pulse.external_id == pulse_id)
        pulse = (await self.session.execute(q)).scalar_one_or_none()
        if not pulse:
            raise ValueError("Pulse not found")

        # Create comment
        comment = PulseComment(
            external_id=str(uuid.uuid4()),
            user_id=user_id,
            pulse_id=pulse.id,
            content=content,
            created_at=datetime.utcnow()
        )
        self.session.add(comment)
        
        # Update pulse comment count
        pulse.comments_count += 1
        
        await self.session.flush()
        await self.session.refresh(comment, ["user"])

        return {
            "id": comment.external_id,
            "postId": pulse_id,
            "author": {
                "id": comment.user.external_id,
                "username": comment.user.username or "user",
                "displayName": comment.user.name,
                "avatarUrl": comment.user.avatar_url,
                "isVerified": False
            },
            "content": comment.content,
            "like_count": 0,
            "created_at": comment.created_at.isoformat() + "Z",
            "is_liked": False
        }

    async def get_comments(self, pulse_id: str, page: int = 1, limit: int = 20) -> List[Dict[str, Any]]:
        """Get comments for a pulse"""
        # Get pulse
        q_pulse = select(Pulse.id).where(Pulse.external_id == pulse_id)
        pulse_db_id = (await self.session.execute(q_pulse)).scalar_one_or_none()
        if not pulse_db_id:
            return []

        q = (
            select(PulseComment)
            .where(PulseComment.pulse_id == pulse_db_id)
            .options(selectinload(PulseComment.user))
            .order_by(desc(PulseComment.created_at))
            .limit(limit)
            .offset((page - 1) * limit)
        )
        
        comments = (await self.session.execute(q)).scalars().all()
        
        return [
            {
                "id": c.external_id,
                "postId": pulse_id,
                "author": {
                    "id": c.user.external_id,
                    "username": c.user.username or "user",
                    "displayName": c.user.name,
                    "avatarUrl": c.user.avatar_url,
                    "isVerified": False
                },
                "content": c.content,
                "like_count": c.like_count,
                "created_at": c.created_at.isoformat() + "Z",
                "is_liked": False
            }
            for c in comments
        ]

    async def follow_user(self, follower_id: int, following_id: int) -> bool:
        """Follow a user"""
        if follower_id == following_id:
            raise ValueError("Cannot follow yourself")

        # Check if already following
        q = select(UserFollow).where(
            UserFollow.follower_id == follower_id,
            UserFollow.following_id == following_id
        )
        existing = (await self.session.execute(q)).scalar_one_or_none()
        if existing:
            return True

        # Create follow
        follow = UserFollow(follower_id=follower_id, following_id=following_id)
        self.session.add(follow)
        await self.session.flush()
        return True

    async def unfollow_user(self, follower_id: int, following_id: int) -> bool:
        """Unfollow a user"""
        q = select(UserFollow).where(
            UserFollow.follower_id == follower_id,
            UserFollow.following_id == following_id
        )
        existing = (await self.session.execute(q)).scalar_one_or_none()
        if not existing:
            return False

        await self.session.delete(existing)
        await self.session.flush()
        return True

    async def is_following(self, follower_id: int, following_id: int) -> bool:
        """Check if user is following another user"""
        q = select(UserFollow).where(
            UserFollow.follower_id == follower_id,
            UserFollow.following_id == following_id
        )
        existing = (await self.session.execute(q)).scalar_one_or_none()
        return existing is not None

    async def get_follower_count(self, user_id: int) -> int:
        """Get number of followers"""
        q = select(func.count(UserFollow.id)).where(UserFollow.following_id == user_id)
        return (await self.session.execute(q)).scalar() or 0

    async def get_following_count(self, user_id: int) -> int:
        """Get number of following"""
        q = select(func.count(UserFollow.id)).where(UserFollow.follower_id == user_id)
        return (await self.session.execute(q)).scalar() or 0

    async def bookmark_pulse(self, user_id: int, pulse_id: str) -> bool:
        """Bookmark a pulse"""
        # Get pulse
        q = select(Pulse).where(Pulse.external_id == pulse_id)
        pulse = (await self.session.execute(q)).scalar_one_or_none()
        if not pulse:
            raise ValueError("Pulse not found")

        # Check existing
        from ..models import PulseBookmark
        q_bookmark = select(PulseBookmark).where(
            PulseBookmark.user_id == user_id,
            PulseBookmark.pulse_id == pulse.id
        )
        existing = (await self.session.execute(q_bookmark)).scalar_one_or_none()
        if existing:
            return True

        # Create bookmark
        bookmark = PulseBookmark(user_id=user_id, pulse_id=pulse.id)
        self.session.add(bookmark)
        await self.session.flush()
        return True

    async def unbookmark_pulse(self, user_id: int, pulse_id: str) -> bool:
        """Unbookmark a pulse"""
        # Get pulse
        q = select(Pulse).where(Pulse.external_id == pulse_id)
        pulse = (await self.session.execute(q)).scalar_one_or_none()
        if not pulse:
            raise ValueError("Pulse not found")

        from ..models import PulseBookmark
        q_bookmark = select(PulseBookmark).where(
            PulseBookmark.user_id == user_id,
            PulseBookmark.pulse_id == pulse.id
        )
        existing = (await self.session.execute(q_bookmark)).scalar_one_or_none()
        if not existing:
            return False

        await self.session.delete(existing)
        await self.session.flush()
        return True

    async def share_pulse(self, pulse_id: str) -> int:
        """Increment share count"""
        # Get pulse
        q = select(Pulse).where(Pulse.external_id == pulse_id)
        pulse = (await self.session.execute(q)).scalar_one_or_none()
        if not pulse:
            raise ValueError("Pulse not found")

        pulse.shares_count += 1
        await self.session.flush()
        return pulse.shares_count
