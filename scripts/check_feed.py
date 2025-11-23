import requests
import json

try:
    response = requests.get("http://localhost:8000/api/v1/pulse/feed?filter=latest")
    if response.status_code == 200:
        posts = response.json()
        print(f"✅ Found {len(posts)} posts in the feed\n")
        
        for i, post in enumerate(posts[:5], 1):  # Show first 5
            print(f"--- Post {i} ---")
            print(f"ID: {post['id']}")
            print(f"Author: {post['userInfo']['displayName']} (@{post['userInfo']['username']})")
            print(f"Content: {post['content']['text'][:100]}...")
            print(f"Reactions: {post['engagement']['reactions']['total']}")
            print(f"Comments: {post['engagement']['comments']}")
            print(f"Created: {post['timestamp']}")
            print()
    else:
        print(f"❌ Error: {response.status_code} - {response.text}")
except Exception as e:
    print(f"❌ Error: {e}")
