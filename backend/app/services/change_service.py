from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional, List, Dict, Any
from datetime import datetime
from fastapi import HTTPException
from app.db.models.change import Change, ChangeImpact
from app.db.models.product import Product
from app.db.models.approval import Approval
from app.schemas.change import ChangeCreate, ChangeImpactCreate, ChangeImpactReviewRequest

class ChangeService:
    @staticmethod
    def get_changes(
        db: Session,
        product_id: Optional[int] = None,
        status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        query = db.query(Change)
        if product_id:
            query = query.filter(Change.product_id == product_id)
        if status:
            query = query.filter(Change.status == status)

        changes = query.order_by(desc(Change.created_at)).all()
        results = []
        for c in changes:
            prod = db.query(Product).filter(Product.id == c.product_id).first()
            results.append({
                "id": c.id,
                "product_id": c.product_id,
                "product_code": prod.product_code if prod else f"PROD-{c.product_id}",
                "product_name": prod.name if prod else f"Product #{c.product_id}",
                "attribute_name": c.attribute_name,
                "old_value": c.old_value,
                "new_value": c.new_value,
                "change_type": c.change_type,
                "source_document": c.source_document,
                "confidence": c.confidence,
                "status": c.status,
                "created_at": c.created_at,
                "detected_at": c.created_at.strftime("%Y-%m-%d %H:%M")
            })
        return results

    @staticmethod
    def get_change_by_id(db: Session, change_id: int) -> Change:
        change = db.query(Change).filter(Change.id == change_id).first()
        if not change:
            raise HTTPException(status_code=404, detail=f"Change ID {change_id} not found")
        return change

    @staticmethod
    def create_change(db: Session, data: ChangeCreate) -> Change:
        change = Change(
            product_id=data.product_id,
            old_version_id=data.old_version_id,
            new_version_id=data.new_version_id,
            attribute_name=data.attribute_name,
            old_value=data.old_value,
            new_value=data.new_value,
            change_type=data.change_type or "MODIFIED",
            source_document=data.source_document,
            confidence=data.confidence or 0.98,
            status=data.status or "PENDING"
        )
        db.add(change)
        db.commit()
        db.refresh(change)
        return change

    @staticmethod
    def get_change_impacts(
        db: Session,
        change_id: Optional[int] = None,
        reviewed: Optional[bool] = None,
        severity: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        query = db.query(ChangeImpact)
        if change_id:
            query = query.filter(ChangeImpact.change_id == change_id)
        if reviewed is not None:
            query = query.filter(ChangeImpact.reviewed == reviewed)
        if severity:
            query = query.filter(ChangeImpact.severity == severity)

        impacts = query.order_by(ChangeImpact.id).all()
        results = []
        for imp in impacts:
            change = db.query(Change).filter(Change.id == imp.change_id).first()
            prod = db.query(Product).filter(Product.id == change.product_id).first() if change else None
            results.append({
                "id": imp.id,
                "change_id": imp.change_id,
                "product_id": prod.id if prod else None,
                "product_name": prod.name if prod else "Industrial Component",
                "change_description": f"{change.attribute_name}: {change.old_value} → {change.new_value}" if change else "",
                "domain": imp.impact_type,
                "impact_type": imp.impact_type,
                "affected_entity_type": imp.affected_entity_type,
                "affected_entity_id": imp.affected_entity_id,
                "title": imp.title,
                "description": imp.description,
                "context_evidence": imp.context_evidence,
                "severity": imp.severity,
                "reviewed": imp.reviewed,
                "reviewed_at": imp.reviewed_at,
                "reviewed_by": imp.reviewed_by,
                "target_module_url": imp.target_module_url,
                "created_at": imp.created_at
            })
        return results

    @staticmethod
    def review_change_impact(
        db: Session,
        impact_id: int,
        req: ChangeImpactReviewRequest
    ) -> Dict[str, Any]:
        impact = db.query(ChangeImpact).filter(ChangeImpact.id == impact_id).first()
        if not impact:
            raise HTTPException(status_code=404, detail=f"Change Impact ID {impact_id} not found")

        impact.reviewed = req.reviewed
        impact.reviewed_at = datetime.utcnow() if req.reviewed else None
        impact.reviewed_by = req.reviewed_by if req.reviewed else None

        # Log approval
        approval = Approval(
            entity_type="CHANGE_IMPACT",
            entity_id=str(impact.id),
            action="IMPACT_REVIEW",
            status="REVIEWED" if req.reviewed else "UNREVIEWED",
            comments=req.comments,
            approved_by=req.reviewed_by or "Engineering Lead"
        )
        db.add(approval)
        db.commit()
        db.refresh(impact)

        return {
            "id": impact.id,
            "reviewed": impact.reviewed,
            "reviewed_at": impact.reviewed_at,
            "reviewed_by": impact.reviewed_by,
            "message": "Change impact review status updated successfully"
        }

    @staticmethod
    def get_pending_impact_count(db: Session) -> Dict[str, int]:
        total = db.query(ChangeImpact).count()
        reviewed = db.query(ChangeImpact).filter(ChangeImpact.reviewed == True).count()
        unreviewed = total - reviewed
        return {
            "total_impacts": total,
            "reviewed_impacts": reviewed,
            "unreviewed_impacts": unreviewed
        }
