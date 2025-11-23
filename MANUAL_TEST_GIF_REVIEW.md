# Manual Testing Script - GIF Review Feature

## Complete End-to-End Test

### Step 1: Login
1. Open browser: `http://localhost:3000`
2. Click "Login" button (top right)
3. Enter credentials:
   - Email: `user1@iwm.com`
   - Password: `rmrnn0077`
4. Click "Sign In"
5. ✅ Verify you're logged in (see user avatar/name)

### Step 2: Navigate to Review Creation
1. Go to: `http://localhost:3000/movies/9476599f-c2e2-4067-ab2a-c07abefac440/review/create`
   (The Dark Knight)
2. ✅ Verify page loads with "Write Your Review" heading

### Step 3: Fill Review Form
1. **Rating**: Click on the 9th star (9/10 rating)
2. **Review Text**: Enter this engaging review:
   ```
   An absolute masterpiece! Christopher Nolan's direction is phenomenal, and the performances are outstanding. Heath Ledger's Joker is unforgettable - his portrayal is both terrifying and mesmerizing. This film redefined superhero movies forever and set a new standard for the genre.
   ```

### Step 4: Add GIF
1. Scroll down to "Add Media (Optional)" section
2. Click the **"Search GIFs"** button (with sparkles ✨ icon)
3. ✅ Verify modal opens with "Choose a GIF" title
4. Try one of these:
   - **Option A**: Click "Trending" to see popular GIFs
   - **Option B**: Search for "mind blown" or "amazing"
   - **Option C**: Click category button like "excited" or "fire"
5. Click on any GIF you like
6. ✅ Verify modal closes
7. ✅ Verify GIF appears in the review form with hover-to-remove button

### Step 5: Submit Review
1. Scroll to bottom
2. Click **"Publish Review"** button
3. ✅ Verify success toast appears
4. ✅ Verify redirect to movie page

### Step 6: View Published Review
1. Navigate to: `http://localhost:3000/movies/9476599f-c2e2-4067-ab2a-c07abefac440/reviews`
2. Find your review (should be at the top)
3. ✅ **VERIFY GIF DISPLAYS** at the top of the review
4. ✅ Verify GIF is animating
5. ✅ Verify review text displays below GIF
6. ✅ Verify rating shows correctly

---

## What You Should See

### In Review Creation Form:
```
┌─────────────────────────────────┐
│  Write Your Review              │
├─────────────────────────────────┤
│  ★★★★★★★★★☆  (9/10)           │
├─────────────────────────────────┤
│  [Review text editor]           │
├─────────────────────────────────┤
│  ┌───────────────────────┐     │
│  │   [ANIMATED GIF]      │     │
│  │   (hover shows X)     │     │
│  └───────────────────────┘     │
│  Your selected GIF will appear  │
│  at the top of your review      │
├─────────────────────────────────┤
│  [ ] Contains Spoilers          │
├─────────────────────────────────┤
│  [Publish Review]               │
└─────────────────────────────────┘
```

### In Published Review:
```
┌─────────────────────────────────┐
│  user1 ⭐ 9/10                  │
├─────────────────────────────────┤
│  ┌───────────────────────┐     │
│  │                       │     │
│  │   [ANIMATED GIF]      │     │
│  │   (mind blown/etc)    │     │
│  │                       │     │
│  └───────────────────────┘     │
├─────────────────────────────────┤
│  An absolute masterpiece!       │
│  Christopher Nolan's direction  │
│  is phenomenal...               │
│                                 │
│  [Full review text]             │
├─────────────────────────────────┤
│  👍 Helpful  💬 Comment         │
└─────────────────────────────────┘
```

---

## Troubleshooting

### GIF Picker Button Not Visible
- Make sure frontend is running: `cd frontend && npm run dev`
- Check browser console for errors
- Try hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

### GIF Picker Opens But No GIFs
- Check browser Network tab for Tenor API calls
- Verify API key in `frontend/lib/api/tenor.ts`
- Check internet connection

### GIF Not Appearing in Review
- Check browser console for errors during submission
- Verify backend is running on port 8000 or 8001
- Check backend logs for errors

### Review Submits But GIF Missing
- This means we need to update the review display component
- Let me know and I'll add GIF display to the review cards

---

## Expected Database Entry

After submission, check the database:
```sql
SELECT id, rating, gif_url, content 
FROM reviews 
WHERE user_id = (SELECT id FROM users WHERE email = 'user1@iwm.com')
ORDER BY date DESC 
LIMIT 1;
```

You should see:
- `rating`: 9.0
- `gif_url`: https://media.tenor.com/... (full Tenor URL)
- `content`: Your review text

---

## Next Steps After Testing

Once you confirm the GIF picker works:
1. I'll update the review display components to show GIFs
2. I'll add GIF display to the review cards on the reviews page
3. I'll ensure GIFs look great in all review contexts

**Please test and let me know what you see!** 🎬
