"""
Simple TMDB API Fetch Test
Tests if we can fetch data from TMDB API
"""
import requests

TMDB_API_KEY = "eeac973dbc7c5c2dd0936d2e3e1eaf9f"

print("=" * 60)
print("TMDB API SIMPLE FETCH TEST")
print("=" * 60)

# Test 1: Fetch Now Playing Movies
print("\n[Test 1] Fetching Now Playing Movies...")
try:
    response = requests.get(
        "https://api.themoviedb.org/3/movie/now_playing",
        params={
            "api_key": TMDB_API_KEY,
            "page": 1,
            "language": "en-US"
        },
        timeout=10
    )
    
    if response.status_code == 200:
        data = response.json()
        movies = data.get('results', [])
        print(f"✓ SUCCESS! Fetched {len(movies)} movies")
        
        # Show first 3 movies
        if movies:
            print("\nFirst 3 movies:")
            for i, movie in enumerate(movies[:3], 1):
                print(f"  {i}. {movie.get('title')} ({movie.get('release_date', 'N/A')})")
    else:
        print(f"✗ FAILED! Status code: {response.status_code}")
        print(f"Response: {response.text[:200]}")
        
except requests.exceptions.ConnectionError as e:
    print(f"✗ CONNECTION ERROR: Cannot reach TMDB API")
    print(f"Details: {str(e)[:100]}")
except requests.exceptions.Timeout:
    print(f"✗ TIMEOUT: Request took too long")
except Exception as e:
    print(f"✗ ERROR: {type(e).__name__}: {str(e)[:100]}")

# Test 2: Fetch Popular Movies
print("\n[Test 2] Fetching Popular Movies...")
try:
    response = requests.get(
        "https://api.themoviedb.org/3/movie/popular",
        params={
            "api_key": TMDB_API_KEY,
            "page": 1,
            "language": "en-US"
        },
        timeout=10
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✓ SUCCESS! Total results: {data.get('total_results', 0)}")
    else:
        print(f"✗ FAILED! Status code: {response.status_code}")
        
except Exception as e:
    print(f"✗ ERROR: {type(e).__name__}")

# Test 3: Search for a specific movie
print("\n[Test 3] Searching for 'Inception'...")
try:
    response = requests.get(
        "https://api.themoviedb.org/3/search/movie",
        params={
            "api_key": TMDB_API_KEY,
            "query": "Inception",
            "page": 1
        },
        timeout=10
    )
    
    if response.status_code == 200:
        data = response.json()
        results = data.get('results', [])
        if results:
            first = results[0]
            print(f"✓ SUCCESS! Found: {first.get('title')} (ID: {first.get('id')})")
        else:
            print("✓ API works but no results found")
    else:
        print(f"✗ FAILED! Status code: {response.status_code}")
        
except Exception as e:
    print(f"✗ ERROR: {type(e).__name__}")

print("\n" + "=" * 60)
print("TEST COMPLETE")
print("=" * 60)
