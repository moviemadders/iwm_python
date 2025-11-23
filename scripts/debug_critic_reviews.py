import requests
import sys

API_BASE = "http://localhost:8001/api/v1"
MOVIE_ID = "03d528c6-58d4-41a8-af3e-4ef2248da8fc"

def check_critic_reviews():
    url = f"{API_BASE}/critic-reviews/movie/{MOVIE_ID}"
    print(f"Checking URL: {url}")
    try:
        resp = requests.get(url)
        print(f"Status Code: {resp.status_code}")
        print(f"Headers: {resp.headers}")
        print(f"Response: {resp.text}")
        
        if resp.status_code == 200:
            print("✅ Endpoint working")
            return True
        else:
            print("❌ Endpoint failed")
            return False
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

if __name__ == "__main__":
    check_critic_reviews()
