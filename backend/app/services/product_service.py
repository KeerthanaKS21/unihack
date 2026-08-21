from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from typing import Optional, List, Tuple, Dict, Any
from fastapi import HTTPException
from app.db.models.product import Product, ProductVersion, ProductAttribute
from app.db.models.document import Document
from app.db.models.change import Change, ChangeImpact
from app.db.models.certificate import Certificate
from app.db.models.compatibility import Compatibility
from app.schemas.product import ProductCreate, ProductUpdate, ProductVersionCreate, ProductAttributeCreate

class ProductService:
    @staticmethod
    def get_products(
        db: Session,
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None,
        category: Optional[str] = None,
        manufacturer: Optional[str] = None,
        status: Optional[str] = None
    ) -> Tuple[List[Dict[str, Any]], int]:
        query = db.query(Product)

        if category:
            query = query.filter(Product.category == category)
        if manufacturer:
            query = query.filter(Product.manufacturer == manufacturer)
        if status:
            query = query.filter(Product.status == status)
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Product.product_code.ilike(search_term),
                    Product.name.ilike(search_term),
                    Product.manufacturer.ilike(search_term),
                    Product.category.ilike(search_term)
                )
            )

        total = query.count()
        offset = (page - 1) * limit
        products = query.order_by(Product.id).offset(offset).limit(limit).all()

        results = []
        for p in products:
            res = ProductService._format_product_detail(db, p)
            results.append(res)

        return results, total

    @staticmethod
    def get_product_by_id(db: Session, product_id: int) -> Dict[str, Any]:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product ID {product_id} not found")
        return ProductService._format_product_detail(db, product)

    @staticmethod
    def create_product(db: Session, data: ProductCreate) -> Dict[str, Any]:
        existing = db.query(Product).filter(Product.product_code == data.product_code).first()
        if existing:
            raise HTTPException(status_code=409, detail=f"Product with code '{data.product_code}' already exists")

        product = Product(
            product_code=data.product_code,
            name=data.name,
            manufacturer=data.manufacturer,
            category=data.category,
            description=data.description,
            status=data.status or "ACTIVE",
            image_url=data.image_url,
            health_score=data.health_score or 90
        )
        db.add(product)
        db.commit()
        db.refresh(product)

        # Create initial version
        version = ProductVersion(
            product_id=product.id,
            version_number=data.initial_version or "v1.0",
            is_current=True,
            status="VERIFIED"
        )
        db.add(version)
        db.commit()
        db.refresh(version)

        product.current_version_id = version.id
        db.commit()

        # Add initial specs if provided
        if data.specs:
            for k, v in data.specs.items():
                attr = ProductAttribute(
                    product_version_id=version.id,
                    attribute_name=k,
                    attribute_value=str(v),
                    confidence=1.0,
                    verification_status="VERIFIED"
                )
                db.add(attr)
            db.commit()

        return ProductService.get_product_by_id(db, product.id)

    @staticmethod
    def update_product(db: Session, product_id: int, data: ProductUpdate) -> Dict[str, Any]:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product ID {product_id} not found")

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(product, key, value)

        db.commit()
        db.refresh(product)
        return ProductService.get_product_by_id(db, product.id)

    @staticmethod
    def delete_product(db: Session, product_id: int) -> dict:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product ID {product_id} not found")

        db.delete(product)
        db.commit()
        return {"message": f"Product {product_id} ({product.product_code}) deleted successfully"}

    @staticmethod
    def get_product_versions(db: Session, product_id: int) -> List[ProductVersion]:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product ID {product_id} not found")
        return db.query(ProductVersion).filter(ProductVersion.product_id == product_id).order_by(desc(ProductVersion.created_at)).all()

    @staticmethod
    def create_product_version(db: Session, product_id: int, data: ProductVersionCreate) -> ProductVersion:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product ID {product_id} not found")

        # If this is marked current, un-mark previous
        if data.is_current:
            db.query(ProductVersion).filter(ProductVersion.product_id == product_id).update({"is_current": False})

        version = ProductVersion(
            product_id=product_id,
            version_number=data.version_number,
            source_document_id=data.source_document_id,
            is_current=data.is_current,
            verified_by=data.verified_by,
            status=data.status or "VERIFIED"
        )
        db.add(version)
        db.commit()
        db.refresh(version)

        if data.is_current:
            product.current_version_id = version.id
            db.commit()

        if data.attributes:
            for attr_data in data.attributes:
                attr = ProductAttribute(
                    product_version_id=version.id,
                    attribute_name=attr_data.attribute_name,
                    attribute_value=attr_data.attribute_value,
                    normalized_value=attr_data.normalized_value,
                    unit=attr_data.unit,
                    source_document_id=attr_data.source_document_id,
                    source_page=attr_data.source_page,
                    confidence=attr_data.confidence or 1.0,
                    verification_status=attr_data.verification_status or "VERIFIED"
                )
                db.add(attr)
            db.commit()

        return version

    @staticmethod
    def get_product_attributes(db: Session, product_id: int) -> List[ProductAttribute]:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product ID {product_id} not found")

        if product.current_version_id:
            return db.query(ProductAttribute).filter(ProductAttribute.product_version_id == product.current_version_id).all()
        return []

    @staticmethod
    def get_product_documents(db: Session, product_id: int) -> List[Document]:
        return db.query(Document).filter(Document.product_id == product_id).order_by(desc(Document.created_at)).all()

    @staticmethod
    def get_product_changes(db: Session, product_id: int) -> List[Change]:
        return db.query(Change).filter(Change.product_id == product_id).order_by(desc(Change.created_at)).all()

    @staticmethod
    def get_product_compliance(db: Session, product_id: int) -> List[Certificate]:
        return db.query(Certificate).filter(Certificate.product_id == product_id).all()

    @staticmethod
    def get_product_compatibility(db: Session, product_id: int) -> List[Compatibility]:
        return db.query(Compatibility).filter(
            or_(Compatibility.product_id == product_id, Compatibility.compatible_product_id == product_id)
        ).all()

    @staticmethod
    def _format_product_detail(db: Session, p: Product) -> Dict[str, Any]:
        # Get all versions
        versions = db.query(ProductVersion).filter(ProductVersion.product_id == p.id).order_by(desc(ProductVersion.created_at), desc(ProductVersion.id)).all()
        current_ver = next((v for v in versions if v.is_current or v.id == p.current_version_id), versions[0] if versions else None)
        
        # Latest uploaded document for candidate staged specs
        latest_doc = db.query(Document).filter(Document.product_id == p.id).order_by(desc(Document.created_at), desc(Document.id)).first()

        # Staged / candidate draft version linked to latest document
        staged_ver = None
        if latest_doc:
            staged_ver = db.query(ProductVersion).filter(ProductVersion.product_id == p.id, ProductVersion.source_document_id == latest_doc.id).first()
        if not staged_ver:
            staged_ver = next((v for v in versions if not v.is_current and v.status == "DRAFT"), next((v for v in versions if not v.is_current), None))
        
        prev_ver = versions[1] if len(versions) > 1 else None

        current_specs = {}
        if current_ver:
            attrs = db.query(ProductAttribute).filter(ProductAttribute.product_version_id == current_ver.id).all()
            for a in attrs:
                current_specs[a.attribute_name] = a.attribute_value

        staged_specs = {}
        if latest_doc and latest_doc.extracted_attributes and isinstance(latest_doc.extracted_attributes, dict) and len(latest_doc.extracted_attributes) > 0:
            staged_specs = {k: v for k, v in latest_doc.extracted_attributes.items() if not str(k).startswith("File Type") and not str(k).startswith("Total") and not str(k).startswith("Column:")}
        
        if not staged_specs and staged_ver:
            attrs = db.query(ProductAttribute).filter(ProductAttribute.product_version_id == staged_ver.id).all()
            for a in attrs:
                staged_specs[a.attribute_name] = a.attribute_value

        prev_specs = {}
        if prev_ver:
            attrs = db.query(ProductAttribute).filter(ProductAttribute.product_version_id == prev_ver.id).all()
            for a in attrs:
                prev_specs[a.attribute_name] = a.attribute_value

        staged_version_num = (latest_doc.version_detected if latest_doc else None) or (staged_ver.version_number if staged_ver else None)

        changes_count = db.query(Change).filter(Change.product_id == p.id).count()
        pending_impacts = db.query(ChangeImpact).join(Change).filter(Change.product_id == p.id, ChangeImpact.reviewed == False).count()

        return {
            "id": p.id,
            "product_code": p.product_code,
            "name": p.name,
            "manufacturer": p.manufacturer,
            "category": p.category,
            "description": p.description,
            "status": p.status,
            "current_version_id": p.current_version_id,
            "image_url": p.image_url,
            "health_score": p.health_score,
            "created_at": p.created_at,
            "updated_at": p.updated_at,
            "current_version": current_ver.version_number if current_ver else "v1.0",
            "staged_version": staged_version_num,
            "previous_version": prev_ver.version_number if prev_ver else None,
            "specs": current_specs,
            "staged_specs": staged_specs,
            "previous_specs": prev_specs,
            "changes_count": changes_count,
            "pending_impacts_count": pending_impacts
        }
