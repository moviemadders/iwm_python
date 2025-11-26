import asyncio
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

# Use hardcoded token if available, or try to login
# For now let's assume we can get a token or just hit the endpoint if it was public (it's not)
# I'll try to use the login endpoint first

BASE_URL = "http://localhost:8000/api/v1"
EMAIL = "user1@iwm.com"
PASSWORD = "rmrnn0077"

async def test_endpoints():
    async with httpx.AsyncClient() as client:
        # 1. Login
        print("Logging in...")
        try:
            # LoginBody expects JSON
            resp = await client.post(f"{BASE_URL}/auth/login", json={"email": EMAIL, "password": PASSWORD})
            if resp.status_code != 200:
                print(f"Login failed: {resp.status_code} {resp.text}")
                # Try with seeded credentials if known, otherwise I might need to skip auth or use a known token
                # Let's try to read the token from a file if I can't login, but I don't have access to browser storage
                return
            
            token = resp.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            print("Login successful")

            # 2. Test /roles endpoint
            print("\nTesting /roles endpoint...")
            resp = await client.get(f"{BASE_URL}/roles", headers=headers)
            print(f"Status: {resp.status_code}")
            if resp.status_code != 200:
                print(f"Error: {resp.text}")

            # 3. Test /pulse creation
            print("\nTesting /pulse creation...")
            pulse_data = {
                "contentText": "Test pulse from script",
                "postedAsRole": "personal" # Should be ignored/handled now
            }
            # Actually, my fix changed it so "personal" sends undefined/null for role
            # But let's see what happens if I send it, or if I send empty
            
            # The frontend sends:
            # postedAsRole: (selectedRole && selectedRole !== "personal") ? selectedRole : undefined
            
            # So if I send "personal", the backend might still complain if I didn't update the backend validation?
            # Wait, I updated the frontend to NOT send "personal".
            # But the backend validation `if body.postedAsRole not in user_roles:` might still be there?
            # Let's check backend/src/routers/pulse.py again.
            
            resp = await client.post(f"{BASE_URL}/pulse", json=pulse_data, headers=headers)
            print(f"Status: {resp.status_code}")
            if resp.status_code != 200:
                print(f"Error: {resp.text}")

            # 4. Test /pulse/feed
            print("\nTesting /pulse/feed...")
            resp = await client.get(f"{BASE_URL}/pulse/feed?limit=5", headers=headers)
            print(f"Status: {resp.status_code}")
            if resp.status_code != 200:
                print(f"Error: {resp.text}")
            else:
                print(f"Feed items: {len(resp.json())}")

        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"Exception: {repr(e)}")

if __name__ == "__main__":
    asyncio.run(test_endpoints())
