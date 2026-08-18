import sys
from pathlib import Path
from datetime import datetime

# Add parent directory to path so app modules can be imported
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.db.database import SessionLocal
from app.db.models import Product, ProductVersion, ProductAttribute

def add_demo_data():
    db = SessionLocal()
    try:
        # 1. Motor-X500
        p1 = Product(product_code="Motor-X500", name="Motor-X500", manufacturer="Demo", category="Motor", status="ACTIVE")
        db.add(p1)
        db.commit()
        v1 = ProductVersion(product_id=p1.id, version_number="v1.0", is_current=True)
        db.add(v1)
        db.commit()
        p1.current_version_id = v1.id
        db.commit()
        db.add_all([
            ProductAttribute(product_version_id=v1.id, attribute_name="Power", attribute_value="7.5 kW", normalized_value=7.5, unit="kW"),
            ProductAttribute(product_version_id=v1.id, attribute_name="Voltage", attribute_value="415 V", normalized_value=415.0, unit="V"),
            ProductAttribute(product_version_id=v1.id, attribute_name="Speed", attribute_value="1460 RPM", normalized_value=1460.0, unit="RPM"),
            ProductAttribute(product_version_id=v1.id, attribute_name="Shaft Diameter", attribute_value="28 mm", normalized_value=28.0, unit="mm"),
            ProductAttribute(product_version_id=v1.id, attribute_name="IP Rating", attribute_value="IP55", unit="IP")
        ])
        db.commit()

        # 2. Controller-C7
        p2 = Product(product_code="Controller-C7", name="Controller-C7", manufacturer="Demo", category="Controller", status="ACTIVE")
        db.add(p2)
        db.commit()
        v2 = ProductVersion(product_id=p2.id, version_number="v1.0", is_current=True)
        db.add(v2)
        db.commit()
        p2.current_version_id = v2.id
        db.commit()
        db.add_all([
            ProductAttribute(product_version_id=v2.id, attribute_name="Supported Power", attribute_value="5.5-7.5 kW", unit="kW"),
            ProductAttribute(product_version_id=v2.id, attribute_name="Voltage", attribute_value="415 V", normalized_value=415.0, unit="V"),
            ProductAttribute(product_version_id=v2.id, attribute_name="Frequency", attribute_value="50 Hz", normalized_value=50.0, unit="Hz")
        ])
        db.commit()

        # 3. Pump-P12
        p3 = Product(product_code="Pump-P12", name="Pump-P12", manufacturer="Demo", category="Pump", status="ACTIVE")
        db.add(p3)
        db.commit()
        v3 = ProductVersion(product_id=p3.id, version_number="v1.0", is_current=True)
        db.add(v3)
        db.commit()
        p3.current_version_id = v3.id
        db.commit()
        db.add_all([
            ProductAttribute(product_version_id=v3.id, attribute_name="Required Motor Power", attribute_value="5.5-7.5 kW", unit="kW"),
            ProductAttribute(product_version_id=v3.id, attribute_name="Required Speed", attribute_value="1400-1500 RPM", unit="RPM")
        ])
        db.commit()

        # 4. Coupling-C25
        p4 = Product(product_code="Coupling-C25", name="Coupling-C25", manufacturer="Demo", category="Coupling", status="ACTIVE")
        db.add(p4)
        db.commit()
        v4 = ProductVersion(product_id=p4.id, version_number="v1.0", is_current=True)
        db.add(v4)
        db.commit()
        p4.current_version_id = v4.id
        db.commit()
        db.add_all([
            ProductAttribute(product_version_id=v4.id, attribute_name="Bore", attribute_value="25 mm", normalized_value=25.0, unit="mm"),
            ProductAttribute(product_version_id=v4.id, attribute_name="Torque", attribute_value="80 Nm", normalized_value=80.0, unit="Nm")
        ])
        db.commit()

        # 5. Coupling-C28
        p5 = Product(product_code="Coupling-C28", name="Coupling-C28", manufacturer="Demo", category="Coupling", status="ACTIVE")
        db.add(p5)
        db.commit()
        v5 = ProductVersion(product_id=p5.id, version_number="v1.0", is_current=True)
        db.add(v5)
        db.commit()
        p5.current_version_id = v5.id
        db.commit()
        db.add_all([
            ProductAttribute(product_version_id=v5.id, attribute_name="Bore", attribute_value="28 mm", normalized_value=28.0, unit="mm"),
            ProductAttribute(product_version_id=v5.id, attribute_name="Torque", attribute_value="100 Nm", normalized_value=100.0, unit="Nm")
        ])
        db.commit()

        # Add Compatibility Relationships
        from app.db.models.compatibility import Compatibility
        db.add_all([
            Compatibility(product_id=p1.id, compatible_product_id=p2.id, relationship_type="REQUIRES", status="NEEDS REVIEW"),
            Compatibility(product_id=p1.id, compatible_product_id=p3.id, relationship_type="COMPATIBLE_WITH", status="COMPATIBLE"),
            Compatibility(product_id=p1.id, compatible_product_id=p4.id, relationship_type="COMPATIBLE_WITH", status="INCOMPATIBLE"),
            Compatibility(product_id=p1.id, compatible_product_id=p5.id, relationship_type="COMPATIBLE_WITH", status="COMPATIBLE")
        ])
        db.commit()

        print("Demo data added successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    add_demo_data()
