import requests
import unittest

BASE_URL = "http://localhost:8000/api/procurement"

class TestProcurementSourcing(unittest.TestCase):
    
    def test_1_parse_motor_prompt(self):
        print("\n--- TEST 1: Parsing Motor Sourcing Prompt ---")
        prompt = "Need 50 motors with 7.5 kW, 415 V, IP55, price below 40000, and delivery under 10 days."
        response = requests.post(f"{BASE_URL}/parse-prompt", json={"prompt": prompt})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        print("Parsed:", data)
        self.assertEqual(data["category"], "motor")
        self.assertEqual(data["quantity"], 50)
        
        # Verify extracted constraints
        attrs = [c["attribute"] for c in data["constraints"]]
        self.assertIn("power", attrs)
        self.assertIn("voltage", attrs)
        self.assertIn("ipRating", attrs)
        self.assertIn("maxPrice", attrs)
        self.assertIn("deliveryDays", attrs)

    def test_2_parse_pump_prompt(self):
        print("\n--- TEST 2: Parsing Pump Sourcing Prompt ---")
        prompt = "Need 100 pumps with flow rate 120 L/min, pressure 8 bar, SS316, price below 50k, delivery under 9 days."
        response = requests.post(f"{BASE_URL}/parse-prompt", json={"prompt": prompt})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        print("Parsed:", data)
        self.assertEqual(data["category"], "pump")
        self.assertEqual(data["quantity"], 100)
        
        attrs = [c["attribute"] for c in data["constraints"]]
        self.assertIn("flowRate", attrs)
        self.assertIn("pressure", attrs)
        self.assertIn("material", attrs)

    def test_3_evaluate_motor_exact(self):
        print("\n--- TEST 3: Evaluating Motor Exact Matches ---")
        payload = {
            "category": "motor",
            "quantity": 20,
            "constraints": [
                {"attribute": "power", "operator": "=", "value": 7.5, "unit": "kW", "mandatory": True},
                {"attribute": "voltage", "operator": "=", "value": 415, "unit": "V", "mandatory": True},
                {"attribute": "ipRating", "operator": "=", "value": "IP55", "unit": "", "mandatory": True},
                {"attribute": "maxPrice", "operator": "<=", "value": 45000, "unit": "INR", "mandatory": True},
                {"attribute": "deliveryDays", "operator": "<=", "value": 10, "unit": "days", "mandatory": True}
            ]
        }
        response = requests.post(f"{BASE_URL}/evaluate", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        print("Exact matches found:", len(data["exactMatches"]))
        print("Alternatives found:", len(data["alternatives"]))
        
        # Verify Siemens or Crompton motor is exact match
        for item in data["exactMatches"]:
            self.assertEqual(item["isExactMatch"], True)
            self.assertEqual(item["status"], "Exact Match")
            self.assertLessEqual(item["priceINR"], 45000)
            self.assertLessEqual(item["deliveryDays"], 10)

    def test_4_evaluate_pump_exact(self):
        print("\n--- TEST 4: Evaluating Pump Exact Match (SS316, 120 L/min, 8 bar) ---")
        payload = {
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
        response = requests.post(f"{BASE_URL}/evaluate", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        print("Exact Matches:", [x["supplierName"] + " (" + x["productModel"] + ")" for x in data["exactMatches"]])
        print("Alternatives:", [x["supplierName"] + " (" + x["productModel"] + ")" for x in data["alternatives"]])
        
        # Bharat Electric's P-100 centrifugal pump should be exact match
        self.assertTrue(len(data["exactMatches"]) > 0)
        match = data["exactMatches"][0]
        self.assertEqual(match["productModel"], "P-100")
        self.assertEqual(match["isExactMatch"], True)

    def test_5_evaluate_pump_no_exact_match(self):
        print("\n--- TEST 5: Sourcing Pump when Price Constraint fails (Budget Rs.40,000) ---")
        payload = {
            "category": "pump",
            "quantity": 10,
            "constraints": [
                {"attribute": "flowRate", "operator": ">=", "value": 120, "unit": "L/min", "mandatory": True},
                {"attribute": "pressure", "operator": ">=", "value": 8, "unit": "bar", "mandatory": True},
                {"attribute": "material", "operator": "=", "value": "SS316", "unit": "", "mandatory": True},
                {"attribute": "maxPrice", "operator": "<=", "value": 40000, "unit": "INR", "mandatory": True},
                {"attribute": "deliveryDays", "operator": "<=", "value": 10, "unit": "days", "mandatory": True}
            ]
        }
        response = requests.post(f"{BASE_URL}/evaluate", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        print("Status:", data["status"])
        print("Exact matches count:", len(data["exactMatches"]))
        print("Alternatives count:", len(data["alternatives"]))
        
        self.assertEqual(data["status"], "no_exact_match")
        self.assertEqual(len(data["exactMatches"]), 0)
        self.assertTrue(len(data["alternatives"]) > 0)
        
        # Verify tradeoff description is generated
        first_alt = data["alternatives"][0]
        self.assertTrue(len(first_alt["violations"]) > 0)
        print("Tradeoff Reason:", first_alt["violations"][0])
        self.assertIn("exceeds budget limit", first_alt["violations"][0])

    def test_6_unit_normalization(self):
        print("\n--- TEST 6: Unit Normalization Matching (5500 W requirement against 5.5 kW offer) ---")
        # Motor WEG is 37.5 kW, XYZ-450 is 7.5 kW (7500 W)
        payload = {
            "category": "motor",
            "quantity": 1,
            "constraints": [
                {"attribute": "power", "operator": "=", "value": 7500, "unit": "W", "mandatory": True}
            ]
        }
        response = requests.post(f"{BASE_URL}/evaluate", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(len(data["exactMatches"]) > 0)
        match_models = [m["productModel"] for m in data["exactMatches"]]
        print("Matched Models for 7500 W:", match_models)
        self.assertIn("M-101", match_models)

if __name__ == "__main__":
    unittest.main()
