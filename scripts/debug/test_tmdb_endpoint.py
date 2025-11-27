"""Test TMDB dashboard endpoint to see exact error"""
import asyncio
import httpx

async def test_tmdb_endpoint():
    async with httpx.AsyncClient(timeout=20) as client:
        try:
            # Test with authentication
            # First login to get token
            login_response = await client.post(
                "http://localhost:8000/api/v1/auth/login",
                json={"email": "admin@moviemadders.com", "password": "Admin123!"}
            )
            
            if login_response.status_code == 200:
                token = login_response.json().get("access_token")
                print(f"✓ Logged in successfully")
                
                # Now test TMDB endpoint
                response = await client.get(
                    "http://localhost:8000/api/v1/admin/tmdb/new-releases?category=now_playing&page=1",
                    headers={"Authorization": f"Bearer {token}"}
                )
                
                print(f"\nStatus Code: {response.status_code}")
                print(f"Response: {response.text[:500]}")
                
            else:
                print(f"Login failed: {login_response.status_code}")
                print(login_response.text)
                
        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_tmdb_endpoint())
