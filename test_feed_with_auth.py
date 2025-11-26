import asyncio
import httpx

async def test_feed_with_auth():
    async with httpx.AsyncClient() as client:
        # 1. Login
        login_resp = await client.post(
            "http://localhost:8000/api/v1/auth/login",
            json={"email": "user1@iwm.com", "password": "rmrnn0077"}
        )
        print(f"Login: {login_resp.status_code}")
        
        if login_resp.status_code == 200:
            token = login_resp.json()["access_token"]
            
            # 2. Test feed WITH auth headers (like browser does)
            headers = {
                "Authorization": f"Bearer {token}",
                "Origin": "http://localhost:3000"
            }
            
            try:
                feed_resp = await client.get(
                    "http://localhost:8000/api/v1/pulse/feed?filter=latest&limit=1",
                    headers=headers
                )
                print(f"Feed status: {feed_resp.status_code}")
                if feed_resp.status_code != 200:
                    print(f"Error: {feed_resp.text}")
                else:
                    print(f"Success! Got {len(feed_resp.json())} items")
            except Exception as e:
                print(f"Exception: {e}")

if __name__ == "__main__":
    asyncio.run(test_feed_with_auth())
