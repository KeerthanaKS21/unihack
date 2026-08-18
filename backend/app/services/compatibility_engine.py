import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.db.models.product import Product, ProductAttribute
from app.services.unit_normalization_service import UnitNormalizationService

logger = logging.getLogger("compatibility_engine")

class CompatibilityEngine:
    """
    Deterministic Engineering Compatibility Engine.
    Evaluates technical compatibility between industrial products.
    """

    @staticmethod
    def get_product_specs(db: Session, product_id: int) -> Dict[str, Any]:
        """Extracts and normalizes specifications for a given product."""
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            return {}

        specs = {}
        if product.current_version_id:
            attributes = db.query(ProductAttribute).filter(
                ProductAttribute.product_version_id == product.current_version_id
            ).all()
            
            for attr in attributes:
                spec_dict = {
                    "attribute_name": attr.attribute_name,
                    "value": attr.normalized_value if attr.normalized_value is not None else attr.attribute_value,
                    "raw_value": attr.attribute_value,
                    "unit": attr.unit,
                    "source": f"Doc {attr.source_document_id} Page {attr.source_page}" if attr.source_document_id else "Product Master",
                    "confidence": attr.confidence
                }
                norm_spec = UnitNormalizationService.normalize_specification(spec_dict)
                
                # Map to canonical keys
                key = attr.attribute_name.lower().replace(" ", "_")
                if "supported_power" in key: key = "supported_power"
                elif "required_motor_power" in key: key = "required_motor_power"
                elif "required_speed" in key: key = "required_speed"
                elif "power" in key: key = "power"
                elif "voltage" in key: key = "voltage"
                elif "speed" in key or "rpm" in key: key = "speed"
                elif "shaft" in key: key = "shaft_diameter"
                elif "bore" in key: key = "bore"
                elif "torque" in key: key = "torque"
                elif "frequency" in key: key = "frequency"
                
                specs[key] = norm_spec

        return specs

    @staticmethod
    def check_compatibility(db: Session, source_product_id: int, target_product_id: int) -> Dict[str, Any]:
        """Checks compatibility between two products."""
        source_product = db.query(Product).filter(Product.id == source_product_id).first()
        target_product = db.query(Product).filter(Product.id == target_product_id).first()

        if not source_product or not target_product:
            return {"status": "UNKNOWN", "explanation": "Product not found."}

        source_specs = CompatibilityEngine.get_product_specs(db, source_product_id)
        target_specs = CompatibilityEngine.get_product_specs(db, target_product_id)

        checks = []
        overall_status = "COMPATIBLE"
        critical_failure = False
        unknowns = 0

        # Rule 1: Motor to Controller (Power & Voltage)
        if source_product.category == "Motor" and target_product.category == "Controller":
            # Check Power
            if "power" in source_specs and "supported_power" in target_specs:
                s_power = source_specs["power"]["normalized_value"]
                t_power = target_specs["supported_power"]["raw_value"] or target_specs["supported_power"]["normalized_value"]
                if isinstance(t_power, str) and "-" in t_power:
                    min_p, max_p = map(float, t_power.replace("kW", "").strip().split("-"))
                    if min_p <= s_power <= max_p:
                        checks.append({"parameter": "Power", "primaryValue": f"{s_power} kW", "targetValue": f"{min_p}-{max_p} kW", "status": "PASS", "explanation": "Motor power is within controller supported range."})
                    else:
                        checks.append({"parameter": "Power", "primaryValue": f"{s_power} kW", "targetValue": f"{min_p}-{max_p} kW", "status": "FAIL", "explanation": f"Motor power {s_power} kW is outside controller range {min_p}-{max_p} kW."})
                        critical_failure = True
                else:
                    if s_power <= float(t_power):
                        checks.append({"parameter": "Power", "primaryValue": f"{s_power} kW", "targetValue": f"{t_power} kW", "status": "PASS", "explanation": "Motor power is supported by controller."})
                    else:
                        checks.append({"parameter": "Power", "primaryValue": f"{s_power} kW", "targetValue": f"{t_power} kW", "status": "FAIL", "explanation": f"Motor power {s_power} kW exceeds controller max {t_power} kW."})
                        critical_failure = True
            else:
                unknowns += 1
                checks.append({"parameter": "Power", "status": "UNKNOWN", "explanation": "Power specification missing."})

            # Check Voltage
            if "voltage" in source_specs and "voltage" in target_specs:
                s_volt = source_specs["voltage"]["normalized_value"]
                t_volt = target_specs["voltage"]["normalized_value"]
                if s_volt == t_volt:
                    checks.append({"parameter": "Voltage", "primaryValue": f"{s_volt} V", "targetValue": f"{t_volt} V", "status": "PASS", "explanation": "Voltages match."})
                else:
                    checks.append({"parameter": "Voltage", "primaryValue": f"{s_volt} V", "targetValue": f"{t_volt} V", "status": "FAIL", "explanation": "Voltage mismatch."})
                    critical_failure = True
            else:
                unknowns += 1
                checks.append({"parameter": "Voltage", "status": "UNKNOWN", "explanation": "Voltage specification missing."})

        # Rule 2: Motor to Pump (Power & Speed)
        elif source_product.category == "Motor" and target_product.category == "Pump":
            if "power" in source_specs and "required_motor_power" in target_specs:
                s_power = source_specs["power"]["normalized_value"]
                t_power = target_specs["required_motor_power"]["raw_value"] or target_specs["required_motor_power"]["normalized_value"]
                if isinstance(t_power, str) and "-" in t_power:
                    min_p, max_p = map(float, t_power.replace("kW", "").strip().split("-"))
                    if min_p <= s_power <= max_p:
                        checks.append({"parameter": "Power", "primaryValue": f"{s_power} kW", "targetValue": f"{min_p}-{max_p} kW", "status": "PASS", "explanation": "Motor power meets pump requirements."})
                    else:
                        checks.append({"parameter": "Power", "primaryValue": f"{s_power} kW", "targetValue": f"{min_p}-{max_p} kW", "status": "FAIL", "explanation": "Motor power does not meet pump requirements."})
                        critical_failure = True
            
            if "speed" in source_specs and "required_speed" in target_specs:
                s_speed = source_specs["speed"]["normalized_value"]
                t_speed = target_specs["required_speed"]["raw_value"] or target_specs["required_speed"]["normalized_value"]
                if isinstance(t_speed, str) and "-" in t_speed:
                    min_s, max_s = map(float, t_speed.replace("RPM", "").strip().split("-"))
                    if min_s <= s_speed <= max_s:
                        checks.append({"parameter": "Speed", "primaryValue": f"{s_speed} RPM", "targetValue": f"{min_s}-{max_s} RPM", "status": "PASS", "explanation": "Motor speed is within pump required range."})
                    else:
                        checks.append({"parameter": "Speed", "primaryValue": f"{s_speed} RPM", "targetValue": f"{min_s}-{max_s} RPM", "status": "FAIL", "explanation": "Motor speed is outside pump required range."})
                        critical_failure = True

        # Rule 3: Motor to Coupling (Shaft & Bore)
        elif source_product.category == "Motor" and target_product.category == "Coupling":
            if "shaft_diameter" in source_specs and "bore" in target_specs:
                s_shaft = source_specs["shaft_diameter"]["normalized_value"]
                t_bore = target_specs["bore"]["normalized_value"]
                if s_shaft == t_bore:
                    checks.append({"parameter": "Shaft/Bore", "primaryValue": f"{s_shaft} mm", "targetValue": f"{t_bore} mm", "status": "PASS", "explanation": "Motor shaft matches coupling bore."})
                else:
                    diff = abs(float(s_shaft) - float(t_bore))
                    checks.append({"parameter": "Shaft/Bore", "primaryValue": f"{s_shaft} mm", "targetValue": f"{t_bore} mm", "status": "FAIL", "explanation": f"The motor shaft is {'larger' if s_shaft > t_bore else 'smaller'} than the coupling bore by {diff} mm."})
                    critical_failure = True
            else:
                unknowns += 1
                checks.append({"parameter": "Shaft/Bore", "status": "UNKNOWN", "explanation": "Shaft or bore specification missing."})

        if critical_failure:
            overall_status = "INCOMPATIBLE"
        elif len(checks) == 0:
            overall_status = "INCOMPATIBLE"
            checks = [{
                "parameter": "System Rules",
                "primaryValue": "N/A",
                "targetValue": "N/A",
                "status": "FAIL",
                "explanation": "No known compatibility path."
            }]
        elif unknowns > 0 and len(checks) == unknowns:
            overall_status = "UNKNOWN"
        elif unknowns > 0:
            overall_status = "NEEDS REVIEW"

        score = 1.0 if overall_status == "COMPATIBLE" else (0.0 if overall_status == "INCOMPATIBLE" else 0.5)

        return {
            "source_product_id": source_product.id,
            "target_product_id": target_product.id,
            "source_product": source_product.name,
            "target_product": target_product.name,
            "status": overall_status,
            "score": score,
            "checks": checks,
            "explanation": "Compatibility verified." if overall_status == "COMPATIBLE" else "Incompatibilities found."
        }

    @staticmethod
    def check_system_compatibility(db: Session, product_ids: List[int]) -> Dict[str, Any]:
        """Checks compatibility across a system of products."""
        results = []
        overall_status = "COMPATIBLE"
        
        # Check all pairs
        for i in range(len(product_ids)):
            for j in range(i + 1, len(product_ids)):
                res = CompatibilityEngine.check_compatibility(db, product_ids[i], product_ids[j])
                
                results.append(res)
                if res["status"] == "INCOMPATIBLE":
                    overall_status = "INCOMPATIBLE"
                elif res["status"] in ["UNKNOWN", "NEEDS REVIEW"] and overall_status == "COMPATIBLE":
                    overall_status = res["status"]

        return {
            "system_status": overall_status,
            "pair_results": results
        }

    @staticmethod
    def find_alternatives(db: Session, target_product_id: int, source_product_id: int) -> List[Dict[str, Any]]:
        """Finds compatible alternatives for target_product_id that work with source_product_id."""
        target_product = db.query(Product).filter(Product.id == target_product_id).first()
        if not target_product:
            return []

        # Find all products of the same category
        candidates = db.query(Product).filter(Product.category == target_product.category, Product.id != target_product_id).all()
        
        alternatives = []
        for cand in candidates:
            res = CompatibilityEngine.check_compatibility(db, source_product_id, cand.id)
            if res["status"] == "COMPATIBLE":
                alternatives.append({
                    "product_id": cand.id,
                    "product_name": cand.name,
                    "compatibility_score": res["score"],
                    "checks": res["checks"]
                })
                
        # Sort by score
        alternatives.sort(key=lambda x: x["compatibility_score"], reverse=True)
        return alternatives
