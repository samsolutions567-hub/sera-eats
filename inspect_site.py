import urllib.request
import ssl
import json
import re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req = urllib.request.Request('https://saladify.framer.website/', headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
with urllib.request.urlopen(req, context=ctx) as resp:
    html = resp.read().decode('utf-8', errors='replace')

with open('temp_home.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Saved temp_home.html, size:", len(html))

# Find lines or sections with 'designed' or 'template' or 'framer'
lines = html.splitlines()
print(f"Total lines: {len(lines)}")
for i, l in enumerate(lines):
    l_lower = l.lower()
    for word in ['designed by', 'template', 'framer-badge', 'made in framer', 'made with framer']:
        if word in l_lower:
            print(f"Line {i} [{word}]: {l[:200]}")
