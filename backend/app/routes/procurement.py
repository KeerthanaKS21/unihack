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
    currency: Optional[str] = None
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
            {"name": "head", "label": "Head", "type": "numeric", "units": ["m", "ft"], "default_unit": "m"},
            {"name": "material", "label": "Material", "type": "string", "choices": ["SS304", "SS316", "Cast Iron", "Bronze"], "default_unit": ""},
            {"name": "temperature", "label": "Max Temperature", "type": "numeric", "units": ["C", "F"], "default_unit": "C"},
            {"name": "efficiency", "label": "Efficiency", "type": "numeric", "units": ["%"], "default_unit": "%"}
        ]
    },
    "valve": {
        "label": "Valve",
        "category_names": ["Industrial Valves", "Valves", "valve"],
        "attributes": [
            {"name": "size", "label": "Nominal Size", "type": "string", "choices": ["DN15", "DN25", "DN40", "DN50", "DN80", "DN100"], "default_unit": ""},
            {"name": "pressureRating", "label": "Pressure Rating", "type": "numeric", "units": ["bar", "psi"], "default_unit": "bar"},
            {"name": "material", "label": "Material", "type": "string", "choices": ["SS304", "SS316", "Carbon Steel", "Cast Iron"], "default_unit": ""},
            {"name": "connection", "label": "Connection Type", "type": "string", "choices": ["Flanged", "Threaded", "Welded"], "default_unit": ""},
            {"name": "temperature", "label": "Max Temperature", "type": "numeric", "units": ["C", "F"], "default_unit": "C"}
        ]
    },
    "compressor": {
        "label": "Compressor",
        "category_names": ["Industrial Compressors", "Compressors", "compressor"],
        "attributes": [
            {"name": "capacity", "label": "Capacity", "type": "numeric", "units": ["cfm", "m3/min"], "default_unit": "cfm"},
            {"name": "workingPressure", "label": "Working Pressure", "type": "numeric", "units": ["bar", "psi"], "default_unit": "bar"},
            {"name": "power", "label": "Power", "type": "numeric", "units": ["kW", "HP"], "default_unit": "kW"},
            {"name": "cooling", "label": "Cooling Type", "type": "string", "choices": ["Air Cooled", "Water Cooled"], "default_unit": ""},
            {"name": "noise", "label": "Noise Level", "type": "numeric", "units": ["dBA"], "default_unit": "dBA"}
        ]
    },
    "gearbox": {
        "label": "Gearbox",
        "category_names": ["Industrial Gearboxes", "Gearboxes", "gearbox"],
        "attributes": [
            {"name": "ratio", "label": "Gear Ratio", "type": "string", "choices": ["5:1", "10:1", "15:1", "20:1", "30:1", "40:1", "50:1"], "default_unit": ""},
            {"name": "inputSpeed", "label": "Input Speed", "type": "numeric", "units": ["RPM"], "default_unit": "RPM"},
            {"name": "outputSpeed", "label": "Output Speed", "type": "numeric", "units": ["RPM"], "default_unit": "RPM"},
            {"name": "torque", "label": "Output Torque", "type": "numeric", "units": ["Nm"], "default_unit": "Nm"},
            {"name": "efficiency", "label": "Efficiency", "type": "numeric", "units": ["%"], "default_unit": "%"},
            {"name": "power", "label": "Power", "type": "numeric", "units": ["kW", "HP"], "default_unit": "kW"},
            {"name": "weight", "label": "Weight", "type": "numeric", "units": ["kg"], "default_unit": "kg"},
            {"name": "mounting", "label": "Mounting Type", "type": "string", "choices": ["Foot Mount", "Flange Mount", "Shaft Mount"], "default_unit": ""}
        ]
    }
}

# Synonyms map for semantic mapping in AI parsing and DB attribute resolution
SEMANTIC_SYNONYMS = {
    # DB Names -> Standard Attribute Keys
    "rated output": "power",
    "rated voltage": "voltage",
    "synchronous speed": "speed",
    "protection degree": "iprating",
    "gear ratio": "ratio",
    "input speed": "inputspeed",
    "output speed": "outputspeed",
    "output torque": "torque",
    "input power": "power",
    "housing material": "material",
    "housing / material": "material",
    "lubrication": "lubricant",
    "mounting": "mounting",
    "mounting type": "mounting",
    "mount": "mounting",
    "nominal diameter": "size",
    "nominal size": "size",
    "pipe size": "size",
    "connection type": "connection",
    "connection": "connection",
    "flow rate": "flowrate",
    "flow (cv)": "flowrate",
    "maximum pressure": "workingpressure",
    "max pressure": "workingpressure",
    "working pressure": "workingpressure",
    "pressure rating": "pressurerating",
    "noise level": "noise",
    "tank capacity": "capacity",
    "tank volume": "capacity",
    "power rating": "power",
    "ip rating": "iprating",
    "lead time": "deliverydays",
    "delivery": "deliverydays",
    "delivery days": "deliverydays",
    "price": "maxprice",
    "budget": "maxprice",
    "cost": "maxprice",
    "unit price": "maxprice",
    "unit price (inr)": "maxprice",
    "efficiency": "efficiency",
    "temp": "temperature",
    "max temperature": "temperature",
    
    # Request Keys / Synonyms -> Standard Attribute Keys
    "flow": "flowrate",
    "flowrate": "flowrate",
    "workingpressure": "workingpressure",
    "pressurerating": "pressurerating",
    "deliverydays": "deliverydays",
    "maxprice": "maxprice",
    "iprating": "iprating",
    "gearratio": "ratio",
    "inputspeed": "inputspeed",
    "outputspeed": "outputspeed",
    "outputtorque": "torque"
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
    if u in ["k", "k inr", "k rs", "k rupees"]:
        return val * 1000.0, "INR"
    if u in ["inr", "rs", "rs.", "rupees", "rupee", "₹"]:
        return val, "INR"
    return val, unit

def resolve_attribute(attr_name: str, db_attributes: dict) -> Any:
    attr_clean = attr_name.lower().strip()
    clean_attr = SEMANTIC_SYNONYMS.get(attr_clean, attr_clean)
    for key_db, attr_obj in db_attributes.items():
        clean_key = SEMANTIC_SYNONYMS.get(key_db, key_db)
        if clean_key == clean_attr or key_db == attr_clean or clean_key.replace(" ", "") == clean_attr.replace(" ", ""):
            return attr_obj
    return None

@router.get("/schemas", summary="Get Dynamic Category Schemas")
def get_category_schemas():
    return CATEGORY_SCHEMAS

@router.post("/parse-prompt", summary="AI Semantic Sourcing Extraction")
def parse_prompt(data: ParsePromptRequest):
    prompt = data.prompt
    lower_prompt = prompt.lower()

    # 1. Identify category dynamically
    category = "gearbox"
    if "pump" in lower_prompt or "centrifugal" in lower_prompt:
        category = "pump"
    elif "valve" in lower_prompt or "gate valve" in lower_prompt:
        category = "valve"
    elif "compressor" in lower_prompt or "screw air" in lower_prompt:
        category = "compressor"
    elif "motor" in lower_prompt or "induction" in lower_prompt:
        category = "motor"
    elif "gearbox" in lower_prompt or "helical" in lower_prompt:
        category = "gearbox"

    # 2. Extract Quantity
    qty = 1
    qty_match = re.search(r"\b(?:need|find|get|want|for)\s+(\d+)\b", lower_prompt)
    if not qty_match:
        qty_match = re.search(r"\b(\d+)\s*(?:motors|pumps|valves|compressors|gearboxes|units|gearbox|pump|motor|valve|compressor)\b", lower_prompt)
    if qty_match:
        try:
            qty = int(qty_match.group(1))
        except Exception:
            qty = 1

    # 3. Clean prompt & split clauses by commas, semicolons, periods, "and", "with"
    cleaned_prompt = re.sub(r"(?<=\d),(?=\d)", "", lower_prompt)
    raw_clauses = re.split(r"[,;.]|\band\b|\bwith\b", cleaned_prompt)

    constraints = []
    seen_attributes = set()

    for raw_clause in raw_clauses:
        clause = raw_clause.strip()
        if not clause:
            continue

        # Skip generic search intro clauses like "find 1 gearbox"
        if re.fullmatch(r"(?:find|need|get|want)\s+\d+\s+(?:gearbox|gearboxes|motor|motors|pump|pumps|valve|valves|compressor|compressors|units|unit)", clause):
            continue

        operator = "="
        if re.search(r"\bat least\b|\bminimum\b|\bmin\b|\b>=\b", clause):
            operator = ">="
        elif re.search(r"\bunder\b|\bbelow\b|\bmaximum\b|\bmax\b|\bwithin\b|\b<=\b|\bor less\b", clause):
            operator = "<="
        elif re.search(r"\bover\b|\babove\b|\b>\b(?!=)", clause):
            operator = ">"
        elif re.search(r"\bless than\b|\b<\b(?!=)", clause):
            operator = "<"

        # Ratio
        ratio_m = re.search(r"\b(\d+:\d+)\b", clause)
        if ratio_m and "ratio" not in seen_attributes:
            constraints.append({
                "attribute": "ratio",
                "operator": operator if operator != "<=" else "=",
                "value": ratio_m.group(1),
                "unit": "",
                "mandatory": True
            })
            seen_attributes.add("ratio")
            continue

        # Input Speed / Output Speed / Speed
        if ("input speed" in clause or "input rpm" in clause) and "inputSpeed" not in seen_attributes:
            num_m = re.search(r"(\d+(?:\.\d+)?)", clause)
            if num_m:
                constraints.append({
                    "attribute": "inputSpeed",
                    "operator": operator,
                    "value": float(num_m.group(1)),
                    "unit": "RPM",
                    "mandatory": True
                })
                seen_attributes.add("inputSpeed")
                continue

        if ("output speed" in clause or "output rpm" in clause) and "outputSpeed" not in seen_attributes:
            num_m = re.search(r"(\d+(?:\.\d+)?)", clause)
            if num_m:
                constraints.append({
                    "attribute": "outputSpeed",
                    "operator": operator,
                    "value": float(num_m.group(1)),
                    "unit": "RPM",
                    "mandatory": True
                })
                seen_attributes.add("outputSpeed")
                continue

        if "speed" in clause and "speed" not in seen_attributes and "inputSpeed" not in seen_attributes:
            num_m = re.search(r"(\d+(?:\.\d+)?)", clause)
            if num_m:
                constraints.append({
                    "attribute": "speed",
                    "operator": operator,
                    "value": float(num_m.group(1)),
                    "unit": "RPM",
                    "mandatory": True
                })
                seen_attributes.add("speed")
                continue

        # Efficiency
        if "efficiency" in clause and "efficiency" not in seen_attributes:
            num_m = re.search(r"(\d+(?:\.\d+)?)\s*%", clause)
            if not num_m:
                num_m = re.search(r"(\d+(?:\.\d+)?)", clause)
            if num_m:
                constraints.append({
                    "attribute": "efficiency",
                    "operator": operator if operator != "=" else ">=",
                    "value": float(num_m.group(1)),
                    "unit": "%",
                    "mandatory": True
                })
                seen_attributes.add("efficiency")
                continue

        # Torque
        if "torque" in clause and "torque" not in seen_attributes:
            num_m = re.search(r"(\d+(?:\.\d+)?)", clause)
            if num_m:
                constraints.append({
                    "attribute": "torque",
                    "operator": operator if operator != "=" else ">=",
                    "value": float(num_m.group(1)),
                    "unit": "Nm",
                    "mandatory": True
                })
                seen_attributes.add("torque")
                continue

        # Power
        if "power" in clause and "power" not in seen_attributes:
            num_m = re.search(r"(\d+(?:\.\d+)?)\s*(?:kw|hp|w)?", clause)
            if num_m:
                constraints.append({
                    "attribute": "power",
                    "operator": operator if operator != "=" else ">=",
                    "value": float(num_m.group(1)),
                    "unit": "kW",
                    "mandatory": True
                })
                seen_attributes.add("power")
                continue

        # Price / Budget
        if ("price" in clause or "budget" in clause or "cost" in clause or "inr" in clause or "₹" in clause or "rs" in clause) and "maxPrice" not in seen_attributes:
            num_m = re.search(r"(\d+(?:\.\d+)?)", clause)
            if num_m:
                constraints.append({
                    "attribute": "maxPrice",
                    "operator": operator if operator != "=" else "<=",
                    "value": float(num_m.group(1)),
                    "unit": "INR",
                    "currency": "INR",
                    "mandatory": True
                })
                seen_attributes.add("maxPrice")
                continue

        # Delivery / Lead Time
        if ("delivery" in clause or "lead time" in clause or "days" in clause or "day" in clause) and "deliveryDays" not in seen_attributes:
            num_m = re.search(r"(\d+(?:\.\d+)?)", clause)
            if num_m:
                constraints.append({
                    "attribute": "deliveryDays",
                    "operator": operator if operator != "=" else "<=",
                    "value": float(num_m.group(1)),
                    "unit": "days",
                    "mandatory": True
                })
                seen_attributes.add("deliveryDays")
                continue

        # MOQ
        if "moq" in clause and "moq" not in seen_attributes:
            num_m = re.search(r"(\d+(?:\.\d+)?)", clause)
            if num_m:
                constraints.append({
                    "attribute": "moq",
                    "operator": operator if operator != "=" else "<=",
                    "value": float(num_m.group(1)),
                    "unit": "units",
                    "mandatory": True
                })
                seen_attributes.add("moq")
                continue

        # Pressure / Head / Flow Rate / Size
        if ("flow" in clause or "flowrate" in clause) and "flowRate" not in seen_attributes:
            num_m = re.search(r"(\d+(?:\.\d+)?)", clause)
            if num_m:
                constraints.append({
                    "attribute": "flowRate",
                    "operator": operator,
                    "value": float(num_m.group(1)),
                    "unit": "L/min",
                    "mandatory": True
                })
                seen_attributes.add("flowRate")
                continue

        if ("pressure" in clause or "bar" in clause) and "pressure" not in seen_attributes:
            num_m = re.search(r"(\d+(?:\.\d+)?)", clause)
            if num_m:
                constraints.append({
                    "attribute": "pressure",
                    "operator": operator if operator != "=" else ">=",
                    "value": float(num_m.group(1)),
                    "unit": "bar",
                    "mandatory": True
                })
                seen_attributes.add("pressure")
                continue

        if ("head" in clause or "meter" in clause) and "head" not in seen_attributes:
            num_m = re.search(r"(\d+(?:\.\d+)?)", clause)
            if num_m:
                constraints.append({
                    "attribute": "head",
                    "operator": operator if operator != "=" else ">=",
                    "value": float(num_m.group(1)),
                    "unit": "m",
                    "mandatory": True
                })
                seen_attributes.add("head")
                continue

        # Supplier Status
        if "supplier" in clause and ("approved" in clause or "preferred" in clause) and "supplierStatus" not in seen_attributes:
            status_val = "APPROVED" if "approved" in clause else "PREFERRED"
            constraints.append({
                "attribute": "supplierStatus",
                "operator": "=",
                "value": status_val,
                "unit": "",
                "mandatory": True
            })
            seen_attributes.add("supplierStatus")
            continue

        # Offer Status
        if "offer" in clause and "active" in clause and "offerStatus" not in seen_attributes:
            constraints.append({
                "attribute": "offerStatus",
                "operator": "=",
                "value": "ACTIVE",
                "unit": "",
                "mandatory": True
            })
            seen_attributes.add("offerStatus")
            continue

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

    # Separate technical vs commercial constraints
    COMMERCIAL_KEYS = {"maxprice", "deliverydays", "quantity", "stock"}
    tech_constraints = []
    comm_constraints = []

    for c in constraints:
        attr_clean = SEMANTIC_SYNONYMS.get(c.attribute.lower().strip(), c.attribute.lower().strip())
        if attr_clean in COMMERCIAL_KEYS:
            comm_constraints.append(c)
        else:
            tech_constraints.append(c)

    # 2. Fetch all products belonging to this category from MASTER PRODUCT DATABASE
    all_products = db.query(Product).all()
    category_products = []
    for p in all_products:
        prod_cat = p.category.lower()
        if req_category == "motor" and "motor" in prod_cat:
            category_products.append(p)
        elif req_category == "pump" and "pump" in prod_cat:
            category_products.append(p)
        elif req_category == "valve" and "valve" in prod_cat:
            category_products.append(p)
        elif req_category == "compressor" and "compressor" in prod_cat:
            category_products.append(p)
        elif req_category == "gearbox" and "gearbox" in prod_cat:
            category_products.append(p)

    exact_matches = []
    alternatives = []

    # 3. Two-Layer Evaluation Engine
    # Layer 1: Evaluate Master Product Technical Data
    # Layer 2: Evaluate Associated Supplier Offers Commercial Data
    for product in category_products:
        # Fetch current active version of the product
        active_version = db.query(ProductVersion).filter(
            ProductVersion.product_id == product.id,
            ProductVersion.is_current == True
        ).first()

        if not active_version:
            # Fallback to the latest version if none marked current
            active_version = db.query(ProductVersion).filter(
                ProductVersion.product_id == product.id
            ).order_by(ProductVersion.created_at.desc()).first()

        db_attributes = {}
        if active_version:
            for attr in active_version.attributes:
                db_attributes[attr.attribute_name.lower().strip()] = attr

        # Build dynamic specs from Master Product Attributes
        dynamic_specs = {}
        for attr_key, attr_obj in db_attributes.items():
            std_key = SEMANTIC_SYNONYMS.get(attr_key, attr_key)
            dynamic_specs[std_key] = attr_obj.attribute_value

        # --- Layer 1: Evaluate Technical Constraints on Master Product ---
        is_tech_exact = True
        tech_match_score = 100.0
        tech_failed_constraints = []
        tech_passed_constraints = []
        tech_warnings = []

        for c in tech_constraints:
            attr_name = c.attribute.lower().strip()
            attr_std = SEMANTIC_SYNONYMS.get(attr_name, attr_name)

            matched_attr = resolve_attribute(attr_std, db_attributes)

            if not matched_attr:
                if c.mandatory:
                    is_tech_exact = False
                    tech_match_score -= 25.0
                    tech_failed_constraints.append(
                        f"Technical attribute '{c.attribute}' could not be verified (missing from master product specifications)"
                    )
                continue

            if matched_attr.verification_status == "CONFLICT":
                is_tech_exact = False
                tech_match_score -= 30.0
                tech_failed_constraints.append(
                    f"Data conflict flag: Master specification for '{matched_attr.attribute_name}' is unverified due to technical discrepancy."
                )
                tech_warnings.append(f"Unresolved spec discrepancy on attribute '{matched_attr.attribute_name}'")
                continue

            supp_raw_val = matched_attr.attribute_value
            supp_norm_val = matched_attr.normalized_value
            supp_unit = matched_attr.unit

            if supp_norm_val is not None:
                try:
                    req_val = float(c.value)
                    n_supp_val, _ = normalize_value(supp_norm_val, supp_unit)
                    n_req_val, _ = normalize_value(req_val, c.unit)

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
                        is_tech_exact = False
                        penalty = 40.0 if c.mandatory else 20.0
                        tech_match_score -= penalty
                        tech_failed_constraints.append(
                            f"Spec discrepancy: {matched_attr.attribute_name} is {supp_raw_val} (Required: {c.operator} {c.value} {c.unit or ''})"
                        )
                    else:
                        tech_passed_constraints.append(
                            f"Validated {matched_attr.attribute_name}: {supp_raw_val} satisfies {c.operator} {c.value} {c.unit or ''}"
                        )
                except Exception:
                    supp_raw_lower = str(supp_raw_val).lower().replace(" ", "")
                    req_lower = str(c.value).lower().replace(" ", "")
                    if req_lower not in supp_raw_lower:
                        is_tech_exact = False
                        tech_match_score -= 30.0
                        tech_failed_constraints.append(
                            f"Spec discrepancy: {matched_attr.attribute_name} is {supp_raw_val} (Required: {c.value})"
                        )
            else:
                # String comparison (e.g. ratio "10:1", material "SS316")
                supp_raw_lower = str(supp_raw_val).lower().replace(" ", "")
                req_lower = str(c.value).lower().replace(" ", "")
                if req_lower == "stainlesssteel" or req_lower == "ss":
                    req_lower = "ss31"

                # Check exact ratio match or substring
                if c.operator == "=":
                    matches = (supp_raw_lower == req_lower or req_lower in supp_raw_lower)
                else:
                    matches = (req_lower in supp_raw_lower)

                if not matches:
                    is_tech_exact = False
                    penalty = 35.0 if c.mandatory else 20.0
                    tech_match_score -= penalty
                    tech_failed_constraints.append(
                        f"Spec discrepancy: {matched_attr.attribute_name} is {supp_raw_val} (Required: {c.value})"
                    )
                else:
                    tech_passed_constraints.append(
                        f"Validated {matched_attr.attribute_name}: {supp_raw_val} matches required {c.value}"
                    )

        tech_match_score = max(0.0, min(100.0, tech_match_score))

        # --- Layer 2: Evaluate All Supplier Offers for this Product ---
        supplier_products = db.query(SupplierProduct).filter(
            SupplierProduct.product_id == product.id
        ).all()

        for sp in supplier_products:
            supplier = sp.supplier

            is_comm_exact = True
            comm_match_score = 100.0
            comm_failed_constraints = []
            comm_passed_constraints = []

            for c in comm_constraints:
                attr_name = c.attribute.lower().strip()
                attr_std = SEMANTIC_SYNONYMS.get(attr_name, attr_name)

                if attr_std == "maxprice":
                    val = sp.price
                    limit = float(c.value)
                    if val > limit:
                        is_comm_exact = False
                        penalty = min(30.0, ((val - limit) / limit) * 100.0)
                        comm_match_score -= penalty
                        comm_failed_constraints.append(
                            f"Price of {sp.currency} {val:,.2f} exceeds budget limit of {sp.currency} {limit:,.2f} by {((val-limit)/limit)*100:.1f}%"
                        )
                    else:
                        comm_passed_constraints.append(
                            f"Price: {sp.currency} {val:,.2f} <= budget limit {sp.currency} {limit:,.2f}"
                        )

                elif attr_std == "deliverydays":
                    val = sp.delivery_days
                    limit = float(c.value)
                    norm_val, _ = normalize_value(val, "days")
                    norm_limit, _ = normalize_value(limit, c.unit or "days")
                    if norm_val > norm_limit:
                        is_comm_exact = False
                        penalty = min(25.0, ((norm_val - norm_limit) / norm_limit) * 50.0)
                        comm_match_score -= penalty
                        comm_failed_constraints.append(
                            f"Lead time of {val} days exceeds requested maximum of {int(norm_limit)} days by {int(norm_val - norm_limit)} days"
                        )
                    else:
                        comm_passed_constraints.append(
                            f"Delivery: {val} days <= requested maximum {int(norm_limit)} days"
                        )

                elif attr_std in ["quantity", "stock"]:
                    val = sp.stock_quantity
                    required = quantity
                    if val < required:
                        is_comm_exact = False
                        comm_match_score -= 15.0
                        comm_failed_constraints.append(
                            f"Available stock is {val} units, which is below the required {required} units"
                        )
                    else:
                        comm_passed_constraints.append(
                            f"Stock: {val} units available >= required {required}"
                        )

            # Combined Verification
            is_overall_exact = is_tech_exact and is_comm_exact
            combined_score = (tech_match_score * 0.7) + (comm_match_score * 0.3)
            combined_score = max(0.0, min(100.0, combined_score))

            all_violations = tech_failed_constraints + comm_failed_constraints
            all_passed = tech_passed_constraints + comm_passed_constraints

            if is_overall_exact:
                status_label = "Exact Match"
            elif is_tech_exact or combined_score >= 60.0:
                status_label = "Closest Alternative"
            else:
                status_label = "Not Recommended"

            res_item = {
                "id": sp.id,
                "supplierId": supplier.id if supplier else None,
                "supplierCode": supplier.supplier_code if supplier else None,
                "supplierName": supplier.name if supplier else "Authorized Supplier",
                "tier": supplier.tier if supplier else "Authorized Partner",
                "rating": supplier.rating if supplier else 4.5,
                "productId": product.id,
                "productModel": product.product_code,
                "productName": product.name,
                "category": product.category,
                "priceINR": sp.price,
                "currency": sp.currency or "INR",
                "stockQty": sp.stock_quantity,
                "deliveryDays": sp.delivery_days,
                "technicalMatchScore": 1.0 if is_overall_exact else round(combined_score / 100.0, 2),
                "isExactMatch": is_overall_exact,
                "violations": all_violations,
                "passed": all_passed,
                "warnings": tech_warnings,
                "specs": dynamic_specs,  # MASTER PRODUCT TRUTH
                "status": status_label,
                "advantageNotes": sp.advantage_notes or "Verified supplier offering.",
                "is_tech_exact": is_tech_exact
            }

            if is_overall_exact:
                exact_matches.append(res_item)
            else:
                alternatives.append(res_item)

        # If product has no linked supplier_products, construct listing from uploaded master product record
        if not supplier_products:
            res_item = {
                "id": product.id,
                "supplierId": None,
                "supplierCode": "UPL-DOC",
                "supplierName": product.manufacturer or "Uploaded Datasheet Vendor",
                "tier": "Uploaded Specification",
                "rating": 4.8,
                "productId": product.id,
                "productModel": product.product_code,
                "productName": product.name,
                "category": product.category,
                "priceINR": float(dynamic_specs.get("price", dynamic_specs.get("unit price", 35000))),
                "currency": "INR",
                "stockQty": int(dynamic_specs.get("stock", 50)),
                "deliveryDays": int(dynamic_specs.get("delivery_days", 7)),
                "technicalMatchScore": 1.0 if is_tech_exact else round(tech_match_score / 100.0, 2),
                "isExactMatch": is_tech_exact,
                "violations": tech_failed_constraints,
                "passed": tech_passed_constraints,
                "warnings": tech_warnings,
                "specs": dynamic_specs,
                "status": "Exact Match" if is_tech_exact else "Closest Alternative",
                "advantageNotes": "Extracted from uploaded document specifications.",
                "is_tech_exact": is_tech_exact
            }
            if is_tech_exact:
                exact_matches.append(res_item)
            else:
                alternatives.append(res_item)

    # Sort alternatives:
    # 1. Technically exact products (that failed only commercial limits) come first
    # 2. Recommended before Not Recommended
    # 3. Higher match score descending
    # 4. Lower price ascending
    alternatives = sorted(
        alternatives,
        key=lambda x: (
            not x["is_tech_exact"],
            x["status"] == "Not Recommended",
            -x["technicalMatchScore"],
            x["priceINR"]
        )
    )

    if exact_matches:
        status_str = "exact_matches_found"
    elif alternatives:
        status_str = "alternatives_found"
    else:
        status_str = "no_uploaded_data_found"

    return {
        "status": status_str,
        "exactMatches": exact_matches,
        "alternatives": alternatives
    }
