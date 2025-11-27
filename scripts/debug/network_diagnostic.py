"""
Network Diagnostic Tool for TMDB API

This script tests network connectivity to api.themoviedb.org
"""
import socket
import requests

def test_dns():
    """Test DNS resolution"""
    print("=" * 50)
    print("Testing DNS Resolution...")
    print("=" * 50)
    try:
        ip = socket.gethostbyname("api.themoviedb.org")
        print(f"✓ DNS Resolution successful: {ip}")
        return True
    except socket.gaierror as e:
        print(f"✗ DNS Resolution failed: {e}")
        return False

def test_http_with_requests():
    """Test HTTP connection using requests library"""
    print("\n" + "=" * 50)
    print("Testing HTTP with requests library...")
    print("=" * 50)
    try:
        response = requests.get(
            "https://api.themoviedb.org/3/configuration",
            params={"api_key": "eeac973dbc7c5c2dd0936d2e3e1eaf9f"},
            timeout=10
        )
        print(f"✓ Connection successful: Status {response.status_code}")
        return True
    except requests.exceptions.ConnectionError as e:
        print(f"✗ Connection failed: {e}")
        return False
    except requests.exceptions.Timeout as e:
        print(f"✗ Request timed out: {e}")
        return False
    except Exception as e:
        print(f"✗ Unexpected error: {e}")
        return False

def test_port_connectivity():
    """Test if port 443 is accessible"""
    print("\n" + "=" * 50)
    print("Testing Port 443 Connectivity...")
    print("=" * 50)
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        result = sock.connect_ex(("api.themoviedb.org", 443))
        sock.close()
        
        if result == 0:
            print("✓ Port 443 is accessible")
            return True
        else:
            print(f"✗ Port 443 is not accessible (Error code: {result})")
            return False
    except Exception as e:
        print(f"✗ Port test failed: {e}")
        return False

def main():
    print("\n" + "🔍" * 25)
    print("TMDB API Network Diagnostics")
    print("🔍" * 25 + "\n")
    
    dns_ok = test_dns()
    port_ok = test_port_connectivity()
    http_ok = test_http_with_requests()
    
    print("\n" + "=" * 50)
    print("SUMMARY")
    print("=" * 50)
    print(f"DNS Resolution: {'✓ PASS' if dns_ok else '✗ FAIL'}")
    print(f"Port 443 Access: {'✓ PASS' if port_ok else '✗ FAIL'}")
    print(f"HTTP Connection: {'✓ PASS' if http_ok else '✗ FAIL'}")
    
    if not dns_ok:
        print("\n⚠️ Issue: DNS cannot resolve api.themoviedb.org")
        print("Solutions:")
        print("  - Check your DNS settings")
        print("  - Try using Google DNS (8.8.8.8) or Cloudflare DNS (1.1.1.1)")
    elif not port_ok:
        print("\n⚠️ Issue: Port 443 (HTTPS) is blocked")
        print("Solutions:")
        print("  - Check Windows Firewall settings")
        print("  - Check antivirus/security software")
        print("  - Check corporate proxy/firewall")
    elif not http_ok:
        print("\n⚠️ Issue: HTTP request failed despite DNS and port being accessible")
        print("Solutions:")
        print("  - SSL/TLS certificate issue")
        print("  - Proxy configuration needed")
        print("  - Antivirus blocking HTTPS")
    else:
        print("\n✓ All checks passed! TMDB API should be accessible.")
        print("  The issue might be with httpx library specifically.")
        print("  Try restarting the backend server.")

if __name__ == "__main__":
    main()
