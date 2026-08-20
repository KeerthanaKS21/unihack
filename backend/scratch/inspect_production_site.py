import sys
import json
import urllib.request
import re

sys.stdout.reconfigure(encoding='utf-8')

# 1. Fetch website HTML
print("--- 1. Fetching https://inducore-website.vercel.app/ ---")
try:
    req = urllib.request.Request('https://inducore-website.vercel.app/', headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=10) as resp:
        html = resp.read().decode('utf-8')
        print(f"HTML status: {resp.status} | Length: {len(html)}")
        scripts = re.findall(r'src=["\']([^"\']+)["\']', html)
        print("Script tags found:", scripts)
        
        # Check if JS bundle contains GB-100 or API endpoints
        for s in scripts:
            full_js_url = s if s.startswith('http') else ('https://inducore-website.vercel.app/' + s.lstrip('/'))
            print(f"\nFetching script: {full_js_url}")
            try:
                s_req = urllib.request.Request(full_js_url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(s_req, timeout=10) as s_resp:
                    js_code = s_resp.read().decode('utf-8')
                    print(f"  JS size: {len(js_code)} bytes")
                    
                    # Look for GB-100 references
                    gb_matches = [m.start() for m in re.finditer(r'GB-100', js_code)]
                    print(f"  GB-100 occurrences in JS: {len(gb_matches)}")
                    for idx in gb_matches[:3]:
                        snippet = js_code[max(0, idx-100):min(len(js_code), idx+300)]
                        print(f"  Snippet: {snippet}\n")
                        
                    # Look for API endpoints in JS
                    api_matches = re.findall(r'(/api/[a-zA-Z0-9_-]+)', js_code)
                    print(f"  API endpoints referenced in JS: {set(api_matches)}")
            except Exception as e:
                print(f"  Error reading script {full_js_url}: {e}")
except Exception as e:
    print(f"Error fetching website: {e}")

# 2. Test POST to production endpoint
print("\n--- 2. Testing POST https://inducore-website.vercel.app/api/integration/product-update ---")
try:
    test_payload = {
        'requestId': 'test-audit-123',
        'productId': 'GB-100',
        'modelNumber': 'GB-100',
        'expectedVersion': 1,
        'newVersion': 2,
        'updates': {'ratio': '12:1'},
        'source': {'documentName': 'GB-100_Datasheet.csv', 'documentVersion': '2.0'},
        'approval': {'approved': True, 'approvedBy': 'lead@company.com', 'approvalId': 'APP-TEST-1'}
    }
    req2 = urllib.request.Request(
        'https://inducore-website.vercel.app/api/integration/product-update',
        data=json.dumps(test_payload).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'},
        method='POST'
    )
    with urllib.request.urlopen(req2, timeout=10) as resp2:
        print('API POST status:', resp2.status)
        resp_data = resp2.read().decode('utf-8')
        print('API POST response body:', resp_data)
except Exception as e:
    print('API POST error:', e)

# 3. Test GET product endpoints if any exist on inducore-website
print("\n--- 3. Testing potential GET endpoints on https://inducore-website.vercel.app/ ---")
endpoints_to_test = [
    'api/products/GB-100',
    'api/products',
    'api/storefront/GB-100',
    'api/integration/product-update',
    'api/ecommerce/storefront/GB-100'
]
for ep in endpoints_to_test:
    url = f"https://inducore-website.vercel.app/{ep}"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as r:
            print(f"GET {url} -> {r.status} : {r.read()[:100]}")
    except Exception as e:
        print(f"GET {url} -> Failed: {e}")
