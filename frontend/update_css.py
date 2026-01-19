import os

file_path = 'src/pages/LandingPage.css'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace .landing-page block
# We construct the old block based on what we saw in view_file
# Note: view_file showed 4 spaces indentation
old_landing_parts = [
    ".landing-page {",
    "    font-family: 'Outfit', sans-serif;",
    "    color: var(--text-main);",
    "    background-color: var(--bg-dark);",
    "    overflow-x: hidden;",
    "}"
]

# Try to find this block ignoring line endings
import re

# Regex to find .landing-page block
# \s* matches any whitespace including newlines
pattern_landing = r"\.landing-page\s*\{\s*font-family:\s*'Outfit',\s*sans-serif;\s*color:\s*var\(--text-main\);\s*background-color:\s*var\(--bg-dark\);\s*overflow-x:\s*hidden;\s*\}"

new_landing = """.landing-page {
    font-family: 'Outfit', sans-serif;
    color: var(--text-main);
    background: linear-gradient(rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.95)),
                url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=3840&auto=format&fit=crop');
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
    background-repeat: no-repeat;
    overflow-x: hidden;
    min-height: 100vh;
}"""

# Perform replacement
new_content = re.sub(pattern_landing, new_landing, content)

if new_content == content:
    print("Warning: Could not match .landing-page block with regex.")
    # Fallback: Append the new style with !important to override
    new_content += "\n\n" + new_landing.replace("}", "    z-index: 0;\n}") # Ensure it's valid css
    # Actually if we append, we need to make sure it overrides.
    # But let's hope regex works.
    
    # Let's try to just replace the background-color line if the block match failed
    pattern_bg = r"background-color:\s*var\(--bg-dark\);"
    if re.search(pattern_bg, new_content):
        print("Replacing background-color line only.")
        new_bg = "background: linear-gradient(rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.95)), url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=3840&auto=format&fit=crop');\n    background-size: cover;\n    background-position: center;\n    background-attachment: fixed;\n    background-repeat: no-repeat;\n    min-height: 100vh;"
        new_content = re.sub(pattern_bg, new_bg, new_content)

# Append hero override
new_content += "\n\n/* Override hero background */\n.hero-section { background: none !important; }"

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Updated LandingPage.css")
