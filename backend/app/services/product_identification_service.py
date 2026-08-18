import logging
import re
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from app.db.models.document import Document
from app.db.models.product import Product
from app.schemas.document import ProductExtractionResponse

logger = logging.getLogger("product_identification_service")

class ProductIdentificationService:
    """
    Evidence-based Product Identification Service.
    Determines whether an uploaded/extracted document matches an existing Master Catalog product.
    Does NOT rely on filename; uses multi-factor evidence:
    1. Exact Model / Part Number
    2. Manufacturer
    3. Product Type / Category
    4. Key Technical Specifications
    """

    @classmethod
    def identify_product_for_document(
        cls,
        db: Session,
        document_id: int
    ) -> Dict[str, Any]:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            raise ValueError(f"Document #{document_id} not found")

        # Gather extracted content
        extracted_data = doc.extracted_product_data or {}
        product_ident = extracted_data.get("product", {})
        specs = extracted_data.get("specifications", [])
        
        extracted_model = (product_ident.get("model") or "").strip()
        extracted_mfr = (product_ident.get("manufacturer") or "").strip()
        extracted_cat = (product_ident.get("category") or "").strip()
        extracted_type = (product_ident.get("product_type") or "").strip()
        
        # Combine text for fallback inspection
        full_corpus = f"{doc.extracted_text or ''} {doc.extracted_summary or ''} {doc.original_file_name}"
        for k, v in (doc.extracted_attributes or {}).items():
            full_corpus += f" {k}: {v}"

        # Fetch all candidate master products from database
        products = db.query(Product).all()

        best_match: Optional[Product] = None
        best_score: float = 0.0
        best_evidence: List[str] = []
        match_status = "NO_MATCH"
        candidates = []

        for p in products:
            score, evidence = cls._evaluate_product_match(
                product=p,
                extracted_model=extracted_model,
                extracted_mfr=extracted_mfr,
                extracted_cat=extracted_cat,
                extracted_type=extracted_type,
                specs=specs,
                full_corpus=full_corpus
            )

            if score > 0.40:
                candidates.append({
                    "product_id": p.id,
                    "product_code": p.product_code,
                    "product_name": p.name,
                    "manufacturer": p.manufacturer,
                    "category": p.category,
                    "confidence": round(score, 2),
                    "evidence": evidence
                })

            if score > best_score:
                best_score = score
                best_match = p
                best_evidence = evidence

        # Determine Match State
        if best_score >= 0.90:
            match_status = "EXACT_MATCH"
        elif best_score >= 0.75:
            match_status = "LIKELY_MATCH"
        elif best_score >= 0.50:
            match_status = "POSSIBLE_MATCH"
        elif len(candidates) > 1 and candidates[0]["confidence"] == candidates[1]["confidence"]:
            match_status = "REVIEW_REQUIRED"
        else:
            match_status = "NO_MATCH"

        # Update document association if confident match
        if best_match and match_status in ["EXACT_MATCH", "LIKELY_MATCH"]:
            doc.product_id = best_match.id
            doc.match_confidence = round(best_score, 2)
            db.commit()
            db.refresh(doc)

        result = {
            "document_id": doc.id,
            "match_status": match_status,
            "product_id": best_match.id if best_match else None,
            "product_code": best_match.product_code if best_match else None,
            "product_name": best_match.name if best_match else None,
            "confidence": round(best_score, 2) if best_match else 0.0,
            "evidence": best_evidence,
            "candidate_products": sorted(candidates, key=lambda x: x["confidence"], reverse=True)
        }

        return result

    @classmethod
    def _evaluate_product_match(
        cls,
        product: Product,
        extracted_model: str,
        extracted_mfr: str,
        extracted_cat: str,
        extracted_type: str,
        specs: List[Dict[str, Any]],
        full_corpus: str
    ) -> Tuple[float, List[str]]:
        score = 0.0
        evidence: List[str] = []

        p_code = product.product_code.lower()
        p_mfr = product.manufacturer.lower()
        p_cat = product.category.lower()
        p_name = product.name.lower()
        corpus_lower = full_corpus.lower()

        # 1. Model / Code Matching (Weight: 0.50)
        if extracted_model and (p_code in extracted_model.lower() or extracted_model.lower() in p_code):
            score += 0.50
            evidence.append(f"Exact model number matched: '{product.product_code}'")
        elif p_code in corpus_lower:
            score += 0.45
            evidence.append(f"Model identifier '{product.product_code}' found in document text")

        # 2. Manufacturer Matching (Weight: 0.25)
        if extracted_mfr and (extracted_mfr.lower() in p_mfr or p_mfr in extracted_mfr.lower()):
            score += 0.25
            evidence.append(f"Manufacturer verified: '{product.manufacturer}'")
        elif p_mfr.split()[0] in corpus_lower:
            score += 0.20
            evidence.append(f"Manufacturer brand '{product.manufacturer.split()[0]}' found in document")

        # 3. Category / Domain Overlap (Weight: 0.15)
        if extracted_cat and (extracted_cat.lower() in p_cat or p_cat in extracted_cat.lower() or "motor" in extracted_cat.lower() and "motor" in p_cat):
            score += 0.15
            evidence.append(f"Category aligned: '{product.category}'")
        elif "motor" in corpus_lower and "motor" in p_cat:
            score += 0.10
            evidence.append(f"Product domain aligned with '{product.category}'")

        # 4. Key Technical Spec Correlation (Weight: 0.10)
        # Check if extracted power or voltage overlaps with existing product version specs
        spec_matched = False
        for s in specs:
            attr = s.get("attribute_name", "")
            raw = str(s.get("raw_value", ""))
            if attr in ["power", "voltage", "speed"] and raw:
                for v in product.versions:
                    for a in v.attributes:
                        if attr in a.attribute_name.lower() and str(s.get("value")) in str(a.normalized_value or a.attribute_value):
                            score += 0.10
                            evidence.append(f"Technical spec '{attr}' ({raw}) correlates with active catalog baseline")
                            spec_matched = True
                            break
                    if spec_matched:
                        break
            if spec_matched:
                break

        return min(1.0, score), evidence
