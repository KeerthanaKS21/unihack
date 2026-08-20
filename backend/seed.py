import sys
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
        if db.query(Product).count() > 0:
            print("Database already contains records. Clearing existing records for clean seed...")
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

        print("Seeding Products & Versions...")
        # 1. XYZ-450 Industrial Motor
        p1 = Product(
            product_code="XYZ-450",
            name="XYZ-450 Industrial Induction Motor",
            manufacturer="Siemens",
            category="Electric Motors & Drives",
            description="Premium severe-duty 3-phase TEFC cast iron induction motor engineered for continuous continuous industrial pumping, conveyor, and fan operations.",
            status="ACTIVE",
            image_url="https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80",
            health_score=94
        )
        # 2. ABC-550 Pump
        p2 = Product(
            product_code="ABC-550",
            name="ABC-550 High-Pressure Centrifugal Pump",
            manufacturer="Grundfos Industrial",
            category="Industrial Pumps & Valves",
            description="Multi-stage stainless steel centrifugal booster pump for chemical processing and industrial water circulation.",
            status="ACTIVE",
            image_url="https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80",
            health_score=89
        )
        # 3. CTRL-100 Controller
        p3 = Product(
            product_code="CTRL-100",
            name="ABC-100 Variable Frequency Inverter Drive",
            manufacturer="ABB Automation",
            category="Automation & Controllers",
            description="Compact industrial VFD motor speed controller with vector torque control and Modbus RS485 communication.",
            status="ACTIVE",
            image_url="https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=800&auto=format&fit=crop&q=80",
            health_score=92
        )
        # 4. WEG-W22
        p4 = Product(
            product_code="WEG-W22",
            name="WEG W22 Severe Duty Induction Motor",
            manufacturer="WEG Global",
            category="Electric Motors & Drives",
            description="High-efficiency cast-iron electric motor designed to provide low operating costs and reduced noise.",
            status="ACTIVE",
            image_url="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80",
            health_score=91
        )
        # 5. ABB-M2
        p5 = Product(
            product_code="ABB-M2",
            name="ABB M2BAX Process Performance Motor",
            manufacturer="ABB Heavy Industries",
            category="Electric Motors & Drives",
            description="Process performance cast iron motor built for heavy industrial and harsh chemical environment reliability.",
            status="ACTIVE",
            image_url="https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80",
            health_score=93
        )
        db.add_all([p1, p2, p3, p4, p5])
        db.commit()

        # Link documents to p1
        db.commit()

        # Versions for XYZ-450
        v1 = ProductVersion(
            product_id=p1.id,
            version_number="v1.4",
            source_document_id=None,
            effective_date=datetime.utcnow() - timedelta(days=500),
            is_current=False,
            verified_by="Archive System",
            status="SUPERSEDED"
        )
        v2 = ProductVersion(
            product_id=p1.id,
            version_number="v2.0",
            source_document_id=None,
            effective_date=datetime.utcnow(),
            is_current=True,
            verified_by="Engineering Lead",
            status="VERIFIED"
        )
        db.add_all([v1, v2])
        db.commit()

        p1.current_version_id = v2.id
        db.commit()

        # Attributes for v1.4
        v1_attrs = [
            ProductAttribute(product_version_id=v1.id, attribute_name="Rated Output", attribute_value="5.5 kW (7.5 HP)", normalized_value=5.5, unit="kW", confidence=1.0),
            ProductAttribute(product_version_id=v1.id, attribute_name="Rated Voltage", attribute_value="415 V 3-Phase", normalized_value=415.0, unit="V", confidence=1.0),
            ProductAttribute(product_version_id=v1.id, attribute_name="Synchronous Speed", attribute_value="1440 RPM", normalized_value=1440.0, unit="RPM", confidence=1.0),
            ProductAttribute(product_version_id=v1.id, attribute_name="Protection Degree", attribute_value="IP55", unit="IP", confidence=1.0),
            ProductAttribute(product_version_id=v1.id, attribute_name="Gross Weight", attribute_value="42 kg", normalized_value=42.0, unit="kg", confidence=1.0),
            ProductAttribute(product_version_id=v1.id, attribute_name="Efficiency", attribute_value="89.6%", normalized_value=89.6, unit="%", confidence=1.0)
        ]
        # Attributes for v2.0
        v2_attrs = [
            ProductAttribute(product_version_id=v2.id, attribute_name="Rated Output", attribute_value="7.5 kW (10 HP)", normalized_value=7.5, unit="kW", confidence=0.98, source_document_id=None, source_page=1),
            ProductAttribute(product_version_id=v2.id, attribute_name="Rated Voltage", attribute_value="415 V ±10% 3-Phase", normalized_value=415.0, unit="V", confidence=0.99, source_document_id=None, source_page=2),
            ProductAttribute(product_version_id=v2.id, attribute_name="Synchronous Speed", attribute_value="1460 RPM at 50Hz", normalized_value=1460.0, unit="RPM", confidence=0.97, source_document_id=None, source_page=2),
            ProductAttribute(product_version_id=v2.id, attribute_name="Protection Degree", attribute_value="IP55 Dust & Water Jet", unit="IP", confidence=0.99, source_document_id=None, source_page=4),
            ProductAttribute(product_version_id=v2.id, attribute_name="Gross Weight", attribute_value="45.2 kg", normalized_value=45.2, unit="kg", confidence=0.96, source_document_id=None, source_page=4),
            ProductAttribute(product_version_id=v2.id, attribute_name="Full Load Efficiency", attribute_value="91.2%", normalized_value=91.2, unit="%", confidence=0.98, source_document_id=None, source_page=1),
            ProductAttribute(product_version_id=v2.id, attribute_name="Standard Compliance", attribute_value="IEC 60034-1 / IS 12615:2018", confidence=0.98, source_document_id=None, source_page=5)
        ]
        db.add_all(v1_attrs + v2_attrs)
        db.commit()

        print("Seeding Changes & Change Impacts...")
        chg1 = Change(
            product_id=p1.id,
            old_version_id=v1.id,
            new_version_id=v2.id,
            attribute_name="Rated Output",
            old_value="5.5 kW",
            new_value="7.5 kW",
            change_type="MODIFIED",
            source_document="technical_spec_2026.pdf (Page 1)",
            confidence=0.98,
            status="PENDING"
        )
        chg2 = Change(
            product_id=p1.id,
            old_version_id=v1.id,
            new_version_id=v2.id,
            attribute_name="Synchronous Speed",
            old_value="1440 RPM",
            new_value="1460 RPM",
            change_type="MODIFIED",
            source_document="technical_spec_2026.pdf (Page 2)",
            confidence=0.97,
            status="PENDING"
        )
        chg3 = Change(
            product_id=p1.id,
            old_version_id=v1.id,
            new_version_id=v2.id,
            attribute_name="Gross Weight",
            old_value="42 kg",
            new_value="45 kg",
            change_type="MODIFIED",
            source_document="technical_spec_2026.pdf (Page 4)",
            confidence=0.96,
            status="PENDING"
        )
        chg4 = Change(
            product_id=p1.id,
            old_version_id=v1.id,
            new_version_id=v2.id,
            attribute_name="Rated Voltage",
            old_value="415 V",
            new_value="415 V",
            change_type="UNCHANGED",
            source_document="technical_spec_2026.pdf (Page 2)",
            confidence=0.99,
            status="APPROVED"
        )
        db.add_all([chg1, chg2, chg3, chg4])
        db.commit()

        # Operational Impacts
        imp1 = ChangeImpact(
            change_id=chg1.id,
            impact_type="Compatibility",
            affected_entity_type="Controller Drive",
            affected_entity_id="CTRL-100",
            title="Drive Inverter ABC-100 Thermal Overload",
            description="Upstream drive ABC-100 is rated for 5.5 kW max output. Upgrading XYZ-450 to 7.5 kW will trip the breaker under full mechanical load.",
            context_evidence="Drivetrain topology graph shows 5.5kW inverter limit.",
            severity="critical",
            reviewed=False,
            target_module_url="/compatibility"
        )
        imp2 = ChangeImpact(
            change_id=chg3.id,
            impact_type="Compatibility",
            affected_entity_type="Mechanical Coupling",
            affected_entity_id="CP-50",
            title="Flexible Coupling Shaft Bore Mismatch",
            description="Frame size increased from 112M to 132M (shaft 24mm → 28mm). Coupling CP-50 cannot mount without re-boring.",
            context_evidence="Mechanical drawing page 4 indicates 28mm shaft diameter.",
            severity="high",
            reviewed=False,
            target_module_url="/compatibility"
        )
        imp3 = ChangeImpact(
            change_id=chg1.id,
            impact_type="E-commerce",
            affected_entity_type="Storefront Listing",
            affected_entity_id="SKU-XYZ-450",
            title="B2B Storefront Specification Mismatch",
            description="Online catalog currently displays 5.5 kW (legacy v1.4). Customers ordering will receive 7.5 kW motor.",
            context_evidence="Shopify/SAP Commerce API payload needs push.",
            severity="high",
            reviewed=False,
            target_module_url="/ecommerce"
        )
        imp4 = ChangeImpact(
            change_id=chg1.id,
            impact_type="Procurement",
            affected_entity_type="Supplier Price Contract",
            affected_entity_id="SUP-SIEMENS",
            title="Supplier Price Tier Adjustment (+18%)",
            description="OEM base price increases from ₹36,000 to ₹42,500 for the 7.5 kW rating. Target BOM margins must be re-evaluated.",
            context_evidence="Supplier catalog Q3 pricing matrix.",
            severity="medium",
            reviewed=False,
            target_module_url="/procurement"
        )
        imp5 = ChangeImpact(
            change_id=chg1.id,
            impact_type="Quote",
            affected_entity_type="Pending Customer RFQ",
            affected_entity_id="QT-2026-8941",
            title="Active Quote QT-2026-8941 Specification Outdated",
            description="Quote submitted to Jindal Steel for 10 units of 5.5 kW. Must issue revised quote v2.0 with 7.5 kW specs.",
            context_evidence="Customer RFQ references pump pairing requiring 7.5 kW.",
            severity="high",
            reviewed=True,
            reviewed_by="Sales Operations Lead",
            reviewed_at=datetime.utcnow() - timedelta(hours=2),
            target_module_url="/quotes"
        )
        imp6 = ChangeImpact(
            change_id=chg1.id,
            impact_type="Recommendations",
            affected_entity_type="Recommended Alternative",
            affected_entity_id="ABB-M2",
            title="Cross-Sell & Sourcing Recommendation",
            description="Recommend ABB-M2 or Crompton 7.5 kW as valid secondary supply sources to mitigate single-vendor risk.",
            context_evidence="Procurement match score 96%.",
            severity="low",
            reviewed=True,
            reviewed_by="Procurement Lead",
            reviewed_at=datetime.utcnow() - timedelta(hours=4),
            target_module_url="/procurement"
        )
        db.add_all([imp1, imp2, imp3, imp4, imp5, imp6])
        db.commit()

        print("Seeding Suppliers & Supplier Products...")
        s1 = Supplier(name="Siemens Industrial Direct", supplier_code="SUP-SIEMENS", contact_email="orders@siemens-direct.com", phone="+91 22 6789 0001", address="Siemens Corporate Park, Worli, Mumbai", tier="Direct OEM", rating=4.9, status="ACTIVE")
        s2 = Supplier(name="Crompton & Greaves Authorized Supply", supplier_code="SUP-CROMPTON", contact_email="b2b@cg-power.com", phone="+91 22 4567 8900", address="Kanjurmarg East, Mumbai", tier="Authorized Partner", rating=4.8, status="ACTIVE")
        s3 = Supplier(name="ABB Power & Motion Hub", supplier_code="SUP-ABB", contact_email="motion@in.abb.com", phone="+91 80 2294 9111", address="Peenya Industrial Area, Bengaluru", tier="Authorized Partner", rating=4.7, status="ACTIVE")
        s4 = Supplier(name="WEG Global Industrial Supply", supplier_code="SUP-WEG", contact_email="sales.in@weg.net", phone="+91 44 2681 1200", address="Ambattur Industrial Estate, Chennai", tier="Distributor", rating=4.4, status="ACTIVE")
        db.add_all([s1, s2, s3, s4])
        db.commit()

        # Supplier Products
        sp1 = SupplierProduct(supplier_id=s1.id, product_id=p1.id, supplier_product_code="SIEM-XYZ450-IE3", price=42500.0, currency="INR", stock_quantity=45, delivery_days=3, minimum_order_quantity=1, technical_match_score=1.0, is_exact_match="Exact Match", supplier_status="AVAILABLE", advantage_notes="Direct OEM warranty, official 3-year support, immediate dispatch")
        sp2 = SupplierProduct(supplier_id=s2.id, product_id=p1.id, supplier_product_code="CG-EM-75KW-4P", price=39800.0, currency="INR", stock_quantity=60, delivery_days=5, minimum_order_quantity=2, technical_match_score=0.98, is_exact_match="Exact Match", supplier_status="AVAILABLE", advantage_notes="Lowest exact-spec price, local warehouse stock, bulk rebate eligible")
        sp3 = SupplierProduct(supplier_id=s3.id, product_id=p5.id, supplier_product_code="ABB-M2BAX-132M", price=46200.0, currency="INR", stock_quantity=12, delivery_days=14, minimum_order_quantity=1, technical_match_score=0.96, is_exact_match="Closest Alternative", supplier_status="AVAILABLE", advantage_notes="Higher efficiency class IE4, but delivery time exceeds 10 days")
        sp4 = SupplierProduct(supplier_id=s4.id, product_id=p4.id, supplier_product_code="WEG-W22-7.5KW", price=37500.0, currency="INR", stock_quantity=80, delivery_days=4, minimum_order_quantity=1, technical_match_score=0.88, is_exact_match="Closest Alternative", supplier_status="AVAILABLE", advantage_notes="Lowest price alternative, but enclosure is IP54 instead of mandatory IP55")
        db.add_all([sp1, sp2, sp3, sp4])
        db.commit()

        print("Seeding Catalog Issues...")
        iss1 = CatalogIssue(
            product_id=p1.id,
            issue_type="conflict",
            attribute_name="Rated Voltage",
            title="Rated Voltage Conflict (415 V vs 440 V)",
            description="Engineering datasheet (Page 2) confirms 415 V ±10% 3-Phase. ERP database currently lists 440 V. Cross-system conflict causes quoting discrepancies.",
            sources=[
                {"sourceName": "technical_spec_2026.pdf (Page 2)", "value": "415 V 3-Phase", "priority": "High (OEM Datasheet)", "confidence": 0.99},
                {"sourceName": "SAP ERP Product Master", "value": "440 V", "priority": "Medium (Internal ERP)", "confidence": 0.85},
                {"sourceName": "E-Commerce Catalog Feed", "value": "415 V", "priority": "Low (Web Listing)", "confidence": 0.90}
            ],
            ai_recommendation={
                "suggestedValue": "415 V 3-Phase",
                "reasoning": "OEM datasheet technical_spec_2026.pdf explicitly states 415 V 50Hz for India/EU grid standard. The 440V ERP entry was a legacy typo.",
                "confidence": 0.99,
                "standardReference": "IEC 60038 Standard Voltages"
            },
            evidence="technical_spec_2026.pdf page 2 line 14: 'Rated Supply: 415V AC, 3 Phase, 50Hz'",
            severity="critical",
            status="open"
        )
        iss2 = CatalogIssue(
            product_id=p2.id,
            issue_type="missing",
            attribute_name="Full Load Efficiency",
            title="Missing Full Load Efficiency Rating on ABC-550",
            description="Product record lacks standardized efficiency percentage required for green procurement qualification.",
            sources=[{"sourceName": "Product Master", "value": "NULL", "priority": "High", "confidence": 0.0}],
            ai_recommendation={
                "suggestedValue": "91.8%",
                "reasoning": "Extracted from Grundfos standard curve test report (Doc #GF-2025-PMP).",
                "confidence": 0.94,
                "standardReference": "ISO 9906 Grade 2B"
            },
            evidence="Pump performance test curve sheet GF-2025-PMP page 3.",
            severity="medium",
            status="open"
        )
        iss3 = CatalogIssue(
            product_id=p1.id,
            issue_type="outdated",
            attribute_name="Standard Compliance",
            title="Outdated IS 325 Standard Reference",
            description="Legacy record references superseded IS 325 standard instead of current IS 12615:2018 energy efficiency standards.",
            sources=[{"sourceName": "motor_old.pdf", "value": "IS 325:1996", "priority": "Low", "confidence": 0.80}],
            ai_recommendation={
                "suggestedValue": "IS 12615:2018 / IEC 60034-30-1 (IE3 Class)",
                "reasoning": "IS 325 was formally superseded by Bureau of Indian Standards for 3-phase induction motors.",
                "confidence": 0.97,
                "standardReference": "BIS Standard Gazetted 2018"
            },
            evidence="technical_spec_2026.pdf page 5 specifies IS 12615:2018 compliance.",
            severity="low",
            status="open"
        )
        db.add_all([iss1, iss2, iss3])
        db.commit()

        print("Seeding Compliance Certificates...")
        c1 = Certificate(product_id=p1.id, document_id=None, certificate_number="IEC-60034-2024-098", standard="IEC 60034-1 Rotating Electrical Machines", issue_date=datetime.utcnow() - timedelta(days=200), expiry_date=datetime.utcnow() + timedelta(days=900), status="VALID", verification_status="Compliant", ai_confidence=0.99, ai_recommendation="Valid international standard conformity certificate.")
        c2 = Certificate(product_id=p1.id, document_id=None, certificate_number="CE-LVD-2024-4412", standard="CE Low Voltage Directive 2014/35/EU", issue_date=datetime.utcnow() - timedelta(days=300), expiry_date=datetime.utcnow() + timedelta(days=450), status="VALID", verification_status="Compliant", ai_confidence=0.98, ai_recommendation="Compliant with EU market safety declarations.")
        c3 = Certificate(product_id=p1.id, document_id=None, certificate_number="ATEX-2023-EX-009", standard="ATEX Directive 2014/34/EU (Zone 2 Hazardous)", issue_date=datetime.utcnow() - timedelta(days=680), expiry_date=datetime.utcnow() + timedelta(days=45), status="EXPIRING", verification_status="Action Required", ai_confidence=0.95, ai_recommendation="Certificate expires in 45 days. Request re-certification from Siemens Quality Desk.", issue_description="Expiring in 45 days. Needs renewal submission.")
        c4 = Certificate(product_id=p1.id, document_id=None, certificate_number="ROHS-3-2025-IND", standard="RoHS 3 Directive (EU 2015/863)", issue_date=datetime.utcnow() - timedelta(days=100), expiry_date=datetime.utcnow() + timedelta(days=620), status="VALID", verification_status="Compliant", ai_confidence=0.98, ai_recommendation="Lead and hazardous material threshold verified compliant.")
        db.add_all([c1, c2, c3, c4])
        db.commit()

        print("Seeding Compatibility...")
        comp1 = Compatibility(
            product_id=p1.id,
            compatible_product_id=p3.id,
            relationship_type="REQUIRES",
            status="Incompatible",
            compatibility_score=0.45,
            explanation="Controller ABC-100 is rated for 5.5 kW max output; motor upgraded to 7.5 kW causes thermal overload trip.",
            affected_by_recent_change=True,
            confidence=0.98,
            verification_status="VERIFIED"
        )
        comp2 = Compatibility(
            product_id=p1.id,
            compatible_product_id=p2.id,
            relationship_type="COMPATIBLE_WITH",
            status="Compatible",
            compatibility_score=0.98,
            explanation="XYZ-450 7.5 kW delivers optimal torque curve for ABC-550 pump high-pressure hydraulic stage.",
            affected_by_recent_change=False,
            confidence=0.99,
            verification_status="VERIFIED"
        )
        db.add_all([comp1, comp2])
        db.commit()

        print("Seeding Quotes...")
        q1 = Quote(
            quote_number="QT-2026-8941",
            customer_name="Vikramaditya Singhania",
            customer_email="v.singhania@jindalsteel.com",
            company="Jindal Steel & Power Ltd.",
            request_prompt="Require 10 units of 7.5 kW 415V IE3 industrial motors with 7-day urgent delivery to Angul Plant.",
            status="Validated",
            version="v1.0",
            subtotal=425000.0,
            tax=76500.0,
            freight=8500.0,
            total=510000.0,
            currency="INR",
            delivery_days=7,
            valid_until="30 Days from Generation",
            validation_notes=[
                "Verified 7.5 kW 415V specifications against Siemens technical_spec_2026.pdf.",
                "Warehouse inventory confirmed (Siemens Direct has 45 units in stock, required: 10).",
                "Calculated 18% standard industrial equipment GST + heavy logistics freight."
            ],
            history=[
                {"timestamp": "2026-08-18 10:15", "event": "RFQ ingested from Jindal Steel customer portal.", "by": "AI Quote Engine"},
                {"timestamp": "2026-08-18 10:16", "event": "Technical specs matched with XYZ-450 v2.0 (100% parameter alignment).", "by": "System"},
                {"timestamp": "2026-08-18 10:17", "event": "Initial quote draft v1.0 generated and validated.", "by": "Sales Operations"}
            ]
        )
        db.add(q1)
        db.commit()

        qi1 = QuoteItem(
            quote_id=q1.id,
            product_id=p1.id,
            supplier_id=s1.id,
            product_model="XYZ-450-IE3",
            description="Siemens 7.5 kW (10 HP) 415V 3-Phase 1460 RPM Foot-Mounted TEFC Induction Motor (Frame 132M)",
            spec_summary="7.5 kW | 415 V | 1460 RPM | IP55 | IE3",
            quantity=10,
            unit_price=42500.0,
            delivery_days=7,
            subtotal=425000.0,
            supplier_source="Siemens Industrial Direct (SUP-SIEMENS)"
        )
        db.add(qi1)
        db.commit()

        print("Database seeded successfully with realistic industrial records!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
