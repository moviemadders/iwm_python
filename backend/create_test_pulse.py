import asyncio
import uuid
import json
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from src.models import User, Pulse
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5433/iwm")
engine = create_async_engine(DATABASE_URL, echo=True)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def create_pulse():
    async with async_session() as session:
        # Get a user
        result = await session.execute(select(User).limit(1))
        user = result.scalars().first()
        if not user:
            print("No user found!")
            return

        # Create Pulse with Carousel (Images)
        pulse_carousel = Pulse(
            external_id=str(uuid.uuid4()),
            user_id=user.id,
            content_text="Check out these amazing posters! #CarouselTest",
            content_media=json.dumps([
                {"type": "image", "url": "https://image.tmdb.org/t/p/original/qJ2tW6WMUDux911r6m7haRef0WH.jpg"},
                {"type": "image", "url": "https://image.tmdb.org/t/p/original/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg"},
                {"type": "image", "url": "https://image.tmdb.org/t/p/original/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg"}
            ]),
            hashtags=json.dumps(["CarouselTest", "Movies"]),
            reactions_total=0,
            comments_count=0,
            shares_count=0
        )
        session.add(pulse_carousel)

        # Create Pulse with Video
        pulse_video = Pulse(
            external_id=str(uuid.uuid4()),
            user_id=user.id,
            content_text="Here is a cool video trailer! #VideoTest",
            content_media=json.dumps([
                {"type": "video", "url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"}
            ]),
            hashtags=json.dumps(["VideoTest", "Trailer"]),
            reactions_total=0,
            comments_count=0,
            shares_count=0
        )
        session.add(pulse_video)

        await session.commit()
        print("✅ Created test pulses with Carousel and Video!")

if __name__ == "__main__":
    asyncio.run(create_pulse())
