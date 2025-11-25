# Role-Based Pulse System - Quick Reference

## 🚀 Quick Start

### For Backend Developers

**Creating a role-based pulse:**
```python
await repo.create(
    user_id=user.id,
    content_text="Oppenheimer is amazing!",
    linked_movie_id="mov_123",
    posted_as_role="critic",    # 'critic', 'industry_pro', or 'talent_pro'
    star_rating=5,              # 1-5 (requires role + movie)
    hashtags=["Oppenheimer"]
)
```

### For Frontend Developers

**API Request:**
```typescript
POST /api/v1/pulse
{
  "contentText": "Oppenheimer is amazing!",
  "linkedMovieId": "mov_123",
  "postedAsRole": "critic",
  "starRating": 5,
  "hashtags": ["Oppenheimer"]
}
```

**Response:**
```typescript
{
  "userInfo": {
    "isVerified": true,  // ← Shows verified badge
    "role": "critic"     // ← Role type
  },
  "content": {
    "starRating": 5      // ← 1-5 star rating
  }
}
```

---

## 📋 Validation Rules

| Field | Required | Validation | Error |
|-------|----------|------------|-------|
| `postedAsRole` | No | Must be `'critic'`, `'industry_pro'`, or `'talent_pro'` | 400 |
| `starRating` | No | 1-5, requires role + movie | 400 |
| User Permission | - | User must have role in DB | 403 |

---

## 🎯 Common Scenarios

### 1. Personal Post (Default)
```json
{
  "contentText": "Loved this movie!"
}
```
Result: `isVerified: false`, `role: null`

### 2. Critic Review
```json
{
  "contentText": "A masterpiece!",
  "linkedMovieId": "mov_123",
  "postedAsRole": "critic",
  "starRating": 5
}
```
Result: `isVerified: true`, `role: "critic"`, `starRating: 5`

### 3. Industry Pro Post (No Rating)
```json
{
  "contentText": "Behind the scenes...",
  "postedAsRole": "industry_pro"
}
```
Result: `isVerified: true`, `role: "industry_pro"`, `starRating: null`

---

## ⚠️ Common Errors

### 403 Forbidden
```json
{
  "detail": "User does not have 'critic' role"
}
```
**Fix:** Ensure user has role in `user_role_profiles` table

### 400 Bad Request (No Movie)
```json
{
  "detail": "Star rating requires a linked movie"
}
```
**Fix:** Add `linkedMovieId` when including `starRating`

### 400 Bad Request (No Role)
```json
{
  "detail": "Star rating requires a professional role"
}
```
**Fix:** Add `postedAsRole` when including `starRating`

---

## 🔧 Database Queries

### Get User Roles
```sql
SELECT role_type FROM user_role_profiles
WHERE user_id = ? AND enabled = true;
```

### Get Critic Posts for Movie
```sql
SELECT * FROM pulses
WHERE linked_movie_id = ?
  AND posted_as_role = 'critic'
  AND deleted_at IS NULL;
```

### Get Pro Feed
```sql
SELECT * FROM pulses
WHERE posted_as_role IS NOT NULL
  AND deleted_at IS NULL
ORDER BY created_at DESC;
```

---

## 📊 Response Format

```typescript
interface PulseResponse {
  id: string
  userId: string
  userInfo: {
    username: string
    displayName: string
    avatarUrl: string
    isVerified: boolean     // NEW: true for professional posts
    role: string | null     // NEW: 'critic' | 'industry_pro' | 'talent_pro' | null
  }
  content: {
    text: string
    media?: Media[]
    linkedContent?: LinkedContent
    hashtags?: string[]
    starRating?: number     // NEW: 1-5 or null
  }
  engagement: { ... }
  timestamp: string
}
```

---

## 🧪 Testing

```bash
# Run API tests
python test_role_pulse_api.py

# Expected output:
# ✅ Personal pulse created
# ✅ Critic pulse created with rating
# ✅ Invalid role rejected (403)
# ✅ Rating without movie rejected (400)
```

---

## 📁 Files Modified

| File | Changes |
|------|---------|
| `backend/alembic/versions/e9f4a2b8c7d6_*.py` | Migration for 3 new columns |
| `backend/src/models.py` | Added role fields to Pulse model |
| `backend/src/repositories/pulse.py` | Updated DTO and create method |
| `backend/src/routers/pulse.py` | Updated API endpoint + validation |

---

## 🎨 Frontend TODO

```typescript
// In Pulse Composer
<Select name="role">
  <option value="">Personal</option>
  {userRoles.includes('critic') && (
    <option value="critic">As Critic 🎬</option>
  )}
  {userRoles.includes('industry_pro') && (
    <option value="industry_pro">As Filmmaker 🎥</option>
  )}
</Select>

// In Pulse Card
{pulse.userInfo.isVerified && (
  <Badge>✓ {pulse.userInfo.role}</Badge>
)}

{pulse.content.starRating && (
  <StarRating rating={pulse.content.starRating} />
)}
```

---

## 🔗 Related Documentation

- [Full Implementation Guide](./role_based_pulse_implementation.md)
- [API Documentation](./api_documentation.md)
- [Database Schema](./database_schema.md)
