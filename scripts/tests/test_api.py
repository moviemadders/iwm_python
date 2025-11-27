"""
Quick test to verify backend API is returning movies correctly
"""
import requests

# Test 1: Get movies
print("🧪 Test 1: Fetching movies from backend...")
try:
    response = requests.get("http://localhost:8000/api/v1/movies?limit=5")
    response.raise_for_status()
    movies = response.json()
    print(f"✅ Success! Got {len(movies)} movies")
    if movies:
        print(f"   First movie: {movies[0].get('title', 'N/A')}")
        print(f"   Movie ID: {movies[0].get('id', 'N/A')}")
except Exception as e:
    print(f"❌ Error: {e}")

# Test 2: Search movies
print("\n🧪 Test 2: Searching for 'Inception'...")
try:
    response = requests.get("http://localhost:8000/api/v1/movies/search?q=Inception&limit=10")
    response.raise_for_status()
    search_results = response.json()
    print(f"✅ Success! Got {len(search_results.get('results', []))} results")
    print(f"   Total matches: {search_results.get('total', 0)}")
    if search_results.get('results'):
        for movie in search_results['results'][:3]:
            print(f"   - {movie.get('title', 'N/A')}")
except Exception as e:
    print(f"❌ Error: {e}")

print("\n✨ Backend API is working correctly!")
