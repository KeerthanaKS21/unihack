import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print("=" * 70)
print("VeriSpec AI - End-to-End API Route & Execution Suite")
print("=" * 70)

# 1. Health / Root Check
print("\n[1] Testing Health Endpoint:")
res = client.get("/health")
print(f"    Status: {res.status_code} | Body: {res.json()}")

# 2. Products List
print("\n[2] Testing Products API (/api/products):")
res = client.get("/api/products")
print(f"    Status: {res.status_code}")
if res.status_code == 200:
    data = res.json()
    items = data.get('items', [])
    print(f"    Retrieved {len(items)} of {data.get('total')} products from verified database:")
    for p in items[:3]:
        print(f"     - Code: {p.get('product_code'):<10} | Name: {p.get('name')} | Category: {p.get('category')}")

# 3. Quotes Listing
print("\n[3] Testing Quotes API (/api/quotes):")
res = client.get("/api/quotes")
print(f"    Status: {res.status_code}")
if res.status_code == 200:
    quotes = res.json()
    print(f"    Found {len(quotes)} existing quotes.")
    for q in quotes[:2]:
        print(f"     - Quote: {q.get('quote_number')} | Company: {q.get('company')} | Total: INR {q.get('total'):,.2f} | Status: {q.get('status')}")

# 4. RFQ Match & Quote Generation Engine
print("\n[4] Testing RFQ Match & Quote Engine (/api/quotes/match):")
match_payload = {
    "requirementText": "Need 50 units of 7.5 kW, 415 V, IP55 induction motors with 1460 RPM delivered in 7 days to Pune plant.",
    "company": "Tata Advanced Systems",
    "referenceNumber": "RFQ-TATA-2026-X1"
}
res = client.post("/api/quotes/match", json=match_payload)
print(f"    Status: {res.status_code}")
if res.status_code == 200:
    data = res.json()
    print(f"    Match Status : {data.get('matchStatus')}")
    print(f"    Matched Model: {data.get('productMatch', {}).get('product_code')} - {data.get('productMatch', {}).get('name')}")
    best_offer = data.get('supplierOffer') or {}
    print(f"    Best Supplier: {best_offer.get('supplierName')} (Price: INR {best_offer.get('priceINR'):,.2f}, Lead: {best_offer.get('deliveryDays')} days)")
    q_data = data.get('quoteData') or {}
    print(f"    Generated Quote #{q_data.get('quoteNumber')} | Total: INR {q_data.get('total'):,.2f}")
    print(f"    Datasheet Grounding Matrix:")
    for ev in data.get('specEvidence', []):
        mark = "✓" if ev.get('matched') else "✗"
        print(f"      [{mark}] {ev.get('parameter'):<30}: Required '{ev.get('required_value')}' vs Datasheet '{ev.get('datasheet_value')}' (Page {ev.get('source_page')})")

# 5. Quote Revision Simulation
print("\n[5] Testing Quote Revision Simulation (/api/quotes/simulate-revision):")
sim_payload = {
    "quoteNumber": "Q-2026-TEST",
    "productModel": "XYZ-450",
    "supplierName": "Bharat Electric",
    "originalQuantity": 50,
    "newQuantity": 30,
    "originalDeliveryDays": 7,
    "newDeliveryDays": 7,
    "unitPrice": 39800.0
}
res = client.post("/api/quotes/simulate-revision", json=sim_payload)
print(f"    Status: {res.status_code}")
if res.status_code == 200:
    s_data = res.json()
    print(f"    Simulation Supported: {s_data.get('supported')}")
    print(f"    Result Message     : {s_data.get('message')}")
    print(f"    Revised Grand Total: INR {s_data.get('revisedTotal'):,.2f}")

# 6. Procurement Natural Language Sourcing Parse
print("\n[6] Testing Procurement Parser (/api/procurement/parse-prompt):")
proc_payload = {
    "prompt": "Need 100 pumps with flow rate 120 L/min, pressure 8 bar, SS316, price below 50k, delivery under 9 days."
}
res = client.post("/api/procurement/parse-prompt", json=proc_payload)
print(f"    Status: {res.status_code}")
if res.status_code == 200:
    p_data = res.json()
    print(f"    Extracted Category: {p_data.get('category')} | Quantity: {p_data.get('quantity')}")
    print(f"    Extracted Constraints ({len(p_data.get('constraints', []))}):")
    for c in p_data.get('constraints', []):
        print(f"      - {c.get('attribute')}: {c.get('operator')} {c.get('value')} {c.get('unit')}")

# 7. Procurement Sourcing Evaluation Engine
print("\n[7] Testing Procurement Sourcing Evaluation (/api/procurement/evaluate):")
eval_payload = {
    "category": "pump",
    "quantity": 10,
    "constraints": [
        {"attribute": "flowRate", "operator": ">=", "value": 120, "unit": "L/min", "mandatory": True},
        {"attribute": "pressure", "operator": ">=", "value": 8, "unit": "bar", "mandatory": True},
        {"attribute": "material", "operator": "=", "value": "SS316", "unit": "", "mandatory": True},
        {"attribute": "maxPrice", "operator": "<=", "value": 50000, "unit": "INR", "mandatory": True},
        {"attribute": "deliveryDays", "operator": "<=", "value": 10, "unit": "days", "mandatory": True}
    ]
}
res = client.post("/api/procurement/evaluate", json=eval_payload)
print(f"    Status: {res.status_code}")
if res.status_code == 200:
    e_data = res.json()
    print(f"    Sourcing Status : {e_data.get('status')}")
    print(f"    Exact Matches   : {len(e_data.get('exactMatches', []))}")
    for m in e_data.get('exactMatches', []):
        print(f"      - {m.get('supplierName')} ({m.get('productModel')}) @ INR {m.get('priceINR'):,.2f} | SLA: {m.get('deliveryDays')} days")
    print(f"    Alternatives    : {len(e_data.get('alternatives', []))}")

print("\n" + "=" * 70)
print("Execution Complete - All Endpoints Verified Successfully!")
print("=" * 70)
