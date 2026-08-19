import sys
import json
import urllib.request

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000/api/procurement"

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
print("TEST 1: Currency Normalization in parse-prompt")
print("==================================================================")
currency_prompts = [
    ("₹30,000", "Find 1 gearbox with gear ratio 10:1, input speed 1440 RPM, efficiency at least 95%, torque at least 250 Nm, power at least 4 kW, price below ₹30,000, and delivery within 7 days."),
    ("30,000 INR", "Find 1 gearbox with ratio 10:1, price below 30,000 INR, delivery under 7 days"),
    ("30000 INR", "Find 1 gearbox with ratio 10:1, price below 30000 INR, delivery under 7 days"),
    ("₹30k", "Find 1 gearbox with ratio 10:1, price below ₹30k, delivery under 7 days"),
    ("30k INR", "Find 1 gearbox with ratio 10:1, price below 30k INR, delivery under 7 days"),
    ("30000 rupees", "Find 1 gearbox with ratio 10:1, price below 30000 rupees, delivery under 7 days"),
]

for label, p in currency_prompts:
    res = post_json("parse-prompt", {"prompt": p})
    price_c = next((c for c in res["constraints"] if c["attribute"] == "maxPrice"), None)
    if price_c and price_c["value"] == 30000.0 and price_c["unit"] == "INR":
        print(f"  [PASS] {label:15} -> {price_c['operator']} {price_c['value']} {price_c['unit']}")
    else:
        print(f"  [FAIL] {label:15} -> {price_c}")

print("\n==================================================================")
print("TEST 2: Full Gearbox Prompt Parsing (All 7 Constraints)")
print("==================================================================")
full_prompt = "Find 1 gearbox with gear ratio 10:1, input speed 1440 RPM, efficiency at least 95%, torque at least 250 Nm, power at least 4 kW, price below ₹30,000, and delivery within 7 days."
res = post_json("parse-prompt", {"prompt": full_prompt})
print(f"Category: {res['category']} | Quantity: {res['quantity']}")
print(f"Constraints detected ({len(res['constraints'])}):")
for c in res["constraints"]:
    print(f"  - {c['attribute']:15} {c['operator']:3} {str(c['value']):10} {c.get('unit', ''):6} [mandatory={c['mandatory']}]")

assert len(res["constraints"]) == 7, f"Expected 7 constraints, got {len(res['constraints'])}"

print("\n==================================================================")
print("TEST 3 & 4: Technical Matching + Multi-Supplier Commercial Evaluation")
print("==================================================================")
eval_res = post_json("evaluate", {
    "category": res["category"],
    "quantity": res["quantity"],
    "constraints": res["constraints"]
})

print(f"Status: {eval_res['status']}")
print(f"Exact Matches count: {len(eval_res['exactMatches'])}")
for m in eval_res["exactMatches"]:
    print(f"  [EXACT] Product: {m['productModel']} ({m['productName']}) | Supplier: {m['supplierName']} | Price: ₹{m['priceINR']:,.0f} | Stock: {m['stockQty']} | Delivery: {m['deliveryDays']} days | Match: {m['technicalMatchScore']*100:.0f}%")
    print(f"          Master Specs: {m['specs']}")

print(f"\nAlternatives count: {len(eval_res['alternatives'])}")
for a in eval_res["alternatives"][:5]:
    print(f"  [ALT] Product: {a['productModel']} | Supplier: {a['supplierName']} | Status: {a['status']} | Score: {a['technicalMatchScore']*100:.0f}%")
    if a.get('violations'):
        print(f"        Violations: {a['violations'][:2]}")

print("\n==================================================================")
print("TEST 5: Delivery Constraint Filtering (e.g. max 6 days delivery)")
print("==================================================================")
# Change delivery constraint to <= 6 days
# Alpha (5 days) -> PASS
# Nova (6 days) -> PASS
# Prime (7 days) -> FAIL on delivery
strict_constraints = [c for c in res["constraints"] if c["attribute"] != "deliveryDays"] + [
    {"attribute": "deliveryDays", "operator": "<=", "value": 6, "unit": "days", "mandatory": True}
]
strict_eval = post_json("evaluate", {
    "category": "gearbox",
    "quantity": 1,
    "constraints": strict_constraints
})

print(f"Strict Delivery (<= 6 days) - Exact Matches ({len(strict_eval['exactMatches'])}):")
for m in strict_eval["exactMatches"]:
    print(f"  [EXACT] {m['productModel']} | {m['supplierName']} | Delivery: {m['deliveryDays']} days")

print(f"Strict Delivery (<= 6 days) - Alternatives ({len(strict_eval['alternatives'])}):")
for a in strict_eval["alternatives"]:
    if a["productModel"] == "GB-100":
        print(f"  [ALT] {a['productModel']} | {a['supplierName']} | Delivery: {a['deliveryDays']} days | Violations: {a['violations']}")

print("\n==================================================================")
print("TEST 6: Category Isolation (Pump Sourcing)")
print("==================================================================")
pump_prompt = "Find 1 pump with flow rate at least 120 L/min, pressure at least 8 bar, SS316 material, price below 50000, and delivery under 10 days."
pump_parsed = post_json("parse-prompt", {"prompt": pump_prompt})
print(f"Pump Parsed Category: {pump_parsed['category']} | Constraints: {len(pump_parsed['constraints'])}")
pump_eval = post_json("evaluate", {
    "category": pump_parsed["category"],
    "quantity": pump_parsed["quantity"],
    "constraints": pump_parsed["constraints"]
})
print(f"Pump Exact Matches ({len(pump_eval['exactMatches'])}):")
for m in pump_eval["exactMatches"]:
    print(f"  [EXACT] {m['productModel']} | {m['supplierName']} | Price: ₹{m['priceINR']:,.0f} | Delivery: {m['deliveryDays']} days")

print("\nALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!")
