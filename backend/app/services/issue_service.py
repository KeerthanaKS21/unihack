from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional, List, Tuple, Dict, Any
from datetime import datetime
from fastapi import HTTPException
from app.db.models.issue import CatalogIssue
from app.db.models.product import Product
from app.db.models.approval import Approval
from app.schemas.issue import CatalogIssueCreate, CatalogIssueResolveRequest

class IssueService:
    @staticmethod
    def get_issues(
        db: Session,
        page: int = 1,
        limit: int = 20,
        issue_type: Optional[str] = None,
        status: Optional[str] = None,
        severity: Optional[str] = None,
        product_id: Optional[int] = None
    ) -> Tuple[List[Dict[str, Any]], int]:
        query = db.query(CatalogIssue)

        if product_id:
            query = query.filter(CatalogIssue.product_id == product_id)
        if issue_type and issue_type != "all":
            query = query.filter(CatalogIssue.issue_type == issue_type)
        if status and status != "all":
            query = query.filter(CatalogIssue.status == status)
        if severity:
            query = query.filter(CatalogIssue.severity == severity)

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
        iss = db.query(CatalogIssue).filter(CatalogIssue.id == issue_id).first()
        if not iss:
            raise HTTPException(status_code=404, detail=f"Catalog Issue ID {issue_id} not found")

        iss.status = "resolved"
        iss.resolution_value = req.resolution_value
        iss.resolved_by = req.resolved_by or "Engineering Lead"
        iss.resolved_at = datetime.utcnow()

        # Log approval
        approval = Approval(
            entity_type="CATALOG_ISSUE",
            entity_id=str(iss.id),
            action="CATALOG_CORRECTION",
            status="RESOLVED",
            comments=f"Resolved with value '{req.resolution_value}'. Note: {req.comments or 'No notes'}",
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
            "resolved_at": iss.resolved_at,
            "message": "Catalog issue successfully resolved"
        }
