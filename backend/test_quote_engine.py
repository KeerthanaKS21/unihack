import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
from app.db.database import SessionLocal
from app.services.quote_service import QuoteService
from app.schemas.quote import QuoteMatchRequest, QuoteSimulateRevisionRequest

db = SessionLocal()

print("=" * 60)
print("VeriSpec AI - Quote Generation & Sourcing Engine Test")
print("=" * 60)

prompt = "Need 25 units of 7.5 kW 415V IP55 motors with 1460 RPM delivered in 8 days to Pune plant"
print(f"Customer Input: \"{prompt}\"")
print("-" * 60)

req = QuoteMatchRequest(
    requirementText=prompt,
    company="MegaCorp Heavy Industries",
    referenceNumber="RFQ-2026-009"
)

result = QuoteService.match_requirements_and_generate_quote(db, req)

print(f"Engine Status: {result.matchStatus}")
print(f"Parsed Target: {result.parsedSpecs.quantity} units of {result.parsedSpecs.product} | Power: {result.parsedSpecs.power} | Voltage: {result.parsedSpecs.voltage} | SLA: <={result.parsedSpecs.deliveryDays} days")
print(f"Matched Product: {result.productMatch['name']} ({result.productMatch['product_code']}) [Source: {result.productMatch['source_document']}]")

if result.supplierOffer:
    print(f"\nBest Supplier Offer:")
    print(f"  Supplier: {result.supplierOffer.supplierName}")
    print(f"  Unit Price: INR {result.supplierOffer.priceINR:,.2f}")
    print(f"  Lead Time: {result.supplierOffer.deliveryDays} business days")
    print(f"  Stock Available: {result.supplierOffer.stockQuantity} units")
    print(f"  Exact Match: {result.supplierOffer.isExactMatch}")

if result.quoteData:
    print(f"\nCommercial Cost Breakdown:")
    print(f"  Quote Number : {result.quoteData['quoteNumber']}")
    print(f"  Subtotal     : INR {result.quoteData['subtotal']:,.2f}")
    print(f"  GST (18%)    : INR {result.quoteData['tax']:,.2f}")
    print(f"  Freight      : INR {result.quoteData['freight']:,.2f}")
    print(f"  Grand Total  : INR {result.quoteData['total']:,.2f}")

print(f"\nGrounding & Datasheet Verification Matrix:")
for ev in result.specEvidence:
    status = "PASS" if ev.matched else "DIFF"
    print(f"  [{status}] {ev.parameter:30} : Req='{ev.required_value}' vs Datasheet='{ev.datasheet_value}' (Doc: {ev.source_document}, Page {ev.source_page})")

print(f"\nEngine Audit Logs:")
for log in result.processLogs:
    print(f"  {log}")

# Test Revision Simulation
print("\n" + "=" * 60)
print("Testing Quote Revision Simulation Engine")
print("=" * 60)
sim_req = QuoteSimulateRevisionRequest(
    productModel="XYZ-450",
    supplierName="Bharat Electric",
    originalQuantity=25,
    newQuantity=150, # High quantity to test warehouse stock limits
    originalDeliveryDays=8,
    newDeliveryDays=4, # Very short lead time
    unitPrice=38500.0
)
sim_res = QuoteService.simulate_revision(db, sim_req)
print(f"Simulation Result (150 qty, 4 days SLA):")
print(f"  Supported: {sim_res.supported}")
print(f"  Status   : {sim_res.status}")
print(f"  Message  : {sim_res.message}")
if sim_res.alternativeOffer:
    print(f"  Alternative Supplier with stock: {sim_res.alternativeOffer.supplierName} (Stock: {sim_res.alternativeOffer.stockQuantity})")

db.close()
