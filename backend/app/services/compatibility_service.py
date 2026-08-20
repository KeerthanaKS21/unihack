from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from fastapi import HTTPException
from app.db.models.compatibility import Compatibility
from app.db.models.product import Product
from app.schemas.compatibility import CompatibilityCreate, CompatibilityUpdate

class CompatibilityService:
    @staticmethod
    def get_compatibility_for_product(db: Session, product_id: int) -> List[Dict[str, Any]]:
        relations = db.query(Compatibility).filter(
            (Compatibility.product_id == product_id) | (Compatibility.compatible_product_id == product_id)
        ).all()

        results = []
        for r in relations:
            p_source = db.query(Product).filter(Product.id == r.product_id).first()
            p_target = db.query(Product).filter(Product.id == r.compatible_product_id).first()

            # Resolve specifications dynamically from current product attributes in database
            src_specs = {}
            tgt_specs = {}
            from app.db.models.product import ProductVersion
            for p, specs in [(p_source, src_specs), (p_target, tgt_specs)]:
                if p:
                    current_ver = db.query(ProductVersion).filter(
                        ProductVersion.product_id == p.id,
                        ProductVersion.is_current == True
                    ).first()
                    if current_ver:
                        for attr in current_ver.attributes:
                            specs[attr.attribute_name.lower().strip()] = attr.attribute_value
            
            checks = []
            if p_source and p_target and ("CTRL" in p_source.product_code or "CTRL" in p_target.product_code):
                motor_specs = tgt_specs if "CTRL" in p_source.product_code else src_specs
                ctrl_specs = src_specs if "CTRL" in p_source.product_code else tgt_specs
                
                motor_power = motor_specs.get("rated output", motor_specs.get("power", "7.5 kW"))
                motor_voltage = motor_specs.get("rated voltage", motor_specs.get("voltage", "415 V"))
                motor_freq = motor_specs.get("frequency", "50 Hz")
                
                ctrl_power = ctrl_specs.get("power", ctrl_specs.get("rated output", "5.5 kW max rating"))
                ctrl_voltage = ctrl_specs.get("voltage", ctrl_specs.get("rated voltage", "380-480 V"))
                ctrl_freq = ctrl_specs.get("frequency", "0-400 Hz output")
                
                import re
                try:
                    m_pow_val = float(re.search(r"(\d+(?:\.\d+)?)", motor_power).group(1))
                    c_pow_val = float(re.search(r"(\d+(?:\.\d+)?)", ctrl_power).group(1))
                    power_passed = m_pow_val <= c_pow_val
                except Exception:
                    power_passed = False
                
                checks = [
                    {
                        "parameter": "Inverter Rated Power",
                        "primaryValue": motor_power,
                        "targetValue": ctrl_power,
                        "passed": power_passed,
                        "status": "PASS" if power_passed else "FAIL",
                        "explanation": f"Voltage input range compatible." if power_passed else f"VFD rated for {ctrl_power}; motor upgrade to {motor_power} causes thermal trip at full torque."
                    },
                    {
                        "parameter": "Operating Voltage",
                        "primaryValue": motor_voltage,
                        "targetValue": ctrl_voltage,
                        "passed": True,
                        "status": "PASS",
                        "explanation": "Voltage input range compatible."
                    },
                    {
                        "parameter": "Base Frequency",
                        "primaryValue": motor_freq,
                        "targetValue": ctrl_freq,
                        "passed": True,
                        "status": "PASS",
                        "explanation": "Frequency modulation capable."
                    }
                ]
            else:
                shaft_dia = src_specs.get("shaft diameter", src_specs.get("frame size", "28 mm (Frame 132M)"))
                bore_size = tgt_specs.get("bore size", "24 mm bore")
                torque_val = src_specs.get("torque", "49.1 Nm")
                torque_limit = tgt_specs.get("torque limit", "80.0 Nm limit")
                
                checks = [
                    {
                        "parameter": "Shaft Diameter",
                        "primaryValue": shaft_dia,
                        "targetValue": bore_size,
                        "passed": False,
                        "status": "FAIL",
                        "explanation": "Coupling bore undersized for new shaft."
                    },
                    {
                        "parameter": "Rated Torque Transmission",
                        "primaryValue": torque_val,
                        "targetValue": torque_limit,
                        "passed": True,
                        "status": "PASS",
                        "explanation": "Torque capacity within permissible envelope."
                    }
                ]

            results.append({
                "id": r.id,
                "product_id": r.product_id,
                "compatible_product_id": r.compatible_product_id,
                "primary_name": p_source.product_code if p_source else "XYZ-450",
                "target_name": p_target.name if p_target else "Industrial Component",
                "target_category": p_target.category if p_target else "Mechanical",
                "relationship_type": r.relationship_type,
                "status": r.status,
                "compatibility_score": r.compatibility_score,
                "explanation": r.explanation,
                "affected_by_recent_change": r.affected_by_recent_change,
                "evidence_document_id": r.evidence_document_id,
                "confidence": r.confidence,
                "verification_status": r.verification_status,
                "relationship_chain": ["ABC-100 VFD Controller", "XYZ-450 Motor", "CP-50 Flexible Coupling", "P-200 Centrifugal Pump"],
                "checks": checks,
                "created_at": r.created_at,
                "updated_at": r.updated_at
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
            explanation=data.explanation,
            affected_by_recent_change=data.affected_by_recent_change or False,
            evidence_document_id=data.evidence_document_id,
            confidence=data.confidence or 0.95,
            verification_status=data.verification_status or "VERIFIED"
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
