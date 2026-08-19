from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import re
import math

from app.db.database import get_db
from app.db.models.supplier import Supplier, SupplierProduct
from app.db.models.product import Product, ProductVersion, ProductAttribute

router = APIRouter(prefix="/procurement", tags=["Procurement"])

# Schema definitions
class ConstraintModel(BaseModel):
    attribute: str
    operator: str
    value: Any
    unit: Optional[str] = None
    mandatory: bool = True

class ParsePromptRequest(BaseModel):
    prompt: str

class EvaluateSourcingRequest(BaseModel):
    category: str
    quantity: int = 1
    constraints: List[ConstraintModel]

# Category Schemas metadata for UI rendering
CATEGORY_SCHEMAS = {
    "motor": {
        "label": "Motor",
        "category_names": ["Electric Motors & Drives", "Motors", "motor"],
        "attributes": [
            {"name": "power", "label": "Power", "type": "numeric", "units": ["kW", "W", "HP"], "default_unit": "kW"},
            {"name": "voltage", "label": "Voltage", "type": "numeric", "units": ["V", "kV"], "default_unit": "V"},
            {"name": "ipRating", "label": "IP Rating", "type": "string", "choices": ["IP54", "IP55", "IP56", "IP65", "IP66"], "default_unit": ""},
            {"name": "speed", "label": "Speed", "type": "numeric", "units": ["RPM"], "default_unit": "RPM"}
        ]
    },
    "pump": {
        "label": "Pump",
        "category_names": ["Industrial Pumps & Valves", "Pumps", "pump"],
        "attributes": [
            {"name": "flowRate", "label": "Flow Rate", "type": "numeric", "units": ["L/min", "m3/h"], "default_unit": "L/min"},
            {"name": "pressure", "label": "Pressure", "type": "numeric", "units": ["bar", "psi"], "default_unit": "bar"},
            {"name": "material", "label": "Material", "type": "string", "choices": ["SS304", "SS316", "Cast Iron", "Bronze"], "default_unit": ""},
            {"name": "temperature", "label": "Max Temperature", "type": "numeric", "units": ["C", "F"], "default_unit": "C"}
        ]
    },
    "valve": {
        "label": "Valve",
        "category_names": ["Industrial Valves", "Valves", "valve"],
        "attributes": [
            {"name": "size", "label": "Nominal Size", "type": "string", "choices": ["DN15", "DN25", "DN40", "DN50", "DN80", "DN100"], "default_unit": ""},
            {"name": "pressureRating", "label": "Pressure Rating", "type": "numeric", "units": ["bar", "psi"], "default_unit": "bar"},
            {"name": "material", "label": "Material", "type": "string", "choices": ["SS304", "SS316", "Carbon Steel", "Cast Iron"], "default_unit": ""},
            {"name": "connection", "label": "Connection Type", "type": "string", "choices": ["Flanged", "Threaded", "Welded"], "default_unit": ""}
        ]
    },
    "compressor": {
        "label": "Compressor",
        "category_names": ["Industrial Compressors", "Compressors", "compressor"],
        "attributes": [
            {"name": "capacity", "label": "Capacity", "type": "numeric", "units": ["cfm", "m3/min"], "default_unit": "cfm"},
            {"name": "workingPressure", "label": "Working Pressure", "type": "numeric", "units": ["bar", "psi"], "default_unit": "bar"},
            {"name": "power", "label": "Power", "type": "numeric", "units": ["kW", "HP"], "default_unit": "kW"}
        ]
    },
    "gearbox": {
        "label": "Gearbox",
        "category_names": ["Industrial Gearboxes", "Gearboxes", "gearbox"],
        "attributes": [
            {"name": "ratio", "label": "Gear Ratio", "type": "string", "choices": ["5:1", "10:1", "15:1", "20:1", "30:1", "40:1", "50:1"], "default_unit": ""},
            {"name": "torque", "label": "Output Torque", "type": "numeric", "units": ["Nm"], "default_unit": "Nm"}
        ]
    }
}

# Synonyms map for semantic mapping in AI parsing and DB attribute resolution
SEMANTIC_SYNONYMS = {
    # DB Names -> Request Constraint Names
    "rated output": "power",
    "rated voltage": "voltage",
    "synchronous speed": "speed",
    "protection degree": "iprating",
    
    # Synonyms / Alternative constraint keys -> Standard constraint keys
    "flow": "flowrate",
    "flow rate": "flowrate",
    "flowrate": "flowrate",
    "working pressure": "workingpressure",
    "workingpressure": "workingpressure",
    "pressure rating": "pressurerating",
    "pressurerating": "pressurerating",
    "lead time": "deliverydays",
    "delivery": "deliverydays",
    "deliverydays": "deliverydays",
    "price": "maxprice",
    "budget": "maxprice",
    "cost": "maxprice",
    "maxprice": "maxprice",
    "ip": "iprating",
    "ip rating": "iprating",
    "iprating": "iprating",
    "nominal size": "size",
    "pipe size": "size"
}

# Unit normalizer
def normalize_value(val: float, unit: str) -> tuple[float, str]:
    if not unit:
        return val, ""
    u = unit.lower().strip()
    if u in ["w", "watts"]:
        return val / 1000.0, "kW"
    if u in ["kv", "kilovolts"]:
        return val * 1000.0, "V"
    if u in ["weeks", "week", "wk"]:
        return val * 7.0, "days"
    if u in ["hp", "horsepower"]:
        return val * 0.7457, "kW"
    if u in ["psi"]:
        return val * 0.0689476, "bar"
    return val, unit

def resolve_attribute(attr_name: str, db_attributes: dict) -> Any:
    # attr_name is standard key like "power" or "iprating"
    attr_clean = attr_name.lower().strip()
    for key_db, attr_obj in db_attributes.items():
        clean_key = SEMANTIC_SYNONYMS.get(key_db, key_db)
        if clean_key == attr_clean or key_db == attr_clean:
            return attr_obj
    return None

@router.get("/schemas", summary="Get Dynamic Category Schemas")
def get_category_schemas():
    return CATEGORY_SCHEMAS

@router.post("/parse-prompt", summary="AI Semantic Sourcing Extraction")
def parse_prompt(data: ParsePromptRequest):
    prompt = data.prompt
    lower_prompt = prompt.lower()
    
    # 1. Identify category using semantic keywords
    category = "motor"
    if "pump" in lower_prompt or "centrifugal" in lower_prompt:
        category = "pump"
    elif "valve" in lower_prompt or "gate valve" in lower_prompt:
        category = "valve"
    elif "compressor" in lower_prompt or "screw air" in lower_prompt:
        category = "compressor"
    elif "gearbox" in lower_prompt or "helical" in lower_prompt:
        category = "gearbox"
        
    # 2. Extract Quantity
    qty = 1
    qty_match = re.search(r"\b(need|find|get|want|for)\s+(\d+)\b", lower_prompt)
    if not qty_match:
        qty_match = re.search(r"\b(\d+)\s*(motors|pumps|valves|compressors|gearboxes|units)\b", lower_prompt)
    if qty_match:
        try:
            qty = int(qty_match.group(1) if len(qty_match.groups()) == 1 or qty_match.group(1).isdigit() else qty_match.group(2))
        except Exception:
            qty = 1

    constraints = []
    
    # 3. Detect Mandatory Flags
    # By default, constraints are mandatory unless preceded by "prefer", "optional", "nice to have"
    def is_mandatory(phrase: str) -> bool:
        phrase_lower = phrase.lower()
        if "prefer" in phrase_lower or "optional" in phrase_lower or "nice to have" in phrase_lower or "nice-to-have" in phrase_lower:
            return False
        return True

    # 4. Extract power (kW, W, HP)
    power_match = re.search(r"(\b\d+(?:\.\d+)?)\s*(kw|w|hp)\b", lower_prompt)
    if power_match:
        val = float(power_match.group(1))
        unit = power_match.group(2).upper()
        # Find context around matching to determine mandatory
        start = max(0, power_match.start() - 15)
        context = lower_prompt[start:power_match.start()]
        constraints.append({
            "attribute": "power",
            "operator": ">=" if "at least" in context or "min" in context else "=",
            "value": val,
            "unit": unit,
            "mandatory": is_mandatory(context)
        })
        
    # 5. Extract voltage (V, kV)
    volt_match = re.search(r"(\b\d+)\s*(v|kv)\b", lower_prompt)
    if volt_match:
        val = float(volt_match.group(1))
        unit = volt_match.group(2).upper()
        start = max(0, volt_match.start() - 15)
        context = lower_prompt[start:volt_match.start()]
        constraints.append({
            "attribute": "voltage",
            "operator": "=",
            "value": val,
            "unit": unit,
            "mandatory": is_mandatory(context)
        })

    # 6. Extract IP Rating
    ip_match = re.search(r"\b(ip\s*\d{2})\b", lower_prompt)
    if ip_match:
        val = ip_match.group(1).upper().replace(" ", "")
        start = max(0, ip_match.start() - 15)
        context = lower_prompt[start:ip_match.start()]
        constraints.append({
            "attribute": "ipRating",
            "operator": "=",
            "value": val,
            "unit": "",
            "mandatory": is_mandatory(context)
        })

    # 7. Extract Flow Rate
    flow_match = re.search(r"(\b\d+(?:\.\d+)?)\s*(l/min|m3/h)\b", lower_prompt)
    if flow_match:
        val = float(flow_match.group(1))
        unit = flow_match.group(2)
        start = max(0, flow_match.start() - 15)
        context = lower_prompt[start:flow_match.start()]
        constraints.append({
            "attribute": "flowRate",
            "operator": ">=" if "at least" in context or "min" in context or "flow" in context else "=",
            "value": val,
            "unit": unit,
            "mandatory": is_mandatory(context)
        })

    # 8. Extract Pressure
    pres_match = re.search(r"(\b\d+(?:\.\d+)?)\s*(bar|psi)\b", lower_prompt)
    if pres_match:
        val = float(pres_match.group(1))
        unit = pres_match.group(2)
        start = max(0, pres_match.start() - 15)
        context = lower_prompt[start:pres_match.start()]
        constraints.append({
            "attribute": "pressure" if category == "pump" else "pressureRating",
            "operator": ">=" if "at least" in context or "min" in context or "pressure" in context else "=",
            "value": val,
            "unit": unit,
            "mandatory": is_mandatory(context)
        })

    # 9. Extract Material (SS316, SS304, cast iron)
    mat_match = re.search(r"\b(ss316|ss304|stainless steel|cast iron|bronze)\b", lower_prompt)
    if mat_match:
        val = mat_match.group(1).upper()
        if "STAINLESS STEEL" in val:
            val = "SS316"  # default standard conversion
        start = max(0, mat_match.start() - 15)
        context = lower_prompt[start:mat_match.start()]
        constraints.append({
            "attribute": "material",
            "operator": "=",
            "value": val,
            "unit": "",
            "mandatory": is_mandatory(context)
        })

    # 10. Extract Commercial: Max Price (under 50k, budget ₹40,000, max price 15000)
    # Search for currencies or budget markers
    price_match = re.search(r"\b(?:price|budget|under|below|max|cost)\s*(?:rs\.?|₹|inr)?\s*(\d+(?:,\d+)*)\s*(k|thousand)?\b", lower_prompt)
    if price_match:
        val_str = price_match.group(1).replace(",", "")
        val = float(val_str)
        if price_match.group(2) == "k":
            val *= 1000
        elif price_match.group(2) == "thousand":
            val *= 1000
        constraints.append({
            "attribute": "maxPrice",
            "operator": "<=",
            "value": val,
            "unit": "INR",
            "mandatory": True
        })

    # 11. Extract Commercial: Max Delivery (within 10 days, delivery under 2 weeks)
    deliv_match = re.search(r"\b(?:delivery|lead time|within|under|in)\s*(\d+)\s*(days|weeks|day|week)\b", lower_prompt)
    if deliv_match:
        val = float(deliv_match.group(1))
        unit = deliv_match.group(2)
        constraints.append({
            "attribute": "deliveryDays",
            "operator": "<=",
            "value": val,
            "unit": unit,
            "mandatory": True
        })

    return {
        "category": category,
        "quantity": qty,
        "constraints": constraints
    }

@router.post("/evaluate", summary="Generic Procurement Evaluation Engine")
def evaluate_sourcing(data: EvaluateSourcingRequest, db: Session = Depends(get_db)):
    req_category = data.category.lower().strip()
    quantity = data.quantity
    constraints = data.constraints
    
    # 1. Load dynamic category schema config
    schema = None
    for k, v in CATEGORY_SCHEMAS.items():
        if k == req_category or req_category in [n.lower() for n in v["category_names"]]:
            schema = v
            req_category = k
            break
            
    if not schema:
        raise HTTPException(status_code=400, detail=f"Unsupported product category: {data.category}")

    # 2. Fetch all supplier offerings (SupplierProduct) belonging to this category
    supplier_products = db.query(SupplierProduct).join(Product).all()
    filtered_sp = []
    for sp in supplier_products:
        prod_cat = sp.product.category.lower()
        if req_category == "motor" and "motor" in prod_cat:
            filtered_sp.append(sp)
        elif req_category == "pump" and "pump" in prod_cat:
            filtered_sp.append(sp)
        elif req_category == "valve" and "valve" in prod_cat:
            filtered_sp.append(sp)
        elif req_category == "compressor" and "compressor" in prod_cat:
            filtered_sp.append(sp)
        elif req_category == "gearbox" and "gearbox" in prod_cat:
            filtered_sp.append(sp)

    exact_matches = []
    alternatives = []
    
    # 3. Central Sourcing Engine matching logic
    for sp in filtered_sp:
        product = sp.product
        supplier = sp.supplier
        
        # Load active attributes for product version
        active_version = db.query(ProductVersion).filter(
            ProductVersion.product_id == product.id,
            ProductVersion.is_current == True
        ).first()
        
        db_attributes = {}
        if active_version:
            for attr in active_version.attributes:
                db_attributes[attr.attribute_name.lower().strip()] = attr

        is_exact = True
        match_score = 100.0
        failed_constraints = []
        passed_constraints = []
        data_warnings = []
        
        # Evaluate each constraint
        for c in constraints:
            attr_name = c.attribute.lower().strip()
            # Map common synonyms
            attr_name = SEMANTIC_SYNONYMS.get(attr_name, attr_name)
            
            # --- Evaluate Commercial Constraints ---
            if attr_name == "maxprice":
                val = sp.price
                # Price is always <= limit
                limit = float(c.value)
                if val > limit:
                    is_exact = False
                    penalty = min(30.0, ((val - limit) / limit) * 100.0)
                    match_score -= penalty
                    failed_constraints.append(
                        f"Price of {sp.currency} {val:,.2f} exceeds budget limit of {sp.currency} {limit:,.2f} by {((val-limit)/limit)*100:.1f}%"
                    )
                else:
                    passed_constraints.append(f"Price: {sp.currency} {val:,.2f} <= limit {sp.currency} {limit:,.2f}")
                continue
                
            elif attr_name == "deliverydays":
                val = sp.delivery_days
                limit = float(c.value)
                # Normalize units
                norm_val, _ = normalize_value(val, "days")
                norm_limit, _ = normalize_value(limit, c.unit or "days")
                if norm_val > norm_limit:
                    is_exact = False
                    penalty = min(20.0, ((norm_val - norm_limit) / norm_limit) * 50.0)
                    match_score -= (penalty + 5.0)  # flat penalty for speed
                    failed_constraints.append(
                        f"Lead time of {val} days exceeds requested maximum of {int(norm_limit)} days by {int(norm_val - norm_limit)} days"
                    )
                else:
                    passed_constraints.append(f"Delivery: {val} days <= requested {int(norm_limit)} days")
                continue
                
            elif attr_name == "quantity" or attr_name == "stock":
                val = sp.stock_quantity
                required = quantity
                if val < required:
                    # Inadequate stock is not a technical rejection but reduces matching
                    is_exact = False
                    match_score -= 15.0
                    failed_constraints.append(
                        f"Available stock is {val} units, which is below the required {required} units"
                    )
                else:
                    passed_constraints.append(f"Stock: {val} units available >= required {required}")
                continue
                
            # --- Evaluate Technical Constraints ---
            # Lookup in product specifications
            matched_attr = resolve_attribute(attr_name, db_attributes)
                    
            if not matched_attr:
                # Missing attribute
                if c.mandatory:
                    is_exact = False
                    match_score -= 25.0
                    failed_constraints.append(
                        f"Technical attribute '{c.attribute}' could not be verified (missing from supplier specification sheet)"
                    )
                continue
                
            # Attribute has value. Check verification status for conflicts
            if matched_attr.verification_status == "CONFLICT":
                is_exact = False
                match_score -= 30.0
                failed_constraints.append(
                    f"Data conflict flag: Supplier database value is unverified due to technical discrepancy."
                )
                data_warnings.append(f"Unresolved spec discrepancy on attribute '{matched_attr.attribute_name}'")
                continue

            # Compare values
            supp_raw_val = matched_attr.attribute_value
            supp_norm_val = matched_attr.normalized_value
            supp_unit = matched_attr.unit
            
            # Numeric comparison
            if supp_norm_val is not None:
                try:
                    # Convert requirement value to float
                    req_val = float(c.value)
                    
                    # Normalize both values to standardized units
                    n_supp_val, n_supp_unit = normalize_value(supp_norm_val, supp_unit)
                    n_req_val, n_req_unit = normalize_value(req_val, c.unit)
                    
                    # Check operators
                    op = c.operator
                    val_ok = True
                    if op == "=":
                        val_ok = abs(n_supp_val - n_req_val) < 0.01
                    elif op == ">=":
                        val_ok = n_supp_val >= n_req_val
                    elif op == "<=":
                        val_ok = n_supp_val <= n_req_val
                    elif op == ">":
                        val_ok = n_supp_val > n_req_val
                    elif op == "<":
                        val_ok = n_supp_val < n_req_val
                    elif op == "!=":
                        val_ok = abs(n_supp_val - n_req_val) >= 0.01
                        
                    if not val_ok:
                        is_exact = False
                        penalty = 25.0
                        if c.mandatory:
                            penalty = 40.0
                        match_score -= penalty
                        failed_constraints.append(
                            f"Spec discrepancy: {matched_attr.attribute_name} is {supp_raw_val} instead of requested {c.operator} {c.value} {c.unit or ''}"
                        )
                    else:
                        passed_constraints.append(
                            f"Validated {matched_attr.attribute_name}: {supp_raw_val} satisfies {c.operator} {c.value} {c.unit or ''}"
                        )
                except Exception:
                    # Fallback to string search if numeric parsing fails
                    supp_raw_lower = str(supp_raw_val).lower().replace(" ", "")
                    req_lower = str(c.value).lower().replace(" ", "")
                    if req_lower not in supp_raw_lower:
                        is_exact = False
                        match_score -= 25.0
                        failed_constraints.append(
                            f"Spec discrepancy: {matched_attr.attribute_name} is {supp_raw_val} (Required: {c.value})"
                        )
            else:
                # String comparison (e.g. material, size, ratio)
                supp_raw_lower = str(supp_raw_val).lower().replace(" ", "")
                req_lower = str(c.value).lower().replace(" ", "")
                # Check mapping for SS316 vs stainless steel
                if req_lower == "stainlesssteel" or req_lower == "ss":
                    req_lower = "ss31"  # matches SS316 or SS304
                    
                if req_lower not in supp_raw_lower:
                    is_exact = False
                    penalty = 20.0
                    if c.mandatory:
                        penalty = 35.0
                    match_score -= penalty
                    failed_constraints.append(
                        f"Spec discrepancy: {matched_attr.attribute_name} is {supp_raw_val} (Required: {c.value})"
                    )
                else:
                    passed_constraints.append(
                        f"Validated {matched_attr.attribute_name}: {supp_raw_val} matches required {c.value}"
                    )

        # Make sure match_score is bounded [0, 100]
        match_score = max(0.0, min(100.0, match_score))
        
        res_item = {
            "id": sp.id,
            "supplierId": supplier.id,
            "supplierName": supplier.name,
            "tier": supplier.tier,
            "rating": supplier.rating,
            "productId": product.id,
            "productModel": product.product_code,
            "productName": product.name,
            "category": product.category,
            "priceINR": sp.price,
            "stockQty": sp.stock_quantity,
            "deliveryDays": sp.delivery_days,
            "technicalMatchScore": round(match_score / 100.0, 2),
            "isExactMatch": is_exact,
            "violations": failed_constraints,
            "passed": passed_constraints,
            "warnings": data_warnings,
            "specs": {
                "power": resolve_attribute("power", db_attributes).attribute_value if resolve_attribute("power", db_attributes) else "N/A",
                "voltage": resolve_attribute("voltage", db_attributes).attribute_value if resolve_attribute("voltage", db_attributes) else "N/A",
                "ipRating": resolve_attribute("iprating", db_attributes).attribute_value if resolve_attribute("iprating", db_attributes) else "N/A",
                "speed": resolve_attribute("speed", db_attributes).attribute_value if resolve_attribute("speed", db_attributes) else "N/A",
                "flowRate": resolve_attribute("flowrate", db_attributes).attribute_value if resolve_attribute("flowrate", db_attributes) else "N/A",
                "pressure": resolve_attribute("pressure", db_attributes).attribute_value if resolve_attribute("pressure", db_attributes) else (
                    resolve_attribute("pressurerating", db_attributes).attribute_value if resolve_attribute("pressurerating", db_attributes) else "N/A"
                ),
                "material": resolve_attribute("material", db_attributes).attribute_value if resolve_attribute("material", db_attributes) else "N/A"
            },
            "status": "Exact Match" if is_exact else ("Closest Alternative" if match_score >= 60.0 else "Not Recommended"),
            "advantageNotes": sp.advantage_notes or "Meets basic requirements."
        }
        
        if is_exact:
            exact_matches.append(res_item)
        else:
            alternatives.append(res_item)

    # Sort alternatives by match score descending
    alternatives = sorted(alternatives, key=lambda x: (x["status"] == "Not Recommended", -x["technicalMatchScore"], x["priceINR"]))

    status_str = "exact_matches_found" if len(exact_matches) > 0 else "no_exact_match"
    if not filtered_sp:
        status_str = "insufficient_data"

    return {
        "status": status_str,
        "exactMatches": exact_matches,
        "alternatives": alternatives
    }
