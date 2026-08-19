from fastapi import APIRouter, Depends, Query, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from app.db.database import get_db
from app.services.ecommerce_sync_service import EcommerceSyncService

router = APIRouter(prefix="/ecommerce", tags=["E-commerce"])

@router.post("/inspect-website", summary="Inspect live website URL and compare against AI-verified master data")
def inspect_live_website(
    website_url: str = Body(..., embed=True, description="The live product page URL"),
    product_code: Optional[str] = Body("VTX-550", embed=True, description="Target product code"),
    db: Session = Depends(get_db)
):
    """
    1. Fetches and parses the live webpage HTML at website_url.
    2. Extracts current published specifications and faceted filter categories.
    3. Compares against the latest AI-verified Master Catalog version.
    4. Returns a side-by-side discrepancy comparison matrix.
    """
    return EcommerceSyncService.inspect_live_website(db, website_url, product_code)

@router.post("/push-update", summary="Push verified technical specification update to live website API endpoint")
def push_update_to_storefront(
    api_endpoint: str = Body(..., embed=True, description="Target website update webhook/API endpoint"),
    product_code: Optional[str] = Body("VTX-550", embed=True, description="Product code to update"),
    api_key: Optional[str] = Body(None, embed=True, description="Optional bearer token or secret key"),
    db: Session = Depends(get_db)
):
    """
    Dispatches standard JSON payload to the website's API endpoint.
    Updates the storefront live and resolves corresponding E-commerce change impacts.
    """
    return EcommerceSyncService.push_update_to_storefront(db, api_endpoint, product_code, api_key)

@router.get("/storefront/{product_code}", summary="Get current live storefront specifications for demo product")
def get_storefront_data(product_code: str, db: Session = Depends(get_db)):
    """
    Powers the built-in live storefront simulation page.
    """
    return EcommerceSyncService.get_storefront_product(db, product_code)

@router.post("/demo-update-receiver", summary="Built-in webhook receiver for local demo testing")
def demo_update_receiver(payload: Dict[str, Any] = Body(...)):
    """
    Receives push updates and confirms receipt.
    """
    return {
        "status": "ACCEPTED",
        "message": f"Storefront database updated for {payload.get('product_code')} with {len(payload.get('specifications', {}))} specifications.",
        "received_payload": payload
    }
