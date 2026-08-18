from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional, List, Dict, Any
from datetime import datetime
from fastapi import HTTPException
from app.db.models.quote import Quote, QuoteItem
from app.db.models.product import Product
from app.db.models.supplier import Supplier
from app.db.models.approval import Approval
from app.schemas.quote import QuoteCreate, QuoteRevisionRequest, QuoteItemCreate

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

        # Bump version
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
