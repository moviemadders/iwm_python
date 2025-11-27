"""Check if TMDB API key is loaded in settings"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.src.config import settings

print("=== Settings Check ===")
print(f"TMDB API Key present: {bool(settings.tmdb_api_key)}")
if settings.tmdb_api_key:
    print(f"TMDB API Key (first 10 chars): {settings.tmdb_api_key[:10]}...")
else:
    print("TMDB API Key: NOT SET")

print(f"\nDatabase URL: {settings.database_url}")
print(f"Environment: {settings.env}")
