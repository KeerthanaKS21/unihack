import sys
import urllib.request
import re
import json

sys.stdout.reconfigure(encoding='utf-8')

url = 'https://inducore-website.vercel.app/assets/index-pFzQKNFx.js'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=10) as resp:
    js_text = resp.read().decode('utf-8')

print("Total JS Length:", len(js_text))

# Search for GB-100 object definition
match = re.search(r'\{[^{}]*id:\s*[`\'"]GB-100[`\'"][^{}]*\}', js_text)
if match:
    print("Found simple match:", match.group(0))
else:
    # Broader search
    pos = js_text.find('GB-100')
    while pos != -1:
        print("\n--- GB-100 Match at pos", pos, "---")
        print(js_text[max(0, pos-150):min(len(js_text), pos+350)])
        pos = js_text.find('GB-100', pos+1)
