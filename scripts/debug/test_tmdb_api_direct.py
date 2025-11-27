"""Test TMDB API directly to see if it's working"""
import asyncio
import httpx

TMDB_API_KEY = "eeac973dbc7c5c2dd0936d2e3e1eaf9f"

async def test_tmdb_api():
    print("Testing TMDB API directly...")
    
    async with httpx.AsyncClient(timeout=60) as client:
        try:
            response = await client.get(
                "https://api.themoviedb.org/3/movie/now_playing",
                params={
                    "api_key": TMDB_API_KEY,
                    "page": 1,
                    "language": "en-US",
                },
            )
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"Success! Got {len(data.get('results', []))} movies")
                if data.get('results'):
                    first = data['results'][0]
                    print(f"First movie: {first.get('title')}")
            else:
                print(f"Error response: {response.text}")
                
        except Exception as e:
            print(f"Exception: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_tmdb_api())
