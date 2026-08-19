from sqlalchemy.orm import Session
from typing import Dict, Any
from app.db.models.product import Product
from app.db.models.issue import CatalogIssue
from app.db.models.certificate import Certificate

class HealthService:
    @staticmethod
    def get_catalog_health(db: Session) -> Dict[str, Any]:
        total_products_count = db.query(Product).count()
        if total_products_count == 0:
            return {
                "total_products": 0,
                "complete_products": 0,
                "missing_data": 0,
                "conflicts": 0,
                "duplicates": 0,
                "outdated": 0,
                "compliance_issues": 0,
                "overall_health": 100
            }

        # Count actual issues in database
        open_issues = db.query(CatalogIssue).filter(CatalogIssue.status == "open").all()
        conflicts = sum(1 for i in open_issues if i.issue_type == "conflict")
        missing_data = sum(1 for i in open_issues if i.issue_type == "missing")
        duplicates = sum(1 for i in open_issues if i.issue_type == "duplicate")
        outdated = sum(1 for i in open_issues if i.issue_type == "outdated")
        
        # Compliance issues
        compliance_issues = db.query(Certificate).filter(
            Certificate.status.in_(["EXPIRED", "EXPIRING", "MISSING", "Action Required"])
        ).count()

        total_issues = conflicts + missing_data + duplicates + outdated + compliance_issues
        complete_products = max(0, total_products_count - total_issues)
        overall_health = int((complete_products / total_products_count) * 100)

        return {
            "total_products": total_products_count,
            "complete_products": complete_products,
            "missing_data": missing_data,
            "conflicts": conflicts,
            "duplicates": duplicates,
            "outdated": outdated,
            "compliance_issues": compliance_issues,
            "overall_health": overall_health
        }
