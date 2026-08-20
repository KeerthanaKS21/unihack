import sys
import json
import urllib.request
import sqlite3
import time

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000/api/ecommerce"
PORT5000_URL = "http://localhost:5000/api"

def post_json(endpoint, data):
    req = urllib.request.Request(
        f"{BASE_URL}/{endpoint}",
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def post_to_port5000(endpoint, data):
    req = urllib.request.Request(
        f"{PORT5000_URL}/{endpoint}",
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def get_from_port5000(endpoint):
    req = urllib.request.Request(
        f"{PORT5000_URL}/{endpoint}",
        headers={"User-Agent": "Mozilla/5.0"}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

print("==================================================================")
print("TEST 1: Dynamic Inspection Across Multiple Product Categories")
print("==================================================================")
categories_to_test = ["GB-100", "M-101", "V-100", "P-100"]

for pcode in categories_to_test:
    res = post_json("inspect-website", {
        "website_url": "http://localhost:5000",
        "product_code": pcode
    })
    print(f"Product: {res['product_code']:8} | Name: {res['product_name'][:30]:30} | Category: {res['category']:12} | Storefront Specs: {len(res['storefront_matrix'])} | Commercial: {len(res['commercial_matrix'])}")
    assert len(res["storefront_matrix"]) > 0, f"No storefront specs for {pcode}"
    # Verify commercial fields are categorized separately
    for row in res["commercial_matrix"]:
        assert row["field_category"] == "SUPPLIER_COMMERCIAL"

print("\n==================================================================")
print("TEST 2: Motor Category Multi-Field Update (M-101)")
print("==================================================================")
m_curr = get_from_port5000("products/M-101")
m_ver = m_curr.get("version", 1)

motor_payload = {
    "requestId": f"upd-M101-{int(time.time())}",
    "productId": "M-101",
    "modelNumber": "M-101",
    "expectedVersion": m_ver,
    "newVersion": m_ver + 1,
    "updates": {
        "power": "7.5 kW",
        "speed": "1460 RPM",
        "efficiency": "92.5%"
    },
    "source": {
        "documentName": "M-101_Enhanced_Motor_Datasheet_v2.pdf",
        "documentVersion": f"{m_ver + 1}.0"
    },
    "approval": {
        "approved": True,
        "approvedBy": "electrical-lead@company.com",
        "approvalId": "APP-M101-2026"
    }
}

m_res = post_to_port5000("integration/product-update", motor_payload)
print("Motor Update Response:", m_res["status"])
print("Motor Changed Fields:", m_res["changedFields"])
assert m_res["status"] == "updated"

# Verify Motor GET endpoint
m_get = get_from_port5000("products/M-101")
print(f"M-101 Verified -> Power: {m_get['specifications'].get('Power') or m_get['specifications'].get('Input Power')} | Speed: {m_get['specifications'].get('Speed') or m_get['specifications'].get('Input Speed')} | Efficiency: {m_get['specifications'].get('Efficiency')} | Version: {m_get.get('version')}")
assert m_get["version"] == m_ver + 1

print("\n==================================================================")
print("TEST 3: Valve Category Multi-Field Update (V-100)")
print("==================================================================")
v_curr = get_from_port5000("products/V-100")
v_ver = v_curr.get("version", 1)

valve_payload = {
    "requestId": f"upd-V100-{int(time.time())}",
    "productId": "V-100",
    "modelNumber": "V-100",
    "expectedVersion": v_ver,
    "newVersion": v_ver + 1,
    "updates": {
        "pressure": "25 bar",
        "material": "Stainless Steel 316"
    },
    "source": {
        "documentName": "V-100_High_Pressure_Valve_v2.pdf",
        "documentVersion": f"{v_ver + 1}.0"
    },
    "approval": {
        "approved": True,
        "approvedBy": "piping-lead@company.com",
        "approvalId": "APP-V100-2026"
    }
}

v_res = post_to_port5000("integration/product-update", valve_payload)
print("Valve Update Response:", v_res["status"])
print("Valve Changed Fields:", v_res["changedFields"])
assert v_res["status"] == "updated"

v_get = get_from_port5000("products/V-100")
print(f"V-100 Verified -> Pressure: {v_get['specifications'].get('Pressure') or v_get['specifications'].get('Pressure Rating')} | Material: {v_get['specifications'].get('Material') or v_get['specifications'].get('Housing Material')} | Version: {v_get.get('version')}")
assert v_get["version"] == v_ver + 1

print("\n==================================================================")
print("TEST 4: Pump Category Multi-Field Update (P-100)")
print("==================================================================")
p_curr = get_from_port5000("products/P-100")
p_ver = p_curr.get("version", 1)

pump_payload = {
    "requestId": f"upd-P100-{int(time.time())}",
    "productId": "P-100",
    "modelNumber": "P-100",
    "expectedVersion": p_ver,
    "newVersion": p_ver + 1,
    "updates": {
        "flowrate": "320 L/min",
        "head": "42 m"
    },
    "source": {
        "documentName": "P-100_High_Head_Pump_v2.pdf",
        "documentVersion": f"{p_ver + 1}.0"
    },
    "approval": {
        "approved": True,
        "approvedBy": "hydraulics-lead@company.com",
        "approvalId": "APP-P100-2026"
    }
}

p_res = post_to_port5000("integration/product-update", pump_payload)
print("Pump Update Response:", p_res["status"])
print("Pump Changed Fields:", p_res["changedFields"])
assert p_res["status"] == "updated"

p_get = get_from_port5000("products/P-100")
print(f"P-100 Verified -> Flow Rate: {p_get['specifications'].get('Flow Rate')} | Head: {p_get['specifications'].get('Head')} | Version: {p_get.get('version')}")
assert p_get["version"] == p_ver + 1

print("\n==================================================================")
print("TEST 5: Gearbox GB-100 Update (Acceptance Test)")
print("==================================================================")
gb_curr = get_from_port5000("products/GB-100")
gb_ver = gb_curr.get("version", 1)

gb_payload = {
    "requestId": f"upd-GB100-{int(time.time())}",
    "productId": "GB-100",
    "modelNumber": "GB-100",
    "expectedVersion": gb_ver,
    "newVersion": gb_ver + 1,
    "updates": {
        "ratio": "12:1"
    },
    "source": {
        "documentName": "GB-100_Updated_Datasheet_v2.csv",
        "documentVersion": f"{gb_ver + 1}.0"
    },
    "approval": {
        "approved": True,
        "approvedBy": "gearbox-engineer@company.com",
        "approvalId": "APP-GB100-2026"
    }
}

gb_res = post_to_port5000("integration/product-update", gb_payload)
print("GB-100 Update Response:", gb_res["status"])
print("GB-100 Changed Fields:", gb_res["changedFields"])
assert gb_res["status"] == "updated"

gb_get = get_from_port5000("products/GB-100")
print(f"GB-100 Verified -> Gear Ratio: {gb_get['specifications'].get('Gear Ratio')} | Ratio: {gb_get['specifications'].get('Ratio')} | Version: {gb_get.get('version')}")
assert gb_get["version"] == gb_ver + 1

print("\n==================================================================")
print("ALL MULTI-PRODUCT & MULTI-FIELD GENERIC TESTS PASSED 100%!")
print("==================================================================")
