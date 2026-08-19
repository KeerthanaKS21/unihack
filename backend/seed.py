import sys
import re
import csv
import json
from pathlib import Path
from datetime import datetime, timedelta

# Add parent directory to path so app modules can be imported
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.db.database import SessionLocal, engine, Base
from app.db.models import (
    Product,
    ProductVersion,
    ProductAttribute,
    Document,
    Supplier,
    SupplierProduct,
    Certificate,
    Compatibility,
    Change,
    ChangeImpact,
    CatalogIssue,
    Quote,
    QuoteItem,
    Approval,
    AuditLog
)

def seed_database():
    # Ensure all tables exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("Checking existing data...")
        # Clear existing records for a clean, deterministic seed
        db.query(QuoteItem).delete()
        db.query(Quote).delete()
        db.query(CatalogIssue).delete()
        db.query(ChangeImpact).delete()
        db.query(Change).delete()
        db.query(Compatibility).delete()
        db.query(Certificate).delete()
        db.query(SupplierProduct).delete()
        db.query(Supplier).delete()
        db.query(ProductAttribute).delete()
        db.query(ProductVersion).delete()
        db.query(Document).delete()
        db.query(Product).delete()
        db.query(Approval).delete()
        db.query(AuditLog).delete()
        db.commit()

        print("Seeding Documents...")
        doc_storefront = Document(
            file_name="products_datasheet.csv",
            original_file_name="products_datasheet.csv",
            file_path="d:/UniHack/website/products_datasheet.csv",
            document_type="CATALOG",
            file_size=19923,
            file_size_formatted="19.9 KB",
            mime_type="text/csv",
            content_hash="storefront_catalog_hash_2026",
            uploaded_by="Migration System",
            processing_status="PROCESSED",
            version_detected="v1.0",
            match_confidence=1.0,
            pages_count=1,
            extracted_summary="Storefront product database mapping containing legacy specifications."
        )
        # Locate engineering specs CSV
        eng_csv_candidates = [
            Path(__file__).resolve().parent / "uploads" / "1787138755_product_specifications_separate_columns.csv",
            Path(__file__).resolve().parent / "app" / "db" / "engineering_catalog.csv",
            Path(__file__).resolve().parent / "uploads" / "1787127272_product_specifications_separate_columns.csv"
        ]
        eng_csv_path = None
        for cand in eng_csv_candidates:
            if cand.exists():
                eng_csv_path = cand
                break
        if not eng_csv_path:
            eng_csv_path = eng_csv_candidates[1]

        doc_engineering = Document(
            file_name=eng_csv_path.name if eng_csv_path else "engineering_catalog.csv",
            original_file_name=eng_csv_path.name if eng_csv_path else "engineering_catalog.csv",
            file_path=str(eng_csv_path),
            document_type="DATASHEET",
            file_size=2832,
            file_size_formatted="2.8 KB",
            mime_type="text/csv",
            content_hash="engineering_specs_hash_2026",
            uploaded_by="Engineering Lead",
            processing_status="PROCESSED",
            version_detected="v2.0",
            match_confidence=1.0,
            pages_count=1,
            extracted_summary="Verified engineering catalog release 2026."
        )
        db.add_all([doc_storefront, doc_engineering])
        db.commit()

        # 1. Parse and seed ALL products from Storefront Catalog (legacy baseline)
        print("Parsing storefront datasheet CSV...")
        storefront_csv_candidates = [
            Path("d:/UniHack/website/products_datasheet.csv"),
            Path(__file__).resolve().parent / "app" / "db" / "legacy_catalog.csv"
        ]
        storefront_csv_path = None
        for cand in storefront_csv_candidates:
            if cand.exists():
                storefront_csv_path = cand
                break
        if not storefront_csv_path:
            storefront_csv_path = storefront_csv_candidates[1]
        
        with open(storefront_csv_path, mode='r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                p_code = row.get("Product ID") or row.get("ID")
                p_name = row.get("Name")
                p_cat = row.get("Category")
                p_desc = row.get("Description") or f"{p_name} standard industrial supply."
                p_ver = row.get("Database Version") or "1"
                
                if not p_code or not p_name or not p_cat:
                    continue
                    
                # Create legacy product
                p = Product(
                    product_code=p_code,
                    name=p_name,
                    manufacturer="Siemens" if "motor" in p_cat.lower() else ("Grundfos Industrial" if "pump" in p_cat.lower() else "ABB Automation"),
                    category=p_cat,
                    description=p_desc,
                    status="LEGACY",
                    image_url="https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&w=600&q=80",
                    health_score=85
                )
                db.add(p)
                db.commit()
                db.refresh(p)
                
                # Add version v1.0
                v = ProductVersion(
                    product_id=p.id,
                    version_number=f"v{p_ver}.0",
                    source_document_id=doc_storefront.id,
                    is_current=True,
                    status="VERIFIED"
                )
                db.add(v)
                db.commit()
                db.refresh(v)
                p.current_version_id = v.id
                db.commit()
                
                # Extract dynamic specifications columns
                metadata_cols = ["Product ID", "ID", "Model Reference", "Name", "Category", "Description", "Database Version", "Last Checked Date"]
                for col_name, raw_val in row.items():
                    if col_name in metadata_cols or not raw_val or raw_val.strip() in ("", "None", "null"):
                        continue
                        
                    # Normalize numerical value and unit
                    normalized_value = None
                    unit = None
                    num_match = re.match(r"^\s*(\d+(?:\.\d+)?)\s*([a-zA-Z°%/-]+(?:\s+[a-zA-Z0-9°%/-]+)*)?\s*$", raw_val)
                    if num_match:
                        normalized_value = float(num_match.group(1))
                        unit = num_match.group(2)
                        
                    attr = ProductAttribute(
                        product_version_id=v.id,
                        attribute_name=col_name,
                        attribute_value=raw_val,
                        normalized_value=normalized_value,
                        unit=unit,
                        source_document_id=doc_storefront.id,
                        confidence=0.95,
                        verification_status="VERIFIED"
                    )
                    db.add(attr)
                db.commit()

        # 2. Parse and apply updates from Engineering Specification CSV (v2.0)
        print("Parsing verified engineering specs CSV...")
        
        with open(eng_csv_path, mode='r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                p_code = row.get("ID") or row.get("Product ID")
                p_name = row.get("Name")
                p_cat = row.get("Category")
                
                if not p_code:
                    continue
                    
                # Look up product in master DB
                p = db.query(Product).filter(Product.product_code == p_code).first()
                if not p:
                    # If not exists (e.g. M-101 / XYZ-450 was seeded as XYZ-450, let's map it or create it)
                    p = Product(
                        product_code=p_code,
                        name=p_name,
                        manufacturer="Siemens" if "motor" in p_cat.lower() else "ABB Automation",
                        category=p_cat,
                        status="ACTIVE",
                        image_url="https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&w=600&q=80",
                        health_score=95
                    )
                    db.add(p)
                    db.commit()
                    db.refresh(p)
                else:
                    # Update status to ACTIVE (verified)
                    p.status = "ACTIVE"
                    p.health_score = 95
                    db.commit()

                # Get current active version
                old_ver = db.query(ProductVersion).filter(
                    ProductVersion.product_id == p.id,
                    ProductVersion.is_current == True
                ).first()
                
                is_gb100 = (p.product_code == "GB-100")
                
                if is_gb100:
                    # Keep old version v1.0 as current, and stage v2.0 as DRAFT
                    v2 = ProductVersion(
                        product_id=p.id,
                        version_number="v2.0",
                        source_document_id=doc_engineering.id,
                        is_current=False,
                        status="DRAFT"
                    )
                    p.status = "CHANGES_DETECTED"
                else:
                    if old_ver:
                        old_ver.is_current = False
                        old_ver.status = "SUPERSEDED"
                    v2 = ProductVersion(
                        product_id=p.id,
                        version_number="v2.0",
                        source_document_id=doc_engineering.id,
                        is_current=True,
                        status="VERIFIED"
                    )
                    p.status = "ACTIVE"
                
                db.add(v2)
                db.commit()
                db.refresh(v2)
                if not is_gb100:
                    p.current_version_id = v2.id
                    db.commit()

                # Extract and write specifications dynamically
                metadata_cols = ["ID", "Product ID", "Name", "Category", "Version"]
                changes_list = []
                for col_name, raw_val in row.items():
                    if col_name in metadata_cols or not raw_val or raw_val.strip() in ("", "None", "null"):
                        continue
                        
                    # Normalize numerical value and unit
                    normalized_value = None
                    unit = None
                    num_match = re.match(r"^\s*(\d+(?:\.\d+)?)\s*([a-zA-Z°%/-]+(?:\s+[a-zA-Z0-9°%/-]+)*)?\s*$", raw_val)
                    if num_match:
                        normalized_value = float(num_match.group(1))
                        unit = num_match.group(2)
                        
                    attr = ProductAttribute(
                        product_version_id=v2.id,
                        attribute_name=col_name,
                        attribute_value=raw_val,
                        normalized_value=normalized_value,
                        unit=unit,
                        source_document_id=doc_engineering.id,
                        confidence=0.99,
                        verification_status="VERIFIED"
                    )
                    db.add(attr)

                    # Check for changes against v1.0
                    if old_ver:
                        old_attr = db.query(ProductAttribute).filter(
                            ProductAttribute.product_version_id == old_ver.id,
                            ProductAttribute.attribute_name == col_name
                        ).first()
                        old_v = old_attr.attribute_value if old_attr else ""
                        if old_v != raw_val:
                            changes_list.append((col_name, old_v, raw_val))
                db.commit()

                # Create Change and ChangeImpact records for specification shifts
                for attr_name, old_val, new_val in changes_list:
                    chg = Change(
                        product_id=p.id,
                        old_version_id=old_ver.id if old_ver else None,
                        new_version_id=v2.id,
                        attribute_name=attr_name,
                        old_value=old_val,
                        new_value=new_val,
                        change_type="MODIFIED",
                        source_document="1787127272_product_specifications_separate_columns.csv",
                        confidence=0.99,
                        status="PENDING" if is_gb100 else "APPROVED"
                    )
                    db.add(chg)
                    db.commit()
                    db.refresh(chg)

                    # Storefront mismatch impact
                    ecom_imp = ChangeImpact(
                        change_id=chg.id,
                        impact_type="E-commerce",
                        affected_entity_type="Storefront Listing",
                        affected_entity_id=f"SKU-{p.product_code}",
                        title="B2B Storefront Specification Mismatch",
                        description=f"Online catalog displays {old_val}. Engineering release updates it to {new_val}.",
                        context_evidence="Ingestion datasheet attribute mismatch.",
                        severity="high",
                        reviewed=False,
                        target_module_url="/ecommerce"
                    )
                    db.add(ecom_imp)
                db.commit()

        # 3. Seed Suppliers
        print("Seeding B2B Suppliers...")
        suppliers_data = [
            {"name": "Alpha Industrial Supplies", "supplier_code": "SUP-ALPHA", "tier": "Authorized Partner", "rating": 4.8},
            {"name": "Nova Industrial Systems", "supplier_code": "SUP-NOVA", "tier": "Direct OEM", "rating": 4.9},
            {"name": "Prime Engineering Traders", "supplier_code": "SUP-PRIME", "tier": "Authorized Partner", "rating": 4.7},
            {"name": "Siemens Industrial Direct", "supplier_code": "SUP-SIEMENS", "tier": "Direct OEM", "rating": 4.9},
            {"name": "Crompton & Greaves Authorized Supply", "supplier_code": "SUP-CROMPTON", "tier": "Authorized Partner", "rating": 4.7},
            {"name": "ABB Power & Motion Hub", "supplier_code": "SUP-ABB", "tier": "Authorized Partner", "rating": 4.8},
            {"name": "WEG Global Industrial Supply", "supplier_code": "SUP-WEG", "tier": "Distributor", "rating": 4.2},
            {"name": "Havells Industrial Power", "supplier_code": "SUP-HAVELLS", "tier": "Authorized Partner", "rating": 4.5},
            {"name": "Kirloskar Electric Co", "supplier_code": "SUP-KIRLOSKAR", "tier": "Direct OEM", "rating": 4.6}
        ]
        suppliers = {}
        for s_info in suppliers_data:
            sup = Supplier(
                name=s_info["name"],
                supplier_code=s_info["supplier_code"],
                contact_email=f"sales@{s_info['supplier_code'].lower()}.com",
                phone="+91 22 6789 0001",
                address="Industrial Zone, Mumbai",
                tier=s_info["tier"],
                rating=s_info["rating"],
                status="ACTIVE"
            )
            db.add(sup)
            db.commit()
            db.refresh(sup)
            suppliers[s_info["name"]] = sup
            suppliers[s_info["supplier_code"]] = sup

        # 4. Parse and seed Supplier Offerings from Master Catalog CSV and Supplier Offers CSV
        print("Parsing supplier offerings CSV...")
        seeded_pairs = set()

        # 4a. Master product supplier catalog (if present)
        master_catalog_csv = Path(__file__).resolve().parent / "uploads" / "1787142633_master_product_supplier_catalog.csv"
        if master_catalog_csv.exists():
            with open(master_catalog_csv, mode='r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    p_code = row.get("ID") or row.get("Product ID")
                    s_code = row.get("Supplier ID")
                    s_name = row.get("Supplier Name")
                    price_str = row.get("Unit Price (INR)")
                    stock_str = row.get("Stock Qty")
                    deliv_str = row.get("Delivery Days")
                    notes = row.get("Supplier Data Source") or "Verified supplier offering."

                    if not p_code or not price_str:
                        continue

                    p = db.query(Product).filter(Product.product_code == p_code).first()
                    sup = suppliers.get(s_code) or suppliers.get(s_name)

                    if p and sup:
                        pair_key = (p.id, sup.id)
                        if pair_key not in seeded_pairs:
                            seeded_pairs.add(pair_key)
                            sp = SupplierProduct(
                                supplier_id=sup.id,
                                product_id=p.id,
                                supplier_product_code=f"{p_code}-{sup.supplier_code}",
                                price=float(price_str),
                                currency=row.get("Currency") or "INR",
                                stock_quantity=int(stock_str or 10),
                                delivery_days=int(deliv_str or 7),
                                minimum_order_quantity=int(row.get("MOQ") or 1),
                                technical_match_score=1.0,
                                is_exact_match="Exact Match",
                                supplier_status=row.get("Offer Status") or "AVAILABLE",
                                advantage_notes=notes
                            )
                            db.add(sp)
            db.commit()

        # 4b. Supplier offers CSV for any additional products (e.g. M-101, P-100)
        supplier_csv_path = Path(__file__).resolve().parent / "app" / "db" / "supplier_offers.csv"
        if supplier_csv_path.exists():
            with open(supplier_csv_path, mode='r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    p_code = row.get("Product ID")
                    s_name = row.get("Supplier Name")
                    price = float(row.get("Price"))
                    stock = int(row.get("Stock"))
                    delivery = int(row.get("Delivery Days"))
                    notes = row.get("Notes")

                    p = db.query(Product).filter(Product.product_code == p_code).first()
                    sup = suppliers.get(s_name)

                    if p and sup:
                        pair_key = (p.id, sup.id)
                        if pair_key not in seeded_pairs:
                            seeded_pairs.add(pair_key)
                            sp = SupplierProduct(
                                supplier_id=sup.id,
                                product_id=p.id,
                                supplier_product_code=f"{p_code}-{sup.supplier_code}",
                                price=price,
                                currency="INR",
                                stock_quantity=stock,
                                delivery_days=delivery,
                                minimum_order_quantity=1,
                                technical_match_score=1.0 if delivery <= 7 else 0.85,
                                is_exact_match="Exact Match" if delivery <= 7 else "Closest Alternative",
                                supplier_status="AVAILABLE",
                                advantage_notes=notes
                            )
                            db.add(sp)
            db.commit()

        # 5. Create some dummy unresolved issues for Catalog Health metrics
        print("Seeding Catalog Issues...")
        for p_code, issue_type, attr, title, desc_text in [
            ("M-101", "conflict", "Rated Voltage", "Rated Voltage Conflict (415 V vs 440 V)", "Datasheet confirms 415 V standard, ERP lists 440 V."),
            ("P-100", "missing", "Full Load Efficiency", "Missing Full Load Efficiency Rating", "Pump record lacks efficiency spec."),
            ("GB-100", "outdated", "Standard Compliance", "Outdated IS 325 Standard Reference", "Gearbox references superseded standards.")
        ]:
            prod = db.query(Product).filter(Product.product_code == p_code).first()
            if prod:
                iss = CatalogIssue(
                    product_id=prod.id,
                    issue_type=issue_type,
                    attribute_name=attr,
                    title=title,
                    description=desc_text,
                    status="open",
                    severity="critical" if issue_type == "conflict" else "medium",
                    sources=[{"sourceName": "technical_spec_2026.pdf", "value": "415 V"}],
                    ai_recommendation={"suggestedValue": "415 V", "reasoning": "Baseline standardization."}
                )
                db.add(iss)
        db.commit()

        # 6. Compliance certificates
        print("Seeding Compliance Certificates...")
        m101 = db.query(Product).filter(Product.product_code == "M-101").first()
        if m101:
            c1 = Certificate(product_id=m101.id, certificate_number="IEC-60034-2024-098", standard="IEC 60034-1 Rotating Electrical Machines", expiry_date=datetime.utcnow() + timedelta(days=900), status="VALID", verification_status="Compliant", ai_confidence=0.99)
            c2 = Certificate(product_id=m101.id, certificate_number="CE-LVD-2024-4412", standard="CE Low Voltage Directive 2014/35/EU", expiry_date=datetime.utcnow() + timedelta(days=450), status="VALID", verification_status="Compliant", ai_confidence=0.98)
            db.add_all([c1, c2])
            db.commit()

        # 7. Compatibility records
        print("Seeding Drivetrain Compatibility...")
        gb100 = db.query(Product).filter(Product.product_code == "GB-100").first()
        c105 = db.query(Product).filter(Product.product_code == "C-105").first()
        if m101 and gb100:
            comp1 = Compatibility(product_id=m101.id, compatible_product_id=gb100.id, relationship_type="COMPATIBLE_WITH", status="Compatible", compatibility_score=0.98, explanation="Standard helical coupling match.")
            db.add(comp1)
        if m101 and c105:
            comp2 = Compatibility(product_id=m101.id, compatible_product_id=c105.id, relationship_type="REQUIRES", status="Incompatible", compatibility_score=0.45, explanation="Controller power rating undersized.")
            db.add(comp2)
        db.commit()

        print("Database dynamically seeded successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
