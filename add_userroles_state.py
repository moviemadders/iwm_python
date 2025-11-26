"""
Add userRoles state to pulse-composer.tsx
"""

file_path = r"frontend\components\pulse\composer\pulse-composer.tsx"

# Read the file
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the line with starRating state and add userRoles after it
old_line = '  const [starRating, setStarRating] = useState<number>(0)\n  const { toast } = useToast()'
new_line = '  const [starRating, setStarRating] = useState<number>(0)\n  const [userRoles, setUserRoles] = useState<string[]>([])\n  const { toast } = useToast()'

if old_line in content:
    content = content.replace(old_line, new_line)
    
    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Added userRoles state variable")
else:
    print("⚠️  Could not find the exact location to add userRoles")
    print("    Checking if it already exists...")
    if 'userRoles' in content:
        print("    ✅ userRoles already exists in file")
    else:
        print("    ❌ userRoles not found, manual fix needed")
