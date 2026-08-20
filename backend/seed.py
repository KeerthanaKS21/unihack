import sys
from pathlib import Path

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
    """
    Clears all database tables to ensure zero fake or pre-seeded data.
    The database will start completely empty, and data will only be populated
    from user documents uploaded via the Upload page (/upload).
    """
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("Clearing all database records for clean upload-driven state...")
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

        print("Database completely cleared! Waiting for user uploads on the Upload page.")

    except Exception as e:
        db.rollback()
        print(f"Error resetting database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
