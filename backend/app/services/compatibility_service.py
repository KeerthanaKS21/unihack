from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from fastapi import HTTPException
from app.db.models.compatibility import Compatibility
from app.db.models.product import Product
from app.schemas.compatibility import CompatibilityCreate, CompatibilityUpdate
from app.services.compatibility_engine import CompatibilityEngine

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

            # Use real engine instead of mock data
            engine_result = CompatibilityEngine.check_compatibility(db, r.product_id, r.compatible_product_id)

            results.append({
                "id": r.id,
                "product_id": r.product_id,
                "compatible_product_id": r.compatible_product_id,
                "primary_name": p_source.product_code if p_source else "Unknown",
                "target_name": p_target.name if p_target else "Unknown Component",
                "target_category": p_target.category if p_target else "Unknown",
                "relationship_type": r.relationship_type,
                "status": engine_result["status"],
                "compatibility_score": engine_result["score"],
                "explanation": engine_result["explanation"],
                "affected_by_recent_change": r.affected_by_recent_change,
                "evidence_document_id": r.evidence_document_id,
                "confidence": r.confidence,
                "verification_status": r.verification_status,
                "relationship_chain": [p_source.name if p_source else "", p_target.name if p_target else ""],
                "checks": engine_result["checks"],
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
