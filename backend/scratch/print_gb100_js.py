import urllib.request

url = 'https://inducore-website.vercel.app/assets/index-pFzQKNFx.js'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=10) as resp:
    js_text = resp.read().decode('utf-8')

print("GB-100 Object Definition in Vite JS Bundle:")
print(js_text[222715:223600])
