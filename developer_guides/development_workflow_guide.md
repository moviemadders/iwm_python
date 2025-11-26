# 🚀 Full-Stack Development Workflow Guide
## FastAPI (Backend) + Next.js (Frontend) Best Practices

**Version**: 1.0  
**Stack**: Python FastAPI + PostgreSQL + Next.js + TypeScript  
**Author**: Movie Madders Development Team  
**Last Updated**: November 2025

---

## 📖 Table of Contents

1. [Overview](#overview)
2. [The Golden Rule](#the-golden-rule)
3. [Complete Development Workflow](#complete-development-workflow)
4. [Phase-by-Phase Guide](#phase-by-phase-guide)
5. [Real-World Example](#real-world-example)
6. [Common Patterns](#common-patterns)
7. [Troubleshooting](#troubleshooting)
8. [Checklists](#checklists)

---

## 🎯 Overview

### Why Backend-First?

✅ **Clear API Contract** - Frontend knows exactly what to expect  
✅ **Early Bug Detection** - Test backend logic before UI integration  
✅ **Type Safety** - Generate TypeScript types from backend models  
✅ **Parallel Development** - Different developers can work simultaneously  
✅ **Easier Debugging** - Isolate issues to specific layers  

### The Stack

```
┌─────────────────────────────────┐
│   Frontend (Next.js + React)    │
│   - TypeScript                  │
│   - Tailwind CSS                │
│   - React Query (optional)      │
└────────────┬────────────────────┘
             │ REST API
             │ JSON
┌────────────▼────────────────────┐
│   Backend (FastAPI + Python)    │
│   - Pydantic Models             │
│   - SQLAlchemy ORM              │
│   - Alembic Migrations          │
└────────────┬────────────────────┘
             │ SQL
┌────────────▼────────────────────┐
│   Database (PostgreSQL)         │
│   - Relational Tables           │
│   - Foreign Keys                │
│   - Indexes                     │
└─────────────────────────────────┘
```

---

## 🔑 The Golden Rule

> **Always build from the database up, never from the UI down.**

**Correct Flow**: `Database → Backend → API → Types → Frontend`  
**Wrong Flow**: ~~`UI → Mock Data → Backend → Database`~~

---

## 📋 Complete Development Workflow

### 🎨 The 9-Step Process

```
┌──────────────────────────────────────────────────────────┐
│  BACKEND PHASE (Steps 1-5)                               │
├──────────────────────────────────────────────────────────┤
│  1. ✏️  Design Database Schema                           │
│  2. 🗄️  Create Models & Migration                        │
│  3. 🧪  Apply Migration & Verify                         │
│  4. 🔧  Build Repository Layer                           │
│  5. 🌐  Create API Endpoints                             │
├──────────────────────────────────────────────────────────┤
│  TESTING PHASE (Steps 6-7)                               │
├──────────────────────────────────────────────────────────┤
│  6. 🧪  Write/Run API Tests                              │
│  7. 📮  Manual Testing (Postman)                         │
├──────────────────────────────────────────────────────────┤
│  FRONTEND PHASE (Steps 8-9)                              │
├──────────────────────────────────────────────────────────┤
│  8. 📘  Create TypeScript Types                          │
│  9. 🎨  Build UI Components                              │
└──────────────────────────────────────────────────────────┘
```

---

## 🔨 Phase-by-Phase Guide

### Phase 1: Database Design (Day 1 - Morning)

#### Step 1: Design Database Schema

**Time**: 30-60 minutes  
**Location**: Whiteboard / Notepad / Draw.io

**Checklist**:
- [ ] Identify all entities (tables)
- [ ] Define fields for each table
- [ ] Determine data types
- [ ] Plan relationships (1-to-1, 1-to-many, many-to-many)
- [ ] Identify foreign keys
- [ ] Plan indexes for query performance
- [ ] Consider unique constraints
- [ ] Plan for soft deletes (is_deleted flag)

**Example Schema**:
```
Table: pulse_reactions
├── id (int, PK, auto-increment)
├── external_id (string, unique, indexed)
├── user_id (int, FK → users.id)
├── pulse_id (int, FK → pulses.id)
├── type (string: love, fire, mindblown, laugh, sad, angry)
├── created_at (datetime, default: now)
└── UNIQUE(user_id, pulse_id)
```

**Pro Tips**:
- Use `external_id` for public-facing IDs (UUID/slug)
- Always add `created_at` and `updated_at` timestamps
- Use `nullable=True` for optional fields
- Index foreign keys and frequently queried fields

---

### Phase 2: Backend Models (Day 1 - Afternoon)

#### Step 2: Create SQLAlchemy Model

**Time**: 20-30 minutes per model  
**Location**: `backend/src/models.py`

**Template**:
```python
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

class PulseReaction(Base):
    __tablename__ = "pulse_reactions"
    
    # Constraints
    __table_args__ = (
        UniqueConstraint("user_id", "pulse_id", name="uq_pulse_reaction_user_pulse"),
    )
    
    # Fields
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    pulse_id: Mapped[int] = mapped_column(ForeignKey("pulses.id"))
    type: Mapped[str] = mapped_column(String(20))  # love, fire, etc.
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user: Mapped["User"] = relationship(lazy="selectin")
    pulse: Mapped["Pulse"] = relationship(back_populates="reactions", lazy="selectin")
```

**Checklist**:
- [ ] Import required SQLAlchemy types
- [ ] Define `__tablename__`
- [ ] Add all fields with correct types
- [ ] Set primary key
- [ ] Add foreign keys
- [ ] Define relationships
- [ ] Add unique constraints
- [ ] Set default values
- [ ] Add indexes

---

#### Step 3: Create Alembic Migration

**Time**: 10 minutes  
**Location**: Terminal

**Commands**:
```bash
# Navigate to backend
cd backend

# Create migration
alembic revision --autogenerate -m "add pulse reactions table"

# Review the generated migration file
# Location: backend/alembic/versions/xxxxx_add_pulse_reactions_table.py

# Apply migration
alembic upgrade head

# Verify in database
psql -d your_database -c "\d pulse_reactions"
```

**Checklist**:
- [ ] Generate migration with descriptive message
- [ ] Review generated SQL
- [ ] Check for any missing indexes
- [ ] Verify foreign key constraints
- [ ] Apply migration to local database
- [ ] Verify table exists in database
- [ ] Test rollback: `alembic downgrade -1`
- [ ] Reapply: `alembic upgrade head`

**Common Issues**:
```python
# ❌ Problem: Foreign key not detected
# Solution: Ensure ForeignKey() is used correctly
user_id = mapped_column(ForeignKey("users.id"))  # ✅ Correct

# ❌ Problem: Relationship not working
# Solution: Add back_populates on both sides
# In PulseReaction:
pulse: Mapped["Pulse"] = relationship(back_populates="reactions")
# In Pulse:
reactions: Mapped[List["PulseReaction"]] = relationship(back_populates="pulse")
```

---

### Phase 3: Backend Repository (Day 1 - Afternoon)

#### Step 4: Create Repository Layer

**Time**: 1-2 hours  
**Location**: `backend/src/repositories/pulse.py` (or new file)

**Purpose**: Encapsulate all database operations

**Template**:
```python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from ..models import PulseReaction, Pulse
import uuid

class PulseReactionRepository:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def toggle_reaction(
        self, 
        user_id: int, 
        pulse_id: str, 
        reaction_type: str
    ) -> dict:
        """Toggle a reaction on a pulse"""
        
        # Find pulse
        pulse_stmt = select(Pulse).where(Pulse.external_id == pulse_id)
        pulse = await self.session.scalar(pulse_stmt)
        if not pulse:
            raise ValueError(f"Pulse {pulse_id} not found")
        
        # Check if reaction exists
        reaction_stmt = select(PulseReaction).where(
            PulseReaction.user_id == user_id,
            PulseReaction.pulse_id == pulse.id
        )
        existing_reaction = await self.session.scalar(reaction_stmt)
        
        if existing_reaction:
            # Same type = remove, different type = update
            if existing_reaction.type == reaction_type:
                await self.session.delete(existing_reaction)
                await self.session.flush()
                return {"action": "removed", "type": None}
            else:
                existing_reaction.type = reaction_type
                await self.session.flush()
                return {"action": "updated", "type": reaction_type}
        else:
            # Create new reaction
            new_reaction = PulseReaction(
                external_id=str(uuid.uuid4()),
                user_id=user_id,
                pulse_id=pulse.id,
                type=reaction_type
            )
            self.session.add(new_reaction)
            await self.session.flush()
            return {"action": "added", "type": reaction_type}
```

**Checklist**:
- [ ] Create repository class
- [ ] Initialize with AsyncSession
- [ ] Implement all CRUD methods
- [ ] Add validation logic
- [ ] Handle errors gracefully
- [ ] Use async/await properly
- [ ] Return consistent data structures
- [ ] Add docstrings

**Common Methods**:
- `create()` - Create new record
- `get_by_id()` - Fetch by ID
- `get_by_external_id()` - Fetch by external ID
- `list()` - List with pagination
- `update()` - Update record
- `delete()` - Delete record
- `exists()` - Check existence

---

### Phase 4: Backend API (Day 2 - Morning)

#### Step 5: Create FastAPI Endpoints

**Time**: 1-2 hours  
**Location**: `backend/src/routers/pulse.py`

**Template**:
```python
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from ..db import get_session
from ..dependencies.auth import get_current_user
from ..models import User
from ..repositories.pulse import PulseReactionRepository

router = APIRouter(prefix="/pulse", tags=["pulse"])

# Request/Response Models
class ReactionRequest(BaseModel):
    type: str = Field(..., pattern="^(love|fire|mindblown|laugh|sad|angry)$")

class ReactionResponse(BaseModel):
    action: str  # added, removed, updated
    type: str | None

# Endpoint
@router.post("/{pulse_id}/reactions", response_model=ReactionResponse)
async def toggle_reaction(
    pulse_id: str,
    body: ReactionRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Toggle a reaction on a pulse"""
    repo = PulseReactionRepository(session)
    
    try:
        result = await repo.toggle_reaction(
            user_id=current_user.id,
            pulse_id=pulse_id,
            reaction_type=body.type,
        )
        await session.commit()
        return result
    except ValueError as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=str(e)
        )
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to toggle reaction"
        )
```

**Checklist**:
- [ ] Define request/response models with Pydantic
- [ ] Add input validation
- [ ] Use dependency injection
- [ ] Implement authentication
- [ ] Add error handling
- [ ] Commit/rollback transactions
- [ ] Return proper HTTP status codes
- [ ] Add OpenAPI documentation

**HTTP Status Codes**:
- `200 OK` - Success
- `201 Created` - Created new resource
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

### Phase 5: Testing (Day 2 - Afternoon)

#### Step 6: Write API Tests

**Time**: 30-60 minutes  
**Location**: `backend/tests/test_pulse_reactions.py`

**Template**:
```python
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

@pytest.mark.asyncio
async def test_toggle_reaction_add(
    client: AsyncClient,
    session: AsyncSession,
    auth_headers: dict,
    test_pulse_id: str
):
    """Test adding a reaction"""
    response = await client.post(
        f"/api/v1/pulse/{test_pulse_id}/reactions",
        json={"type": "love"},
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["action"] == "added"
    assert data["type"] == "love"

@pytest.mark.asyncio
async def test_toggle_reaction_remove(
    client: AsyncClient,
    auth_headers: dict,
    test_pulse_id: str
):
    """Test removing a reaction"""
    # Add reaction first
    await client.post(
        f"/api/v1/pulse/{test_pulse_id}/reactions",
        json={"type": "love"},
        headers=auth_headers
    )
    
    # Remove it
    response = await client.post(
        f"/api/v1/pulse/{test_pulse_id}/reactions",
        json={"type": "love"},
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["action"] == "removed"
    assert data["type"] is None
```

**Run Tests**:
```bash
# Run all tests
pytest

# Run specific test file
pytest backend/tests/test_pulse_reactions.py

# Run with coverage
pytest --cov=backend/src

# Run with verbose output
pytest -v
```

**Checklist**:
- [ ] Test happy path
- [ ] Test error cases (404, 400, 401)
- [ ] Test edge cases
- [ ] Test validation failures
- [ ] Test authentication
- [ ] Test authorization
- [ ] Achieve >80% code coverage

---

#### Step 7: Manual Testing with Postman

**Time**: 20-30 minutes

**Setup**:
1. Open Postman or Thunder Client (VS Code)
2. Create collection: "Pulse Reactions"
3. Set environment variables:
   - `BASE_URL`: `http://localhost:8000`
   - `TOKEN`: Your JWT token

**Test Cases**:

**1. Add Reaction**
```
POST {{BASE_URL}}/api/v1/pulse/pulse-123/reactions
Headers:
  Authorization: Bearer {{TOKEN}}
  Content-Type: application/json
Body:
{
  "type": "love"
}

Expected Response (200):
{
  "action": "added",
  "type": "love"
}
```

**2. Change Reaction**
```
POST {{BASE_URL}}/api/v1/pulse/pulse-123/reactions
Headers:
  Authorization: Bearer {{TOKEN}}
Body:
{
  "type": "fire"
}

Expected Response (200):
{
  "action": "updated",
  "type": "fire"
}
```

**3. Remove Reaction**
```
POST {{BASE_URL}}/api/v1/pulse/pulse-123/reactions
Headers:
  Authorization: Bearer {{TOKEN}}
Body:
{
  "type": "fire"  # Same type again
}

Expected Response (200):
{
  "action": "removed",
  "type": null
}
```

**4. Invalid Type**
```
POST {{BASE_URL}}/api/v1/pulse/pulse-123/reactions
Body:
{
  "type": "invalid"
}

Expected Response (400):
{
  "detail": "Validation error..."
}
```

**5. Pulse Not Found**
```
POST {{BASE_URL}}/api/v1/pulse/invalid-id/reactions
Body:
{
  "type": "love"
}

Expected Response (404):
{
  "detail": "Pulse invalid-id not found"
}
```

**Checklist**:
- [ ] All endpoints return expected status codes
- [ ] Response bodies match schema
- [ ] Validation works correctly
- [ ] Authentication required
- [ ] Error messages are clear
- [ ] Database state is correct after each call

---

### Phase 6: Frontend Types (Day 2 - Afternoon)

#### Step 8: Create TypeScript Types

**Time**: 15-30 minutes  
**Location**: `frontend/types/pulse.ts` or `frontend/lib/api/pulses.ts`

**Template**:
```typescript
// Request type
export interface ToggleReactionRequest {
  type: 'love' | 'fire' | 'mindblown' | 'laugh' | 'sad' | 'angry'
}

// Response type
export interface ToggleReactionResponse {
  action: 'added' | 'removed' | 'updated'
  type: 'love' | 'fire' | 'mindblown' | 'laugh' | 'sad' | 'angry' | null
}

// API client function
export async function toggleReaction(
  pulseId: string,
  type: ToggleReactionRequest['type']
): Promise<ToggleReactionResponse> {
  const response = await fetch(
    `${API_BASE}/api/v1/pulse/${pulseId}/reactions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify({ type }),
    }
  )
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to toggle reaction')
  }
  
  return response.json()
}
```

**Checklist**:
- [ ] Match backend Pydantic models exactly
- [ ] Use TypeScript unions for enums
- [ ] Add JSDoc comments
- [ ] Export all types
- [ ] Create API client functions
- [ ] Add error handling
- [ ] Use type-safe fetch wrappers

**Pro Tips**:
- Use `type` for simple types
- Use `interface` for object shapes
- Use unions (`|`) for multiple possibilities
- Use `null` not `undefined` for nullable fields (matches JSON)

---

### Phase 7: Frontend UI (Day 3)

#### Step 9: Build UI Components

**Time**: 2-4 hours  
**Location**: `frontend/components/pulse/`

**Example Component**:
```typescript
'use client'

import { useState } from 'react'
import { toggleReaction } from '@/lib/api/pulses'
import { Heart, Flame, Zap, Smile, Frown, Angry } from 'lucide-react'

const REACTIONS = [
  { type: 'love', icon: Heart, label: 'Love' },
  { type: 'fire', icon: Flame, label: 'Fire' },
  { type: 'mindblown', icon: Zap, label: 'Mind Blown' },
  { type: 'laugh', icon: Smile, label: 'Laugh' },
  { type: 'sad', icon: Frown, label: 'Sad' },
  { type: 'angry', icon: Angry, label: 'Angry' },
] as const

interface ReactionButtonsProps {
  pulseId: string
  currentReaction?: string | null
  onReactionChange?: () => void
}

export function ReactionButtons({ 
  pulseId, 
  currentReaction,
  onReactionChange 
}: ReactionButtonsProps) {
  const [reaction, setReaction] = useState(currentReaction)
  const [isLoading, setIsLoading] = useState(false)

  const handleReaction = async (type: typeof REACTIONS[number]['type']) => {
    setIsLoading(true)
    try {
      const result = await toggleReaction(pulseId, type)
      setReaction(result.type)
      onReactionChange?.()
    } catch (error) {
      console.error('Failed to toggle reaction:', error)
      // Show error toast
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      {REACTIONS.map(({ type, icon: Icon, label }) => (
        <button
          key={type}
          onClick={() => handleReaction(type)}
          disabled={isLoading}
          className={`
            p-2 rounded-full transition-all
            ${reaction === type 
              ? 'bg-purple-100 text-purple-600' 
              : 'hover:bg-gray-100'
            }
            disabled:opacity-50
          `}
          aria-label={label}
        >
          <Icon className="w-5 h-5" />
        </button>
      ))}
    </div>
  )
}
```

**Checklist**:
- [ ] Import API client function
- [ ] Add loading states
- [ ] Add error handling
- [ ] Show user feedback (toasts, etc.)
- [ ] Update UI optimistically (optional)
- [ ] Handle authentication errors
- [ ] Add accessibility (ARIA labels)
- [ ] Test on mobile
- [ ] Add animations (optional)

---

## 🎓 Real-World Example: Adding "Pulse Bookmarks"

Let's walk through adding a complete feature end-to-end.

### Day 1: Backend

**Morning (2 hours)**

#### 1. Design Schema (15 min)
```
Table: pulse_bookmarks
├── id (int, PK)
├── user_id (int, FK → users.id)
├── pulse_id (int, FK → pulses.id)
├── created_at (datetime)
└── UNIQUE(user_id, pulse_id)
```

#### 2. Create Model (15 min)
```python
# backend/src/models.py
class PulseBookmark(Base):
    __tablename__ = "pulse_bookmarks"
    __table_args__ = (
        UniqueConstraint("user_id", "pulse_id"),
    )
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    pulse_id: Mapped[int] = mapped_column(ForeignKey("pulses.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
```

#### 3. Create Migration (10 min)
```bash
alembic revision --autogenerate -m "add pulse bookmarks"
alembic upgrade head
```

**Afternoon (2 hours)**

#### 4. Add Repository Methods (45 min)
```python
# backend/src/repositories/pulse.py
class PulseRepository:
    # ... existing methods ...
    
    async def bookmark_pulse(self, user_id: int, pulse_id: str):
        """Add bookmark"""
        pulse = await self._get_pulse_by_external_id(pulse_id)
        
        bookmark = PulseBookmark(
            user_id=user_id,
            pulse_id=pulse.id
        )
        self.session.add(bookmark)
        await self.session.flush()
    
    async def unbookmark_pulse(self, user_id: int, pulse_id: str):
        """Remove bookmark"""
        pulse = await self._get_pulse_by_external_id(pulse_id)
        
        stmt = select(PulseBookmark).where(
            PulseBookmark.user_id == user_id,
            PulseBookmark.pulse_id == pulse.id
        )
        bookmark = await self.session.scalar(stmt)
        if bookmark:
            await self.session.delete(bookmark)
            await self.session.flush()
```

#### 5. Add API Endpoints (45 min)
```python
# backend/src/routers/pulse.py
@router.post("/{pulse_id}/bookmark")
async def bookmark_pulse(
    pulse_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    repo = PulseRepository(session)
    await repo.bookmark_pulse(current_user.id, pulse_id)
    await session.commit()
    return {"bookmarked": True}

@router.delete("/{pulse_id}/bookmark")
async def unbookmark_pulse(
    pulse_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    repo = PulseRepository(session)
    await repo.unbookmark_pulse(current_user.id, pulse_id)
    await session.commit()
    return {"bookmarked": False}
```

#### 6. Test with Postman (30 min)
```
POST /api/v1/pulse/pulse-123/bookmark → 200 OK
DELETE /api/v1/pulse/pulse-123/bookmark → 200 OK
```

### Day 2: Frontend

**Morning (1 hour)**

#### 7. Add TypeScript Types (15 min)
```typescript
// frontend/lib/api/pulses.ts
export async function bookmarkPulse(pulseId: string) {
  const response = await fetch(
    `${API_BASE}/api/v1/pulse/${pulseId}/bookmark`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
    }
  )
  if (!response.ok) throw new Error('Failed to bookmark')
  return response.json()
}

export async function unbookmarkPulse(pulseId: string) {
  const response = await fetch(
    `${API_BASE}/api/v1/pulse/${pulseId}/bookmark`,
    {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }
  )
  if (!response.ok) throw new Error('Failed to unbookmark')
  return response.json()
}
```

#### 8. Update Component (45 min)
```typescript
// frontend/components/pulse/feed/pulse-card-actions.tsx
import { bookmarkPulse, unbookmarkPulse } from '@/lib/api/pulses'
import { Bookmark } from 'lucide-react'

export function PulseCardActions({ pulse }: { pulse: PulsePost }) {
  const [isBookmarked, setIsBookmarked] = useState(
    pulse.engagement.hasBookmarked
  )
  
  const handleBookmark = async () => {
    try {
      if (isBookmarked) {
        await unbookmarkPulse(pulse.id)
        setIsBookmarked(false)
      } else {
        await bookmarkPulse(pulse.id)
        setIsBookmarked(true)
      }
    } catch (error) {
      console.error('Bookmark failed:', error)
    }
  }
  
  return (
    <button onClick={handleBookmark}>
      <Bookmark 
        className={isBookmarked ? 'fill-purple-600' : ''} 
      />
    </button>
  )
}
```

#### 9. Test in Browser (30 min)
- Click bookmark button → API called
- Check database → Record created
- Refresh page → Bookmark persists
- Click again → Record deleted

**✅ Total Time: ~6 hours for complete feature**

---

## 🔄 Common Development Patterns

### Pattern 1: CRUD Operations

**Backend**:
```python
# Repository
async def create_item(self, data: dict) -> Item
async def get_item(self, item_id: str) -> Item
async def update_item(self, item_id: str, data: dict) -> Item
async def delete_item(self, item_id: str) -> bool
async def list_items(self, page: int, limit: int) -> List[Item]

# API
POST   /items        → create_item()
GET    /items/{id}   → get_item()
PATCH  /items/{id}   → update_item()
DELETE /items/{id}   → delete_item()
GET    /items        → list_items()
```

**Frontend**:
```typescript
// API Client
export const createItem = (data) => post('/items', data)
export const getItem = (id) => get(`/items/${id}`)
export const updateItem = (id, data) => patch(`/items/${id}`, data)
export const deleteItem = (id) => del(`/items/${id}`)
export const listItems = (params) => get('/items', { params })

// Component
const { data, isLoading } = useQuery(['items'], listItems)
const createMutation = useMutation(createItem)
```

### Pattern 2: Relationships (1-to-Many)

**Example**: User has many Pulses

**Backend**:
```python
class User(Base):
    pulses: Mapped[List["Pulse"]] = relationship(back_populates="user")

class Pulse(Base):
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    user: Mapped["User"] = relationship(back_populates="pulses")
```

**API**:
```python
GET /users/{id}/pulses → List user's pulses
```

**Frontend**:
```typescript
interface User {
  id: string
  pulses?: Pulse[]  // Optional, loaded separately
}
```

### Pattern 3: Many-to-Many

**Example**: Movies ↔ Genres

**Backend**:
```python
movie_genres = Table(
    "movie_genres",
    Base.metadata,
    Column("movie_id", ForeignKey("movies.id")),
    Column("genre_id", ForeignKey("genres.id")),
)

class Movie(Base):
    genres: Mapped[List["Genre"]] = relationship(secondary=movie_genres)
```

### Pattern 4: Soft Deletes

**Backend**:
```python
class Pulse(Base):
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

# Repository
async def delete(self, pulse_id: str):
    pulse = await self.get(pulse_id)
    pulse.is_deleted = True
    pulse.deleted_at = datetime.utcnow()
```

### Pattern 5: Pagination

**Backend**:
```python
async def list_items(
    self, 
    page: int = 1, 
    limit: int = 20
) -> dict:
    offset = (page - 1) * limit
    
    # Get items
    stmt = select(Item).offset(offset).limit(limit)
    items = await self.session.scalars(stmt)
    
    # Get total count
    count_stmt = select(func.count(Item.id))
    total = await self.session.scalar(count_stmt)
    
    return {
        "items": items.all(),
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }
```

**Frontend**:
```typescript
const [page, setPage] = useState(1)
const { data } = useQuery(['items', page], () => getItems({ page }))
```

---

## 🚨 Troubleshooting Guide

### Backend Issues

#### Issue: Migration fails
```bash
alembic.util.exc.CommandError: Target database is not up to date
```
**Solution**:
```bash
alembic current  # Check current version
alembic history  # View all migrations
alembic upgrade head  # Apply all migrations
```

#### Issue: Foreign key constraint fails
```
IntegrityError: (psycopg2.errors.ForeignKeyViolation)
```
**Solution**:
- Ensure parent record exists before creating child
- Check foreign key column name matches exactly
- Verify relationship is bidirectional

#### Issue: Unique constraint violation
```
IntegrityError: duplicate key value violates unique constraint
```
**Solution**:
- Check for existing record before creating
- Use `ON CONFLICT` for upserts
- Add proper error handling

#### Issue: Authentication fails
```
HTTPException: 401 Unauthorized
```
**Solution**:
- Check token is sent in header: `Authorization: Bearer <token>`
- Verify token hasn't expired
- Ensure user exists in database

### Frontend Issues

#### Issue: CORS error
```
Access to fetch at 'http://localhost:8000' has been blocked by CORS policy
```
**Solution** (Backend):
```python
# backend/src/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### Issue: Type errors
```
Property 'xyz' does not exist on type 'ABC'
```
**Solution**:
- Ensure frontend types match backend exactly
- Use optional chaining: `data?.xyz`
- Add proper null checks

#### Issue: API returns 404
```
Failed to fetch: 404 Not Found
```
**Solution**:
- Check URL matches backend route exactly
- Verify backend server is running
- Check API prefix (e.g., `/api/v1/`)

---

## ✅ Quick Reference Checklists

### Starting a New Feature

```
□ Design database schema
□ Create SQLAlchemy model
□ Generate & apply migration
□ Verify database table exists
□ Create repository methods
□ Create API endpoints with Pydantic models
□ Test with Postman
□ Write automated tests
□ Create TypeScript types
□ Create API client functions
□ Build UI components
□ Test end-to-end
```

### Before Committing Code

**Backend**:
```
□ All migrations applied
□ No commented-out code
□ Proper error handling
□ Input validation works
□ Tests pass
□ No hardcoded values
□ Docstrings added
□ Type hints added
```

**Frontend**:
```
□ TypeScript errors fixed
□ No console errors
□ Loading states added
□ Error handling implemented
□ Mobile responsive
□ Accessibility checked
□ Unused imports removed
□ Code formatted
```

### Debugging Checklist

```
□ Check browser console for errors
□ Check network tab for API calls
□ Verify backend logs
□ Check database records
□ Test API with Postman
□ Clear browser cache
□ Restart backend server
□ Check environment variables
```

---

## 📚 Additional Resources

### Documentation
- **FastAPI**: https://fastapi.tiangolo.com/
- **SQLAlchemy**: https://docs.sqlalchemy.org/
- **Alembic**: https://alembic.sqlalchemy.org/
- **Next.js**: https://nextjs.org/docs
- **TypeScript**: https://www.typescriptlang.org/docs

### Tools
- **API Testing**: Postman, Thunder Client (VS Code)
- **Database**: DBeaver, pgAdmin, TablePlus
- **API Docs**: FastAPI auto-docs at `/docs`

---

## 🎯 Summary

### The Golden Path

```
1. Database First  → Schema is your foundation
2. Backend Second  → API is your contract
3. Testing Third   → Verify before integration
4. Frontend Last   → Build on stable foundation
```

### Time Estimates

| Phase | Simple Feature | Medium Feature | Complex Feature |
|-------|----------------|----------------|-----------------|
| Backend (DB + API) | 2-3 hours | 4-6 hours | 1-2 days |
| Testing | 30 mins | 1 hour | 2-4 hours |
| Frontend | 1-2 hours | 3-4 hours | 1-2 days |
| **Total** | **4-6 hours** | **8-11 hours** | **2-4 days** |

### Success Metrics

✅ **Good Development**:
- Backend tests pass
- API works in Postman before frontend starts
- TypeScript catches errors
- Code is reusable
- Features work on first integration

❌ **Bad Development**:
- Frontend built before backend exists
- Mock data doesn't match real API
- Type errors everywhere
- Constant rewrites
- Debugging takes longer than development

---

**Remember**: *Build from the foundation up, test early and often, and your code will be solid!* 🚀
