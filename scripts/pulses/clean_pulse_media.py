"""
Clean up placeholder media URLs in pulses and optionally add real TMDB images
"""
import asyncio
import sys
import json
sys.path.append('backend/src')

from database import get_session
from sqlalchemy import text

async def clean_pulse_media():
    async for session in get_session():
        print("🔍 Checking for pulses with placeholder media...")
        
        # Find all pulses with placeholder media
        result = await session.execute(
            text("""
                SELECT id, content_media, linked_movie_id 
                FROM pulses 
                WHERE content_media IS NOT NULL 
                AND content_media LIKE '%placeholder%'
            """)
        )
        rows = result.fetchall()
        
        print(f"📊 Found {len(rows)} pulses with placeholder media")
        
        if len(rows) == 0:
            print("✅ No placeholder media found! Database is clean.")
            return
        
        # Clean them up
        cleaned = 0
        for row in rows:
            pulse_id, media_json, movie_id = row
            
            print(f"\n🧹 Cleaning pulse {pulse_id}...")
            print(f"   Current media: {media_json}")
            
            # Option 1: Just remove the placeholder media
            await session.execute(
                text("UPDATE pulses SET content_media = NULL WHERE id = :id"),
                {"id": pulse_id}
            )
            cleaned += 1
            print(f"   ✅ Removed placeholder media")
        
        await session.commit()
        print(f"\n✨ Successfully cleaned {cleaned} pulses!")
        print("🎉 All placeholder media has been removed.")
        print("💡 Tip: Upload real images via the pulse composer to test media display!")
        break

if __name__ == "__main__":
    asyncio.run(clean_pulse_media())
