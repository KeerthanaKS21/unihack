import sys
import os
import asyncio
from io import BytesIO
from fastapi import UploadFile

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from app.db.database import SessionLocal
from app.services.document_service import DocumentService
from app.services.quote_service import QuoteService
from app.schemas.quote import QuoteMatchRequest
from app.db.models.document import Document
from app.db.models.product import Product

db = SessionLocal()

print("=" * 80)
print("STARTING FULL END-TO-END TEST: UPLOAD & INGEST -> RFQ DATASHEET CONNECTION")
print("=" * 80)

# STEP 1: Check existing seeded documents
print("\n[STEP 1] Inspecting initial database documents...")
docs, total = DocumentService.get_documents(db=db, limit=10)
print(f"Total existing documents in DB: {total}")
for d in docs:
    print(f"  - Doc #{d.id}: '{d.original_file_name}' (type={d.document_type}, version={d.version_detected})")

# STEP 2: Create a synthetic but real PDF file for Upload & Ingest testing
# We create a simple valid PDF using PyMuPDF (fitz) or reportlab
print("\n[STEP 2] Creating a new real PDF datasheet 'new_motor_datasheet.pdf' with Power = 11.0 kW...")
import fitz

doc_pdf = fitz.open()
page = doc_pdf.new_page()
pdf_text = """
SIEMENS INDUSTRIAL MOTORS - OFFICIAL DATASHEET
Model: XYZ-450-11KW
Manufacturer: Siemens
Product Series: Severe-Duty Induction Motors

TECHNICAL SPECIFICATIONS:
Rated Power: 11.0 kW (15.0 HP)
Rated Voltage: 415 V 3-Phase
Synchronous Speed: 1460 RPM
Protection Degree: IP55
Full Load Efficiency: 93.0%
Unit Weight: 62 kg
Mounting: Foot Mounted B3
Standard: IEC 60034-1
"""
page.insert_text((50, 72), pdf_text, fontsize=11)
pdf_bytes = doc_pdf.tobytes()
doc_pdf.close()

# Wrap as FastAPI UploadFile
upload_file = UploadFile(
    filename="new_motor_datasheet.pdf",
    file=BytesIO(pdf_bytes),
    headers={"content-type": "application/pdf"}
)

# STEP 3: Execute Document Upload through the real DocumentService pipeline
print("\n[STEP 3] Uploading 'new_motor_datasheet.pdf' via DocumentService.upload_document...")
upload_res = asyncio.run(
    DocumentService.upload_document(
        db=db,
        file=upload_file,
        uploaded_by="Lead Systems Engineer"
    )
)

print(f"✓ Upload succeeded!")
print(f"  - Generated Doc ID  : #{upload_res.id}")
print(f"  - Stored File Name  : {upload_res.file_name}")
print(f"  - Original File Name: {upload_res.original_file_name}")
print(f"  - Detected Type     : {upload_res.document_type}")
print(f"  - File Size         : {upload_res.file_size_formatted}")

# STEP 4: Verify document retrieval API returns the newly uploaded document at index 0 (top)
print("\n[STEP 4] Verifying Document Retrieval API ordering...")
refreshed_docs, total_after = DocumentService.get_documents(db=db, limit=10)
print(f"Total documents after upload: {total_after}")
newest_doc = refreshed_docs[0]
print(f"Top Document in Dropdown Query: Doc #{newest_doc.id} - '{newest_doc.original_file_name}' (version: {newest_doc.version_detected})")

assert newest_doc.id == upload_res.id, f"Expected top document to be #{upload_res.id}, got #{newest_doc.id}"
assert newest_doc.original_file_name == "new_motor_datasheet.pdf"

# STEP 5: Generate Quote Grounded on the NEWLY UPLOADED DATASHEET (Doc ID #upload_res.id)
print(f"\n[STEP 5] Generating RFQ Quotation strictly using NEW Datasheet (Doc ID #{upload_res.id})...")
req_new = QuoteMatchRequest(
    requirementText="Customer needs 20 industrial motors, 11.0 kW, 415 V, IP55, 1460 RPM delivery in 7 days to Pune plant",
    company="Premier Manufacturing Corp",
    referenceNumber="RFQ-2026-NEW-DATASHEET",
    document_id=upload_res.id
)

result_new = QuoteService.match_requirements_and_generate_quote(db, req_new)

print(f"Success       : {result_new.success}")
print(f"Match Status  : {result_new.matchStatus}")
print(f"Source Doc    : {result_new.productMatch['source_document'] if result_new.productMatch else 'None'}")
print(f"Doc ID        : {result_new.productMatch.get('document_id') if result_new.productMatch else 'None'}")
print(f"Grounded Specs: {result_new.productMatch.get('specs') if result_new.productMatch else 'None'}")
print("Evidence Matrix:")
for ev in result_new.specEvidence:
    print(f"  - [{ev.parameter}]: Req='{ev.required_value}' vs Datasheet='{ev.datasheet_value}' -> Matched={ev.matched} (Doc: {ev.source_document})")

# Assertions for New Datasheet Grounding
assert result_new.success == True
assert result_new.productMatch['document_id'] == upload_res.id
assert result_new.productMatch['source_document'] == "new_motor_datasheet.pdf"
pwr_ev_new = next(ev for ev in result_new.specEvidence if "Power" in ev.parameter)
assert "11" in pwr_ev_new.datasheet_value, f"Expected 11.0 kW from new datasheet, got '{pwr_ev_new.datasheet_value}'"
assert pwr_ev_new.matched == True

# STEP 6: Verify Historical Doc #2 (motor_old.pdf) remains isolated and is NOT contaminated by new upload
print(f"\n[STEP 6] Verifying Historical Datasheet (motor_old.pdf - Doc ID #2) remains isolated...")
req_old = QuoteMatchRequest(
    requirementText="Customer needs 20 industrial motors, 11.0 kW, 415 V, IP55, 1460 RPM delivery in 7 days to Pune plant",
    company="Premier Manufacturing Corp",
    referenceNumber="RFQ-2026-OLD-DATASHEET",
    document_id=2
)

result_old = QuoteService.match_requirements_and_generate_quote(db, req_old)
print(f"Success       : {result_old.success}")
print(f"Match Status  : {result_old.matchStatus}")
print(f"Source Doc    : {result_old.productMatch['source_document'] if result_old.productMatch else 'None'}")
pwr_ev_old = next(ev for ev in result_old.specEvidence if "Power" in ev.parameter)
print(f"Grounded Power: '{pwr_ev_old.datasheet_value}' (Matched: {pwr_ev_old.matched})")

assert result_old.productMatch['source_document'] == "motor_old.pdf"
assert "5.5" in pwr_ev_old.datasheet_value, f"Expected 5.5 kW from motor_old.pdf, got '{pwr_ev_old.datasheet_value}'"
assert pwr_ev_old.matched == False # Because 11.0 kW required != 5.5 kW available in motor_old.pdf

# STEP 7: Verify Historical Doc #1 (technical_spec_2026.pdf) remains isolated
print(f"\n[STEP 7] Verifying Historical Datasheet (technical_spec_2026.pdf - Doc ID #1) remains isolated...")
req_doc1 = QuoteMatchRequest(
    requirementText="Customer needs 20 industrial motors, 7.5 kW, 415 V, IP55, 1460 RPM delivery in 7 days to Pune plant",
    company="Premier Manufacturing Corp",
    referenceNumber="RFQ-2026-DOC1-TEST",
    document_id=1
)

result_doc1 = QuoteService.match_requirements_and_generate_quote(db, req_doc1)
assert result_doc1.productMatch['source_document'] == "technical_spec_2026.pdf"
pwr_ev_doc1 = next(ev for ev in result_doc1.specEvidence if "Power" in ev.parameter)
assert "7.5" in pwr_ev_doc1.datasheet_value
assert pwr_ev_doc1.matched == True

print("\n" + "=" * 80)
print("ALL END-TO-END VERIFICATION STEPS PASSED PERFECTLY!")
print("=" * 80)

db.close()
