import asyncio
import aiohttp
import sys

async def test_pulse_feed_with_user():
    async with aiohttp.ClientSession() as session:
        # Test the problematic endpoint
        url = "http://localhost:8000/api/v1/pulse/feed?userId=b6cae7e3-686e-4293-93cb-d712afdf22e4&limit=20"
        print(f"Testing: {url}")
        
        try:
            async with session.get(url) as resp:
                print(f"Status: {resp.status}")
                print(f"Headers: {dict(resp.headers)}")
                
                if resp.status == 200:
                    data = await resp.json()
                    print(f"Success! Got {len(data)} pulses")
                    return
                else:
                    text = await resp.text()
                    print(f"Error response: {text}")
        except Exception as e:
            print(f"Exception: {type(e).__name__}: {e}")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(test_pulse_feed_with_user())
