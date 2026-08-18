import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.db.models.document import Document
from app.db.models.product import Product, ProductVersion, ProductAttribute
from app.db.models.change import Change, ChangeImpact
from app.db.models.approval import Approval
from app.services.product_identification_service import ProductIdentificationService
from app.services.unit_normalization_service import UnitNormalizationService

logger = logging.getLogger("version_detection_service")

class VersionDetectionService:
    """
    Version & Difference Detection Engine with Change Impact Generation and Synchronization.
    Compares newly extracted, normalized document attributes against active Master Catalog versions.
    """

    @classmethod
    def analyze_document_version(
        cls,
        db: Session,
        document_id: int
    ) -> Dict[str, Any]:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail=f"Document #{document_id} not found")

        # 1. Product Identification
        ident_result = ProductIdentificationService.identify_product_for_document(db, document_id)
        match_status = ident_result.get("match_status")
        product_id = ident_result.get("product_id")

        # Gather extracted intelligence
        extracted_data = doc.extracted_product_data or {}
        product_ident = extracted_data.get("product", {})
        raw_specs = extracted_data.get("specifications", [])
        normalized_specs = UnitNormalizationService.normalize_specifications_list(raw_specs)

        # Handle Candidate New Product Creation (Master Workflow: NO -> Create candidate new product)
        if match_status == "NO_MATCH" or not product_id:
            extracted_model = (product_ident.get("model") or "").strip()
            extracted_mfr = (product_ident.get("manufacturer") or "").strip()
            extracted_name = (product_ident.get("product_name") or "").strip()
            extracted_cat = (product_ident.get("category") or "").strip()

            if not extracted_model:
                # Fallback check from extracted attributes
                attrs = doc.extracted_attributes or {}
                extracted_model = attrs.get("Model") or attrs.get("Model Identifier") or "NEW-PRODUCT"
                extracted_mfr = attrs.get("Manufacturer") or "Industrial Manufacturer"
                extracted_name = f"{extracted_mfr} {extracted_model} Equipment"
                extracted_cat = attrs.get("Category") or "Industrial Equipment"

            # Check if product code already exists in DB
            existing_p = db.query(Product).filter(Product.product_code == extracted_model).first()
            if not existing_p:
                # Create candidate product
                new_product = Product(
                    product_code=extracted_model,
                    name=extracted_name or f"{extracted_mfr} {extracted_model} Industrial Equipment",
                    manufacturer=extracted_mfr or "Industrial Manufacturer",
                    category=extracted_cat or "Industrial Equipment",
                    status="ACTIVE"
                )
                db.add(new_product)
                db.commit()
                db.refresh(new_product)

                # Determine version label (e.g. V1.0)
                v_label = "v1.0"
                if "v1" in doc.original_file_name.lower():
                    v_label = "v1.0"
                elif "v2" in doc.original_file_name.lower():
                    v_label = "v2.0"

                # Create baseline version
                base_v = ProductVersion(
                    product_id=new_product.id,
                    version_number=v_label,
                    source_document_id=doc.id,
                    effective_date=datetime.utcnow(),
                    is_current=True,
                    verified_by="Intake Pipeline",
                    status="VERIFIED"
                )
                db.add(base_v)
                db.commit()
                db.refresh(base_v)

                # Add normalized attributes
                for s in normalized_specs:
                    attr_rec = ProductAttribute(
                        product_version_id=base_v.id,
                        attribute_name=s["attribute_name"].replace("_", " ").title(),
                        attribute_value=f"{s['normalized_value']} {s.get('normalized_unit') or ''}".strip(),
                        normalized_value=s["normalized_value"] if isinstance(s["normalized_value"], (int, float)) else None,
                        unit=s.get("normalized_unit"),
                        source_document_id=doc.id,
                        source_page=s.get("source", {}).get("page", 1),
                        confidence=s.get("model_confidence", 0.98),
                        verification_status="VERIFIED"
                    )
                    db.add(attr_rec)

                new_product.current_version_id = base_v.id
                doc.product_id = new_product.id
                doc.version_detected = v_label
                db.commit()
                db.refresh(new_product)
                product = new_product
            else:
                product = existing_p
                doc.product_id = product.id
                db.commit()
        else:
            product = db.query(Product).filter(Product.id == product_id).first()

        if not product:
            raise HTTPException(status_code=404, detail=f"Product #{product_id} not found")

        # 2. Check for Duplicate Uploads (Exact Binary File Content Hash)
        duplicate_doc = (
            db.query(Document)
            .filter(
                Document.product_id == product.id,
                Document.id != doc.id,
                Document.content_hash == doc.content_hash
            )
            .first()
        )
        if duplicate_doc:
            return {
                "document_id": document_id,
                "product_id": product.id,
                "product_code": product.product_code,
                "product_name": product.name,
                "version_status": "DUPLICATE_DOCUMENT",
                "match_status": match_status,
                "message": f"Duplicate document detected (identical SHA-256 hash to Document #{duplicate_doc.id}).",
                "changes": [],
                "impacts": []
            }

        # 3. Retrieve Latest / Current Baseline Product Version
        baseline_version = (
            db.query(ProductVersion)
            .filter(ProductVersion.product_id == product.id, ProductVersion.is_current == True)
            .first()
        )
        if not baseline_version:
            baseline_version = (
                db.query(ProductVersion)
                .filter(ProductVersion.product_id == product.id)
                .order_by(ProductVersion.created_at.desc())
                .first()
            )

        # Build Normalized Baseline Spec Map
        baseline_specs: Dict[str, Dict[str, Any]] = {}
        if baseline_version:
            for attr in baseline_version.attributes:
                k = cls._canonical_attr_key(attr.attribute_name)
                baseline_specs[k] = {
                    "attribute_name": attr.attribute_name,
                    "raw_value": attr.attribute_value,
                    "normalized_value": attr.normalized_value,
                    "unit": attr.unit
                }

        # 4. Difference Detection (Attribute-by-Attribute using Normalized Values)
        diff_records = []
        meaningful_changes = []

        for new_spec in normalized_specs:
            attr_key = cls._canonical_attr_key(new_spec["attribute_name"])

            new_norm_val = new_spec["normalized_value"]
            new_raw_val = f"{new_spec['raw_value']} {new_spec['raw_unit'] or ''}".strip()
            new_norm_str = f"{new_norm_val} {new_spec.get('normalized_unit') or ''}".strip()

            if attr_key in baseline_specs:
                base = baseline_specs[attr_key]
                base_norm_val = base["normalized_value"]
                base_raw_val = base["raw_value"]
                base_norm_str = f"{base_norm_val} {base['unit'] or ''}".strip() if base_norm_val is not None else base_raw_val

                # Check if values are equivalent after normalization
                is_same = False
                if isinstance(new_norm_val, (int, float)) and isinstance(base_norm_val, (int, float)):
                    is_same = abs(new_norm_val - base_norm_val) < 0.001
                elif str(new_norm_val).strip().lower() == str(base_norm_val).strip().lower() or str(new_norm_val).strip().lower() == str(base_raw_val).strip().lower():
                    is_same = True

                if is_same:
                    diff_records.append({
                        "attribute_name": new_spec["attribute_name"],
                        "old_value": base_norm_str or base_raw_val,
                        "new_value": new_norm_str,
                        "change_type": "UNCHANGED",
                        "status": "VERIFIED"
                    })
                else:
                    change_item = {
                        "attribute_name": new_spec["attribute_name"],
                        "old_value": base_norm_str or base_raw_val,
                        "new_value": new_norm_str,
                        "change_type": "MODIFIED",
                        "status": "DETECTED"
                    }
                    diff_records.append(change_item)
                    meaningful_changes.append(change_item)
            else:
                change_item = {
                    "attribute_name": new_spec["attribute_name"],
                    "old_value": "-",
                    "new_value": new_norm_str,
                    "change_type": "ADDED",
                    "status": "DETECTED"
                }
                diff_records.append(change_item)
                meaningful_changes.append(change_item)

        # 5. Version State Determination
        existing_v_label = baseline_version.version_number if baseline_version else "v1.0"
        
        # Calculate Next Candidate Version
        candidate_v_label = "v2.0"
        if "v1" in existing_v_label:
            candidate_v_label = "v2.0"
        elif "v2" in existing_v_label:
            candidate_v_label = "v2.1"
        else:
            candidate_v_label = f"{existing_v_label}.1"

        if len(meaningful_changes) > 0:
            version_status = "NEW_VERSION"
        else:
            version_status = "NO_CHANGE"

        # 6. Generate Downstream Impacts & Persist Changes to Database
        generated_impacts = []
        if version_status == "NEW_VERSION":
            for change_item in meaningful_changes:
                attr = change_item["attribute_name"].lower()
                old_v = change_item["old_value"]
                new_v = change_item["new_value"]

                # Find or create Change record
                existing_change = (
                    db.query(Change)
                    .filter(
                        Change.product_id == product.id,
                        Change.attribute_name == change_item["attribute_name"],
                        Change.new_value == new_v,
                        Change.status == "PENDING"
                    )
                    .first()
                )

                if not existing_change:
                    existing_change = Change(
                        product_id=product.id,
                        old_version_id=baseline_version.id if baseline_version else None,
                        attribute_name=change_item["attribute_name"],
                        old_value=old_v,
                        new_value=new_v,
                        change_type=change_item["change_type"],
                        source_document=doc.original_file_name,
                        confidence=0.98,
                        status="PENDING"
                    )
                    db.add(existing_change)
                    db.commit()
                    db.refresh(existing_change)

                # Generate Specific Impacts for this Change
                impact_defs = []
                if attr in ["power", "speed", "voltage", "mounting", "frame_size", "frequency", "efficiency"]:
                    impact_defs.append({
                        "impact_type": "Compatibility",
                        "severity": "high",
                        "affected_entity_type": "Controller & Inverter VFD",
                        "title": f"Controller Revalidation Required ({change_item['attribute_name']}: {old_v} → {new_v})",
                        "description": f"Existing drive and PLC inverter configurations reference {old_v}. Operating at {new_v} requires electrical and thermal protection revalidation.",
                        "target_module_url": "/compatibility"
                    })

                impact_defs.append({
                    "impact_type": "E-commerce",
                    "severity": "medium",
                    "affected_entity_type": "Storefront Listing",
                    "title": f"Storefront Specification Update Required ({change_item['attribute_name']})",
                    "description": f"Published storefront listing for {product.product_code} contains specification '{old_v}'. Synchronization required.",
                    "target_module_url": "/ecommerce"
                })

                if attr in ["power", "voltage", "speed", "weight", "efficiency"]:
                    impact_defs.append({
                        "impact_type": "Procurement",
                        "severity": "medium",
                        "affected_entity_type": "Supplier Cross-Reference",
                        "title": f"Supplier Part Mapping Notice ({change_item['attribute_name']})",
                        "description": f"Supplier price and inventory tables reference previous specification ({old_v}).",
                        "target_module_url": "/procurement"
                    })

                impact_defs.append({
                    "impact_type": "Quote",
                    "severity": "low",
                    "affected_entity_type": "Active Quotation Template",
                    "title": f"Customer Quote Notice ({change_item['attribute_name']})",
                    "description": f"Active customer quotes for {product.product_code} currently list '{old_v}'. Review before re-issuing.",
                    "target_module_url": "/quotes"
                })

                for imp_def in impact_defs:
                    existing_imp = (
                        db.query(ChangeImpact)
                        .filter(
                            ChangeImpact.change_id == existing_change.id,
                            ChangeImpact.impact_type == imp_def["impact_type"],
                            ChangeImpact.title == imp_def["title"]
                        )
                        .first()
                    )
                    if not existing_imp:
                        new_imp = ChangeImpact(
                            change_id=existing_change.id,
                            impact_type=imp_def["impact_type"],
                            affected_entity_type=imp_def.get("affected_entity_type"),
                            title=imp_def["title"],
                            description=imp_def["description"],
                            severity=imp_def["severity"],
                            reviewed=False,
                            target_module_url=imp_def["target_module_url"]
                        )
                        db.add(new_imp)
                        db.commit()
                        db.refresh(new_imp)
                        generated_impacts.append({
                            "id": new_imp.id,
                            "change_id": existing_change.id,
                            "domain": new_imp.impact_type,
                            "impact_type": new_imp.impact_type,
                            "title": new_imp.title,
                            "description": new_imp.description,
                            "severity": new_imp.severity,
                            "reviewed": new_imp.reviewed,
                            "target_module_url": new_imp.target_module_url
                        })
                    else:
                        generated_impacts.append({
                            "id": existing_imp.id,
                            "change_id": existing_change.id,
                            "domain": existing_imp.impact_type,
                            "impact_type": existing_imp.impact_type,
                            "title": existing_imp.title,
                            "description": existing_imp.description,
                            "severity": existing_imp.severity,
                            "reviewed": existing_imp.reviewed,
                            "target_module_url": existing_imp.target_module_url
                        })

        return {
            "document_id": document_id,
            "product_id": product.id,
            "product_code": product.product_code,
            "product_name": product.name,
            "existing_version": existing_v_label,
            "candidate_version": candidate_v_label if version_status == "NEW_VERSION" else existing_v_label,
            "version_status": version_status,
            "match_status": match_status,
            "total_changes": len(meaningful_changes),
            "changes": diff_records,
            "meaningful_changes": meaningful_changes,
            "impacts": generated_impacts
        }

    @classmethod
    def approve_synchronization(
        cls,
        db: Session,
        document_id: int,
        approved_by: str = "Lead Systems Engineer",
        comments: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Stage 9: Human Approval of Synchronization:
        1. Promotes candidate version to active (e.g. v2.0 is_current=True).
        2. Archives previous version (is_current=False, status='SUPERSEDED') without overwriting!
        3. Inserts normalized ProductAttribute records for the new version.
        4. Updates Change records to 'APPROVED'.
        5. Logs formal Approval audit trail.
        """
        analysis = cls.analyze_document_version(db, document_id)
        if analysis["version_status"] != "NEW_VERSION":
            raise HTTPException(status_code=400, detail="Cannot synchronize: No new version or modifications detected.")

        product_id = analysis["product_id"]
        product = db.query(Product).filter(Product.id == product_id).first()
        doc = db.query(Document).filter(Document.id == document_id).first()

        # Archive all existing active versions
        existing_versions = db.query(ProductVersion).filter(ProductVersion.product_id == product_id).all()
        for v in existing_versions:
            if v.is_current:
                v.is_current = False
                v.status = "SUPERSEDED"

        # Create New Product Version
        new_version_num = analysis["candidate_version"]
        new_version = ProductVersion(
            product_id=product_id,
            version_number=new_version_num,
            source_document_id=document_id,
            effective_date=datetime.utcnow(),
            is_current=True,
            verified_by=approved_by,
            status="VERIFIED"
        )
        db.add(new_version)
        db.commit()
        db.refresh(new_version)

        # Create Normalized Product Attributes for New Version
        extracted_data = doc.extracted_product_data or {}
        raw_specs = extracted_data.get("specifications", [])
        normalized_specs = UnitNormalizationService.normalize_specifications_list(raw_specs)

        for spec in normalized_specs:
            attr = ProductAttribute(
                product_version_id=new_version.id,
                attribute_name=spec["attribute_name"].replace("_", " ").title(),
                attribute_value=f"{spec['normalized_value']} {spec.get('normalized_unit') or ''}".strip(),
                normalized_value=spec["normalized_value"] if isinstance(spec["normalized_value"], (int, float)) else None,
                unit=spec.get("normalized_unit"),
                source_document_id=document_id,
                source_page=spec.get("source", {}).get("page", 1),
                confidence=spec.get("model_confidence", 0.98),
                verification_status="VERIFIED"
            )
            db.add(attr)

        # Update Master Product current_version_id and status
        product.current_version_id = new_version.id
        product.status = "ACTIVE"

        # Update PENDING Changes to APPROVED
        pending_changes = db.query(Change).filter(Change.product_id == product_id, Change.status == "PENDING").all()
        for c in pending_changes:
            c.status = "APPROVED"
            c.new_version_id = new_version.id

        # Log Approval
        approval = Approval(
            entity_type="PRODUCT_VERSION",
            entity_id=str(new_version.id),
            action="SYNCHRONIZATION_APPROVAL",
            status="APPROVED",
            comments=comments or f"Approved synchronization from Document #{document_id} ({doc.original_file_name})",
            approved_by=approved_by
        )
        db.add(approval)
        db.commit()

        return {
            "status": "SYNCHRONIZED",
            "product_id": product.id,
            "product_code": product.product_code,
            "promoted_version": new_version_num,
            "previous_version": analysis["existing_version"],
            "attributes_created": len(normalized_specs),
            "approved_by": approved_by,
            "message": f"Successfully synchronized {product.product_code} to {new_version_num}. Previous version archived."
        }

    @staticmethod
    def _canonical_attr_key(attr_name: str) -> str:
        k = attr_name.lower().replace("_", " ").replace("-", " ")
        if "power" in k or "kw" in k or "hp" in k or "output" in k:
            return "power"
        if "volt" in k or "voltage" in k:
            return "voltage"
        if "freq" in k or "frequency" in k or "hz" in k:
            return "frequency"
        if "speed" in k or "rpm" in k or "r/min" in k:
            return "speed"
        if "ip" in k or "enclosure" in k or "protect" in k:
            return "ip_rating"
        if "weight" in k or "mass" in k:
            return "weight"
        if "duty" in k:
            return "duty_cycle"
        if "insul" in k:
            return "insulation_class"
        if "eff" in k:
            return "efficiency"
        if "mount" in k:
            return "mounting"
        if "standard" in k or "compliance" in k:
            return "compliance"
        return attr_name.lower().replace(" ", "_")
