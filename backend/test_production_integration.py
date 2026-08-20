import sys
import json
import urllib.request
import sqlite3

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
print("TEST 1: Inspect Live Deployed InduCore Production Website")
print("==================================================================")
prod_inspect = post_json("inspect-website", {
    "website_url": "https://inducore-website.vercel.app/",
    "product_code": "GB-100"
})

print(f"Website URL: {prod_inspect['website_url']}")
print(f"Crawl Status: {prod_inspect['crawl_status']}")
print(f"Product: {prod_inspect['product_code']} ({prod_inspect['product_name']})")
print(f"Total Storefront Mismatches: {prod_inspect['total_mismatches']}")

print("\n--- PRODUCTION STOREFRONT MATRIX ---")
for r in prod_inspect["storefront_matrix"]:
    print(f"  {r['attribute_name']:20} | Live: {r['website_value']:25} | New: {r['new_catalog_value']:20} | Status: {r['status']:8} | Action: {r['action_required']}")

assert prod_inspect["total_mismatches"] == 1, f"Expected 1 mismatch (Ratio: 10:1 -> 12:1), got {prod_inspect['total_mismatches']}"
ratio_row = next(r for r in prod_inspect["storefront_matrix"] if r["attribute_name"] == "Ratio")
assert ratio_row["status"] == "MISMATCH"
assert ratio_row["website_value"] == "10:1"
assert ratio_row["new_catalog_value"] == "12:1"

print("\n==================================================================")
print("TEST 2: Execute Verified Storefront Update POST")
print("==================================================================")
push_res = post_json("push-update", {
    "api_endpoint": "http://127.0.0.1:8000/api/ecommerce/demo-update-receiver",
    "product_code": "GB-100",
    "website_url": "https://inducore-website.vercel.app/"
})

print(f"Push Status: {push_res['status']}")
print(f"Verification Status: {push_res.get('verification_status')}")
print(f"Target API Endpoint: {push_res.get('api_endpoint')}")
print(f"Pushed Updates: {json.dumps(push_res.get('pushed_updates'), indent=2)}")
print(f"Audit Log ID: {push_res.get('audit_id')}")

assert push_res["status"] == "SUCCESS"
assert push_res["verification_status"] == "VERIFIED"
assert "ratio" in push_res["pushed_updates"]
assert push_res["pushed_updates"]["ratio"] == "12:1"

# Verify no commercial fields leaked into payload
for k in push_res["pushed_updates"].keys():
    assert "supplier" not in k and "price" not in k and "stock" not in k

print("\n==================================================================")
print("TEST 3: Post-Update Verification (Expected: 0 Mismatches / In Sync)")
print("==================================================================")
re_inspect = post_json("inspect-website", {
    "website_url": "https://inducore-website.vercel.app/",
    "product_code": "GB-100"
})

print(f"Total Storefront Mismatches after push: {re_inspect['total_mismatches']}")
for r in re_inspect["storefront_matrix"]:
    if r["attribute_name"] == "Ratio":
        print(f"  Ratio Spec -> Live: {r['website_value']} | New: {r['new_catalog_value']} | Status: {r['status']}")

assert re_inspect["total_mismatches"] == 0, f"Expected 0 mismatches after update, got {re_inspect['total_mismatches']}"

print("\n==================================================================")
print("TEST 4: Database Production Audit Log Verification")
print("==================================================================")
con = sqlite3.connect('product_intelligence.db')
con.row_factory = sqlite3.Row
audit = con.execute("SELECT * FROM approvals WHERE action = 'PRODUCTION_ECOMMERCE_APPROVAL' ORDER BY created_at DESC LIMIT 1").fetchone()
print(f"Audit ID: {audit['id']} | Action: {audit['action']} | Status: {audit['status']} | By: {audit['approved_by']}")
audit_data = json.loads(audit['comments'])
print(f"  Audit Payload -> Product: {audit_data['productId']} | Old Ver: {audit_data['expectedVersion']} | New Ver: {audit_data['newVersion']} | Changed: {audit_data['changedFields']} | Verification: {audit_data['productionVerificationResult']}")
con.close()

assert audit_data["productId"] == "GB-100"
assert audit_data["productionVerificationResult"] == "VERIFIED"

print("\nALL PRODUCTION INTEGRATION ACCEPTANCE CRITERIA PASSED SUCCESSFULLY!")
