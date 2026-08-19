import logging
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from typing import Optional, List, Tuple, Dict, Any
from datetime import datetime
from fastapi import HTTPException

from app.db.models.issue import CatalogIssue
from app.db.models.product import Product, ProductVersion, ProductAttribute
from app.db.models.approval import Approval
from app.schemas.issue import CatalogIssueCreate, CatalogIssueResolveRequest
from app.services.unit_normalization_service import UnitNormalizationService

logger = logging.getLogger("issue_service")

class IssueService:
    @staticmethod
    def get_issues(
        db: Session,
        page: int = 1,
        limit: int = 50,
        issue_type: Optional[str] = None,
        status: Optional[str] = None,
        severity: Optional[str] = None,
        product_id: Optional[int] = None,
        search: Optional[str] = None
    ) -> Tuple[List[Dict[str, Any]], int]:
        query = db.query(CatalogIssue)

        if product_id:
            query = query.filter(CatalogIssue.product_id == product_id)
        if issue_type and issue_type.lower() != "all":
            # Support both hyphenated and underscore matching (e.g. invalid-unit or invalid_unit)
            norm_type = issue_type.lower().replace("-", "_")
            query = query.filter(CatalogIssue.issue_type == norm_type)
        if status and status.lower() != "all":
            query = query.filter(CatalogIssue.status == status.lower())
        if severity and severity.lower() != "all":
            query = query.filter(CatalogIssue.severity == severity.lower())
        if search and search.strip():
            term = f"%{search.strip()}%"
            query = query.join(Product).filter(
                or_(
                    CatalogIssue.title.ilike(term),
                    CatalogIssue.description.ilike(term),
                    CatalogIssue.attribute_name.ilike(term),
                    Product.product_code.ilike(term),
                    Product.name.ilike(term)
                )
            )

        total = query.count()
        offset = (page - 1) * limit
        issues = query.order_by(desc(CatalogIssue.created_at)).offset(offset).limit(limit).all()

        results = []
        for iss in issues:
            prod = db.query(Product).filter(Product.id == iss.product_id).first()
            results.append({
                "id": iss.id,
                "product_id": iss.product_id,
                "product_model": prod.product_code if prod else "Industrial SKU",
                "product_name": prod.name if prod else "Industrial Product",
                "field": iss.attribute_name,
                "issue_type": iss.issue_type,
                "attribute_name": iss.attribute_name,
                "title": iss.title,
                "description": iss.description,
                "sources": iss.sources or [],
                "ai_recommendation": iss.ai_recommendation or {},
                "evidence": iss.evidence,
                "severity": iss.severity,
                "status": iss.status,
                "resolution_value": iss.resolution_value,
                "resolved_by": iss.resolved_by,
                "resolved_at": iss.resolved_at,
                "created_at": iss.created_at,
                "updated_at": iss.updated_at
            })

        return results, total

    @staticmethod
    def get_issue_by_id(db: Session, issue_id: int) -> Dict[str, Any]:
        iss = db.query(CatalogIssue).filter(CatalogIssue.id == issue_id).first()
        if not iss:
            raise HTTPException(status_code=404, detail=f"Catalog Issue ID {issue_id} not found")
        prod = db.query(Product).filter(Product.id == iss.product_id).first()
        return {
            "id": iss.id,
            "product_id": iss.product_id,
            "product_model": prod.product_code if prod else "Industrial SKU",
            "product_name": prod.name if prod else "Industrial Product",
            "field": iss.attribute_name,
            "issue_type": iss.issue_type,
            "attribute_name": iss.attribute_name,
            "title": iss.title,
            "description": iss.description,
            "sources": iss.sources or [],
            "ai_recommendation": iss.ai_recommendation or {},
            "evidence": iss.evidence,
            "severity": iss.severity,
            "status": iss.status,
            "resolution_value": iss.resolution_value,
            "resolved_by": iss.resolved_by,
            "resolved_at": iss.resolved_at,
            "created_at": iss.created_at,
            "updated_at": iss.updated_at
        }

    @staticmethod
    def resolve_issue(
        db: Session,
        issue_id: int,
        req: CatalogIssueResolveRequest
    ) -> Dict[str, Any]:
        """
        Applies human-approved correction to product database, logs audit trail,
        and marks issue resolved.
        """
        iss = db.query(CatalogIssue).filter(CatalogIssue.id == issue_id).first()
        if not iss:
            raise HTTPException(status_code=404, detail=f"Catalog Issue ID {issue_id} not found")

        prod = db.query(Product).filter(Product.id == iss.product_id).first()
        if not prod:
            raise HTTPException(status_code=404, detail="Associated product not found")

        # 1. Apply Real Database Correction if applicable
        correction_applied = False
        applied_details = ""

        # Find active or latest version
        active_version = None
        if prod.current_version_id:
            active_version = db.query(ProductVersion).filter(ProductVersion.id == prod.current_version_id).first()
        if not active_version:
            active_version = db.query(ProductVersion).filter(ProductVersion.product_id == prod.id).order_by(desc(ProductVersion.created_at)).first()

        if iss.issue_type in ["missing", "conflict", "invalid_unit", "invalid_value", "low_confidence"] and iss.attribute_name:
            if active_version:
                # Find existing attribute or create new one
                attr = db.query(ProductAttribute).filter(
                    ProductAttribute.product_version_id == active_version.id,
                    ProductAttribute.attribute_name.ilike(iss.attribute_name)
                ).first()

                norm_info = UnitNormalizationService.normalize_attribute(iss.attribute_name, req.resolution_value)

                if attr:
                    attr.attribute_value = req.resolution_value
                    attr.normalized_value = norm_info.get("normalized_value")
                    attr.unit = norm_info.get("unit")
                    attr.confidence = 1.0
                    attr.verification_status = "VERIFIED"
                    attr.updated_at = datetime.utcnow()
                else:
                    attr = ProductAttribute(
                        product_version_id=active_version.id,
                        attribute_name=iss.attribute_name,
                        attribute_value=req.resolution_value,
                        normalized_value=norm_info.get("normalized_value"),
                        unit=norm_info.get("unit"),
                        confidence=1.0,
                        verification_status="VERIFIED"
                    )
                    db.add(attr)
                correction_applied = True
                applied_details = f"Updated {iss.attribute_name} to '{req.resolution_value}' in {active_version.version_number}"

        elif iss.issue_type == "wrong_category":
            prod.category = req.resolution_value
            prod.updated_at = datetime.utcnow()
            correction_applied = True
            applied_details = f"Updated category of {prod.product_code} to '{req.resolution_value}'"

        # 2. Mark Issue Resolved
        iss.status = "resolved"
        iss.resolution_value = req.resolution_value
        iss.resolved_by = req.resolved_by or "Engineering Lead"
        iss.resolved_at = datetime.utcnow()
        iss.updated_at = datetime.utcnow()

        # 3. Log Formal Approval Audit Record
        approval = Approval(
            entity_type="CATALOG_ISSUE",
            entity_id=str(iss.id),
            action="CATALOG_CORRECTION",
            status="RESOLVED",
            comments=f"Resolved issue '{iss.title}' with value '{req.resolution_value}'. {applied_details}. Note: {req.comments or 'Approved'}",
            approved_by=req.resolved_by or "Engineering Lead"
        )
        db.add(approval)
        db.commit()
        db.refresh(iss)

        return {
            "id": iss.id,
            "status": iss.status,
            "resolution_value": iss.resolution_value,
            "resolved_by": iss.resolved_by,
            "resolved_at": iss.resolved_at.isoformat() if iss.resolved_at else None,
            "correction_applied": correction_applied,
            "applied_details": applied_details,
            "message": f"Issue #{iss.id} marked as resolved. Catalog data validated."
        }
