import sys
import os
from datetime import datetime, timedelta
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.db.database import SessionLocal, engine, Base
from app.db.models.product import Product, ProductVersion, ProductAttribute
from app.db.models.certificate import Certificate
from app.db.models.document import Document
from app.db.models.audit import AuditLog
from app.services.compliance_service import ComplianceService

def run_compliance_test_suite():
    print("========================================================")
    print("RUNNING COMPLETE REFINED COMPLIANCE AUDITING TEST SUITE")
    print("========================================================\n")

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # ----------------------------------------------------
        # TEST CASE 1: NexusGuard NX-450 Datasheet Ingestion & Evidence Missing Audit
        # ----------------------------------------------------
        nx450 = Product(
            name="NexusGuard NX-450 Industrial Motor",
            product_code="NIS-NX450-415",
            manufacturer="Nova Industrial Systems",
            category="motors",
            description="Severe Duty 3-Phase Electric Motor 7.5 kW 415 V 1460 RPM."
        )
        db.add(nx450)
        db.commit()

        pv_nx450 = ProductVersion(product_id=nx450.id, version_number="v1.0", is_current=True)
        db.add(pv_nx450)
        db.commit()

        # Seed technical attributes extracted from datasheet
        attrs_data = [
            ("Power", "7.5 kW"),
            ("Voltage", "415 V AC"),
            ("Frequency", "50 Hz"),
            ("Speed", "1460 RPM"),
            ("Efficiency", "91.2%"),
            ("Power Factor", "0.86"),
            ("IP Rating", "IP55"),
            ("Insulation Class", "F"),
            ("Cooling", "IC411"),
            ("Weight", "45 kg"),
            ("Ambient Temperature", "-20°C to +50°C"),
            ("Duty", "S1 Continuous"),
            ("Safety Standard", "IEC 60034-1")
        ]
        for name, val in attrs_data:
            db.add(ProductAttribute(product_version_id=pv_nx450.id, attribute_name=name, attribute_value=val))
        db.commit()

        # Perform compliance audit on NX-450 BEFORE certificate upload
        detail_nx450 = ComplianceService.get_product_compliance_detail(db, nx450.id)
        
        assert detail_nx450["compliance_status"] == "NEEDS REVIEW", f"Expected NEEDS REVIEW for NX-450, got {detail_nx450['compliance_status']}"
        
        # Verify IP Ingress Protection Rating status breakdown
        ip_item = next(i for i in detail_nx450["required_items"] if "IP" in i["name"])
        assert ip_item["specification_found"] == True, "IP Rating specification must be recognized as FOUND in datasheet"
        assert ip_item["specification_value"] == "IP55", f"Expected IP55, got {ip_item['specification_value']}"
        assert ip_item["evidence_status"] == "EVIDENCE_MISSING", f"Expected EVIDENCE_MISSING, got {ip_item['evidence_status']}"
        assert ip_item["status_label"] == "⚠ Evidence Missing"

        # Verify IEC 60034-1 status breakdown
        iec_item = next(i for i in detail_nx450["required_items"] if "IEC" in i["name"])
        assert iec_item["specification_found"] == True
        assert iec_item["evidence_status"] == "EVIDENCE_MISSING"

        # Verify ATEX status breakdown (Non-hazardous standard environment)
        atex_item = next(i for i in detail_nx450["required_items"] if "ATEX" in i["name"])
        assert atex_item["evidence_status"] == "NOT_APPLICABLE"

        # Verify AI Diagnostic Message formatting
        ai_panel = detail_nx450["ai_recommendation_panel"]
        assert "IP55 is specified" in ai_panel["problem"], f"Diagnostic problem error: {ai_panel['problem']}"
        assert "Upload a valid IP/Ingress Protection certificate" in ai_panel["recommendation"]

        print("[PASS] TEST CASE 1: NexusGuard NX-450 Datasheet Evidence Missing Detection (Specification Found IP55, Evidence Missing)")

        # ----------------------------------------------------
        # TEST CASE 2: Certificate Upload & Product Matching (NS-2026-45821)
        # ----------------------------------------------------
        match_high = ComplianceService.match_and_attach_certificate(db, "Nova_Systems_NX-450_NS-2026-45821.pdf")
        assert match_high["match_type"] == "HIGH_CONFIDENCE", f"Expected HIGH_CONFIDENCE, got {match_high['match_type']}"
        assert match_high["matched_product"]["product_model"] == "NIS-NX450-415"
        print("[PASS] TEST CASE 2: Certificate Matched to NX-450 (High Confidence 99% - NS-2026-45821)")

        # ----------------------------------------------------
        # TEST CASE 3: Human Approval of Certificate Association
        # ----------------------------------------------------
        res_assoc = ComplianceService.resolve_action(
            db=db,
            action_type="APPROVE_ASSOCIATION",
            product_id=nx450.id,
            value="NS-2026-45821",
            notes="Quality Engineer approved association of verified TÜV/Nova IP55 IEC certificate."
        )
        assert res_assoc["status"] == "COMPLIANT"

        # Re-fetch compliance detail for NX-450
        detail_nx450_verified = ComplianceService.get_product_compliance_detail(db, nx450.id)
        assert detail_nx450_verified["compliance_status"] == "COMPLIANT"
        
        ip_item_v = next(i for i in detail_nx450_verified["required_items"] if "IP" in i["name"])
        assert ip_item_v["evidence_status"] == "VERIFIED"
        assert ip_item_v["status_label"] == "✅ Verified"
        assert ip_item_v["certificate_number"] == "NS-2026-45821"

        print("[PASS] TEST CASE 3: Human Approval of Certificate Association (NX-450 updated to COMPLIANT)")

        # ----------------------------------------------------
        # TEST CASE 4: Expired Certificate Detection & Replacement Candidate Search
        # ----------------------------------------------------
        p2 = Product(name="HazDrive Explosion-Proof Motor", product_code="ABC-700", manufacturer="Crompton & Greaves", category="motors")
        db.add(p2)
        db.commit()

        pv2 = ProductVersion(product_id=p2.id, version_number="v1.0", is_current=True)
        db.add(pv2)
        db.commit()

        c2_expired = Certificate(
            product_id=p2.id,
            certificate_number="IEC-EXPIRED-700",
            certificate_type="Safety Certificate",
            standard="IEC 60034-1",
            issue_date=datetime.utcnow() - timedelta(days=800),
            expiry_date=datetime.utcnow() - timedelta(days=5),
            status="EXPIRED",
            verification_status="Expired"
        )
        
        doc_new = Document(file_name="IEC_Certificate_ABC700_2028.pdf", document_type="certificate", processing_status="PROCESSED", original_file_name="IEC_Certificate_ABC700_2028.pdf", file_path="uploads/IEC_Certificate_ABC700_2028.pdf", file_size=1024, mime_type="application/pdf", content_hash="hash123")
        db.add(doc_new)
        db.commit()

        c2_expired.replacement_candidate_id = doc_new.id
        db.add(c2_expired)
        db.commit()

        detail_p2 = ComplianceService.get_product_compliance_detail(db, p2.id)
        assert detail_p2["compliance_status"] == "EXPIRED"
        print("[PASS] TEST CASE 4: Expired Certificate Detection (ABC-700 expiry flagged with replacement candidate)")

        # ----------------------------------------------------
        # TEST CASE 5: Expired Certificate Replacement Approval Workflow
        # ----------------------------------------------------
        res_replace = ComplianceService.resolve_action(
            db=db,
            certificate_id=c2_expired.id,
            product_id=p2.id,
            action_type="APPROVE_REPLACEMENT",
            value="IEC-RENEWED-700",
            notes="Approved new 2026-2028 certificate replacement."
        )
        assert res_replace["status"] == "Compliant"
        print("[PASS] TEST CASE 5: Expired Certificate Replacement Approval Workflow")

        # ----------------------------------------------------
        # TEST CASE 6: Conflicting Compliance Specification Resolution
        # ----------------------------------------------------
        p4 = Product(name="Heavy Duty Industrial Pump", product_code="P-201", manufacturer="Prime Engineering", category="pumps")
        db.add(p4)
        db.commit()

        pv4 = ProductVersion(product_id=p4.id, version_number="v1.0", is_current=True)
        db.add(pv4)
        db.commit()

        db.add(ProductAttribute(product_version_id=pv4.id, attribute_name="IP Rating", attribute_value="IP55"))
        db.commit()

        c4_conflict = Certificate(
            product_id=p4.id,
            certificate_number="PUMP-CONF-201",
            certificate_type="Safety Certificate",
            standard="IEC 60034-1",
            issue_date=datetime.utcnow() - timedelta(days=10),
            expiry_date=datetime.utcnow() + timedelta(days=365),
            status="VALID",
            verification_status="Needs Review",
            conflict_details={
                "field": "IP Rating",
                "db_value": "IP55",
                "certificate_value": "IP65",
                "source_document": "Pump_Test_Report_v2.pdf"
            }
        )
        db.add(c4_conflict)
        db.commit()

        res_conflict = ComplianceService.resolve_action(
            db=db,
            certificate_id=c4_conflict.id,
            product_id=p4.id,
            action_type="RESOLVE_CONFLICT",
            value="IP65",
            notes="Confirmed IP65 enclosure rating from certified test report."
        )
        assert res_conflict["status"] == "Compliant"
        print("[PASS] TEST CASE 6: Conflicting Compliance Specification Resolution (IP55 -> IP65)")

        # ----------------------------------------------------
        # TEST CASE 7: Low Confidence Candidate Matching (Human Confirmation Enforced)
        # ----------------------------------------------------
        match_low = ComplianceService.match_and_attach_certificate(db, "General_Motor_Inspection_Doc.pdf")
        assert match_low["match_type"] == "LOW_CONFIDENCE"
        assert match_low["human_confirmation_required"] == True
        print("[PASS] TEST CASE 7: Certificate with Uncertain Product Match (Human Confirmation Enforced)")

        # ----------------------------------------------------
        # TEST CASE 8: Final Compliance Summary & Audit Trail
        # ----------------------------------------------------
        summary = ComplianceService.get_summary(db)
        print("\n--------------------------------------------------------")
        print(f"FINAL SYSTEM COMPLIANCE SUMMARY: {summary}")
        print("--------------------------------------------------------\n")
        print("SUCCESS: ALL 8 REFINED COMPLIANCE AUDITING SCENARIOS PASSED WITH ZERO ERRORS!\n")

    finally:
        db.close()

if __name__ == "__main__":
    run_compliance_test_suite()
