from __future__ import annotations

from typing import Any, Mapping

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import User, UserSettings


DEFAULTS = {
    "account": {"name": None, "email": None, "phone": None, "avatar": None, "bio": None},
    "profile": {"username": None, "fullName": None, "avatarUrl": None, "bio": None},
    "privacy": {
        "profileVisibility": "public",
        "activitySharing": True,
        "messageRequests": "everyone",
        "dataDownloadRequested": False,
    },
    "display": {
        "theme": "dark",
        "fontSize": "medium",
        "highContrastMode": False,
        "reduceMotion": False,
    },
    "preferences": {
        "language": "en",
        "region": "us",
        "hideSpoilers": True,
        "excludedGenres": [],
        "contentRating": "all",
    },
    "security": {"twoFactorEnabled": False, "loginNotifications": True},
    "integrations": {"facebook": False, "twitter": False, "instagram": False},
    "data": {"deletionRequested": False, "exportRequested": False, "lastExportAt": None},
}


class SettingsRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def _get_or_create_row(self, user_id: int) -> UserSettings:
        row = (
            await self.session.execute(select(UserSettings).where(UserSettings.user_id == user_id))
        ).scalar_one_or_none()
        if row is None:
            row = UserSettings(user_id=user_id, **DEFAULTS)
            self.session.add(row)
            await self.session.flush()
        return row

    async def get_user_by_external_id(self, user_external_id: str) -> User | None:
        return (
            await self.session.execute(select(User).where(User.external_id == user_external_id))
        ).scalar_one_or_none()

    async def get_all(self, user_external_id: str) -> dict[str, Any]:
        user = await self.get_user_by_external_id(user_external_id)
        if not user:
            return DEFAULTS.copy()
        row = (
            await self.session.execute(select(UserSettings).where(UserSettings.user_id == user.id))
        ).scalar_one_or_none()
        if not row:
            return DEFAULTS.copy()
        
        # Merge User table data into profile settings
        profile_data = {**DEFAULTS["profile"], **(row.profile or {})}
        if user.username:
            profile_data["username"] = user.username
        if user.name:
            profile_data["fullName"] = user.name
        if user.avatar_url:
            profile_data["avatarUrl"] = user.avatar_url
        if user.bio:
            profile_data["bio"] = user.bio

        data = {
            "account": {**DEFAULTS["account"], **(row.account or {})},
            "profile": profile_data,
            "privacy": {**DEFAULTS["privacy"], **(row.privacy or {})},
            "display": {**DEFAULTS["display"], **(row.display or {})},
            "preferences": {**DEFAULTS["preferences"], **(row.preferences or {})},
            "security": {**DEFAULTS["security"], **(row.security or {})},
            "integrations": {**DEFAULTS["integrations"], **(row.integrations or {})},
            "data": {**DEFAULTS["data"], **(row.data or {})},
        }
        return data

    async def update_all(self, user_external_id: str, payload: Mapping[str, Any]) -> dict[str, Any]:
        user = await self.get_user_by_external_id(user_external_id)
        if not user:
            # If user does not exist yet, create a placeholder user?
            # For this project we assume seed ensures user exists; otherwise return defaults merged with payload
            merged = {k: (v.copy() if isinstance(v, dict) else v) for k, v in DEFAULTS.items()}
            for k, v in payload.items():
                if k in merged and isinstance(v, dict):
                    merged[k] = {**merged[k], **v}
            return merged
        
        # Update User table fields if present in profile payload
        if "profile" in payload:
            profile_payload = payload["profile"]
            if "username" in profile_payload:
                user.username = profile_payload["username"]
            if "fullName" in profile_payload:
                user.name = profile_payload["fullName"]
            if "avatarUrl" in profile_payload:
                user.avatar_url = profile_payload["avatarUrl"]
            if "bio" in profile_payload:
                user.bio = profile_payload["bio"]
            self.session.add(user)

        row = await self._get_or_create_row(user.id)
        for section in DEFAULTS.keys():
            if section in payload and isinstance(payload[section], dict):
                current = getattr(row, section) or {}
                merged = {**current, **payload[section]}
                setattr(row, section, merged)
        await self.session.flush()
        await self.session.commit()
        return await self.get_all(user.external_id)

    async def get_section(self, user_external_id: str, section: str) -> dict[str, Any]:
        all_data = await self.get_all(user_external_id)
        return all_data.get(section, {})

    async def update_section(self, user_external_id: str, section: str, data: Mapping[str, Any]) -> dict[str, Any]:
        if section not in DEFAULTS:
            return {}
        user = await self.get_user_by_external_id(user_external_id)
        if not user:
            merged = {**DEFAULTS[section], **(data or {})}
            return merged
            
        # Update User table fields if updating profile section
        if section == "profile":
            if "username" in data:
                user.username = data["username"]
            if "fullName" in data:
                user.name = data["fullName"]
            if "avatarUrl" in data:
                user.avatar_url = data["avatarUrl"]
            if "bio" in data:
                user.bio = data["bio"]
            self.session.add(user)

        row = await self._get_or_create_row(user.id)
        current = getattr(row, section) or {}
        merged = {**current, **dict(data)}
        setattr(row, section, merged)
        await self.session.flush()
        await self.session.commit()
        return await self.get_section(user.external_id, section)

