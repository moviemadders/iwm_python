"""
Add userRoles fetching logic to pulse-composer.tsx
"""

file_path = r"frontend\components\pulse\composer\pulse-composer.tsx"

# Read the file
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the useEffect and add role fetching
old_code = """  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await me()
        setAuthUser(user)
      } catch (error) {
        console.debug("User not authenticated")
      }
    }
    fetchUser()
  }, [])"""

new_code = """  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await me()
        setAuthUser(user)
        
        // Fetch user roles
        const rolesRes = await fetch('http://localhost:8000/api/v1/roles', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        })
        if (rolesRes.ok) {
          const rolesData = await rolesRes.json()
          const roleMapping: Record<string, string> = {
            'critic': 'critic',
            'industry': 'industry_pro',
            'talent': 'talent_pro'
          }
          const available = rolesData.roles
            .filter((r: any) => r.enabled)
            .map((r: any) => roleMapping[r.role_type])
            .filter((r: string) => r !== undefined)
          
          setUserRoles(available)
        }
      } catch (error) {
        console.debug("User not authenticated")
      }
    }
    fetchUser()
  }, [])"""

if old_code in content:
    content = content.replace(old_code, new_code)
    
    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Added userRoles fetching logic")
else:
    print("⚠️  useEffect code not found or already modified")
