import requests
import json
import sqlite3

BASE_URL = "http://localhost:8000/api/compatibility"

def test():
    conn = sqlite3.connect("product_intelligence.db")
    c = conn.cursor()
    c.execute("SELECT id, product_code FROM products WHERE product_code IN ('Motor-X500', 'Controller-C7', 'Pump-P12', 'Coupling-C25', 'Coupling-C28')")
    products = {row[1]: row[0] for row in c.fetchall()}
    conn.close()

    results = {}
    results["Motor + Controller"] = requests.post(f"{BASE_URL}/check", json={"source_product_id": products["Motor-X500"], "target_product_id": products["Controller-C7"]}).json()
    results["Motor + Pump"] = requests.post(f"{BASE_URL}/check", json={"source_product_id": products["Motor-X500"], "target_product_id": products["Pump-P12"]}).json()
    results["Motor + Coupling-C25"] = requests.post(f"{BASE_URL}/check", json={"source_product_id": products["Motor-X500"], "target_product_id": products["Coupling-C25"]}).json()
    results["Motor + Coupling-C28"] = requests.post(f"{BASE_URL}/check", json={"source_product_id": products["Motor-X500"], "target_product_id": products["Coupling-C28"]}).json()
    results["System Check"] = requests.post(f"{BASE_URL}/system-check", json={"product_ids": [products["Motor-X500"], products["Controller-C7"], products["Pump-P12"], products["Coupling-C25"]]}).json()
    results["Alternatives for Coupling-C25"] = requests.post(f"{BASE_URL}/alternatives", json={"target_product_id": products["Coupling-C25"], "source_product_id": products["Motor-X500"]}).json()
    results["Simulate Replacement"] = requests.post(f"{BASE_URL}/simulate", json={"product_ids": [products["Motor-X500"], products["Controller-C7"], products["Pump-P12"], products["Coupling-C25"]], "replace_product_id": products["Coupling-C25"], "with_product_id": products["Coupling-C28"]}).json()

    with open("test_results.json", "w") as f:
        json.dump(results, f, indent=2)

if __name__ == "__main__":
    test()
