import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from app.db.database import SessionLocal
from app.services.quote_service import QuoteService
from app.schemas.quote import QuoteMatchRequest

db = SessionLocal()

print("=" * 80)
print("TEST 1: QUOTATION GROUNDED IN DATASHEET A (technical_spec_2026.pdf - Doc ID #1)")
print("=" * 80)

req_a = QuoteMatchRequest(
    requirementText="Customer needs 20 industrial motors, 7.5 kW, 415 V, IP55, 1460 RPM delivery in 7 days to Pune plant",
    company="Premier Manufacturing Corp",
    referenceNumber="RFQ-2026-TEST-A",
    document_id=1
)

result_a = QuoteService.match_requirements_and_generate_quote(db, req_a)

print(f"Success       : {result_a.success}")
print(f"Match Status  : {result_a.matchStatus}")
print(f"Source Doc    : {result_a.productMatch['source_document'] if result_a.productMatch else 'None'}")
print(f"Doc ID        : {result_a.productMatch.get('document_id') if result_a.productMatch else 'None'}")
print(f"Grounded Specs: {result_a.productMatch.get('specs') if result_a.productMatch else 'None'}")
print("Evidence Matrix:")
for ev in result_a.specEvidence:
    print(f"  - [{ev.parameter}]: Req='{ev.required_value}' vs Datasheet='{ev.datasheet_value}' -> Matched={ev.matched} (Doc: {ev.source_document})")

assert result_a.success == True
assert result_a.matchStatus == "Exact Match"
assert result_a.productMatch['source_document'] == "technical_spec_2026.pdf"
assert any("7.5" in ev.datasheet_value for ev in result_a.specEvidence if "Power" in ev.parameter)

print("\n" + "=" * 80)
print("TEST 2: QUOTATION GROUNDED IN HISTORICAL DATASHEET B (motor_old.pdf - Doc ID #2)")
print("=" * 80)

req_b = QuoteMatchRequest(
    requirementText="Customer needs 20 industrial motors, 7.5 kW, 415 V, IP55, 1460 RPM delivery in 7 days to Pune plant",
    company="Premier Manufacturing Corp",
    referenceNumber="RFQ-2026-TEST-B",
    document_id=2
)

result_b = QuoteService.match_requirements_and_generate_quote(db, req_b)

print(f"Success       : {result_b.success}")
print(f"Match Status  : {result_b.matchStatus}")
print(f"Source Doc    : {result_b.productMatch['source_document'] if result_b.productMatch else 'None'}")
print(f"Doc ID        : {result_b.productMatch.get('document_id') if result_b.productMatch else 'None'}")
print(f"Grounded Specs: {result_b.productMatch.get('specs') if result_b.productMatch else 'None'}")
print("Evidence Matrix:")
for ev in result_b.specEvidence:
    print(f"  - [{ev.parameter}]: Req='{ev.required_value}' vs Datasheet='{ev.datasheet_value}' -> Matched={ev.matched} (Diff: {ev.difference_note}) (Doc: {ev.source_document})")

assert result_b.success == True
assert result_b.matchStatus != "Exact Match" # Because motor_old.pdf is 5.5 kW!
assert result_b.productMatch['source_document'] == "motor_old.pdf"
power_ev = next(ev for ev in result_b.specEvidence if "Power" in ev.parameter)
assert power_ev.matched == False
assert "5.5" in power_ev.datasheet_value

print("\n" + "=" * 80)
print("TEST 3: NON-EXISTENT DATASHEET ID (NO BROAD FALLBACK)")
print("=" * 80)

req_c = QuoteMatchRequest(
    requirementText="Customer needs 20 industrial motors, 7.5 kW, 415 V, IP55, 1460 RPM delivery in 7 days to Pune plant",
    company="Premier Manufacturing Corp",
    referenceNumber="RFQ-2026-TEST-C",
    document_id=9999
)

result_c = QuoteService.match_requirements_and_generate_quote(db, req_c)

print(f"Success       : {result_c.success}")
print(f"Match Status  : {result_c.matchStatus}")
print(f"Warnings      : {result_c.warnings}")

assert result_c.success == False
assert "Unable to generate quotation because the selected product/datasheet could not be verified." in result_c.warnings

print("\n" + "=" * 80)
print("ALL VERIFICATIONS PASSED SUCCESSFULLY!")
print("=" * 80)

db.close()
