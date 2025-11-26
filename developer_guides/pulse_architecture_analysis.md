# Pulse Architecture Analysis: Movie-Hashtag Relations & Feature Access Points

## Overview
This document provides a comprehensive analysis of the Pulse architecture, focusing on how movies use hashtags, the database relationships, and all locations where pulse features are accessed.

---

## 🏗️ Database Architecture

### Core Pulse Tables

#### 1. **Pulse** (Main Table)
**Location**: `backend/src/models.py` (Lines 783-814)

```python
class Pulse(Base):
    __tablename__ = "pulses"
    
    # Identity
    id: int (primary key)
    external_id: str (unique, indexed)
    
    # User Relationship
    user_id: int (FK to users.id)
    user: relationship to User
    
    # Content
    content_text: str (text)
    content_media: str (JSON array - nullable)
    
    # 🎬 MOVIE LINKING
    linked_type: str (e.g., "movie" or "cricket")
    linked_external_id: str
    linked_title: str
    linked_poster_url: str
    linked_movie_id: int (FK to movies.id - nullable)
    linked_movie: relationship to Movie
    
    # 🏷️ HASHTAGS
    hashtags: str (JSON array of strings)
    
    # Engagement Metrics
    reactions_json: str (JSON object with reaction counts)
    reactions_total: int (default 0)
    comments_count: int (default 0)
    shares_count: int (default 0)
    
    # Timestamps
    created_at: datetime (indexed)
    edited_at: datetime (nullable)
    
    # Relationships
    reactions: List[PulseReaction]
    comments: List[PulseComment]
```

**Key Movie-Hashtag Architecture**:
- ✅ Movies link to pulses via `linked_movie_id` (foreign key)
- ✅ Hashtags stored as JSON array in `hashtags` field
- ✅ Each pulse can be tagged with both a movie AND multiple hashtags

#### 2. **PulseReaction**
**Location**: `backend/src/models.py` (Lines 815-829)

```python
class PulseReaction(Base):
    __tablename__ = "pulse_reactions"
    
    id: int (primary key)
    user_id: int (FK to users.id)
    pulse_id: int (FK to pulses.id)
    type: str (love, fire, mindblown, laugh, sad, angry)
    created_at: datetime
    
    # Unique constraint: one reaction per user per pulse
    UniqueConstraint("user_id", "pulse_id")
```

#### 3. **PulseComment**
**Location**: `backend/src/models.py` (Lines 831-844)

```python
class PulseComment(Base):
    __tablename__ = "pulse_comments"
    
    id: int (primary key)
    external_id: str (unique, indexed)
    user_id: int (FK to users.id)
    pulse_id: int (FK to pulses.id)
    content: str (text)
    created_at: datetime
    updated_at: datetime (nullable)
```

#### 4. **PulseBookmark**
**Location**: `backend/src/models.py` (Lines 846-859)

```python
class PulseBookmark(Base):
    __tablename__ = "pulse_bookmarks"
    
    id: int (primary key)
    user_id: int (FK to users.id)
    pulse_id: int (FK to pulses.id)
    created_at: datetime
    
    # Unique constraint: one bookmark per user per pulse
    UniqueConstraint("user_id", "pulse_id")
```

#### 5. **UserFollow**
**Location**: `backend/src/models.py` (Lines 774-781)

```python
class UserFollow(Base):
    __tablename__ = "user_follows"
    
    id: int (primary key)
    follower_id: int (FK to users.id)
    following_id: int (FK to users.id)
    created_at: datetime
```

#### 6. **TrendingTopic**
**Location**: `backend/src/models.py` (Lines 863-872)

```python
class TrendingTopic(Base):
    __tablename__ = "trending_topics"
    
    id: int (primary key)
    tag: str (indexed - hashtag text)
    category: str (movie | cricket | event | general)
    window_label: str (default "7d")
    count: int (default 0)
    computed_at: datetime
```

---

## 🔗 Movie-Hashtag Relationship Diagram

```
┌─────────────────┐
│     Movie       │
│  (movies.id)    │
└────────┬────────┘
         │
         │ FK: linked_movie_id
         │
         ▼
┌─────────────────────────────────┐
│          Pulse                  │
│  ┌──────────────────────────┐  │
│  │ linked_movie_id (FK)     │  │
│  │ linked_type: "movie"     │  │
│  │ linked_external_id       │  │
│  │ linked_title             │  │
│  │ linked_poster_url        │  │
│  ├──────────────────────────┤  │
│  │ hashtags: JSON array     │  │
│  │   ["#Oppenheimer",       │  │
│  │    "#ChristopherNolan"]  │  │
│  └──────────────────────────┘  │
└─────────────────────────────────┘
         │
         ├──► PulseReaction (likes, etc.)
         ├──► PulseComment
         └──► PulseBookmark
```

**How It Works**:
1. User creates a pulse about a movie
2. Pulse stores `linked_movie_id` to link to the movie
3. Hashtags are extracted from content and stored in `hashtags` JSON array
4. Users can filter feed by hashtag to see all pulses with that tag
5. Movie page can show all pulses linked to that specific movie

---

## 🚀 Backend API Endpoints

**Location**: `backend/src/routers/pulse.py`

### Pulse Feed & Discovery

| Endpoint | Method | Description | Hashtag Support |
|----------|--------|-------------|-----------------|
| `/api/v1/pulse/feed` | GET | Get pulse feed with filters | ✅ `?hashtag=xyz` |
| `/api/v1/pulse/trending-topics` | GET | Get trending hashtags | ✅ Returns hashtag list |

**Feed Filters**:
- `filter`: latest, popular, following, trending
- `window`: 24h, 7d, 30d
- `page`: pagination
- `limit`: items per page
- `viewerId`: optional viewer context
- **`hashtag`**: Filter by specific hashtag ✅

### Pulse CRUD Operations

| Endpoint | Method | Description | Movie/Hashtag Fields |
|----------|--------|-------------|----------------------|
| `/api/v1/pulse` | POST | Create pulse | `linkedMovieId`, `hashtags[]` |
| `/api/v1/pulse/{id}` | DELETE | Delete pulse | - |

**Create Pulse Request Body**:
```json
{
  "contentText": "Just watched Oppenheimer!",
  "contentMedia": ["url1", "url2"],
  "linkedMovieId": "movie-oppenheimer-2023",
  "hashtags": ["#Oppenheimer", "#ChristopherNolan"]
}
```

### Pulse Interactions

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/pulse/{id}/reactions` | POST | Toggle reaction |
| `/api/v1/pulse/{id}/comments` | POST | Add comment |
| `/api/v1/pulse/{id}/comments` | GET | Get comments |
| `/api/v1/pulse/{id}/bookmark` | POST | Bookmark pulse |
| `/api/v1/pulse/{id}/bookmark` | DELETE | Unbookmark pulse |
| `/api/v1/pulse/{id}/share` | POST | Share pulse |

---

## 📊 Backend Repository Layer

**Location**: `backend/src/repositories/pulse.py`

### PulseRepository Methods

#### Feed & Discovery
- `list_feed()` - Get feed with hashtag filtering
  - **Supports hashtag parameter** ✅
  - Filters: latest, popular, following, trending
  - Window: 24h, 7d, 30d
- `trending_topics()` - Get trending hashtags
  - Analyzes pulse hashtags
  - Returns top hashtags by count

#### CRUD Operations
- `create()` - Create new pulse
  - **Accepts `linked_movie_id` parameter** 🎬
  - **Accepts `hashtags` array parameter** 🏷️
  - Links movie via foreign key
  - Stores hashtags as JSON
- `delete()` - Delete pulse (owner only)

#### Engagement
- `toggle_reaction()` - Add/remove reaction
- `add_comment()` - Add comment
- `get_comments()` - Get comments with pagination
- `bookmark_pulse()` - Add bookmark
- `unbookmark_pulse()` - Remove bookmark
- `share_pulse()` - Increment share count

#### User Interactions
- `follow_user()` - Follow user
- `unfollow_user()` - Unfollow user
- `is_following()` - Check follow status
- `get_follower_count()` - Get follower count
- `get_following_count()` - Get following count

---

## 🎨 Frontend Architecture

### Type Definitions

**Location**: `frontend/types/pulse.ts`

Key interfaces for movie-hashtag support:

```typescript
// Pulse post with movie linking
export interface PulsePost {
  id: string
  userId: string
  userInfo: PulseUserInfo
  content: {
    text: string
    media?: PulseMedia[]
    linkedContent?: {        // 🎬 MOVIE LINK
      type: string          // "movie"
      id: string
      title: string
      posterUrl?: string
    }
    hashtags?: string[]      // 🏷️ HASHTAGS
  }
  engagement: {...}
  timestamp: string
}

// Trending hashtag topic
export interface TrendingTopic {
  id: string
  hashtag: string
  pulse_count: number
  trend_rank: number
  is_rising: boolean
}
```

### API Client

**Location**: `frontend/lib/api/pulses.ts`

```typescript
// Create pulse with movie & hashtags
interface PulseCreateData {
  contentText: string
  contentMedia?: string[]
  linkedMovieId?: string    // 🎬 Movie link
  hashtags?: string[]       // 🏷️ Hashtags
}

// API Functions
- createPulse(data: PulseCreateData)
- deletePulse(pulseId: string)
- toggleReaction(pulseId: string, type: string)
- createComment(pulseId: string, content: string)
- getComments(pulseId: string, page: number)
```

---

## 📍 All Pulse Feature Access Points

### Backend Access Points

#### 1. **Router Layer**
- `backend/src/routers/pulse.py` - All pulse API endpoints
- `backend/src/routers/users.py` - Uses PulseRepository for follow stats

#### 2. **Repository Layer**
- `backend/src/repositories/pulse.py` - All pulse business logic

#### 3. **Database Models**
- `backend/src/models.py`:
  - Lines 774-781: UserFollow
  - Lines 783-814: Pulse
  - Lines 815-829: PulseReaction
  - Lines 831-844: PulseComment
  - Lines 846-859: PulseBookmark
  - Lines 863-872: TrendingTopic

#### 4. **Migrations**
- `backend/alembic/versions/d2ca5accbc79_add_pulse_domain.py`
- `backend/versions/eb02a63d64d9_add_pulsebookmark.py`
- `backend/versions/d2ca5accbc79_add_pulse_domain.py`
- `backend/versions/982c56c4934d_remove_like_count_from_pulsebookmark.py`
- `backend/versions/58172f66d20a_add_missing_pulse_tables.py`

### Frontend Access Points

#### 1. **Pages**
- `frontend/app/pulse/page.tsx` - Main pulse feed page
- `frontend/app/pulse/enhanced/page.tsx` - Enhanced pulse page
- `frontend/app/page.tsx` - Homepage (includes pulse section)
- `frontend/app/recent/page.tsx` - Recent activity
- `frontend/app/movies/[id]/page.tsx` - Movie detail page (may show related pulses)
- `frontend/app/industry/profile/[id]/page.tsx` - Industry profile (pulse section)
- `frontend/app/critic/[username]/review/[slug]/page.tsx` - Critic review
- `frontend/app/critic/[username]/blog/[slug]/page.tsx` - Critic blog
- `frontend/app/critics/page.tsx` - Critics listing

#### 2. **Main Components**

**Pulse Feed Components**:
- `frontend/components/pulse/feed/pulse-feed.tsx` - Main feed container
- `frontend/components/pulse/feed/pulse-card.tsx` - Individual pulse card
- `frontend/components/pulse/feed/pulse-card-header.tsx` - Card header
- `frontend/components/pulse/feed/pulse-card-content.tsx` - Card content with **hashtag highlighting** 🏷️
- `frontend/components/pulse/feed/pulse-card-actions.tsx` - Card actions

**Pulse Composer**:
- `frontend/components/pulse/composer/pulse-composer.tsx` - Create pulse form
  - **Extracts hashtags from content** 🏷️
  - **Supports movie tagging** 🎬
  - Uses: `import { createPulse } from '@/lib/api/pulses'`

**Layout Components**:
- `frontend/components/pulse/pulse-page-layout.tsx` - Page layout
- `frontend/components/pulse/pulse-header.tsx` - Page header
- `frontend/components/pulse/pulse-feed-container.tsx` - Feed container

**Sidebar Components**:
- `frontend/components/pulse/left-sidebar/pulse-left-sidebar.tsx` - Navigation
- `frontend/components/pulse/right-sidebar/pulse-right-sidebar.tsx` - Trending & suggestions
- `frontend/components/pulse/right-sidebar/trending-topics.tsx` - **Trending hashtags** 🏷️

**Other Components**:
- `frontend/components/pulse/pulse-skeleton.tsx` - Loading skeleton
- `frontend/components/pulse/pulse-card.tsx` - Alternative card component
- `frontend/components/pulse/pulse-composer.tsx` - Alternative composer
- `frontend/components/pulse/enhanced-pulse-composer.tsx` - Enhanced composer
- `frontend/components/pulse/enhanced-pulse-card.tsx` - Enhanced card

#### 3. **Homepage Integration**
- `frontend/components/homepage/trending-pulse-section.tsx` - Trending pulses
- `frontend/components/homepage/pulse-trending-card.tsx` - Trending card
- `frontend/components/homepage/pulse-card-carousel.tsx` - Carousel
- `frontend/components/siddu-pulse-section.tsx` - Siddu pulse section

#### 4. **Industry Profiles**
- `frontend/components/industry-profiles/view/tabs/profile-pulses.tsx` - Profile pulse tab
- `frontend/components/industry-profiles/create/steps/pulse-management-step.tsx` - Pulse management

#### 5. **Search**
- `frontend/components/search/results/pulse-results.tsx` - Pulse search results

#### 6. **Utilities**
- `frontend/lib/api/pulses.ts` - API client
- `frontend/types/pulse.ts` - TypeScript types
- `frontend/lib/pulse/mock-pulse-posts.ts` - Mock data
- `frontend/components/pulse/mock-data.ts` - Mock data with **hashtag examples** 🏷️
- `frontend/components/pulse/types.ts` - Component types

#### 7. **Legacy/Alternative Components**
- `frontend/components/pulse-card.tsx` - Alternative pulse card
- `frontend/components/pulse/main-feed/pulse-main-feed.tsx` - Alternative feed

---

## 🎬 Movie Integration with Pulse

### How Movies Use Hashtags in Pulse

1. **User creates pulse about a movie**:
   ```typescript
   createPulse({
     contentText: "Just watched #Oppenheimer and it was mind-blowing! 🤯",
     linkedMovieId: "movie-oppenheimer-2023",
     hashtags: ["#Oppenheimer", "#ChristopherNolan", "#IMAX"]
   })
   ```

2. **Backend stores**:
   - Movie link via `linked_movie_id` foreign key
   - Hashtags as JSON array: `["#Oppenheimer", "#ChristopherNolan", "#IMAX"]`

3. **Users can discover**:
   - Filter feed by hashtag: `GET /api/v1/pulse/feed?hashtag=Oppenheimer`
   - View trending hashtags: `GET /api/v1/pulse/trending-topics`
   - See all pulses for a movie (via `linked_movie_id`)

### Where Movie-Pulse Features Are Accessed

| Location | Purpose | Movie Support | Hashtag Support |
|----------|---------|---------------|-----------------|
| Pulse Composer | Create pulse about movie | ✅ LinkedMovieId | ✅ Auto-extract |
| Pulse Feed | Browse pulses | ✅ Show movie card | ✅ Hashtag links |
| Movie Page | Movie discussion | ✅ Show related pulses | ✅ Movie hashtags |
| Trending Topics | Discover trending | ✅ Movie category | ✅ Full support |
| Search Results | Search pulses | ✅ Movie filter | ✅ Hashtag filter |

---

## 🔍 Hashtag Processing Flow

### Frontend: Hashtag Extraction
**Location**: `frontend/components/pulse/composer/pulse-composer.tsx` (Lines 67-69)

```typescript
// Extract hashtags from content
const hashtagRegex = /#(\w+)/g
const hashtags = content.match(hashtagRegex) || []
```

### Backend: Hashtag Storage
**Location**: `backend/src/repositories/pulse.py` (create method)

```python
# Store hashtags as JSON
pulse.hashtags = json.dumps(hashtags) if hashtags else None
```

### Frontend: Hashtag Display
**Location**: `frontend/components/pulse/feed/pulse-card-content.tsx` (Line 25)

```typescript
// Highlight hashtags and mentions
// Renders hashtags as clickable links
```

---

## 📋 Summary

### Database Schema
- ✅ **Pulse table** has `linked_movie_id` (FK to movies)
- ✅ **Pulse table** has `hashtags` (JSON array)
- ✅ **TrendingTopic table** tracks trending hashtags
- ✅ Separate tables for reactions, comments, bookmarks

### Backend (Python/FastAPI)
- ✅ **8 REST endpoints** for pulse operations
- ✅ **PulseRepository** handles all business logic
- ✅ Hashtag filtering in feed
- ✅ Trending hashtag calculation
- ✅ Movie linking via foreign key

### Frontend (Next.js/React)
- ✅ **50+ files** access pulse features
- ✅ Main pulse pages: `/pulse/*`
- ✅ Pulse composer extracts hashtags automatically
- ✅ Trending topics sidebar shows hashtags
- ✅ Movie tagging in composer
- ✅ Homepage integration
- ✅ Industry profile integration
- ✅ Search integration

### Movie-Hashtag Architecture
- ✅ Movies link to pulses via `linked_movie_id`
- ✅ Hashtags stored as JSON array in pulse
- ✅ Users can filter by hashtag or movie
- ✅ Trending system tracks popular hashtags
- ✅ Full integration across platform
