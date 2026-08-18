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
from app.routes.compatibility import router as compatibility_router
from app.routes.quotes import router as quotes_router
from app.routes.dashboard import router as dashboard_router
from app.routes.sales_assistant import router as sales_assistant_router

api_router = APIRouter(prefix="/api")

api_router.include_router(dashboard_router)
api_router.include_router(documents_router)
api_router.include_router(products_router)
api_router.include_router(product_versions_router)
api_router.include_router(changes_router)
api_router.include_router(change_impacts_router)
api_router.include_router(catalog_health_router)
api_router.include_router(catalog_issues_router)
api_router.include_router(suppliers_router)
api_router.include_router(certificates_router)
api_router.include_router(compatibility_router)
api_router.include_router(quotes_router)
api_router.include_router(sales_assistant_router)

__all__ = ["api_router"]
