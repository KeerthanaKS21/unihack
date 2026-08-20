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
print("TEST 1: Inspect GB-100 and Classify Storefront vs Supplier Fields")
print("==================================================================")
inspect_res = post_json("inspect-website", {
    "website_url": "http://localhost:3000/storefront",
    "product_code": "GB-100"
})

print(f"Product: {inspect_res['product_code']} - {inspect_res['product_name']}")
print(f"Total Storefront Mismatches count: {inspect_res['total_mismatches']}")
print(f"Total Storefront Fields count: {inspect_res['total_storefront_fields']}")
print(f"Total Commercial Fields count: {inspect_res['total_commercial_fields']}")

print("\n--- STOREFRONT SPECIFICATIONS ---")
for r in inspect_res["storefront_matrix"][:8]:
    print(f"  {r['attribute_name']:20} | Live: {r['website_value']:15} | New: {r['new_catalog_value']:15} | Status: {r['status']:10} | Action: {r['action_required']}")

print("\n--- SUPPLIER / COMMERCIAL DATA (SEPARATED) ---")
for r in inspect_res["commercial_matrix"][:8]:
    print(f"  {r['attribute_name']:25} | Value: {r['new_catalog_value']:15} | Category: {r['field_category']:20} | Action: {r['action_required']}")

# Assertions
for comm in inspect_res["commercial_matrix"]:
    assert comm["field_category"] == "SUPPLIER_COMMERCIAL", f"Expected SUPPLIER_COMMERCIAL, got {comm['field_category']}"
    assert comm["is_storefront_field"] is False, f"Commercial field {comm['attribute_name']} should not be a storefront field"
    assert comm["action_required"] != "Update Storefront", f"Commercial field should never show Update Storefront"

print("\n==================================================================")
print("TEST 2: Push Update Payload Inspection")
print("==================================================================")
push_res = post_json("push-update", {
    "api_endpoint": "http://localhost:8000/api/ecommerce/demo-update-receiver",
    "product_code": "GB-100"
})

print(f"Push Status: {push_res['status']}")
print(f"Pushed Updates Payload: {json.dumps(push_res.get('pushed_updates'), indent=2)}")

# Verify NO commercial fields are in pushed updates
for key in push_res.get('pushed_updates', {}).keys():
    for forbidden in ["supplier", "price", "stock", "delivery", "moq", "payment", "incoterm", "quote"]:
        assert forbidden not in key.lower(), f"Forbidden commercial field '{key}' leaked into storefront update payload!"

print("\n[PASS] All supplier and commercial fields are 100% excluded from the E-commerce payload!")

print("\n==================================================================")
print("TEST 3: Other Categories (Motor M-101 & Valve V-100)")
print("==================================================================")
for p_code in ["M-101", "V-100", "COMP-100"]:
    res = post_json("inspect-website", {
        "website_url": "http://localhost:3000/storefront",
        "product_code": p_code
    })
    print(f"Product {p_code:8} -> Storefront Fields: {res['total_storefront_fields']} | Commercial Fields: {res['total_commercial_fields']} | Mismatches: {res['total_mismatches']}")
    for comm in res.get("commercial_matrix", []):
        assert comm["action_required"] != "Update Storefront"

print("\nALL E-COMMERCE SEPARATION TESTS PASSED SUCCESSFULLY!")
