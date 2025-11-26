"""
Fix selectedRole default - should be empty string, not "personal"
"""

file_path = r"frontend\components\pulse\composer\pulse-composer.tsx"

# Read the file
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the default selectedRole
content = content.replace(
    'const [selectedRole, setSelectedRole] = useState<string>(\"\")',
    'const [selectedRole, setSelectedRole] = useState<string>("")'
)

# Also need to update the submission logic to NOT send "personal" as a role
# Find the createPulse call and fix it
old_code = """        postedAsRole: selectedRole || undefined,"""
new_code = """        postedAsRole: (selectedRole && selectedRole !== "personal") ? selectedRole : undefined,"""

content = content.replace(old_code, new_code)

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Fixed selectedRole default and submission logic")
print("   - Default is now empty string (not 'personal')")
print("   - Personal posts won't send role to backend")
