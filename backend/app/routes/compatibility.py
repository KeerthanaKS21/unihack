from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel
from app.db.database import get_db
from app.services.compatibility_service import CompatibilityService
from app.services.compatibility_engine import CompatibilityEngine
from app.schemas.compatibility import (
    CompatibilityCreate,
    CompatibilityUpdate,
    CompatibilityResponse
)

router = APIRouter(prefix="/compatibility", tags=["Compatibility"])

class CheckRequest(BaseModel):
    source_product_id: int
    target_product_id: int

class SystemCheckRequest(BaseModel):
    product_ids: List[int]

class AlternativesRequest(BaseModel):
    target_product_id: int
    source_product_id: int

class SimulateRequest(BaseModel):
    product_ids: List[int]
    replace_product_id: int
    with_product_id: int

@router.post("/check", summary="Check compatibility between two products")
def check_compatibility(req: CheckRequest, db: Session = Depends(get_db)):
    return CompatibilityEngine.check_compatibility(db, req.source_product_id, req.target_product_id)

@router.post("/system-check", summary="Check compatibility across a system of products")
def check_system_compatibility(req: SystemCheckRequest, db: Session = Depends(get_db)):
    return CompatibilityEngine.check_system_compatibility(db, req.product_ids)

@router.post("/alternatives", summary="Find compatible alternatives")
def find_alternatives(req: AlternativesRequest, db: Session = Depends(get_db)):
    return CompatibilityEngine.find_alternatives(db, req.target_product_id, req.source_product_id)

@router.post("/simulate", summary="Run what-if replacement simulation")
def simulate_replacement(req: SimulateRequest, db: Session = Depends(get_db)):
    new_system = [pid if pid != req.replace_product_id else req.with_product_id for pid in req.product_ids]
    return CompatibilityEngine.check_system_compatibility(db, new_system)

@router.get("/explore/{product_id}", summary="Explore all compatible products for a given product")
def explore_compatible_products(product_id: int, db: Session = Depends(get_db)):
    from app.db.models.product import Product
    all_products = db.query(Product).filter(Product.id != product_id).all()
    compatible_products = []
    for p in all_products:
        # Check both directions since rules are directional
        res1 = CompatibilityEngine.check_compatibility(db, product_id, p.id)
        res2 = CompatibilityEngine.check_compatibility(db, p.id, product_id)
        
        if res1["status"] == "COMPATIBLE" and res1["checks"]:
            compatible_products.append({
                "product_id": p.id,
                "product_name": p.name,
                "category": p.category,
                "score": res1["score"],
                "checks": res1["checks"]
            })
        elif res2["status"] == "COMPATIBLE" and res2["checks"]:
            compatible_products.append({
                "product_id": p.id,
                "product_name": p.name,
                "category": p.category,
                "score": res2["score"],
                "checks": res2["checks"]
            })
            
    # Sort by category and then by score
    compatible_products.sort(key=lambda x: (x["category"], -x["score"]))
    return compatible_products

@router.get("/{product_id}", response_model=List[CompatibilityResponse], summary="Get drivetrain compatibility topology and checks for a product")
def get_product_compatibility(product_id: int, db: Session = Depends(get_db)):
    """
    Returns 4-node drivetrain topology relations and multi-point parameter checks.
    """
    return CompatibilityService.get_compatibility_for_product(db, product_id)

@router.post("", summary="Create a new compatibility rule")
def create_compatibility(data: CompatibilityCreate, db: Session = Depends(get_db)):
    return CompatibilityService.create_compatibility(db, data)

@router.put("/{id}", summary="Update a compatibility rule")
def update_compatibility(id: int, data: CompatibilityUpdate, db: Session = Depends(get_db)):
    return CompatibilityService.update_compatibility(db, id, data)

@router.delete("/{id}", summary="Delete a compatibility rule")
def delete_compatibility(id: int, db: Session = Depends(get_db)):
    return CompatibilityService.delete_compatibility(db, id)
