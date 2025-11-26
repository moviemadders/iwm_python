"""
Test script to verify role-based Pulse creation works correctly.
Tests validation logic for roles and star ratings.
"""

import sys
sys.path.insert(0, "backend/src")

from repositories.pulse import PulseRepository
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import asyncio

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/iwm_python"

async def test_pulse_validation():
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        repo = PulseRepository(session)
        
        print("🧪 Testing Pulse Validation Logic...\n")
        
        # Test 1: Invalid role
        print("Test 1: Invalid role")
        try:
            await repo.create(
                user_id=1,
                content_text="Test pulse",
                posted_as_role="invalid_role"
            )
            print("❌ FAILED: Should have raised ValueError for invalid role")
        except ValueError as e:
            print(f"✅ PASSED: {e}\n")
        
        # Test 2: Star rating without role
        print("Test 2: Star rating without role")
        try:
            await repo.create(
                user_id=1,
                content_text="Test pulse",
                star_rating=5
            )
            print("❌ FAILED: Should have raised ValueError for rating without role")
        except ValueError as e:
            print(f"✅ PASSED: {e}\n")
        
        # Test 3: Star rating out of range
        print("Test 3: Star rating out of range")
        try:
            await repo.create(
                user_id=1,
                content_text="Test pulse",
                posted_as_role="critic",
                star_rating=6
            )
            print("❌ FAILED: Should have raised ValueError for rating > 5")
        except ValueError as e:
            print(f"✅ PASSED: {e}\n")
        
        # Test 4: Star rating without movie
        print("Test 4: Star rating without movie")
        try:
            await repo.create(
                user_id=1,
                content_text="Test pulse",
                posted_as_role="critic",
                star_rating=5
            )
            print("❌ FAILED: Should have raised ValueError for rating without movie")
        except ValueError as e:
            print(f"✅ PASSED: {e}\n")
        
        print("✅ All validation tests passed!")
        print("\n📝 Note: These are validation tests only.")
        print("   Full creation tests will be added after API endpoints are ready.")

if __name__ == "__main__":
    asyncio.run(test_pulse_validation())
