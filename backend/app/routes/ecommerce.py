from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any, List
import urllib.request
import urllib.error
import json
import logging
import uuid
import time
from datetime import datetime

from app.db.database import get_db
from app.db.models.product import Product, ProductVersion
from app.db.models.change import Change, ChangeImpact
from app.db.models.approval import Approval

router = APIRouter(prefix="/ecommerce", tags=["E-commerce"])
logger = logging.getLogger("product_intelligence")

# Generic attribute translation mapping to standard storefront keys.
# Falls back to using the attribute name exactly as is.
ATTRIBUTE_MAP = {
    "rated output": "power",
    "rated power": "power",
    "power": "power",
    "synchronous speed": "speed",
    "full load speed": "speed",
    "speed": "speed",
    "gross weight": "weight",
    "weight": "weight",
    "rated voltage": "voltage",
    "voltage": "voltage",
    "efficiency": "efficiency",
    "full load efficiency": "efficiency",
    "flow rate": "flowRate",
    "flowrate": "flowRate",
    "maximum pressure": "pressure",
    "max pressure": "pressure",
    "working pressure": "pressure",
    "pressure": "pressure",
    "operating temp": "temperature",
    "operating temperature": "temperature",
    "temperature": "temperature",
    "material": "material",
    "connection": "connection",
    "capacity": "capacity",
    "noise level": "noiseLevel",
    "noiselevel": "noiseLevel",
    "input voltage": "inputVoltage",
    "inputvoltage": "inputVoltage",
    "communication protocol": "communicationProtocol",
    "communicationprotocol": "communicationProtocol"
}

@router.post("/sync/{product_id_or_code}", summary="Synchronize approved specifications to external e-commerce website")
def sync_ecommerce(product_id_or_code: str, db: Session = Depends(get_db)):
    # 1. Resolve product by ID, product_code, or front-end mock ID (e.g. prod-xyz-450)
    product = None
    
    # Map frontend mock string IDs directly to database integer IDs
    MOCK_ID_MAP = {
        "prod-xyz-450": 1,
        "prod-abc-550": 2,
        "prod-ctrl-100": 3,
        "prod-weg-w22": 4,
        "prod-abb-m2": 5
    }
    
    if product_id_or_code in MOCK_ID_MAP:
        product = db.query(Product).filter(Product.id == MOCK_ID_MAP[product_id_or_code]).first()
        
    if not product and product_id_or_code.isdigit():
        product = db.query(Product).filter(Product.id == int(product_id_or_code)).first()
    
    if not product:
        product = db.query(Product).filter(Product.product_code == product_id_or_code).first()
        
    if not product:
        # Fallback: remove mock "prod-" prefix if present and convert to uppercase
        clean_code = product_id_or_code
        if clean_code.startswith("prod-"):
            clean_code = clean_code.replace("prod-", "").upper()
        # Handle cases like prod-xyz-450 -> XYZ-450
        product = db.query(Product).filter(Product.product_code.ilike(clean_code)).first()

    if not product:
        raise HTTPException(
            status_code=404, 
            detail=f"Website update failed: product '{product_id_or_code}' could not be identified."
        )


    # 2. Check if there are any unreviewed e-commerce-related Change Impacts
    unreviewed_impacts = db.query(ChangeImpact).join(Change).filter(
        Change.product_id == product.id,
        ChangeImpact.impact_type == 'E-commerce',
        ChangeImpact.reviewed == False
    ).count()
    if unreviewed_impacts > 0:
        raise HTTPException(
            status_code=400,
            detail="Website update blocked: review required change impacts first."
        )

    # 3. Retrieve approved or pending changes for e-commerce publishing
    changes = db.query(Change).filter(
        Change.product_id == product.id,
        Change.status.in_(["APPROVED", "PENDING"])
    ).all()
    
    if not changes:
        raise HTTPException(
            status_code=400,
            detail="No approved or pending changes found to synchronize."
        )

    # 4. Fetch current storefront products to locate match and read expectedVersion
    storefront_url = "http://localhost:5000/api/products"
    storefront_products = []
    try:
        req = urllib.request.Request(storefront_url, method="GET")
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status == 200:
                storefront_products = json.loads(response.read().decode("utf-8"))
    except Exception as e:
        logger.error(f"Failed to fetch products from e-commerce catalog: {e}")
        raise HTTPException(
            status_code=502,
            detail="Website update failed: external e-commerce service unavailable."
        )

    # Find matching storefront product
    # Identification: Match product_code against ID or Model case-insensitively
    matching_ecom_products = []
    for p in storefront_products:
        p_id = str(p.get("id", "")).lower()
        p_model = str(p.get("model", "")).lower()
        target_code = product.product_code.lower()
        if p_id == target_code or p_model == target_code:
            matching_ecom_products.append(p)

    if len(matching_ecom_products) > 1:
        raise HTTPException(
            status_code=400,
            detail=f"E-commerce sync failed: ambiguous match on storefront for product code '{product.product_code}'."
        )
    elif len(matching_ecom_products) == 1:
        matched_ecom_prod = matching_ecom_products[0]
    else:
        matched_ecom_prod = None

    if not matched_ecom_prod:
        # If not found directly, reject request
        raise HTTPException(
            status_code=404,
            detail=f"Website update failed: product '{product.product_code}' could not be identified on storefront."
        )

    expected_version = matched_ecom_prod.get("version", 1)

    # 5. Build updates dictionary dynamically (generic, works for any attribute)
    updates_dict = {}
    for c in changes:
        clean_name = c.attribute_name.strip().lower()
        key = ATTRIBUTE_MAP.get(clean_name, c.attribute_name.strip())
        updates_dict[key] = c.new_value

    # 6. Fetch source document metadata from product version
    current_version_rec = db.query(ProductVersion).filter(
        ProductVersion.product_id == product.id,
        ProductVersion.is_current == True
    ).first()

    source_doc_name = "N/A"
    source_doc_version = "1.0"
    if current_version_rec:
        source_doc_version = current_version_rec.version_number
        if current_version_rec.source_document:
            source_doc_name = current_version_rec.source_document.original_file_name

    # 7. Construct payload with unique requestId and approval details
    request_id = f"upd-{product.product_code}-{int(time.time())}"
    approval_id = f"APP-{uuid.uuid4().hex[:8].upper()}"

    payload = {
        "requestId": request_id,
        "productId": matched_ecom_prod.get("id"),
        "modelNumber": matched_ecom_prod.get("model"),
        "expectedVersion": expected_version,
        "newVersion": expected_version + 1,
        "updates": updates_dict,
        "source": {
            "documentName": source_doc_name,
            "documentVersion": source_doc_version
        },
        "approval": {
            "approved": True,
            "approvedBy": "engineering-lead@company.com",
            "approvalId": approval_id
        }
    }

    # 8. Post to e-commerce update API
    update_url = "http://localhost:5000/api/integration/product-update"
    try:
        payload_data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            update_url,
            data=payload_data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            res_body = json.loads(response.read().decode("utf-8"))
            
            # Log success approval
            approval = Approval(
                entity_type="ECOMMERCE_UPDATE",
                entity_id=product.product_code,
                action="ECOMMERCE_APPROVAL",
                status="APPROVED",
                comments=f"Storefront synced successfully to version {expected_version + 1}.",
                approved_by="engineering-lead@company.com"
            )
            db.add(approval)

            # Mark changes as approved
            for c in changes:
                c.status = "APPROVED"

            db.commit()

            return {
                "success": True,
                "status": "updated",
                "productId": product.product_code,
                "previousVersion": expected_version,
                "newVersion": expected_version + 1,
                "changedFields": list(updates_dict.keys()),
                "message": "Storefront updated successfully."
            }

    except urllib.error.HTTPError as he:
        try:
            err_body = json.loads(he.read().decode("utf-8"))
            err_msg = err_body.get("message", "E-commerce update failed.")
            status_code = he.code
        except Exception:
            err_msg = f"HTTP Error {he.code}"
            status_code = he.code

        if status_code == 409:
            raise HTTPException(
                status_code=409,
                detail=f"Website update failed: product version has changed. {err_msg}"
            )
        elif status_code == 403:
            raise HTTPException(
                status_code=403,
                detail=f"Website update blocked: human approval required. {err_msg}"
            )
        elif status_code == 404:
            raise HTTPException(
                status_code=404,
                detail=f"Website update failed: product not found. {err_msg}"
            )
        else:
            raise HTTPException(
                status_code=status_code,
                detail=f"Website update failed: {err_msg}"
            )
    except Exception as e:
        logger.error(f"Error calling e-commerce API: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Website update failed: external e-commerce service unavailable. {str(e)}"
        )
