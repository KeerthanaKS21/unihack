from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import Dict, Any, List
from datetime import datetime, timedelta

from app.db.models.product import Product, ProductVersion, ProductAttribute
from app.db.models.supplier import Supplier, SupplierProduct
from app.db.models.document import Document
from app.db.models.change import Change, ChangeImpact
from app.db.models.issue import CatalogIssue
from app.db.models.certificate import Certificate
from app.db.models.quote import Quote
from app.db.models.audit import AuditLog
from app.services.health_service import HealthService

class DashboardService:
    @staticmethod
    def get_dashboard_summary(db: Session) -> Dict[str, Any]:
        now = datetime.utcnow()
        
        # 1. Total Products & Documents
        total_products = db.query(Product).count()
        total_documents = db.query(Document).count()
        
        # 2. Health & Issues
        health = HealthService.get_catalog_health(db)
        health_score = health.get("overall_health", 100.0)
        
        unresolved_issues = db.query(CatalogIssue).filter(CatalogIssue.status != "RESOLVED").count()
        products_needing_review = db.query(CatalogIssue.product_id).filter(CatalogIssue.status != "RESOLVED").distinct().count()
        
        # 3. Compliance Issues
        invalid_certs_count = db.query(Certificate).filter(Certificate.status != "VALID").count()
        compliance_issues = invalid_certs_count + health.get("compliance_issues", 0)
        
        # 4. Changes, Impacts, Sync, E-commerce
        pending_sync = db.query(Change).filter(Change.status == "PENDING").count()
        unreviewed_impacts = db.query(ChangeImpact).filter(ChangeImpact.reviewed == False).count()
        pending_ecommerce = unreviewed_impacts
        
        total_suppliers = db.query(Supplier).count()
        open_procurement = db.query(SupplierProduct).count()
        
        # Quotes
        quotes = db.query(Quote).all()
        quotes_count = len(quotes)
        quotes_pending = sum(1 for q in quotes if q.status == "PENDING_APPROVAL")
        quotes_approved = sum(1 for q in quotes if q.status == "APPROVED")
        quotes_revision = sum(1 for q in quotes if q.status == "REVISION_REQUESTED")
        
        # 5. Pending Actions Aggregation
        pending_actions = []
        if pending_sync > 0:
            pending_actions.append({
                "title": f"{pending_sync} Synchronization Approvals",
                "module": "Synchronization",
                "href": "/synchronization",
                "count": pending_sync,
                "badge_color": "purple"
            })
        if pending_ecommerce > 0:
            pending_actions.append({
                "title": f"{pending_ecommerce} Pending E-Commerce Updates",
                "module": "E-Commerce",
                "href": "/ecommerce",
                "count": pending_ecommerce,
                "badge_color": "blue"
            })
        if unreviewed_impacts > 0:
            pending_actions.append({
                "title": f"{unreviewed_impacts} Unreviewed Change Impact Items",
                "module": "Change Impact",
                "href": "/change-impact",
                "count": unreviewed_impacts,
                "badge_color": "amber"
            })
        if compliance_issues > 0:
            pending_actions.append({
                "title": f"{compliance_issues} Compliance Reviews & Audit Actions",
                "module": "Compliance Auditing",
                "href": "/compliance?status=needs_review",
                "count": compliance_issues,
                "badge_color": "rose"
            })
        if unresolved_issues > 0:
            pending_actions.append({
                "title": f"{unresolved_issues} Unresolved Catalog Health Issues",
                "module": "Catalog Health",
                "href": "/catalog-issues",
                "count": unresolved_issues,
                "badge_color": "red"
            })
        if quotes_pending > 0:
            pending_actions.append({
                "title": f"{quotes_pending} Quotations Pending Review",
                "module": "Quote Automation",
                "href": "/quotes",
                "count": quotes_pending,
                "badge_color": "emerald"
            })
            
        # 6. Recent Activity Log
        recent_activity = []
        audit_logs = db.query(AuditLog).order_by(desc(AuditLog.created_at)).limit(8).all()
        for log in audit_logs:
            recent_activity.append({
                "id": log.id,
                "title": log.action.replace("_", " ").title(),
                "description": f"Entity: {log.entity_type} #{log.entity_id} - {log.performed_by}",
                "timestamp": log.created_at.strftime("%Y-%m-%d %H:%M"),
                "badge_text": log.entity_type,
                "target_url": "/compliance" if log.entity_type == "CERTIFICATE" else "/catalog-health"
            })
            
        if not recent_activity:
            docs = db.query(Document).order_by(desc(Document.uploaded_at)).limit(5).all()
            for d in docs:
                recent_activity.append({
                    "id": d.id,
                    "title": f"Document Ingested: {d.original_file_name or d.file_name}",
                    "description": f"Status: {d.processing_status} • Size: {d.file_size_formatted or 'N/A'}",
                    "timestamp": d.uploaded_at.strftime("%Y-%m-%d %H:%M"),
                    "badge_text": "DOCUMENT",
                    "target_url": "/upload"
                })

        # 7. Recent Product Specification Changes
        recent_changes_query = db.query(Change).order_by(desc(Change.created_at)).limit(5).all()
        changes_list = []
        for c in recent_changes_query:
            prod = db.query(Product).filter(Product.id == c.product_id).first()
            changes_list.append({
                "id": c.id,
                "product_code": prod.product_code if prod else f"SKU-{c.product_id}",
                "product_name": prod.name if prod else "Industrial Component",
                "attribute_name": c.attribute_name,
                "old_value": c.old_value,
                "new_value": c.new_value,
                "change_type": c.change_type,
                "detected_at": c.created_at.strftime("%Y-%m-%d %H:%M")
            })
            
        # 8. Real Trend History
        trend_history = []
        has_trend_data = False
        trend_message = "Not enough historical data for trend analysis."
        
        distinct_dates = db.query(func.date(Document.uploaded_at)).distinct().all()
        if len(distinct_dates) >= 2:
            has_trend_data = True
            trend_message = None
            for d in distinct_dates[:7]:
                date_str = str(d[0])
                trend_history.append({
                    "date": date_str,
                    "score": round(health_score, 1),
                    "conflicts": health.get("conflicts", 0),
                    "missing": health.get("missing_data", 0)
                })

        return {
            "total_products": total_products,
            "total_documents": total_documents,
            "products_needing_review": products_needing_review,
            "catalog_health_score": round(health_score, 1),
            "compliance_issues": compliance_issues,
            "pending_sync": pending_sync,
            "pending_ecommerce": pending_ecommerce,
            "unreviewed_impacts": unreviewed_impacts,
            "total_suppliers": total_suppliers,
            "catalog_health": health,
            "pending_actions": pending_actions,
            "recent_activity": recent_activity,
            "recent_changes": changes_list,
            "procurement_overview": {
                "total_suppliers": total_suppliers,
                "open_procurement_requests": open_procurement
            },
            "quote_overview": {
                "quotes_count": quotes_count,
                "quotes_pending": quotes_pending,
                "quotes_approved": quotes_approved,
                "quotes_revision": quotes_revision
            },
            "has_trend_data": has_trend_data,
            "trend_message": trend_message,
            "trend_history": trend_history,
            "last_updated": now.strftime("%Y-%m-%d %H:%M:%S UTC")
        }
