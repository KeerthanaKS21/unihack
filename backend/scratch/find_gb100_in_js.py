import sys
import urllib.request
import re
import json

sys.stdout.reconfigure(encoding='utf-8')

# Fetch HTML first
html = urllib.request.urlopen('https://inducore-website.vercel.app/').read().decode('utf-8')
scripts = re.findall(r'src=["\']([^"\']+\.js)["\']', html)
print("Scripts in HTML:", scripts)

for s in scripts:
    s_url = s if s.startswith('http') else ('https://inducore-website.vercel.app/' + s.lstrip('/'))
    print(f"\nFetching {s_url}...")
    req = urllib.request.Request(s_url, headers={'User-Agent': 'Mozilla/5.0'})
    js_text = urllib.request.urlopen(req, timeout=10).read().decode('utf-8')
    print("JS Length:", len(js_text))
    
    # Search for GB-100 specs
    pos = 0
    while True:
        pos = js_text.find('GB-100', pos)
        if pos == -1:
            break
        print(f"\n--- GB-100 at {pos} ---")
        print(js_text[max(0, pos-100):min(len(js_text), pos+400)])
        pos += 6

