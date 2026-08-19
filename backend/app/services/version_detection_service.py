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
    def _process_tabular_catalog(cls, db: Session, doc: Document) -> Optional[Dict[str, Any]]:
        attrs = doc.extracted_attributes or {}
        sheets = attrs.get("sheets", [])
        if not sheets:
            return None

        all_rows = []
        for s in sheets:
            rows = s.get("all_rows") or s.get("sample_rows") or []
            all_rows.extend(rows)

        if not all_rows or len(all_rows) < 1:
            return None

        doc_fname = (doc.original_file_name or "").lower()
        default_ver = "v2.0" if ("updated" in doc_fname or "v2" in doc_fname or "2026" in doc_fname or "new" in doc_fname) else "v1.0"

        processed_products = []
        all_created_changes = []
        all_created_impacts = []

        for row in all_rows:
            model_raw = row.get("ID") or row.get("id") or row.get("Model") or row.get("model") or row.get("SKU") or row.get("sku") or row.get("Model Identifier")
            if not model_raw:
                continue
            clean_code = str(model_raw).strip()
            if not clean_code or clean_code.lower() == "nan" or clean_code.lower() == "none":
                continue

            name_raw = str(row.get("Name") or row.get("name") or f"{clean_code} Industrial Equipment").strip()
            cat_raw = str(row.get("Category") or row.get("category") or "Industrial Equipment").strip()
            ver_raw = str(row.get("Version") or row.get("version") or "").strip()

            spec_dict = {}
            for col_k, col_v in row.items():
                clean_k = str(col_k).strip()
                if clean_k.lower() in ["id", "name", "category", "version", "unnamed"] or clean_k.startswith("Unnamed:"):
                    continue
                v_str = str(col_v).strip() if col_v is not None else ""
                if v_str and v_str.lower() not in ["nan", "none", "null", ""]:
                    spec_dict[clean_k] = v_str

            prod = db.query(Product).filter(Product.product_code == clean_code).first()
            if not prod:
                # First time seeing this product -> Baseline v1.0
                row_ver = "v1.0"
                prod = Product(
                    product_code=clean_code,
                    name=name_raw,
                    category=cat_raw,
                    manufacturer="InduCore Industrial",
                    status="ACTIVE"
                )
                db.add(prod)
                db.commit()
                db.refresh(prod)

                base_v = ProductVersion(
                    product_id=prod.id,
                    version_number=row_ver,
                    source_document_id=doc.id,
                    effective_date=datetime.utcnow(),
                    is_current=True,
                    verified_by="Spreadsheet Ingestion Pipeline",
                    status="VERIFIED"
                )
                db.add(base_v)
                db.commit()
                db.refresh(base_v)

                for k, v in spec_dict.items():
                    attr_rec = ProductAttribute(
                        product_version_id=base_v.id,
                        attribute_name=k,
                        attribute_value=v,
                        confidence=0.99,
                        verification_status="VERIFIED"
                    )
                    db.add(attr_rec)

                prod.current_version_id = base_v.id
                db.commit()
                processed_products.append(prod)
            else:
                # Product already exists in DB -> Incremental Revision v2.0
                curr_v = db.query(ProductVersion).filter(ProductVersion.product_id == prod.id, ProductVersion.is_current == True).first()
                if not curr_v:
                    curr_v = db.query(ProductVersion).filter(ProductVersion.product_id == prod.id).order_by(ProductVersion.created_at.desc()).first()

                # Determine next version label
                if curr_v and curr_v.source_document_id != doc.id:
                    row_ver = "v2.0"
                else:
                    row_ver = default_ver

                prev_attrs_map = {a.attribute_name.strip().lower(): a.attribute_value for a in (curr_v.attributes if curr_v else [])}

                # Clean up existing version for this specific doc if re-running
                existing_ver = db.query(ProductVersion).filter(
                    ProductVersion.product_id == prod.id,
                    ProductVersion.source_document_id == doc.id
                ).first()

                if existing_ver and existing_ver.id != getattr(curr_v, 'id', None):
                    db.query(ProductAttribute).filter(ProductAttribute.product_version_id == existing_ver.id).delete()
                    db.delete(existing_ver)
                    db.commit()

                if not existing_ver or existing_ver.id != getattr(curr_v, 'id', None):
                    new_v = ProductVersion(
                        product_id=prod.id,
                        version_number=row_ver,
                        source_document_id=doc.id,
                        effective_date=datetime.utcnow(),
                        is_current=True,
                        verified_by="Spreadsheet Update Pipeline",
                        status="VERIFIED"
                    )
                    db.add(new_v)
                    db.commit()
                    db.refresh(new_v)

                    for k, v in spec_dict.items():
                        attr_rec = ProductAttribute(
                            product_version_id=new_v.id,
                            attribute_name=k,
                            attribute_value=v,
                            confidence=0.99,
                            verification_status="VERIFIED"
                        )
                        db.add(attr_rec)

                    # Compare specifications against previous baseline
                    for k, v in spec_dict.items():
                        clean_k = k.strip().lower()
                        if clean_k in prev_attrs_map:
                            old_val = prev_attrs_map[clean_k]
                            # Clean unit suffixes for comparison if needed
                            clean_old = old_val.replace("kW", "").replace("RPM", "").strip().lower()
                            clean_new = v.replace("kW", "").replace("RPM", "").strip().lower()
                            
                            if clean_old != clean_new and old_val.strip().lower() != v.strip().lower():
                                chg = Change(
                                    product_id=prod.id,
                                    old_version_id=curr_v.id if curr_v else None,
                                    new_version_id=new_v.id,
                                    attribute_name=k,
                                    old_value=old_val,
                                    new_value=v,
                                    change_type="MODIFIED",
                                    source_document=doc.original_file_name,
                                    confidence=0.99,
                                    status="PENDING"
                                )
                                db.add(chg)
                                db.commit()
                                db.refresh(chg)
                                all_created_changes.append(chg)

                                impacts_data = [
                                    ("Compatibility", "high", f"Coupling & electrical compatibility review required for {clean_code}", f"Coupling & electrical load review required for {clean_code} with upstream controller and motor drive load.", "/compatibility"),
                                    ("E-commerce", "medium", f"Storefront SKU {clean_code} Outdated on Website", f"Storefront technical specifications and search filter facets out of sync on website for {clean_code}.", "/ecommerce"),
                                    ("Procurement", "medium", f"Supplier catalog specifications index update for {clean_code}", f"Supplier catalog specifications and unit rate index update for {clean_code}.", "/procurement"),
                                    ("Quotes", "low", f"Open Quote Draft Review for {clean_code}", f"Active customer quotation drafts and proposals contain previous {clean_code} ratings.", "/quotes")
                                ]
                                for imp_type, sev, title_txt, desc_txt, mod_url in impacts_data:
                                    imp = ChangeImpact(
                                        change_id=chg.id,
                                        impact_type=imp_type,
                                        severity=sev,
                                        title=title_txt,
                                        description=desc_txt,
                                        affected_entity_type="Product Specification",
                                        affected_entity_id=clean_code,
                                        target_module_url=mod_url,
                                        reviewed=False
                                    )
                                    db.add(imp)
                                    all_created_impacts.append(imp)
                                db.commit()

                    if curr_v and curr_v.id != new_v.id:
                        curr_v.is_current = False
                    prod.current_version_id = new_v.id
                    db.commit()
                processed_products.append(prod)

        if processed_products:
            doc.product_id = processed_products[0].id
            doc.version_detected = default_ver
            doc.match_confidence = 1.0
            db.commit()

        return {
            "document_id": doc.id,
            "total_products_processed": len(processed_products),
            "total_changes_detected": len(all_created_changes),
            "total_impacts_generated": len(all_created_impacts),
            "message": f"Successfully processed {len(processed_products)} catalog products across spreadsheet rows."
        }

    @classmethod
    def analyze_document_version(
        cls,
        db: Session,
        document_id: int
    ) -> Dict[str, Any]:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail=f"Document #{document_id} not found")

        # 0. If Spreadsheet or CSV with multiple rows, run batch catalog processing
        if doc.document_type == "SPREADSHEET" or (doc.original_file_name or "").lower().endswith((".xlsx", ".xls", ".csv")):
            tab_res = cls._process_tabular_catalog(db, doc)
            if tab_res:
                return tab_res

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
