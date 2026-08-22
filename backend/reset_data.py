import os
import glob
from app.db.database import SessionLocal
from app.db.models.document import Document
from app.db.models.product import Product, ProductVersion, ProductAttribute
from app.db.models.supplier import SupplierProduct
from app.db.models.issue import CatalogIssue
from app.db.models.change import Change, ChangeImpact
from app.db.models.quote import Quote, QuoteItem
from app.db.models.certificate import Certificate
from app.db.models.compatibility import Compatibility
from app.core.config import settings

def reset_all_uploaded_data():
    db = SessionLocal()
    try:
        print("Clearing database records...")
        db.query(QuoteItem).delete()
        db.query(Quote).delete()
        db.query(ChangeImpact).delete()
        db.query(Change).delete()
        db.query(CatalogIssue).delete()
        db.query(Certificate).delete()
        db.query(Compatibility).delete()
        db.query(SupplierProduct).delete()
        db.query(ProductAttribute).delete()
        db.query(ProductVersion).delete()
        db.query(Document).delete()
        db.query(Product).delete()
        db.commit()
        print("Database cleared successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error clearing database: {e}")
    finally:
        db.close()

    # Clear uploaded files from upload folder
    print(f"Clearing uploaded files in {settings.UPLOAD_DIR}...")
    files = glob.glob(os.path.join(settings.UPLOAD_DIR, "*"))
    for f in files:
        try:
            if os.path.isfile(f):
                os.remove(f)
                print(f"Removed file: {f}")
        except Exception as e:
            print(f"Error deleting file {f}: {e}")

    print("All uploaded data removed successfully.")

if __name__ == "__main__":
    reset_all_uploaded_data()
