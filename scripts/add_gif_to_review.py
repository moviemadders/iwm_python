"""
Quick script to add a GIF URL to the existing review for testing
"""
import asyncio
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Database URL
DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost/iwm_db"

# Sample GIF URL from Tenor
GIF_URL = "https://media.tenor.com/fSHRE0v2besAAAAM/mind-blown-amazed.gif"

async def update_review_with_gif():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Update the most recent review
        result = await session.execute(
            update(table("reviews"))
            .where(text("external_id = '7bdeef0f-6803-4ccb-8bfd-ab94d77017a0'"))
            .values(gif_url=GIF_URL)
        )
        await session.commit()
        print(f"✅ Updated review with GIF URL: {GIF_URL}")

if __name__ == "__main__":
    from sqlalchemy import table, column, text
    asyncio.run(update_review_with_gif())
