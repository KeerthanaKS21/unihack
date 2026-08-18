from app.db.database import SessionLocal
from app.db.models.product import Product, ProductVersion, ProductAttribute
from app.db.models.supplier import Supplier, SupplierProduct
from app.db.models.document import Document
from datetime import datetime

db = SessionLocal()

try:
    print("Seeding dynamic category data for Phase 9 Sourcing Engine...")
    
    # 1. Fetch or create standard suppliers
    suppliers_data = [
        {"name": "Siemens Industrial Direct", "supplier_code": "SUP-SIEMENS", "tier": "Direct OEM", "rating": 4.9},
        {"name": "Crompton & Greaves Authorized Supply", "supplier_code": "SUP-CROMPTON", "tier": "Authorized Partner", "rating": 4.7},
        {"name": "ABB Power & Motion Hub", "supplier_code": "SUP-ABB", "tier": "Authorized Partner", "rating": 4.8},
        {"name": "WEG Global Industrial Supply", "supplier_code": "SUP-WEG", "tier": "Distributor", "rating": 4.2},
        {"name": "Havells Industrial Power", "supplier_code": "SUP-HAVELLS", "tier": "Authorized Partner", "rating": 4.5},
        {"name": "Kirloskar Electric Co", "supplier_code": "SUP-KIRLOSKAR", "tier": "Direct OEM", "rating": 4.6}
    ]
    
    suppliers = {}
    for s_info in suppliers_data:
        sup = db.query(Supplier).filter(Supplier.name == s_info["name"]).first()
        if not sup:
            s_code = s_info["supplier_code"]
            dup_code = db.query(Supplier).filter(Supplier.supplier_code == s_info["supplier_code"]).first()
            if dup_code:
                s_code = f"{s_code}-NEW"
            sup = Supplier(
                name=s_info["name"],
                supplier_code=s_code,
                tier=s_info["tier"],
                rating=s_info["rating"],
                status="ACTIVE"
            )
            db.add(sup)
            db.commit()
            db.refresh(sup)
        suppliers[s_info["name"]] = sup

    # 2. Seed a dummy document for sourcing context
    doc = db.query(Document).filter(Document.original_file_name == "sourcing_specs_2026.pdf").first()
    if not doc:
        doc = Document(
            file_name="sourcing_specs_2026.pdf",
            original_file_name="sourcing_specs_2026.pdf",
            file_path="/documents/sourcing_specs_2026.pdf",
            document_type="DATASHEET",
            file_size=1024500,
            mime_type="application/pdf",
            content_hash="sourcing_specs_2026_hash",
            processing_status="PROCESSED"
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

    # 3. Create Products, Versions, and Attributes
    products_to_seed = [
        # --- PUMPS ---
        {
            "product_code": "P-100",
            "name": "Centrifugal Water Pump P-100",
            "category": "Industrial Pumps & Valves",
            "manufacturer": "Grundfos Industrial",
            "description": "Premium stainless steel centrifugal pump for HVAC and chemical fluid transport.",
            "attributes": [
                {"name": "flowRate", "val": "120 L/min", "norm": 120.0, "unit": "L/min"},
                {"name": "pressure", "val": "8 bar", "norm": 8.0, "unit": "bar"},
                {"name": "material", "val": "SS316", "norm": None, "unit": None},
                {"name": "temperature", "val": "80 C", "norm": 80.0, "unit": "C"}
            ],
            "offers": [
                {"supplier": "Crompton & Greaves Authorized Supply", "price": 48000.0, "stock": 50, "delivery": 9, "notes": "SS316 pump, 120 L/min flow, 8 bar pressure. Complete match."},
                {"supplier": "Siemens Industrial Direct", "price": 55000.0, "stock": 15, "delivery": 12, "notes": "Slightly exceeds price ceiling and lead time constraints."}
            ]
        },
        {
            "product_code": "P-101",
            "name": "High-Pressure Centrifugal Pump P-101",
            "category": "Industrial Pumps & Valves",
            "manufacturer": "Kirloskar Pumps",
            "description": "Standard high-pressure booster pump for clean water utility transport.",
            "attributes": [
                {"name": "flowRate", "val": "100 L/min", "norm": 100.0, "unit": "L/min"},
                {"name": "pressure", "val": "6 bar", "norm": 6.0, "unit": "bar"},
                {"name": "material", "val": "SS304", "norm": None, "unit": None},
                {"name": "temperature", "val": "70 C", "norm": 70.0, "unit": "C"}
            ],
            "offers": [
                {"supplier": "Kirloskar Electric Co", "price": 35000.0, "stock": 25, "delivery": 8, "notes": "SS304 pump, does not meet flow and pressure requirement (fails flowRate < 120 L/min, pressure < 8 bar)."}
            ]
        },
        # --- VALVES ---
        {
            "product_code": "V-100",
            "name": "SS Gate Valve V-100",
            "category": "Industrial Valves",
            "manufacturer": "L&T Valves",
            "description": "SS304 flanged gate valve engineered for flow isolation in high pressure utilities.",
            "attributes": [
                {"name": "size", "val": "DN50", "norm": None, "unit": None},
                {"name": "pressureRating", "val": "16 bar", "norm": 16.0, "unit": "bar"},
                {"name": "material", "val": "SS304", "norm": None, "unit": None},
                {"name": "connection", "val": "Flanged", "norm": None, "unit": None}
            ],
            "offers": [
                {"supplier": "Crompton & Greaves Authorized Supply", "price": 15000.0, "stock": 100, "delivery": 5, "notes": "SS304 valve, 16 bar rating, flanged. Matches specifications."}
            ]
        },
        {
            "product_code": "V-101",
            "name": "Premium SS Gate Valve V-101",
            "category": "Industrial Valves",
            "manufacturer": "L&T Valves",
            "description": "Premium SS316 gate valve with flanged connections.",
            "attributes": [
                {"name": "size", "val": "DN50", "norm": None, "unit": None},
                {"name": "pressureRating", "val": "25 bar", "norm": 25.0, "unit": "bar"},
                {"name": "material", "val": "SS316", "norm": None, "unit": None},
                {"name": "connection", "val": "Flanged", "norm": None, "unit": None}
            ],
            "offers": [
                {"supplier": "Siemens Industrial Direct", "price": 22000.0, "stock": 30, "delivery": 6, "notes": "Premium SS316, but exceeds price ceiling."}
            ]
        },
        # --- COMPRESSORS ---
        {
            "product_code": "C-100",
            "name": "Rotary Screw Air Compressor C-100",
            "category": "Industrial Compressors",
            "manufacturer": "Atlas Copco",
            "description": "Variable speed drive rotary screw air compressor engineered for manufacturing plants.",
            "attributes": [
                {"name": "capacity", "val": "150 cfm", "norm": 150.0, "unit": "cfm"},
                {"name": "workingPressure", "val": "10 bar", "norm": 10.0, "unit": "bar"},
                {"name": "power", "val": "11 kW", "norm": 11.0, "unit": "kW"}
            ],
            "offers": [
                {"supplier": "ABB Power & Motion Hub", "price": 120000.0, "stock": 5, "delivery": 15, "notes": "Heavy-duty compressor, lead time is 15 days."}
            ]
        },
        # --- GEARBOXES ---
        {
            "product_code": "GB-100",
            "name": "Helical Industrial Gearbox GB-100",
            "category": "Industrial Gearboxes",
            "manufacturer": "Premium Transmission",
            "description": "Foot-mounted inline helical gearbox with high torque load efficiency.",
            "attributes": [
                {"name": "ratio", "val": "15:1", "norm": None, "unit": None},
                {"name": "torque", "val": "450 Nm", "norm": 450.0, "unit": "Nm"},
                {"name": "efficiency", "val": "94%", "norm": None, "unit": None}
            ],
            "offers": [
                {"supplier": "Kirloskar Electric Co", "price": 32000.0, "stock": 10, "delivery": 12, "notes": "Gear ratio 15:1, 450 Nm torque. Fully validated."}
            ]
        }
    ]
    
    for p_seed in products_to_seed:
        p = db.query(Product).filter(Product.product_code == p_seed["product_code"]).first()
        if not p:
            p = Product(
                product_code=p_seed["product_code"],
                name=p_seed["name"],
                manufacturer=p_seed["manufacturer"],
                category=p_seed["category"],
                description=p_seed["description"],
                status="ACTIVE",
                image_url="https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&w=600&q=80",
                health_score=95
            )
            db.add(p)
            db.commit()
            db.refresh(p)
        
        # Add Version
        v = db.query(ProductVersion).filter(ProductVersion.product_id == p.id, ProductVersion.is_current == True).first()
        if not v:
            v = ProductVersion(
                product_id=p.id,
                version_number="v1.0",
                source_document_id=doc.id,
                is_current=True,
                status="VERIFIED"
            )
            db.add(v)
            db.commit()
            db.refresh(v)
            
        # Add Attributes
        for attr_seed in p_seed["attributes"]:
            attr = db.query(ProductAttribute).filter(
                ProductAttribute.product_version_id == v.id,
                ProductAttribute.attribute_name == attr_seed["name"]
            ).first()
            if not attr:
                attr = ProductAttribute(
                    product_version_id=v.id,
                    attribute_name=attr_seed["name"],
                    attribute_value=attr_seed["val"],
                    normalized_value=attr_seed["norm"],
                    unit=attr_seed["unit"],
                    source_document_id=doc.id,
                    verification_status="VERIFIED"
                )
                db.add(attr)
        db.commit()
        
        # Link Supplier Offers
        for offer_seed in p_seed["offers"]:
            sup = suppliers[offer_seed["supplier"]]
            sp = db.query(SupplierProduct).filter(
                SupplierProduct.supplier_id == sup.id,
                SupplierProduct.product_id == p.id
            ).first()
            if not sp:
                sp = SupplierProduct(
                    supplier_id=sup.id,
                    product_id=p.id,
                    supplier_product_code=f"OFFER-{p_seed['product_code']}",
                    price=offer_seed["price"],
                    currency="INR",
                    stock_quantity=offer_seed["stock"],
                    delivery_days=offer_seed["delivery"],
                    minimum_order_quantity=1,
                    technical_match_score=1.0,
                    is_exact_match="Exact Match",
                    supplier_status="AVAILABLE",
                    advantage_notes=offer_seed["notes"]
                )
                db.add(sp)
        db.commit()
        
    print("Database seeding completed successfully!")
    
except Exception as e:
    print(f"Error seeding database: {e}")
    db.rollback()
finally:
    db.close()
