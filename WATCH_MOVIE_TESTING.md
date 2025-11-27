# Watch Movie Feature - Testing Guide

## ✅ What I Fixed

### Issue 1: Video Fields Not Saving/Loading in Admin Panel

**Problem:** You could add video URL, video source, and is_free in the admin form, but when you saved and came back, the fields were empty.

**Root Cause:** The `mapBackendToAdminMovie` function wasn't mapping the video fields from the backend response.

**Fix Applied:**

1. Updated `mapBackendToAdminMovie` to include `videoUrl`, `videoSource`, and `isFree`
2. Updated `handleSaveChanges` payload to include video fields
3. Updated `handlePublishToBackend` payload to include video fields (already done)

## 🧪 How to Test

### Step 1: Add Video URL to The Matrix

1. Go to: `http://localhost:3000/admin/movies`
2. Find "The Matrix" and click to edit
3. Scroll down to the "Video Playback" section in the "Basic Information" tab
4. Enter:
   - **Video URL**: `https://www.youtube.com/watch?v=m8e-FF8MsqU` (The Matrix trailer)
   - **Video Source**: Select "YouTube"
   - **Free to watch**: Check the box
5. Click **"Publish to Backend"** button
6. Wait for success message

### Step 2: Verify Fields Are Saved

1. After seeing the success message, **refresh the page** or navigate away and back
2. The video fields should still be filled with the values you entered
3. If they're empty, there's still an issue

### Step 3: Test Watch Now Button

1. The success message should show you the movie ID (UUID)
2. Navigate to: `http://localhost:3000/movies/[the-uuid-from-success-message]`
   - Example: `http://localhost:3000/movies/b22df09d-cc47-49ff-a1c7-d1fbf639c470`
3. You should see a **"Watch Now"** button in the hero section
4. Click it to open the video player modal
5. The YouTube video should start playing

## 🔍 Troubleshooting

### If Video Fields Are Still Empty After Save:

1. Check browser console for errors
2. Check if the backend API is returning the video fields:
   ```bash
   curl http://localhost:8000/api/v1/movies/b22df09d-cc47-49ff-a1c7-d1fbf639c470
   ```
3. Look for `videoUrl`, `video_url`, `videoSource`, `video_source` in the response

### If Watch Now Button Doesn't Appear:

1. Check browser console for errors
2. Verify the movie data has `videoUrl` field:
   - Open browser DevTools
   - Go to Network tab
   - Refresh the movie page
   - Find the API call to `/api/v1/movies/[id]`
   - Check if the response includes `videoUrl` or `video_url`

### If Video Player Doesn't Open:

1. Check browser console for errors
2. Verify `react-youtube` is installed:
   ```bash
   cd frontend
   npm list react-youtube
   ```

## 📝 Movie ID for The Matrix

Based on your message, The Matrix movie ID is:
**b22df09d-cc47-49ff-a1c7-d1fbf639c470**

Test URL: `http://localhost:3000/movies/b22df09d-cc47-49ff-a1c7-d1fbf639c470`

## ⚠️ About Parasite Movie

You mentioned Parasite disappeared. This could be:

1. **Status issue** - Movie might be set to "draft" instead of "released"
2. **Deleted** - Movie might have been accidentally deleted
3. **Filter issue** - Frontend might be filtering it out

To check, run:

```bash
python -c "import asyncio; import sys; sys.path.append('.'); from backend.src import db; from sqlalchemy import text; async def check(): await db.init_db(); async with db.SessionLocal() as s: r = await s.execute(text(\"SELECT id, external_id, title, status FROM movies WHERE title ILIKE '%parasite%'\")); movies = r.fetchall(); print('Parasite movies:'); [print(f'ID: {m[0]}, External ID: {m[1]}, Title: {m[2]}, Status: {m[3]}') for m in movies]; asyncio.run(check())"
```
