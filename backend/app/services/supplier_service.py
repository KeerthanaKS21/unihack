from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from fastapi import HTTPException
from app.db.models.supplier import Supplier, SupplierProduct
from app.db.models.product import Product
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierProductCreate

class SupplierService:
    @staticmethod
    def get_suppliers(db: Session, status: Optional[str] = None) -> List[Dict[str, Any]]:
        query = db.query(Supplier)
        if status:
            query = query.filter(Supplier.status == status)

        suppliers = query.order_by(Supplier.id).all()
        results = []
        for s in suppliers:
            prod_count = db.query(SupplierProduct).filter(SupplierProduct.supplier_id == s.id).count()
            results.append({
                "id": s.id,
                "name": s.name,
                "supplier_code": s.supplier_code,
                "contact_email": s.contact_email,
                "phone": s.phone,
                "address": s.address,
                "tier": s.tier,
                "rating": s.rating,
                "status": s.status,
                "created_at": s.created_at,
                "updated_at": s.updated_at,
                "products_count": prod_count
            })
        return results

    @staticmethod
    def get_supplier_by_id(db: Session, supplier_id: int) -> Dict[str, Any]:
        s = db.query(Supplier).filter(Supplier.id == supplier_id).first()
        if not s:
            raise HTTPException(status_code=404, detail=f"Supplier ID {supplier_id} not found")
        prod_count = db.query(SupplierProduct).filter(SupplierProduct.supplier_id == s.id).count()
        return {
            "id": s.id,
            "name": s.name,
            "supplier_code": s.supplier_code,
            "contact_email": s.contact_email,
            "phone": s.phone,
            "address": s.address,
            "tier": s.tier,
            "rating": s.rating,
            "status": s.status,
            "created_at": s.created_at,
            "updated_at": s.updated_at,
            "products_count": prod_count
        }

    @staticmethod
    def create_supplier(db: Session, data: SupplierCreate) -> Supplier:
        supplier = Supplier(
            name=data.name,
            supplier_code=data.supplier_code,
            contact_email=data.contact_email,
            phone=data.phone,
            address=data.address,
            tier=data.tier or "Authorized Partner",
            rating=data.rating or 4.5,
            status=data.status or "ACTIVE"
        )
        db.add(supplier)
        db.commit()
        db.refresh(supplier)
        return supplier

    @staticmethod
    def update_supplier(db: Session, supplier_id: int, data: SupplierUpdate) -> Supplier:
        s = db.query(Supplier).filter(Supplier.id == supplier_id).first()
        if not s:
            raise HTTPException(status_code=404, detail=f"Supplier ID {supplier_id} not found")
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(s, k, v)
        db.commit()
        db.refresh(s)
        return s

    @staticmethod
    def get_supplier_products(
        db: Session,
        supplier_id: Optional[int] = None,
        product_id: Optional[int] = None,
        max_price: Optional[float] = None,
        max_delivery_days: Optional[int] = None,
        in_stock_only: Optional[bool] = False
    ) -> List[Dict[str, Any]]:
        query = db.query(SupplierProduct)

        if supplier_id:
            query = query.filter(SupplierProduct.supplier_id == supplier_id)
        if product_id:
            query = query.filter(SupplierProduct.product_id == product_id)
        if max_price:
            query = query.filter(SupplierProduct.price <= max_price)
        if max_delivery_days:
            query = query.filter(SupplierProduct.delivery_days <= max_delivery_days)
        if in_stock_only:
            query = query.filter(SupplierProduct.stock_quantity > 0)

        items = query.all()
        results = []
        for sp in items:
            sup = db.query(Supplier).filter(Supplier.id == sp.supplier_id).first()
            prod = db.query(Product).filter(Product.id == sp.product_id).first()

            # Resolve specifications dynamically from current product attributes in database
            power = "N/A"
            voltage = "N/A"
            ip_rating = "N/A"
            speed = "N/A"
            
            if prod:
                from app.db.models.product import ProductVersion
                current_ver = db.query(ProductVersion).filter(
                    ProductVersion.product_id == prod.id,
                    ProductVersion.is_current == True
                ).first()
                if current_ver:
                    for attr in current_ver.attributes:
                        name_lower = attr.attribute_name.lower().strip()
                        if name_lower in ["rated output", "power"]:
                            power = attr.attribute_value
                        elif name_lower in ["rated voltage", "voltage"]:
                            voltage = attr.attribute_value
                        elif name_lower in ["protection degree", "ip rating", "iprating", "ip_rating"]:
                            ip_rating = attr.attribute_value
                        elif name_lower in ["synchronous speed", "speed"]:
                            speed = attr.attribute_value

            violations = []
            if sp.is_exact_match != "Exact Match":
                if ip_rating != "N/A" and "IP54" in ip_rating:
                    violations.append(f"Enclosure {ip_rating} (Required: IP55)")
                if sp.delivery_days > 10:
                    violations.append(f"Lead time {sp.delivery_days} days (Required: <10 days)")

            results.append({
                "id": sp.id,
                "supplier_id": sp.supplier_id,
                "product_id": sp.product_id,
                "supplier_name": sup.name if sup else "Authorized Supplier",
                "product_model": prod.product_code if prod else "Industrial SKU",
                "product_name": prod.name if prod else "",
                "supplier_product_code": sp.supplier_product_code,
                "price": sp.price,
                "currency": sp.currency,
                "stock_quantity": sp.stock_quantity,
                "delivery_days": sp.delivery_days,
                "minimum_order_quantity": sp.minimum_order_quantity,
                "technical_match_score": sp.technical_match_score,
                "is_exact_match": sp.is_exact_match,
                "supplier_status": sp.supplier_status,
                "advantage_notes": sp.advantage_notes,
                "tier": sup.tier if sup else "Authorized Partner",
                "rating": sup.rating if sup else 4.5,
                "violations": violations,
                "power": power,
                "voltage": voltage,
                "ip_rating": ip_rating,
                "speed": speed,
                "created_at": sp.created_at,
                "updated_at": sp.updated_at
            })
        return results

    @staticmethod
    def create_supplier_product(db: Session, data: SupplierProductCreate) -> SupplierProduct:
        sp = SupplierProduct(
            supplier_id=data.supplier_id,
            product_id=data.product_id,
            supplier_product_code=data.supplier_product_code,
            price=data.price,
            currency=data.currency or "INR",
            stock_quantity=data.stock_quantity or 0,
            delivery_days=data.delivery_days or 7,
            minimum_order_quantity=data.minimum_order_quantity or 1,
            technical_match_score=data.technical_match_score or 1.0,
            is_exact_match=data.is_exact_match or "Exact Match",
            supplier_status=data.supplier_status or "AVAILABLE",
            advantage_notes=data.advantage_notes
        )
        db.add(sp)
        db.commit()
        db.refresh(sp)
        return sp
