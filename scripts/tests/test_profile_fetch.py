import requests

# Test the profile endpoint directly
url = "http://localhost:8000/api/v1/users/admin"

try:
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")
    print(f"Response:")
    print(response.json())
except Exception as e:
    print(f"Error: {e}")
