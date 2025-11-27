import asyncio
import aiohttp
import sys

async def test_user_endpoint():
    async with aiohttp.ClientSession() as session:
        async with session.get("http://localhost:8000/api/v1/users/user1") as resp:
            if resp.status != 200:
                print(f"Failed: {resp.status}")
                text = await resp.text()
                print(text)
                return
            
            data = await resp.json()
            print("User ID:", data.get('id') or data.get('external_id'))
            print("Username:", data.get('username'))
            print("Full data:", data)

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(test_user_endpoint())
