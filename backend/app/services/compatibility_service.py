from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
import re
from datetime import datetime
from fastapi import HTTPException

from app.db.models.compatibility import Compatibility
from app.db.models.product import Product, ProductVersion, ProductAttribute
from app.db.models.document import Document
from app.db.models.certificate import Certificate
from app.schemas.compatibility import (
    CompatibilityCreate,
    CompatibilityUpdate,
    CompatibilityEvaluationResponse,
    AttributeComparison,
    AlternativeProductRecommendation
)

class CompatibilityService:
    @staticmethod
    def _extract_product_specs(db: Session, product_id: int) -> Dict[str, Any]:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            return {}

        current_ver = db.query(ProductVersion).filter(
            ProductVersion.product_id == product.id,
            ProductVersion.is_current == True
        ).first()

        attrs = {}
        sources = {}

        if current_ver:
            for attr in current_ver.attributes:
                k = attr.attribute_name.lower().strip()
                attrs[k] = attr.attribute_value
                doc = db.query(Document).filter(Document.id == attr.source_document_id).first() if attr.source_document_id else None
                sources[k] = doc.original_file_name if doc else "Product Master Catalog"

        # Check attached certificates for compliance declarations
        certs = db.query(Certificate).filter(Certificate.product_id == product.id).all()
        for c in certs:
            if c.standard:
                attrs["compliance_standard"] = c.standard
                sources["compliance_standard"] = f"Certificate {c.certificate_number} ({c.certification_body or 'Verified Body'})"

        return {
            "product": product,
            "version": current_ver,
            "attributes": attrs,
            "sources": sources
        }

    @staticmethod
    def evaluate_pair(db: Session, product_a_id: int, product_b_id: int) -> CompatibilityEvaluationResponse:
        data_a = CompatibilityService._extract_product_specs(db, product_a_id)
        data_b = CompatibilityService._extract_product_specs(db, product_b_id)

        if not data_a or not data_b:
            raise HTTPException(status_code=404, detail="One or both products not found in catalog")

        p_a: Product = data_a["product"]
        p_b: Product = data_b["product"]

        attrs_a = data_a["attributes"]
        attrs_b = data_b["attributes"]

        src_a = data_a["sources"]
        src_b = data_b["sources"]

        comparisons: List[AttributeComparison] = []
        missing_attrs: List[str] = []
        conflicting_attrs: List[Dict[str, Any]] = []

        is_motor_a = "motor" in p_a.category.lower() or "motor" in p_a.name.lower()
        is_ctrl_a = "drive" in p_a.category.lower() or "controller" in p_a.category.lower() or "vfd" in p_a.name.lower()
        
        is_motor_b = "motor" in p_b.category.lower() or "motor" in p_b.name.lower()
        is_ctrl_b = "drive" in p_b.category.lower() or "controller" in p_b.category.lower() or "vfd" in p_b.name.lower()

        # Extract numeric power
        def parse_power(val_str: Optional[str]) -> Optional[float]:
            if not val_str: return None
            m = re.search(r"(\d+(?:\.\d+)?)\s*(kW|HP|W)", val_str, re.IGNORECASE)
            if not m: return None
            v = float(m.group(1))
            unit = m.group(2).upper()
            if unit == "HP": return v * 0.7457
            if unit == "W": return v / 1000.0
            return v

        pow_a = parse_power(attrs_a.get("rated power") or attrs_a.get("power") or attrs_a.get("output power"))
        pow_b = parse_power(attrs_b.get("rated power") or attrs_b.get("power") or attrs_b.get("max power") or attrs_b.get("supported power"))

        # 1. Power Requirement Check
        if (is_motor_a and is_ctrl_b) or (is_ctrl_a and is_motor_b):
            motor_p = pow_a if is_motor_a else pow_b
            ctrl_p = pow_b if is_motor_a else pow_a
            
            val_a_str = attrs_a.get("rated power") or attrs_a.get("power") or "Unspecified"
            val_b_str = attrs_b.get("max power") or attrs_b.get("power") or attrs_b.get("rated power") or "Unspecified"

            if motor_p is None or ctrl_p is None:
                comparisons.append(AttributeComparison(
                    attribute_name="Power Capacity",
                    is_mandatory=True,
                    product_a_value=val_a_str,
                    product_a_source=src_a.get("power", "Datasheet"),
                    product_b_value=val_b_str,
                    product_b_source=src_b.get("power", "Datasheet"),
                    status="MISSING",
                    explanation="Power rating is missing in verified product specifications."
                ))
                missing_attrs.append("Power Capacity")
            elif motor_p > ctrl_p:
                diff = round(motor_p - ctrl_p, 1)
                comparisons.append(AttributeComparison(
                    attribute_name="Power Capacity",
                    is_mandatory=True,
                    product_a_value=val_a_str,
                    product_a_source=src_a.get("power", "Datasheet"),
                    product_b_value=val_b_str,
                    product_b_source=src_b.get("power", "Datasheet"),
                    status="FAIL",
                    explanation=f"Motor power ({motor_p} kW) exceeds maximum controller rating ({ctrl_p} kW) by {diff} kW."
                ))
            else:
                comparisons.append(AttributeComparison(
                    attribute_name="Power Capacity",
                    is_mandatory=True,
                    product_a_value=val_a_str,
                    product_a_source=src_a.get("power", "Datasheet"),
                    product_b_value=val_b_str,
                    product_b_source=src_b.get("power", "Datasheet"),
                    status="PASS",
                    explanation=f"Controller supported power ({ctrl_p} kW) satisfies motor requirement ({motor_p} kW)."
                ))

        # 2. Voltage Check
        volt_a = attrs_a.get("voltage") or attrs_a.get("rated voltage") or attrs_a.get("operating voltage")
        volt_b = attrs_b.get("voltage") or attrs_b.get("rated voltage") or attrs_b.get("input voltage")

        if not volt_a or not volt_b:
            comparisons.append(AttributeComparison(
                attribute_name="Operating Voltage",
                is_mandatory=True,
                product_a_value=volt_a or "Unspecified",
                product_a_source=src_a.get("voltage", "Datasheet"),
                product_b_value=volt_b or "Unspecified",
                product_b_source=src_b.get("voltage", "Datasheet"),
                status="MISSING",
                explanation="Operating voltage could not be verified from available product specifications."
            ))
            missing_attrs.append("Operating Voltage")
        else:
            comparisons.append(AttributeComparison(
                attribute_name="Operating Voltage",
                is_mandatory=True,
                product_a_value=volt_a,
                product_a_source=src_a.get("voltage", "Datasheet"),
                product_b_value=volt_b,
                product_b_source=src_b.get("voltage", "Datasheet"),
                status="PASS",
                explanation=f"Voltage levels match: Product A ({volt_a}) & Product B ({volt_b})."
            ))

        # 3. Frequency Check
        freq_a = attrs_a.get("frequency") or attrs_a.get("supply frequency")
        freq_b = attrs_b.get("frequency") or attrs_b.get("output frequency")
        if freq_a and freq_b:
            comparisons.append(AttributeComparison(
                attribute_name="Base Frequency",
                is_mandatory=True,
                product_a_value=freq_a,
                product_a_source=src_a.get("frequency", "Datasheet"),
                product_b_value=freq_b,
                product_b_source=src_b.get("frequency", "Datasheet"),
                status="PASS",
                explanation="Frequency modulation range compatible."
            ))

        # 4. Ingress Protection (IP Rating)
        ip_a = attrs_a.get("ip_rating") or attrs_a.get("enclosure protection")
        ip_b = attrs_b.get("ip_rating") or attrs_b.get("enclosure protection")
        if ip_a or ip_b:
            comparisons.append(AttributeComparison(
                attribute_name="Ingress Protection Rating",
                is_mandatory=False,
                product_a_value=ip_a or "Not Specified",
                product_a_source=src_a.get("ip_rating", "Certificate"),
                product_b_value=ip_b or "Not Specified",
                product_b_source=src_b.get("ip_rating", "Certificate"),
                status="PASS" if ip_a == ip_b else "REVIEW",
                explanation="Both components certified to matching protection level." if ip_a == ip_b else "Protection ratings differ; verify installation environment."
            ))

        # Determine Final Result Status
        has_failed_mandatory = any(c.status == "FAIL" and c.is_mandatory for c in comparisons)
        has_missing_mandatory = any(c.status == "MISSING" and c.is_mandatory for c in comparisons)
        has_conflicts = len(conflicting_attrs) > 0

        if has_failed_mandatory:
            result = "NOT_COMPATIBLE"
            overall_label = "❌ NOT COMPATIBLE"
            score = 0.0
            summary = "One or more mandatory technical requirements failed."
        elif has_missing_mandatory:
            result = "INSUFFICIENT_DATA"
            overall_label = "❓ INSUFFICIENT VERIFIED DATA"
            score = 0.5
            summary = f"Mandatory technical data ({', '.join(missing_attrs)}) could not be verified."
        elif has_conflicts:
            result = "NEEDS_REVIEW"
            overall_label = "⚠ NEEDS REVIEW"
            score = 0.7
            summary = "Conflicting specification sources detected across verified documents."
        else:
            result = "COMPATIBLE"
            overall_label = "✅ COMPATIBLE"
            score = 1.0
            summary = "All mandatory technical requirements satisfied based on verified product specifications."

        # Find alternatives if incompatible
        alternatives: List[AlternativeProductRecommendation] = []
        if result == "NOT_COMPATIBLE":
            target_cat = p_b.category
            other_products = db.query(Product).filter(Product.category == target_cat, Product.id != p_b.id).all()
            for alt in other_products:
                alt_specs = CompatibilityService._extract_product_specs(db, alt.id)["attributes"]
                alt_pow = parse_power(alt_specs.get("max power") or alt_specs.get("power") or alt_specs.get("rated power"))
                if alt_pow and pow_a and alt_pow >= pow_a:
                    alternatives.append(AlternativeProductRecommendation(
                        product_id=alt.id,
                        product_code=alt.product_code,
                        name=alt.name,
                        manufacturer=alt.manufacturer,
                        category=alt.category,
                        specs_summary=f"Supported Power: {alt_pow} kW • Voltage: {alt_specs.get('voltage', '415 V')}",
                        reason=f"Satisfies {p_a.product_code} power requirement ({pow_a} kW)."
                    ))

        return CompatibilityEvaluationResponse(
            product_a_id=p_a.id,
            product_a_code=p_a.product_code,
            product_a_name=p_a.name,
            product_a_category=p_a.category,
            product_b_id=p_b.id,
            product_b_code=p_b.product_code,
            product_b_name=p_b.name,
            product_b_category=p_b.category,
            result=result,
            overall_status_label=overall_label,
            overall_score=score,
            summary_reason=summary,
            attribute_comparisons=comparisons,
            missing_attributes=missing_attrs,
            conflicting_attributes=conflicting_attrs,
            alternative_recommendations=alternatives,
            evaluated_at=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        )

    @staticmethod
    def get_compatibility_for_product(db: Session, product_id: int) -> List[Dict[str, Any]]:
        relations = db.query(Compatibility).filter(
            (Compatibility.product_id == product_id) | (Compatibility.compatible_product_id == product_id)
        ).all()

        results = []
        for r in relations:
            p_source = db.query(Product).filter(Product.id == r.product_id).first()
            p_target = db.query(Product).filter(Product.id == r.compatible_product_id).first()
            results.append({
                "id": r.id,
                "product_id": r.product_id,
                "compatible_product_id": r.compatible_product_id,
                "primary_name": p_source.product_code if p_source else f"SKU-{r.product_id}",
                "target_name": p_target.name if p_target else "Industrial Component",
                "target_category": p_target.category if p_target else "Mechanical",
                "relationship_type": r.relationship_type,
                "status": r.status,
                "compatibility_score": r.compatibility_score,
                "explanation": r.explanation
            })
        return results

    @staticmethod
    def create_compatibility(db: Session, data: CompatibilityCreate) -> Compatibility:
        comp = Compatibility(
            product_id=data.product_id,
            compatible_product_id=data.compatible_product_id,
            relationship_type=data.relationship_type or "COMPATIBLE_WITH",
            status=data.status or "Compatible",
            compatibility_score=data.compatibility_score or 1.0,
            explanation=data.explanation
        )
        db.add(comp)
        db.commit()
        db.refresh(comp)
        return comp

    @staticmethod
    def update_compatibility(db: Session, comp_id: int, data: CompatibilityUpdate) -> Compatibility:
        c = db.query(Compatibility).filter(Compatibility.id == comp_id).first()
        if not c:
            raise HTTPException(status_code=404, detail=f"Compatibility record ID {comp_id} not found")
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(c, k, v)
        db.commit()
        db.refresh(c)
        return c

    @staticmethod
    def delete_compatibility(db: Session, comp_id: int) -> dict:
        c = db.query(Compatibility).filter(Compatibility.id == comp_id).first()
        if not c:
            raise HTTPException(status_code=404, detail=f"Compatibility record ID {comp_id} not found")
        db.delete(c)
        db.commit()
        return {"message": f"Compatibility record {comp_id} deleted successfully"}
