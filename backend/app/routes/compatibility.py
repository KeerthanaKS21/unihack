from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import re

from app.db.database import get_db
from app.services.compatibility_service import CompatibilityService
from app.db.models.product import Product
from app.schemas.compatibility import (
    CompatibilityCreate,
    CompatibilityUpdate,
    CompatibilityResponse,
    CompatibilityEvaluationRequest,
    CompatibilityEvaluationResponse,
    SystemCompatibilityRequest,
    NaturalLanguageQueryRequest
)

router = APIRouter(prefix="/compatibility", tags=["Compatibility"])

@router.post("/evaluate", response_model=CompatibilityEvaluationResponse, summary="Evaluate 2-product technical compatibility based on verified database specs")
def evaluate_compatibility(payload: CompatibilityEvaluationRequest, db: Session = Depends(get_db)):
    """
    Parametric compatibility checking engine:
    - Compares power, voltage, frequency, IP rating, temperature, and standards.
    - Returns 1 of 4 official results: COMPATIBLE, NOT_COMPATIBLE, NEEDS_REVIEW, INSUFFICIENT_DATA.
    """
    return CompatibilityService.evaluate_pair(db, payload.product_a_id, payload.product_b_id)

@router.post("/query", summary="Natural language compatibility query handler (reused by AI Sales Assistant)")
def query_compatibility(payload: NaturalLanguageQueryRequest, db: Session = Depends(get_db)):
    """
    Parses product codes from query (e.g. 'Is Motor NX-450 compatible with Controller VTX-550?')
    and executes the authoritative parametric engine.
    """
    products = db.query(Product).all()
    found = []
    q = payload.query.lower()
    for p in products:
        if p.product_code.lower() in q or p.product_code.replace("-", "").lower() in q:
            found.append(p)

    if len(found) < 2:
        return {
            "query": payload.query,
            "status": "INSUFFICIENT_DATA",
            "message": "Please specify at least two catalog product SKUs (e.g. NX-450 and VTX-550) to evaluate compatibility."
        }

    res = CompatibilityService.evaluate_pair(db, found[0].id, found[1].id)
    return {
        "query": payload.query,
        "evaluation": res
    }

@router.get("/{product_id}", response_model=List[CompatibilityResponse], summary="Get drivetrain compatibility topology and checks for a product")
def get_product_compatibility(product_id: int, db: Session = Depends(get_db)):
    return CompatibilityService.get_compatibility_for_product(db, product_id)

@router.post("", summary="Create a new compatibility rule")
def create_compatibility(data: CompatibilityCreate, db: Session = Depends(get_db)):
    return CompatibilityService.create_compatibility(db, data)

@router.put("/{id}", summary="Update a compatibility rule")
def update_compatibility(id: int, data: CompatibilityUpdate, db: Session = Depends(get_db)):
    return CompatibilityService.update_compatibility(db, id, data)

@router.delete("/{id}", summary="Delete a compatibility rule")
def delete_compatibility(id: int, data: CompatibilityUpdate, db: Session = Depends(get_db)):
    return CompatibilityService.delete_compatibility(db, id)
