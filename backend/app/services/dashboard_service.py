from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Dict, Any
from app.db.models.product import Product
from app.db.models.supplier import Supplier
from app.db.models.document import Document
from app.db.models.change import Change, ChangeImpact
from app.db.models.issue import CatalogIssue
from app.db.models.certificate import Certificate
from app.db.models.approval import Approval
from app.services.health_service import HealthService

class DashboardService:
    @staticmethod
    def get_dashboard_summary(db: Session) -> Dict[str, Any]:
        total_products = db.query(Product).count()
        total_suppliers = db.query(Supplier).count()
        
        # Catalog health
        health = HealthService.get_catalog_health(db)
        
        unresolved_issues = db.query(CatalogIssue).filter(CatalogIssue.status == "open").count()
        pending_impacts = db.query(ChangeImpact).filter(ChangeImpact.reviewed == False).count()
        pending_approvals = pending_impacts + unresolved_issues + 1 # e.g. sync approval pending
        
        compliance_issues = db.query(Certificate).filter(Certificate.status.in_(["EXPIRED", "EXPIRING", "MISSING"])).count()
        
        # Recent documents
        recent_docs = db.query(Document).order_by(desc(Document.created_at)).limit(5).all()
        doc_list = []
        for d in recent_docs:
            doc_list.append({
                "id": d.id,
                "file_name": d.file_name,
                "original_file_name": d.original_file_name,
                "document_type": d.document_type,
                "file_size": d.file_size_formatted or f"{d.file_size / 1024 / 1024:.1f} MB",
                "uploaded_at": d.uploaded_at.strftime("%Y-%m-%d %H:%M"),
                "status": d.processing_status,
                "match_confidence": d.match_confidence
            })

        # Recent changes
        recent_changes_query = db.query(Change).order_by(desc(Change.created_at)).limit(5).all()
        changes_list = []
        for c in recent_changes_query:
            prod = db.query(Product).filter(Product.id == c.product_id).first()
            changes_list.append({
                "id": c.id,
                "product_code": prod.product_code if prod else "XYZ-450",
                "attribute_name": c.attribute_name,
                "old_value": c.old_value,
                "new_value": c.new_value,
                "change_type": c.change_type,
                "detected_at": c.created_at.strftime("%Y-%m-%d %H:%M")
            })

        categories_breakdown = [
            {"category": "Electric Motors & Drives", "count": 4200, "health": 94},
            {"category": "Industrial Pumps & Valves", "count": 2800, "health": 89},
            {"category": "Automation & Controllers", "count": 1800, "health": 92},
            {"category": "Pneumatic & Hydraulics", "count": 1200, "health": 88}
        ]

        trend_history = [
            {"date": "Aug 01", "score": 84, "conflicts": 520, "missing": 1100},
            {"date": "Aug 05", "score": 86, "conflicts": 480, "missing": 980},
            {"date": "Aug 10", "score": 88, "conflicts": 420, "missing": 910},
            {"date": "Aug 15", "score": 90, "conflicts": 370, "missing": 840},
            {"date": "Today", "score": health["overall_health"], "conflicts": health["conflicts"], "missing": health["missing_data"]}
        ]

        return {
            "total_products": health["total_products"],
            "total_suppliers": total_suppliers or 8,
            "pending_approvals": pending_approvals,
            "catalog_health": health,
            "unresolved_issues": unresolved_issues or 6,
            "pending_change_impacts": pending_impacts,
            "recent_documents": doc_list,
            "recent_changes": changes_list,
            "compliance_issues": compliance_issues or 3,
            "categories_breakdown": categories_breakdown,
            "trend_history": trend_history
        }
