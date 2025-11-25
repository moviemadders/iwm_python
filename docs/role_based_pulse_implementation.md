# Role-Based Pulse System - Implementation Guide

## Overview

This document describes the implementation of role-based posting for the Pulse social feed feature, allowing users to post as different professional roles (Critic, Industry Pro, Talent Pro) with verified badges and star ratings.

---

## Table of Contents

1. [Features](#features)
2. [Database Schema](#database-schema)
3. [Backend Implementation](#backend-implementation)
4. [API Endpoints](#api-endpoints)
5. [Usage Examples](#usage-examples)
6. [Testing](#testing)
7. [Future Enhancements](#future-enhancements)

---

## Features

### ✅ Implemented

- **Role-Based Posting**: Users can post pulses as different professional roles
- **Verified Badges**: Professional posts display verified badge (`isVerified: true`)
- **Star Ratings**: Critics can add 1-5 star ratings to movie reviews
- **Role Validation**: Backend verifies user has claimed role before allowing professional posts
- **Soft Delete**: Posts can be soft-deleted (preserves data for audit)
- **Backward Compatible**: All existing posts remain functional (NULL = personal post)

### Supported Roles

| Role | `posted_as_role` Value | Badge | Can Rate Movies |
|------|------------------------|-------|-----------------|
| Personal (Default) | `null` | ❌ No | ❌ No |
| Critic | `'critic'` | ✅ Yes | ✅ Yes |
| Industry Pro | `'industry_pro'` | ✅ Yes | ✅ Yes |
| Talent Pro | `'talent_pro'` | ✅ Yes | ✅ Yes |

---

## Database Schema

### Migration File
**File:** `backend/alembic/versions/e9f4a2b8c7d6_add_role_based_posting_to_pulses.py`

### New Columns

```sql
-- Pulses table additions
ALTER TABLE pulses ADD COLUMN posted_as_role VARCHAR(20) NULL;
ALTER TABLE pulses ADD COLUMN star_rating SMALLINT NULL 
    CHECK (star_rating >= 1 AND star_rating <= 5);
ALTER TABLE pulses ADD COLUMN deleted_at TIMESTAMP NULL;
```

### Indexes

```sql
-- Performance indexes
CREATE INDEX ix_pulses_role_created ON pulses(posted_as_role, created_at DESC);
CREATE INDEX ix_pulses_movie_role ON pulses(linked_movie_id, posted_as_role);
CREATE INDEX ix_pulses_user_role ON pulses(user_id, posted_as_role);
CREATE INDEX ix_pulses_deleted_at ON pulses(deleted_at);
```

### Purpose of Indexes

| Index | Purpose |
|-------|---------|
| `ix_pulses_role_created` | Fast "Pro Feed" queries (only verified posts) |
| `ix_pulses_movie_role` | Filter reviews on Movie page by role |
| `ix_pulses_user_role` | User profile tabs ("All Posts" vs "As Critic") |
| `ix_pulses_deleted_at` | Efficiently filter out soft-deleted posts |

---

## Backend Implementation

### 1. Models (`backend/src/models.py`)

```python
class Pulse(Base):
    __tablename__ = "pulses"
    
    # ... existing fields ...
    
    # Role-based posting fields
    posted_as_role: Mapped[str | None] = mapped_column(
        String(20), nullable=True, index=True
    )  # 'critic', 'industry_pro', 'talent_pro', or NULL
    
    star_rating: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )  # 1-5 stars, only for pro roles with movies
    
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True, index=True
    )  # Soft delete timestamp
```

### 2. Repository Layer (`backend/src/repositories/pulse.py`)

#### Updated `_to_dto()` Method

```python
def _to_dto(self, p: Pulse, user_reaction: Optional[str] = None) -> Dict[str, Any]:
    # ... existing code ...
    
    # Determine if user posted with verified role
    is_verified = p.posted_as_role in ['critic', 'industry_pro', 'talent_pro'] if p.posted_as_role else False
    
    return {
        "id": p.external_id,
        "userId": user.external_id,
        "userInfo": {
            "username": username,
            "displayName": display_name,
            "avatarUrl": avatar_url,
            "isVerified": is_verified,  # NEW
            "role": p.posted_as_role,   # NEW: 'critic', 'industry_pro', 'talent_pro', or None
        },
        "content": {
            "text": p.content_text,
            "media": media if media else None,
            "linkedContent": linked,
            "hashtags": _parse_json_array(p.hashtags),
            "starRating": p.star_rating,  # NEW: 1-5 stars or None
        },
        # ... rest of response ...
    }
```

#### Updated `create()` Method

```python
async def create(
    self,
    user_id: int,
    content_text: str,
    content_media: Optional[List[str]] = None,
    linked_movie_id: Optional[str] = None,
    hashtags: Optional[List[str]] = None,
    posted_as_role: Optional[str] = None,  # NEW
    star_rating: Optional[int] = None,     # NEW
) -> Dict[str, Any]:
    """Create a new pulse"""
    
    # Validate role
    if posted_as_role and posted_as_role not in ['critic', 'industry_pro', 'talent_pro']:
        raise ValueError(f"Invalid role: {posted_as_role}")
    
    # Validate star rating
    if star_rating is not None:
        if not posted_as_role:
            raise ValueError("Star rating requires a professional role")
        if star_rating < 1 or star_rating > 5:
            raise ValueError("Star rating must be between 1 and 5")
        if not linked_movie_id:
            raise ValueError("Star rating requires a linked movie")
    
    # Create pulse with role fields
    pulse = Pulse(
        # ... existing fields ...
        posted_as_role=posted_as_role,
        star_rating=star_rating,
    )
    # ... rest of creation ...
```

#### Soft Delete Filter in `list_feed()`

```python
async def list_feed(self, ...):
    q = self._base_query()
    
    # ... privacy filters ...
    
    # Filter out soft-deleted posts
    q = q.where(Pulse.deleted_at.is_(None))
    
    # ... rest of query ...
```

### 3. API Router (`backend/src/routers/pulse.py`)

#### Updated DTO

```python
class PulseCreateBody(BaseModel):
    contentText: str = Field(..., max_length=280)
    contentMedia: Optional[List[str]] = None
    linkedMovieId: Optional[str] = None
    hashtags: Optional[List[str]] = None
    postedAsRole: Optional[str] = None  # NEW: 'critic', 'industry_pro', 'talent_pro'
    starRating: Optional[int] = Field(None, ge=1, le=5)  # NEW: 1-5 stars
```

#### Role Verification Helper

```python
async def get_user_roles(user_id: int, session: AsyncSession) -> List[str]:
    """Get active roles for user from user_role_profiles table"""
    result = await session.execute(
        select(UserRoleProfile.role_type)
        .where(UserRoleProfile.user_id == user_id)
        .where(UserRoleProfile.enabled == True)
    )
    role_types = [row[0] for row in result]
    
    # Map role_type to posted_as_role format
    role_mapping = {
        'critic': 'critic',
        'industry': 'industry_pro',
        'talent': 'talent_pro'
    }
    
    return [role_mapping.get(r) for r in role_types if r in role_mapping]
```

#### Updated Endpoint

```python
@router.post("")
async def create_pulse(
    body: PulseCreateBody,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Create a new pulse"""
    
    # Verify user has claimed role
    if body.postedAsRole:
        user_roles = await get_user_roles(current_user.id, session)
        if body.postedAsRole not in user_roles:
            raise HTTPException(
                status_code=403,
                detail=f"User does not have '{body.postedAsRole}' role"
            )
    
    repo = PulseRepository(session)
    result = await repo.create(
        user_id=current_user.id,
        content_text=body.contentText,
        content_media=body.contentMedia,
        linked_movie_id=body.linkedMovieId,
        hashtags=body.hashtags,
        posted_as_role=body.postedAsRole,  # NEW
        star_rating=body.starRating,       # NEW
    )
    await session.commit()
    return result
```

---

## API Endpoints

### POST `/api/v1/pulse`

**Create a pulse (with optional role and rating)**

**Request Body:**
```json
{
  "contentText": "Oppenheimer is a masterpiece!",
  "linkedMovieId": "movie_123",
  "postedAsRole": "critic",
  "starRating": 5,
  "hashtags": ["Oppenheimer", "ChristopherNolan"]
}
```

**Response:**
```json
{
  "id": "pulse_abc123",
  "userId": "user_xyz",
  "userInfo": {
    "username": "naveen",
    "displayName": "Naveen Kumar",
    "avatarUrl": "...",
    "isVerified": true,
    "role": "critic"
  },
  "content": {
    "text": "Oppenheimer is a masterpiece!",
    "starRating": 5,
    "linkedContent": {
      "type": "movie",
      "id": "movie_123",
      "title": "Oppenheimer"
    },
    "hashtags": ["Oppenheimer", "ChristopherNolan"]
  },
  "engagement": { ... },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**

| Status | Scenario | Response |
|--------|----------|----------|
| 400 | Invalid role | `"Invalid role: xyz"` |
| 400 | Rating without role | `"Star rating requires a professional role"` |
| 400 | Rating out of range | `"Star rating must be between 1 and 5"` |
| 400 | Rating without movie | `"Star rating requires a linked movie"` |
| 403 | User lacks role | `"User does not have 'critic' role"` |

### GET `/api/v1/pulse/feed`

**Fetch pulse feed**

**Query Parameters:**
- `filter`: `latest` | `popular` | `following` | `trending`
- `linkedMovieId`: Filter posts about a specific movie
- `hashtag`: Filter by hashtag

**Response:**
```json
[
  {
    "id": "pulse_1",
    "userInfo": {
      "isVerified": true,
      "role": "critic"
    },
    "content": {
      "starRating": 5
    },
    ...
  },
  {
    "id": "pulse_2",
    "userInfo": {
      "isVerified": false,
      "role": null
    },
    "content": {
      "starRating": null
    },
    ...
  }
]
```

---

## Usage Examples

### Example 1: Personal Post (No Role)

```python
requests.post("/api/v1/pulse", headers=auth_headers, json={
    "contentText": "Just watched a great movie!",
    "hashtags": ["movies"]
})
```

**Result:**
- `isVerified`: `false`
- `role`: `null`
- `starRating`: `null`

### Example 2: Critic Review with Rating

```python
requests.post("/api/v1/pulse", headers=auth_headers, json={
    "contentText": "Oppenheimer is a masterpiece!",
    "linkedMovieId": "mov_xyz",
    "postedAsRole": "critic",
    "starRating": 5,
    "hashtags": ["Oppenheimer"]
})
```

**Result:**
- `isVerified`: `true`
- `role`: `"critic"`
- `starRating`: `5`

### Example 3: Industry Pro Post (No Rating)

```python
requests.post("/api/v1/pulse", headers=auth_headers, json={
    "contentText": "Behind the scenes of our new film...",
    "postedAsRole": "industry_pro",
    "hashtags": ["filmmaking"]
})
```

**Result:**
- `isVerified`: `true`
- `role`: `"industry_pro"`
- `starRating`: `null` (optional)

---

## Testing

### Test Script

**File:** `test_role_pulse_api.py`

**Run:**
```bash
python test_role_pulse_api.py
```

**Test Coverage:**
1. ✅ Personal pulse creation (no role)
2. ✅ Critic pulse with star rating
3. ✅ Invalid role rejection (403)
4. ✅ Star rating without movie rejection (400)
5. ✅ Feed displays roles correctly

### Manual Testing Checklist

- [ ] Create personal pulse → Verify `isVerified: false`
- [ ] Create critic pulse with rating → Verify badge and rating displayed
- [ ] Try posting as role user doesn't have → Verify 403 error
- [ ] Try rating without movie → Verify 400 error
- [ ] Fetch feed → Verify role badges displayed correctly
- [ ] Check existing pulses → Verify backward compatibility (NULL = personal)

---

## Future Enhancements

### Phase 2 Features

1. **Frontend Updates**
   - Role selector in Pulse composer UI
   - Verified badge display in feed
   - Star rating display component
   - Profile tabs: "All Posts" | "As Critic" | "Personal"

2. **Pro Feed Tab**
   - Separate feed showing only verified professional posts
   - Filter: `WHERE posted_as_role IS NOT NULL`

3. **Analytics**
   - Engagement metrics per role
   - "Your posts as Critic get 3x more engagement!"

4. **Role Switching Notifications**
   - Notify followers when user posts as different role
   - "Naveen posted as Critic"

5. **Edit Restrictions**
   - Lock `posted_as_role` after posting (prevent fraud)
   - Allow `content_text` editing (mark as "Edited")

---

## Validation Rules Summary

| Validation | Rule | Error |
|------------|------|-------|
| Role Value | Must be `'critic'`, `'industry_pro'`, or `'talent_pro'` | 400 |
| Role Permission | User must have role in `user_role_profiles` | 403 |
| Rating Range | 1-5 only | 400 (Pydantic) |
| Rating Requires Role | Can't rate without professional role | 400 |
| Rating Requires Movie | Can't rate without `linkedMovieId` | 400 |
| Soft Delete | Deleted posts (`deleted_at != NULL`) hidden from feed | N/A |

---

## Database Queries

### Get All Critic Reviews for a Movie

```sql
SELECT * FROM pulses
WHERE linked_movie_id = ?
  AND posted_as_role = 'critic'
  AND deleted_at IS NULL
ORDER BY created_at DESC;
```

### Get Pro Feed (Only Verified Posts)

```sql
SELECT * FROM pulses
WHERE posted_as_role IS NOT NULL
  AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 20;
```

### Get User's Critic Posts

```sql
SELECT * FROM pulses
WHERE user_id = ?
  AND posted_as_role = 'critic'
  AND deleted_at IS NULL
ORDER BY created_at DESC;
```

---

## Summary

This implementation provides a flexible, scalable role-based posting system for Pulses with:

✅ **Backward Compatibility** - Existing posts unaffected
✅ **Role Verification** - Backend validates user permissions
✅ **Star Ratings** - Context-aware (only with movies)
✅ **Soft Delete** - Preserves audit trail
✅ **Performance** - Indexed for fast queries
✅ **Extensible** - Easy to add new roles in future

**Total Files Modified:** 4
**Total Lines Added:** ~200
**Database Migration:** 1 (backward compatible)
**New API Features:** 2 (role posting + star ratings)
