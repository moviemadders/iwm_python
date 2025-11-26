"""
Safe script to fix the role selector in pulse-composer.tsx
Only shows roles that the user actually has
"""

file_path = r"frontend\components\pulse\composer\pulse-composer.tsx"

# Read the file
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find and replace the SelectContent section (around lines 163-168)
# Looking for the section with SelectItem elements
new_content_lines = []
in_select_content = False
changed = False

for i, line in enumerate(lines):
    # Detect start of SelectContent
    if '<SelectContent className="bg-[#282828] border-[#3A3A3A] text-white">' in line:
        in_select_content = True
        new_content_lines.append(line)
        continue
    
    # Detect end of SelectContent
    if in_select_content and '</SelectContent>' in line:
        in_select_content = False
        # Insert our modified SelectItems before closing tag
        if not changed:
            new_content_lines.append('            <SelectItem value="personal">🎬 Movie Lover</SelectItem>\n')
            new_content_lines.append('            {userRoles.includes(\'critic\') && <SelectItem value="critic">⭐ As Critic</SelectItem>}\n')
            new_content_lines.append('            {userRoles.includes(\'industry_pro\') && <SelectItem value="industry_pro">🎥 As Filmmaker</SelectItem>}\n')
            new_content_lines.append('            {userRoles.includes(\'talent_pro\') && <SelectItem value="talent_pro">🌟 As Talent</SelectItem>}\n')
            changed = True
        new_content_lines.append(line)
        continue
    
    # Skip old SelectItem lines when we're in SelectContent
    if in_select_content and '<SelectItem value=' in line:
        continue
    
    # Keep all other lines
    new_content_lines.append(line)

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_content_lines)

print("✅ Fixed role selector in pulse-composer.tsx")
print("   Now only shows roles the user has enabled")
