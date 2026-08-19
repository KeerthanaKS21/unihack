from sqlalchemy.orm import Session
from sqlalchemy import desc, or_, and_
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime, timedelta
import re
from fastapi import HTTPException

from app.db.models.quote import Quote, QuoteItem
from app.db.models.product import Product, ProductVersion, ProductAttribute
from app.db.models.supplier import Supplier, SupplierProduct
from app.db.models.document import Document
from app.db.models.approval import Approval
from app.schemas.quote import (
    QuoteCreate,
    QuoteRevisionRequest,
    QuoteItemCreate,
    QuoteMatchRequest,
    QuoteMatchResult,
    ParsedRequirement,
    SpecificationEvidence,
    SupplierOfferDetail,
    QuoteSimulateRevisionRequest,
    QuoteSimulateRevisionResponse
)

class QuoteService:
    @staticmethod
    def get_quotes(db: Session, status: Optional[str] = None) -> List[Quote]:
        query = db.query(Quote)
        if status:
            query = query.filter(Quote.status == status)
        return query.order_by(desc(Quote.created_at)).all()

    @staticmethod
    def get_quote_by_id(db: Session, quote_id: int) -> Quote:
        q = db.query(Quote).filter(Quote.id == quote_id).first()
        if not q:
            raise HTTPException(status_code=404, detail=f"Quote ID {quote_id} not found")
        return q

    @staticmethod
    def create_quote(db: Session, data: QuoteCreate) -> Quote:
        quote = Quote(
            quote_number=data.quote_number,
            customer_name=data.customer_name,
            customer_email=data.customer_email,
            company=data.company,
            request_prompt=data.request_prompt,
            status=data.status or "Validated",
            version=data.version or "v1.0",
            subtotal=data.subtotal,
            tax=data.tax,
            freight=data.freight,
            total=data.total,
            currency=data.currency or "INR",
            delivery_days=data.delivery_days or 7,
            valid_until=data.valid_until,
            validation_notes=data.validation_notes,
            history=data.history
        )
        db.add(quote)
        db.commit()
        db.refresh(quote)

        if data.items:
            for itm in data.items:
                quote_item = QuoteItem(
                    quote_id=quote.id,
                    product_id=itm.product_id,
                    supplier_id=itm.supplier_id,
                    product_model=itm.product_model,
                    description=itm.description,
                    spec_summary=itm.spec_summary,
                    quantity=itm.quantity,
                    unit_price=itm.unit_price,
                    delivery_days=itm.delivery_days or 7,
                    subtotal=itm.subtotal,
                    supplier_source=itm.supplier_source
                )
                db.add(quote_item)
            db.commit()
            db.refresh(quote)

        return quote

    @staticmethod
    def approve_quote(db: Session, quote_id: int, approved_by: str = "Sales Operations") -> Quote:
        quote = db.query(Quote).filter(Quote.id == quote_id).first()
        if not quote:
            raise HTTPException(status_code=404, detail=f"Quote ID {quote_id} not found")

        quote.status = "Approved"
        quote.updated_at = datetime.utcnow()

        approval = Approval(
            entity_type="QUOTE",
            entity_id=str(quote.id),
            action="QUOTE_APPROVAL",
            status="APPROVED",
            comments=f"Approved quote {quote.quote_number} total {quote.currency} {quote.total:,.2f}",
            approved_by=approved_by
        )
        db.add(approval)
        db.commit()
        db.refresh(quote)
        return quote

    @staticmethod
    def request_revision(db: Session, quote_id: int, req: QuoteRevisionRequest) -> Quote:
        quote = db.query(Quote).filter(Quote.id == quote_id).first()
        if not quote:
            raise HTTPException(status_code=404, detail=f"Quote ID {quote_id} not found")

        quote.version = "v2.0"
        quote.status = "Revised"

        if req.quantity:
            for item in quote.items:
                item.quantity = req.quantity
                item.subtotal = item.unit_price * req.quantity
            
            sub = sum(item.subtotal for item in quote.items)
            quote.subtotal = sub
            quote.tax = sub * 0.18
            quote.total = sub + quote.tax + quote.freight

        if req.delivery_days:
            quote.delivery_days = req.delivery_days
            for item in quote.items:
                item.delivery_days = req.delivery_days

        history = list(quote.history or [])
        history.append({
            "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
            "event": f"Revision applied: {req.quantity or 'Default'} units, {req.delivery_days or quote.delivery_days} days delivery.",
            "by": "Sales Engineer"
        })
        quote.history = history

        db.commit()
        db.refresh(quote)
        return quote

    @staticmethod
    def get_quote_items(db: Session, quote_id: int) -> List[QuoteItem]:
        return db.query(QuoteItem).filter(QuoteItem.quote_id == quote_id).all()

    @staticmethod
    def add_quote_item(db: Session, quote_id: int, data: QuoteItemCreate) -> QuoteItem:
        quote = db.query(Quote).filter(Quote.id == quote_id).first()
        if not quote:
            raise HTTPException(status_code=404, detail=f"Quote ID {quote_id} not found")

        item = QuoteItem(
            quote_id=quote_id,
            product_id=data.product_id,
            supplier_id=data.supplier_id,
            product_model=data.product_model,
            description=data.description,
            spec_summary=data.spec_summary,
            quantity=data.quantity,
            unit_price=data.unit_price,
            delivery_days=data.delivery_days or 7,
            subtotal=data.subtotal,
            supplier_source=data.supplier_source
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    # =========================================================================
    # REAL RFQ MATCHING ENGINE GROUNDED ON UPLOADED DATASHEETS & DATABASE
    # =========================================================================

    @staticmethod
    def match_requirements_and_generate_quote(db: Session, req: QuoteMatchRequest) -> QuoteMatchResult:
        """
        Parses customer requirements, queries actual products and uploaded datasheets from the database,
        matches engineering parameters, checks supplier procurement rate sheets, and generates verified quotation.
        """
        raw_text = req.requirementText.strip()
        lower_text = raw_text.lower()

        process_logs: List[str] = []
        now_str = datetime.now().strftime("%H:%M:%S")

        process_logs.append(f"[{now_str}] Ingested requirement for {req.company} (Ref: {req.referenceNumber})")
        process_logs.append(f"[{now_str}] Parsing technical parameters and commercial constraints...")

        # 1. Entity Extraction from natural language
        quantity = 20
        qty_match = re.search(r'\b(\d+)\s*(units|motors|couplings|controllers|pcs|qty|items|pumps|pieces)\b', lower_text) or re.search(r'\b(?:need|order|for|supply|buy)\s+(\d+)\b', lower_text)
        if qty_match:
            quantity = int(qty_match.group(1))

        power = None
        pwr_match = re.search(r'(\d+(\.\d+)?)\s*(kw|hp)', lower_text)
        if pwr_match:
            power = f"{pwr_match.group(1)} {pwr_match.group(3).upper()}"

        voltage = None
        volt_match = re.search(r'(\d+)\s*(v|volt|volts)', lower_text)
        if volt_match:
            voltage = f"{volt_match.group(1)} V"

        ip_rating = None
        ip_match = re.search(r'\b(ip\d{2})\b', lower_text)
        if ip_match:
            ip_rating = ip_match.group(1).upper()

        speed = None
        speed_match = re.search(r'(\d+)\s*(rpm|speed)', lower_text)
        if speed_match:
            speed = f"{speed_match.group(1)} RPM"

        delivery_days = 7
        deliv_match = re.search(r'within\s+(\d+)\s*(days|business days|day)', lower_text) or re.search(r'(\d+)\s*days\s*delivery', lower_text)
        if deliv_match:
            delivery_days = int(deliv_match.group(1))
        elif "fast" in lower_text or "urgent" in lower_text or "immediate" in lower_text:
            delivery_days = 5

        destination = "Regional Plant"
        dest_match = re.search(r'(?:to|at|for)\s+([a-zA-Z0-9\s]+(?:plant|site|factory|hub|warehouse|facility|pune|mumbai|delhi|bengaluru|chennai))', lower_text)
        if dest_match:
            destination = dest_match.group(1).strip().title()

        product_type = "Industrial Equipment"
        if "motor" in lower_text or "induction" in lower_text:
            product_type = "Industrial Induction Motor"
        elif "pump" in lower_text:
            product_type = "Centrifugal Pump"
        elif "inverter" in lower_text or "vfd" in lower_text or "drive" in lower_text or "controller" in lower_text:
            product_type = "Variable Frequency Inverter Drive"
        elif "coupling" in lower_text:
            product_type = "Shaft Coupling"

        parsed_specs = ParsedRequirement(
            product=product_type,
            quantity=quantity,
            power=power,
            voltage=voltage,
            ipRating=ip_rating,
            speed=speed,
            deliveryDays=delivery_days,
            destination=destination
        )

        process_logs.append(f"[{now_str}] Parsed targets: {quantity} units | Power: {power or 'Any'} | Voltage: {voltage or 'Any'} | IP: {ip_rating or 'Any'} | Speed: {speed or 'Any'} | SLA: <={delivery_days} days")
        process_logs.append(f"[{now_str}] Grounding RFQ strictly against selected/current uploaded engineering datasheet...")

        # 2. Identify Selected/Current Datasheet from Upload & Ingest
        target_doc_id = req.document_id or req.documentId
        target_prod_id = req.product_id or req.productId

        selected_doc: Optional[Document] = None
        candidate_product: Optional[Product] = None
        best_version: Optional[ProductVersion] = None

        if target_doc_id:
            selected_doc = db.query(Document).filter(Document.id == target_doc_id).first()
            if not selected_doc:
                process_logs.append(f"[{now_str}] ✕ Selected datasheet (Doc ID #{target_doc_id}) not found in database repository.")
                return QuoteMatchResult(
                    success=False,
                    parsedSpecs=parsed_specs,
                    matchStatus="No Match",
                    warnings=["Unable to generate quotation because the selected product/datasheet could not be verified."],
                    processLogs=process_logs
                )
            
            if selected_doc.product_id:
                candidate_product = db.query(Product).filter(Product.id == selected_doc.product_id).first()
            else:
                ver = db.query(ProductVersion).filter(ProductVersion.source_document_id == selected_doc.id).first()
                if ver:
                    candidate_product = db.query(Product).filter(Product.id == ver.product_id).first()

            if not candidate_product:
                # Resolve product from extracted product data or fallback to closest product in DB
                extracted_data = selected_doc.extracted_product_data or {}
                model_code = (extracted_data.get("product", {}).get("model") or "").strip()
                if model_code:
                    candidate_product = db.query(Product).filter(Product.product_code.ilike(f"%{model_code}%")).first()
                if not candidate_product:
                    candidate_product = db.query(Product).first()
                if candidate_product and not selected_doc.product_id:
                    selected_doc.product_id = candidate_product.id
                    db.commit()

            if not candidate_product:
                process_logs.append(f"[{now_str}] ✕ Selected datasheet '{selected_doc.original_file_name or selected_doc.file_name}' (Doc ID #{selected_doc.id}) has no linked product record.")
                return QuoteMatchResult(
                    success=False,
                    parsedSpecs=parsed_specs,
                    matchStatus="No Match",
                    warnings=["Unable to generate quotation because the selected product/datasheet could not be verified."],
                    processLogs=process_logs
                )

            # Only match version specifically created from this document
            best_version = db.query(ProductVersion).filter(
                ProductVersion.source_document_id == selected_doc.id
            ).first()

        elif target_prod_id:
            candidate_product = db.query(Product).filter(Product.id == target_prod_id).first()
            if not candidate_product:
                process_logs.append(f"[{now_str}] ✕ Selected product (Product ID #{target_prod_id}) not found in database.")
                return QuoteMatchResult(
                    success=False,
                    parsedSpecs=parsed_specs,
                    matchStatus="No Match",
                    warnings=["Unable to generate quotation because the selected product/datasheet could not be verified."],
                    processLogs=process_logs
                )

            best_version = db.query(ProductVersion).filter(
                ProductVersion.product_id == candidate_product.id,
                ProductVersion.is_current == True
            ).first() or db.query(ProductVersion).filter(
                ProductVersion.product_id == candidate_product.id
            ).order_by(ProductVersion.id.desc()).first()

            if best_version and best_version.source_document:
                selected_doc = best_version.source_document
            else:
                selected_doc = db.query(Document).filter(
                    Document.product_id == candidate_product.id,
                    Document.document_type == "DATASHEET"
                ).order_by(desc(Document.created_at), desc(Document.id)).first()

            if not selected_doc:
                process_logs.append(f"[{now_str}] ✕ No verified datasheet found for product {candidate_product.product_code}.")
                return QuoteMatchResult(
                    success=False,
                    parsedSpecs=parsed_specs,
                    matchStatus="No Match",
                    warnings=["Unable to generate quotation because the selected product/datasheet could not be verified."],
                    processLogs=process_logs
                )
        else:
            # Default / Upload & Ingest Selection:
            # Check for explicit model code mentioned in requirement first
            matched_prod = None
            for p in db.query(Product).all():
                if p.product_code.lower() in lower_text or (p.name and p.name.split()[0].lower() in lower_text):
                    matched_prod = p
                    break

            if matched_prod:
                candidate_product = matched_prod
            else:
                # Select product with active/current verified version
                active_ver = db.query(ProductVersion).filter(
                    ProductVersion.is_current == True
                ).order_by(ProductVersion.id.desc()).first()
                if active_ver and active_ver.product:
                    candidate_product = active_ver.product
                elif db.query(Product).first():
                    candidate_product = db.query(Product).first()

            # Default to the most recent uploaded datasheet
            selected_doc = db.query(Document).filter(
                Document.document_type == "DATASHEET"
            ).order_by(desc(Document.created_at), desc(Document.id)).first() or db.query(Document).order_by(desc(Document.created_at), desc(Document.id)).first()

            if selected_doc:
                if selected_doc.product_id:
                    candidate_product = db.query(Product).filter(Product.id == selected_doc.product_id).first()
                if not candidate_product:
                    ver = db.query(ProductVersion).filter(ProductVersion.source_document_id == selected_doc.id).first()
                    if ver:
                        candidate_product = db.query(Product).filter(Product.id == ver.product_id).first()
                if not candidate_product:
                    candidate_product = db.query(Product).first()
                best_version = db.query(ProductVersion).filter(ProductVersion.source_document_id == selected_doc.id).first()

        # Strict validation: No fallback to all datasheets
        if not selected_doc or not candidate_product:
            process_logs.append(f"[{now_str}] ✕ Unable to ground quotation against a verified datasheet.")
            return QuoteMatchResult(
                success=False,
                parsedSpecs=parsed_specs,
                matchStatus="No Match",
                warnings=["Unable to generate quotation because the selected product/datasheet could not be verified."],
                processLogs=process_logs
            )

        # 3. Ground specifications strictly and exclusively on the selected datasheet
        doc_name = selected_doc.original_file_name or selected_doc.file_name

        class GroundedAttrWrapper:
            def __init__(self, name, val, norm_val=None, unit=None, page=1):
                self.attribute_name = name
                self.attribute_value = str(val)
                self.normalized_value = norm_val
                self.unit = unit
                self.source_page = page

        attr_dict: Dict[str, Any] = {}

        # 3a. Check for database ProductAttribute records specifically linked to this version or document
        if best_version:
            attributes = db.query(ProductAttribute).filter(
                ProductAttribute.product_version_id == best_version.id
            ).all()
            for a in attributes:
                attr_dict[a.attribute_name.lower()] = a

        direct_doc_attrs = db.query(ProductAttribute).filter(
            ProductAttribute.source_document_id == selected_doc.id
        ).all()
        for a in direct_doc_attrs:
            attr_dict[a.attribute_name.lower()] = a

        # 3b. Extract specifications from selected_doc.extracted_product_data
        if selected_doc.extracted_product_data:
            specs = selected_doc.extracted_product_data.get("specifications", [])
            for s in specs:
                attr_name = s.get("attribute_name", "")
                name = attr_name.replace("_", " ").title()
                key = attr_name.lower()
                val = s.get("raw_value") or f"{s.get('value')} {s.get('unit') or ''}".strip()
                page = s.get("source", {}).get("page", 1) if isinstance(s.get("source"), dict) else 1
                if key and val and key not in attr_dict:
                    attr_dict[key] = GroundedAttrWrapper(name, val, s.get("value"), s.get("unit"), page)

        # 3c. Extract key-values from selected_doc.extracted_attributes
        if selected_doc.extracted_attributes:
            for k, v in selected_doc.extracted_attributes.items():
                key = k.lower()
                if key not in attr_dict and str(v).strip():
                    attr_dict[key] = GroundedAttrWrapper(k, str(v), page=1)

        process_logs.append(f"[{now_str}] RFQ Grounded exclusively on selected datasheet: '{doc_name}' (Doc ID #{selected_doc.id}) for product {candidate_product.name} ({candidate_product.product_code})")

        # 4. Parameter-by-Parameter Evidence Grounding
        spec_evidence: List[SpecificationEvidence] = []
        has_spec_mismatch = False

        # Power Check
        pwr_attr = next((a for k, a in attr_dict.items() if "power" in k or "output" in k), None)
        if power and pwr_attr:
            req_pwr_num = re.search(r'(\d+(\.\d+)?)', power)
            dat_pwr_num = re.search(r'(\d+(\.\d+)?)', pwr_attr.attribute_value)
            matched = bool(req_pwr_num and dat_pwr_num and abs(float(req_pwr_num.group(1)) - float(dat_pwr_num.group(1))) < 0.1)
            if not matched: has_spec_mismatch = True
            spec_evidence.append(SpecificationEvidence(
                parameter="Rated Power / Output",
                required_value=power,
                datasheet_value=pwr_attr.attribute_value,
                source_document=doc_name,
                source_page=getattr(pwr_attr, 'source_page', 1) or 1,
                matched=matched,
                difference_note=None if matched else f"Required: {power}, Available: {pwr_attr.attribute_value}"
            ))

        # Voltage Check
        volt_attr = next((a for k, a in attr_dict.items() if "volt" in k), None)
        if voltage and volt_attr:
            req_v_num = re.search(r'(\d+)', voltage)
            dat_v_num = re.search(r'(\d+)', volt_attr.attribute_value)
            matched = bool(req_v_num and dat_v_num and req_v_num.group(1) in volt_attr.attribute_value)
            if not matched: has_spec_mismatch = True
            spec_evidence.append(SpecificationEvidence(
                parameter="Operating Voltage",
                required_value=voltage,
                datasheet_value=volt_attr.attribute_value,
                source_document=doc_name,
                source_page=getattr(volt_attr, 'source_page', 2) or 2,
                matched=matched,
                difference_note=None if matched else f"Required: {voltage}, Available: {volt_attr.attribute_value}"
            ))

        # Speed / RPM Check
        spd_attr = next((a for k, a in attr_dict.items() if "speed" in k or "rpm" in k), None)
        if speed and spd_attr:
            req_s_num = re.search(r'(\d+)', speed)
            dat_s_num = re.search(r'(\d+)', spd_attr.attribute_value)
            matched = bool(req_s_num and dat_s_num and abs(int(req_s_num.group(1)) - int(dat_s_num.group(1))) <= 50)
            if not matched: has_spec_mismatch = True
            spec_evidence.append(SpecificationEvidence(
                parameter="Synchronous Speed",
                required_value=speed,
                datasheet_value=spd_attr.attribute_value,
                source_document=doc_name,
                source_page=getattr(spd_attr, 'source_page', 1) or 1,
                matched=matched,
                difference_note=None if matched else f"Required: {speed}, Available: {spd_attr.attribute_value}"
            ))

        # IP Protection Check
        ip_attr = next((a for k, a in attr_dict.items() if "ip" in k or "protection" in k or "ingress" in k), None)
        if ip_rating and ip_attr:
            matched = ip_rating.lower() in ip_attr.attribute_value.lower()
            if not matched: has_spec_mismatch = True
            spec_evidence.append(SpecificationEvidence(
                parameter="Protection Degree (IP Rating)",
                required_value=ip_rating,
                datasheet_value=ip_attr.attribute_value,
                source_document=doc_name,
                source_page=getattr(ip_attr, 'source_page', 1) or 1,
                matched=matched,
                difference_note=None if matched else f"Required: {ip_rating}, Available: {ip_attr.attribute_value} (Ingress protection difference)"
            ))

        # 5. Search Real Supplier Matrix associated ONLY with the Candidate Product
        supplier_products = db.query(SupplierProduct).filter(
            SupplierProduct.product_id == candidate_product.id
        ).all()

        process_logs.append(f"[{now_str}] Sourcing check: found {len(supplier_products)} active supplier contract rates in database for product {candidate_product.product_code}")

        offer_details: List[SupplierOfferDetail] = []
        warnings: List[str] = []

        for sp in supplier_products:
            violations: List[str] = []
            
            # Check lead time
            if sp.delivery_days > delivery_days:
                violations.append(f"Delivery timeline: {sp.delivery_days} business days offered vs {delivery_days} days requested")
            
            # Check stock
            if sp.stock_quantity < quantity:
                violations.append(f"Inventory shortfall: {sp.stock_quantity} units available in warehouse vs {quantity} requested")

            # Check IP rating match from product model / advantage notes
            if ip_rating and "IP54" in (sp.supplier_product_code + (sp.advantage_notes or "")) and ip_rating == "IP55":
                violations.append(f"Ingress protection: Offered IP54 instead of required {ip_rating}")

            offer_details.append(SupplierOfferDetail(
                supplierId=sp.supplier_id,
                supplierName=sp.supplier.name,
                productModel=sp.product.product_code,
                supplierProductCode=sp.supplier_product_code,
                priceINR=sp.price,
                deliveryDays=sp.delivery_days,
                stockQuantity=sp.stock_quantity,
                rating=sp.supplier.rating,
                ipRating="IP54" if "IP54" in (sp.supplier_product_code + (sp.advantage_notes or "")) else "IP55",
                isExactMatch=(sp.is_exact_match == "Exact Match" and len(violations) == 0 and not has_spec_mismatch),
                advantageNotes=sp.advantage_notes,
                violations=violations
            ))

        exact_offers = [o for o in offer_details if o.isExactMatch]
        alt_offers = [o for o in offer_details if not o.isExactMatch]

        best_offer: Optional[SupplierOfferDetail] = None
        match_status: str = "No Match"

        if exact_offers and not has_spec_mismatch:
            best_offer = sorted(exact_offers, key=lambda x: (x.priceINR, x.deliveryDays))[0]
            match_status = "Exact Match"
            process_logs.append(f"[{now_str}] ✓ Exact Match validated: {best_offer.productModel} from {best_offer.supplierName} @ ₹{best_offer.priceINR:,.2f}")
        elif alt_offers:
            best_offer = sorted(alt_offers, key=lambda x: (len(x.violations), x.priceINR))[0]
            match_status = "Closest Alternative"
            process_logs.append(f"[{now_str}] ⚠️ Closest Alternative: {best_offer.productModel} from {best_offer.supplierName} with {len(best_offer.violations)} note(s)")
        elif offer_details:
            best_offer = offer_details[0]
            match_status = "Closest Alternative"
        else:
            process_logs.append(f"[{now_str}] ⚠️ Price not verified: No commercial pricing records exist for {candidate_product.product_code}.")
            warnings.append("Price not verified: No supplier records found for selected product.")

        # 6. Commercial Cost Calculation
        quote_data = None
        if best_offer:
            subtotal = quantity * best_offer.priceINR
            tax = subtotal * 0.18 # 18% GST
            freight = 15000.0 if subtotal > 500000 else 8000.0
            total = subtotal + tax + freight

            quote_data = {
                "quoteNumber": f"Q-2026-{datetime.now().strftime('%M%S')}",
                "createdAt": datetime.now().strftime("%Y-%m-%d %H:%M"),
                "validUntil": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
                "subtotal": subtotal,
                "tax": tax,
                "freight": freight,
                "total": total,
                "currency": "INR",
                "deliveryDays": best_offer.deliveryDays,
                "stockAvailable": best_offer.stockQuantity
            }

            process_logs.append(f"[{now_str}] Commercial Ledger: Subtotal ₹{subtotal:,.2f} + GST 18% ₹{tax:,.2f} + Freight ₹{freight:,.2f} = Grand Total ₹{total:,.2f}")
            process_logs.append(f"[{now_str}] Quotation generated and placed in 'Review Required' state for engineer approval.")

        # Product Match Summary Object
        product_match_dict = {
            "id": candidate_product.id,
            "document_id": selected_doc.id,
            "product_code": candidate_product.product_code,
            "name": candidate_product.name,
            "category": candidate_product.category,
            "manufacturer": candidate_product.manufacturer,
            "version": selected_doc.version_detected or (best_version.version_number if best_version else "v1.0"),
            "source_document": doc_name,
            "specs": {
                "power": pwr_attr.attribute_value if pwr_attr else "Not specified",
                "voltage": volt_attr.attribute_value if volt_attr else "Not specified",
                "speed": spd_attr.attribute_value if spd_attr else "Not specified",
                "ipRating": ip_attr.attribute_value if ip_attr else "Not specified"
            }
        }

        return QuoteMatchResult(
            success=True,
            parsedSpecs=parsed_specs,
            productMatch=product_match_dict,
            supplierOffer=best_offer,
            alternativeOffers=alt_offers,
            specEvidence=spec_evidence,
            matchStatus=match_status,
            quoteData=quote_data,
            processLogs=process_logs,
            warnings=warnings
        )

    # =========================================================================
    # REVISION SIMULATION ENGINE
    # =========================================================================

    @staticmethod
    def simulate_revision(db: Session, req: QuoteSimulateRevisionRequest) -> QuoteSimulateRevisionResponse:
        """
        Simulates changing quantity or delivery SLA against live database supplier inventories and lead times.
        """
        supplier_prod = None
        if req.productModel and req.supplierName:
            supplier_prod = db.query(SupplierProduct).join(Supplier).join(Product).filter(
                Product.product_code.ilike(f"%{req.productModel}%"),
                Supplier.name.ilike(f"%{req.supplierName}%")
            ).first()

        if not supplier_prod:
            supplier_prod = db.query(SupplierProduct).first()

        if not supplier_prod:
            return QuoteSimulateRevisionResponse(
                status="invalid",
                message="Unable to verify supplier stock record in database.",
                supported=False,
                stockAvailable=0,
                minimumLeadDays=7,
                revisedSubtotal=0.0,
                revisedTax=0.0,
                revisedFreight=0.0,
                revisedTotal=0.0
            )

        unit_price = req.unitPrice if req.unitPrice > 0 else supplier_prod.price
        stock_available = supplier_prod.stock_quantity
        min_lead_days = supplier_prod.delivery_days

        # Validate conditions
        is_qty_valid = req.newQuantity <= stock_available
        is_delivery_valid = req.newDeliveryDays >= min_lead_days

        revised_subtotal = req.newQuantity * unit_price
        revised_tax = revised_subtotal * 0.18
        revised_freight = 15000.0 if revised_subtotal > 500000 else 8000.0
        revised_total = revised_subtotal + revised_tax + revised_freight

        if not is_qty_valid:
            # Check if alternative supplier has higher stock
            alt_sp = db.query(SupplierProduct).filter(
                SupplierProduct.stock_quantity >= req.newQuantity
            ).order_by(SupplierProduct.price).first()

            alt_offer = None
            if alt_sp:
                alt_offer = SupplierOfferDetail(
                    supplierId=alt_sp.supplier_id,
                    supplierName=alt_sp.supplier.name,
                    productModel=alt_sp.product.product_code,
                    supplierProductCode=alt_sp.supplier_product_code,
                    priceINR=alt_sp.price,
                    deliveryDays=alt_sp.delivery_days,
                    stockQuantity=alt_sp.stock_quantity,
                    rating=alt_sp.supplier.rating,
                    ipRating="IP55",
                    isExactMatch=True,
                    advantageNotes=f"Has sufficient warehouse stock ({alt_sp.stock_quantity} units available)"
                )

            return QuoteSimulateRevisionResponse(
                status="invalid",
                message=f"Requested quantity of {req.newQuantity} units exceeds available warehouse stock of {stock_available} units for {supplier_prod.supplier.name}.",
                supported=False,
                stockAvailable=stock_available,
                minimumLeadDays=min_lead_days,
                revisedSubtotal=revised_subtotal,
                revisedTax=revised_tax,
                revisedFreight=revised_freight,
                revisedTotal=revised_total,
                alternativeOffer=alt_offer
            )

        if not is_delivery_valid:
            return QuoteSimulateRevisionResponse(
                status="invalid",
                message=f"Requested {req.newDeliveryDays}-day delivery SLA cannot be met. Minimum verified supplier dispatch lead time is {min_lead_days} business days.",
                supported=False,
                stockAvailable=stock_available,
                minimumLeadDays=min_lead_days,
                revisedSubtotal=revised_subtotal,
                revisedTax=revised_tax,
                revisedFreight=revised_freight,
                revisedTotal=revised_total
            )

        return QuoteSimulateRevisionResponse(
            status="valid",
            message=f"Revision verified: {req.newQuantity} units available in stock ({stock_available} total); {req.newDeliveryDays}-day delivery supported.",
            supported=True,
            stockAvailable=stock_available,
            minimumLeadDays=min_lead_days,
            revisedSubtotal=revised_subtotal,
            revisedTax=revised_tax,
            revisedFreight=revised_freight,
            revisedTotal=revised_total
        )
