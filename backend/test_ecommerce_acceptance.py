import sys
import json
import urllib.request

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000/api/ecommerce"

def post_json(endpoint, data):
    req = urllib.request.Request(
        f"{BASE_URL}/{endpoint}",
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

print("==================================================================")
print("TEST 1: Inspect GB-100 Discrepancy Classification")
print("==================================================================")
res = post_json("inspect-website", {
    "website_url": "http://localhost:3000/storefront",
    "product_code": "GB-100"
})

print(f"Product: {res['product_code']}")
print(f"Total Storefront Mismatches: {res['total_mismatches']}")
print(f"Search Facet Comparison Status: {res['search_filter_comparison']['status']}")
print(f"Search Facet Published: '{res['search_filter_comparison']['published_filter']}' vs New: '{res['search_filter_comparison']['new_filter']}'")

print("\n--- STOREFRONT SPECIFICATIONS MATRIX ---")
for r in res["storefront_matrix"]:
    print(f"  {r['attribute_name']:20} | Live: {r['website_value']:25} | New: {r['new_catalog_value']:20} | Status: {r['status']:8} | Action: {r['action_required']}")

print("\n==================================================================")
print("TEST 2: Push Update and Re-Inspect (Expected: 0 Mismatches / IN_SYNC)")
print("==================================================================")
push_res = post_json("push-update", {
    "api_endpoint": "http://localhost:8000/api/ecommerce/demo-update-receiver",
    "product_code": "GB-100"
})
print(f"Push Result: {push_res['status']}")

re_res = post_json("inspect-website", {
    "website_url": "http://localhost:3000/storefront",
    "product_code": "GB-100"
})

print(f"After Push - Total Storefront Mismatches: {re_res['total_mismatches']}")
print(f"Search Facet Status: {re_res['search_filter_comparison']['status']} (Action: {re_res['search_filter_comparison']['action_required']})")

print("\n--- STOREFRONT SPECIFICATIONS AFTER SYNC ---")
for r in re_res["storefront_matrix"]:
    print(f"  {r['attribute_name']:20} | Live: {r['website_value']:25} | New: {r['new_catalog_value']:20} | Status: {r['status']:8} | Action: {r['action_required']}")

assert re_res['total_mismatches'] == 0, f"Expected 0 mismatches after sync, got {re_res['total_mismatches']}"
assert re_res['search_filter_comparison']['status'] == "MATCH", f"Expected facet MATCH, got {re_res['search_filter_comparison']['status']}"
assert re_res['search_filter_comparison']['action_required'] == "None (In Sync)", f"Expected facet action None (In Sync), got {re_res['search_filter_comparison']['action_required']}"

print("\n==================================================================")
print("ALL ACCEPTANCE CRITERIA VERIFIED AND PASSED!")
print("==================================================================")
