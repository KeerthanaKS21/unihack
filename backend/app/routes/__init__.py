from fastapi import APIRouter
from app.routes.documents import router as documents_router
from app.routes.products import router as products_router
from app.routes.product_versions import router as product_versions_router
from app.routes.changes import router as changes_router
from app.routes.change_impacts import router as change_impacts_router
from app.routes.catalog_health import router as catalog_health_router
from app.routes.catalog_issues import router as catalog_issues_router
from app.routes.suppliers import router as suppliers_router
from app.routes.certificates import router as certificates_router
from app.routes.compliance import router as compliance_router
from app.routes.compatibility import router as compatibility_router
from app.routes.quotes import router as quotes_router
from app.routes.dashboard import router as dashboard_router
from app.routes.catalog_ai import router as catalog_ai_router
from app.routes.ecommerce import router as ecommerce_router
from app.routes.procurement import router as procurement_router
from app.routes.sales_assistant import router as sales_assistant_router

api_router = APIRouter(prefix="/api")
root_router = APIRouter()

routers = [
    dashboard_router,
    documents_router,
    products_router,
    product_versions_router,
    changes_router,
    change_impacts_router,
    catalog_health_router,
    catalog_issues_router,
    suppliers_router,
    certificates_router,
    compliance_router,
    compatibility_router,
    quotes_router,
    catalog_ai_router,
    ecommerce_router,
    procurement_router,
    sales_assistant_router,
]

for r in routers:
    api_router.include_router(r)
    root_router.include_router(r)

__all__ = ["api_router", "root_router"]
