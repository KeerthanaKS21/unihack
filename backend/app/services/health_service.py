import logging
import re
from datetime import datetime
from typing import Dict, Any, List, Optional, Set, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_, and_

from app.db.models.product import Product, ProductVersion, ProductAttribute
from app.db.models.issue import CatalogIssue
from app.db.models.certificate import Certificate
from app.db.models.compatibility import Compatibility
from app.db.models.change import Change
from app.services.unit_normalization_service import UnitNormalizationService

logger = logging.getLogger("health_service")

# Required technical attributes per product category
CATEGORY_REQUIRED_ATTRIBUTES: Dict[str, List[str]] = {
    "motor": ["Power", "Voltage", "Frequency", "Speed", "IP Rating", "Weight"],
    "motors": ["Power", "Voltage", "Frequency", "Speed", "IP Rating", "Weight"],
    "industrial motor": ["Power", "Voltage", "Frequency", "Speed", "IP Rating", "Weight"],
    "electric motor": ["Power", "Voltage", "Frequency", "Speed", "IP Rating", "Weight"],
    "gearbox": ["Power", "Ratio", "Speed", "Torque", "Mount"],
    "gearboxes": ["Power", "Ratio", "Speed", "Torque", "Mount"],
    "gear reducer": ["Power", "Ratio", "Speed", "Torque", "Mount"],
    "controller": ["Power", "Voltage", "Current", "IP Rating"],
    "controllers": ["Power", "Voltage", "Current", "IP Rating"],
    "vfd": ["Power", "Voltage", "Current", "IP Rating"],
    "inverter": ["Power", "Voltage", "Current", "IP Rating"],
    "drive": ["Power", "Voltage", "Current", "IP Rating"],
    "pump": ["Power", "Flow Rate", "Pressure", "Speed"],
    "pumps": ["Power", "Flow Rate", "Pressure", "Speed"],
    "valve": ["Pressure", "Mount", "Housing / Material"],
    "valves": ["Pressure", "Mount", "Housing / Material"],
}

# Synonyms/aliases for attribute canonicalization
ATTRIBUTE_CANONICAL_MAP = {
    "input power": "Power",
    "rated power": "Power",
    "power": "Power",
    "rated voltage": "Voltage",
    "input voltage": "Voltage",
    "voltage": "Voltage",
    "nominal frequency": "Frequency",
    "frequency": "Frequency",
    "synchronous speed": "Speed",
    "input speed": "Speed",
    "rated speed": "Speed",
    "speed": "Speed",
    "enclosure protection": "IP Rating",
    "protection rating": "IP Rating",
    "ip": "IP Rating",
    "ip rating": "IP Rating",
    "unit weight": "Weight",
    "total weight": "Weight",
    "weight": "Weight",
    "gear ratio": "Ratio",
    "ratio": "Ratio",
    "output torque": "Torque",
    "torque": "Torque",
    "mounting": "Mount",
    "mount": "Mount",
    "current": "Current",
    "rated current": "Current",
    "pressure": "Pressure",
    "working pressure": "Pressure",
    "max pressure": "Pressure",
    "flow rate": "Flow Rate",
    "flow": "Flow Rate",
    "housing material": "Housing / Material",
    "housing / material": "Housing / Material",
}

def canonicalize_attribute_name(raw_name: str) -> str:
    cleaned = raw_name.strip().lstrip(",").rstrip(":").strip().lower()
    return ATTRIBUTE_CANONICAL_MAP.get(cleaned, raw_name.strip().lstrip(",").rstrip(":").strip())

class HealthService:
    @staticmethod
    def get_catalog_health(db: Session) -> Dict[str, Any]:
        total_products_count = db.query(Product).count()
        if total_products_count == 0:
            return {
                "total_products": 0,
                "complete_products": 0,
                "missing_data": 0,
                "conflicts": 0,
                "duplicates": 0,
                "outdated": 0,
                "compliance_issues": 0,
                "overall_health": 100
            }

        # Count actual issues in database
        open_issues = db.query(CatalogIssue).filter(CatalogIssue.status == "open").all()
        conflicts = sum(1 for i in open_issues if i.issue_type == "conflict")
        missing_data = sum(1 for i in open_issues if i.issue_type == "missing")
        duplicates = sum(1 for i in open_issues if i.issue_type == "duplicate")
        outdated = sum(1 for i in open_issues if i.issue_type == "outdated")
        
        # Compliance issues
        compliance_issues = db.query(Certificate).filter(
            Certificate.status.in_(["EXPIRED", "EXPIRING", "MISSING", "Action Required"])
        ).count()

        total_issues = conflicts + missing_data + duplicates + outdated + compliance_issues
        complete_products = max(0, total_products_count - total_issues)
        overall_health = int((complete_products / total_products_count) * 100)

        return {
            "total_products": total_products_count,
    """
    Deterministic Enterprise Catalog Health & Data Governance Engine.
    Monitors ONLY real PostgreSQL database records.
    """

    @classmethod
    def scan_and_detect_issues(cls, db: Session) -> Dict[str, Any]:
        """
        Scans all products in the database and updates catalog_issues idempotently.
        """
        products = db.query(Product).all()
        if not products:
            return {
                "scanned_products": 0,
                "open_issues_count": 0
            }

        # Track active issue keys found in current scan
        # Tuple: (product_id, issue_type, attribute_name)
        active_issue_keys: Set[Tuple[int, str, Optional[str]]] = set()

        # 1. Product-Level & Attribute-Level Inspections
        for prod in products:
            # Determine active / current version
            active_version = None
            if prod.current_version_id:
                active_version = db.query(ProductVersion).filter(ProductVersion.id == prod.current_version_id).first()
            if not active_version:
                active_version = (
                    db.query(ProductVersion)
                    .filter(ProductVersion.product_id == prod.id)
                    .order_by(desc(ProductVersion.is_current), desc(ProductVersion.created_at))
                    .first()
                )

            # Collect attributes for current version
            attr_map: Dict[str, ProductAttribute] = {}
            if active_version:
                for attr in active_version.attributes:
                    c_name = canonicalize_attribute_name(attr.attribute_name)
                    attr_map[c_name] = attr

            cat_lower = prod.category.strip().lower()
            required_attrs = (
                CATEGORY_REQUIRED_ATTRIBUTES.get(cat_lower) or
                CATEGORY_REQUIRED_ATTRIBUTES.get(cat_lower.rstrip("s")) or
                ["Power"]
            )

            # --- A. MISSING DATA DETECTION ---
            for req_attr in required_attrs:
                c_req = canonicalize_attribute_name(req_attr)
                matching_attr = attr_map.get(c_req)
                is_missing = (
                    matching_attr is None or
                    not str(matching_attr.attribute_value).strip() or
                    str(matching_attr.attribute_value).strip() in ["-", "N/A", "null", "None"]
                )

                if is_missing:
                    active_issue_keys.add((prod.id, "missing", c_req))
                    cls._upsert_issue(
                        db=db,
                        product_id=prod.id,
                        issue_type="missing",
                        attribute_name=c_req,
                        title=f"Missing required parameter: {c_req}",
                        description=f"Required specification '{c_req}' is missing for {prod.name} ({prod.product_code}).",
                        severity="high" if c_req in ["Power", "Voltage", "Ratio", "Pressure"] else "medium",
                        evidence=f"Category '{prod.category}' requires '{c_req}', but no verified attribute value is stored in active version {active_version.version_number if active_version else 'v1.0'}.",
                        ai_rec={"suggestedValue": None, "reason": f"Category required attribute for {prod.category}"}
                    )

            # --- B. ATTRIBUTE VALIDATION: INVALID VALUE & INVALID UNIT ---
            for c_name, attr in attr_map.items():
                raw_val = str(attr.attribute_value).strip()
                norm_val = attr.normalized_value

                # 1. Invalid / Out of bounds numeric values
                if norm_val is not None:
                    if c_name == "Weight" and norm_val <= 0:
                        active_issue_keys.add((prod.id, "invalid_unit", c_name))
                        cls._upsert_issue(
                            db=db,
                            product_id=prod.id,
                            issue_type="invalid_unit",
                            attribute_name=c_name,
                            title=f"Invalid physical value on {c_name}: {raw_val}",
                            description=f"Weight cannot be zero or negative ({raw_val}).",
                            severity="high",
                            evidence=f"Normalized value {norm_val} kg is physically invalid.",
                            ai_rec={"suggestedValue": "Positive numeric weight", "reason": "Physical bounds validation"}
                        )
                    elif c_name in ["Power", "Voltage"] and norm_val <= 0:
                        active_issue_keys.add((prod.id, "invalid_unit", c_name))
                        cls._upsert_issue(
                            db=db,
                            product_id=prod.id,
                            issue_type="invalid_unit",
                            attribute_name=c_name,
                            title=f"Invalid electrical value on {c_name}: {raw_val}",
                            description=f"{c_name} must be greater than zero ({raw_val}).",
                            severity="high",
                            evidence=f"Stored value '{raw_val}' evaluated to non-positive number {norm_val}.",
                            ai_rec={"suggestedValue": None, "reason": "Electrical bounds validation"}
                        )
                    elif c_name == "Speed" and norm_val < 0:
                        active_issue_keys.add((prod.id, "invalid_unit", c_name))
                        cls._upsert_issue(
                            db=db,
                            product_id=prod.id,
                            issue_type="invalid_unit",
                            attribute_name=c_name,
                            title=f"Invalid rotational speed: {raw_val}",
                            description=f"Speed cannot be negative ({raw_val}).",
                            severity="high",
                            evidence=f"Stored value '{raw_val}' evaluated to negative RPM.",
                            ai_rec={"suggestedValue": None, "reason": "Kinematic bounds validation"}
                        )
                    elif c_name == "Efficiency" and (norm_val < 0 or norm_val > 100):
                        active_issue_keys.add((prod.id, "invalid_unit", c_name))
                        cls._upsert_issue(
                            db=db,
                            product_id=prod.id,
                            issue_type="invalid_unit",
                            attribute_name=c_name,
                            title=f"Efficiency out of percentage bounds: {raw_val}",
                            description=f"Efficiency must be between 0% and 100% ({raw_val}).",
                            severity="high",
                            evidence=f"Normalized value {norm_val}% is outside 0-100 range.",
                            ai_rec={"suggestedValue": "0-100%", "reason": "Percentage bounds validation"}
                        )

                # 2. IP Rating Pattern
                if c_name == "IP Rating" and raw_val:
                    if not re.search(r'\bIP[0-9X]{2}\b', raw_val, re.IGNORECASE) and "nema" not in raw_val.lower():
                        active_issue_keys.add((prod.id, "invalid_unit", c_name))
                        cls._upsert_issue(
                            db=db,
                            product_id=prod.id,
                            issue_type="invalid_unit",
                            attribute_name=c_name,
                            title=f"Non-standard IP protection rating: '{raw_val}'",
                            description=f"IP protection rating '{raw_val}' does not conform to IEC 60529 or NEMA standards.",
                            severity="medium",
                            evidence=f"Expected format IP55, IP65, IP68, etc. Got '{raw_val}'.",
                            ai_rec={"suggestedValue": "IP55 / IP65", "reason": "IEC 60529 syntax standard"}
                        )

                # 3. Low Extraction Confidence
                if attr.confidence is not None and attr.confidence < 0.70:
                    active_issue_keys.add((prod.id, "low_confidence", c_name))
                    cls._upsert_issue(
                        db=db,
                        product_id=prod.id,
                        issue_type="low_confidence",
                        attribute_name=c_name,
                        title=f"Low confidence extraction on {c_name} ({int(attr.confidence*100)}%)",
                        description=f"Specification parameter '{c_name}' was extracted with {int(attr.confidence*100)}% confidence.",
                        severity="low",
                        evidence=f"Document parsing returned confidence {attr.confidence} on attribute '{attr.attribute_name}'.",
                        ai_rec={"suggestedValue": attr.attribute_value, "reason": "Human verification recommended"}
                    )

            # --- C. OUTDATED PRODUCT / UNSYNCHRONIZED CANDIDATE VERSION ---
            latest_version = (
                db.query(ProductVersion)
                .filter(ProductVersion.product_id == prod.id)
                .order_by(desc(ProductVersion.created_at))
                .first()
            )
            if latest_version and active_version and latest_version.id != active_version.id and latest_version.status != "SUPERSEDED":
                active_issue_keys.add((prod.id, "outdated", "version"))
                cls._upsert_issue(
                    db=db,
                    product_id=prod.id,
                    issue_type="outdated",
                    attribute_name="version",
                    title=f"Unsynchronized candidate version available ({latest_version.version_number})",
                    description=f"Active master record is on {active_version.version_number}, while newly ingested {latest_version.version_number} is pending synchronization approval.",
                    severity="medium",
                    evidence=f"Active version ID: {active_version.id} ({active_version.version_number}), Candidate version ID: {latest_version.id} ({latest_version.version_number}).",
                    ai_rec={"suggestedValue": latest_version.version_number, "reason": "Pending synchronization sign-off"}
                )

            # --- D. WRONG CATEGORY DETECTION ---
            p_name_lower = prod.name.lower()
            if ("electric motor" in p_name_lower or "industrial motor" in p_name_lower or "3-phase motor" in p_name_lower) and cat_lower in ["pump", "pumps", "valve", "valves"]:
                active_issue_keys.add((prod.id, "wrong_category", "category"))
                cls._upsert_issue(
                    db=db,
                    product_id=prod.id,
                    issue_type="wrong_category",
                    attribute_name="category",
                    title=f"Potential Category Misclassification: Assigned to '{prod.category}'",
                    description=f"Product name '{prod.name}' indicates an Electric Motor, but category is set to '{prod.category}'.",
                    severity="medium",
                    evidence=f"Name keywords point to 'Industrial Motors', stored category is '{prod.category}'.",
                    ai_rec={"suggestedCategory": "Industrial Motors", "reason": "Keyword pattern analysis"}
                )

            # --- E. CONFLICT DETECTION ACROSS SOURCES / CHANGES ---
            pending_changes = db.query(Change).filter(Change.product_id == prod.id, Change.status == "PENDING").all()
            for chg in pending_changes:
                c_chg_attr = canonicalize_attribute_name(chg.attribute_name)
                # Ensure it's not a unit representation equivalence (e.g. 5500 W vs 5.5 kW)
                is_real_conflict = not cls._is_equivalent(chg.old_value, chg.new_value)
                if is_real_conflict:
                    active_issue_keys.add((prod.id, "conflict", c_chg_attr))
                    cls._upsert_issue(
                        db=db,
                        product_id=prod.id,
                        issue_type="conflict",
                        attribute_name=c_chg_attr,
                        title=f"Specification Conflict on {c_chg_attr}: {chg.old_value} vs {chg.new_value}",
                        description=f"Different specification values detected for {c_chg_attr} between baseline and newly ingested document.",
                        severity="high",
                        evidence=f"Baseline: '{chg.old_value}' vs Ingested: '{chg.new_value}' (Source: {chg.source_document or 'Datasheet'}).",
                        ai_rec={"suggestedValue": chg.new_value, "reason": "Latest ingested document delta"}
                    )

            # --- F. COMPLIANCE RECORDS ---
            certs = db.query(Certificate).filter(Certificate.product_id == prod.id).all()
            for cert in certs:
                is_expired = (
                    cert.status in ["EXPIRED", "MISSING"] or
                    (cert.expiry_date and cert.expiry_date < datetime.utcnow())
                )
                if is_expired:
                    active_issue_keys.add((prod.id, "compliance", cert.standard))
                    cls._upsert_issue(
                        db=db,
                        product_id=prod.id,
                        issue_type="compliance",
                        attribute_name=cert.standard,
                        title=f"Compliance alert: {cert.standard} certificate {cert.status.lower()}",
                        description=f"Mandatory standard {cert.standard} certificate #{cert.certificate_number} is {cert.status.lower()}.",
                        severity="critical" if cert.status == "EXPIRED" else "high",
                        evidence=f"Expiry Date: {cert.expiry_date.strftime('%Y-%m-%d') if cert.expiry_date else 'Not Provided'}. Status: {cert.status}.",
                        ai_rec={"suggestedValue": "Renew Certificate", "reason": "Regulatory compliance audit"}
                    )

            # --- G. BROKEN RELATIONSHIPS ---
            compatibilities = db.query(Compatibility).filter(Compatibility.product_id == prod.id).all()
            for comp in compatibilities:
                target_p = db.query(Product).filter(Product.id == comp.compatible_product_id).first()
                if not target_p:
                    active_issue_keys.add((prod.id, "broken_relationship", str(comp.compatible_product_id)))
                    cls._upsert_issue(
                        db=db,
                        product_id=prod.id,
                        issue_type="broken_relationship",
                        attribute_name=str(comp.compatible_product_id),
                        title=f"Broken compatibility relationship to Product ID #{comp.compatible_product_id}",
                        description=f"Compatibility reference points to a non-existent or deleted product ID {comp.compatible_product_id}.",
                        severity="high",
                        evidence=f"Relationship '{comp.relationship_type}' has invalid foreign key #{comp.compatible_product_id}.",
                        ai_rec={"suggestedValue": None, "reason": "Database relational integrity"}
                    )

        # --- H. DUPLICATE PRODUCT DETECTION ---
        for i in range(len(products)):
            for j in range(i + 1, len(products)):
                p1, p2 = products[i], products[j]
                # Compare codes
                c1 = re.sub(r'[^a-zA-Z0-9]', '', p1.product_code.lower())
                c2 = re.sub(r'[^a-zA-Z0-9]', '', p2.product_code.lower())

                if c1 == c2 and p1.id != p2.id:
                    active_issue_keys.add((p1.id, "duplicate", p2.product_code))
                    cls._upsert_issue(
                        db=db,
                        product_id=p1.id,
                        issue_type="duplicate",
                        attribute_name=p2.product_code,
                        title=f"Duplicate product entity detected: {p1.product_code} matches {p2.product_code}",
                        description=f"Product {p1.product_code} ({p1.name}) is identical/highly similar to {p2.product_code} ({p2.name}).",
                        severity="medium",
                        evidence=f"Product 1: ID {p1.id} ({p1.product_code}), Product 2: ID {p2.id} ({p2.product_code}).",
                        ai_rec={"suggestedValue": "Review & Merge", "reason": "Duplicate SKU detection"}
                    )

        # 2. Auto-Resolve issues that no longer exist in current scan
        existing_open_issues = db.query(CatalogIssue).filter(CatalogIssue.status == "open").all()
        for iss in existing_open_issues:
            key = (iss.product_id, iss.issue_type, iss.attribute_name)
            if key not in active_issue_keys:
                iss.status = "resolved"
                iss.resolved_by = "System Health Auto-Validator"
                iss.resolved_at = datetime.utcnow()
                iss.resolution_value = "Auto-validated (Defect no longer present in catalog data)"

        db.commit()

        total_open = db.query(CatalogIssue).filter(CatalogIssue.status == "open").count()
        return {
            "scanned_products": len(products),
            "open_issues_count": total_open
        }

    @classmethod
    def get_catalog_health(cls, db: Session) -> Dict[str, Any]:
        """
        Returns real deterministic Catalog Health metrics calculated from PostgreSQL.
        """
        # Run live scan reconciliation
        cls.scan_and_detect_issues(db)

        total_products = db.query(Product).count()
        if total_products == 0:
            return {
                "total_products": 0,
                "products_monitored": 0,
                "complete_products": 0,
                "products_with_issues": 0,
                "missing_data": 0,
                "conflicts": 0,
                "duplicates": 0,
                "outdated": 0,
                "compliance_issues": 0,
                "invalid_units": 0,
                "invalid_values": 0,
                "wrong_category": 0,
                "broken_relationships": 0,
                "image_mismatch": 0,
                "low_confidence": 0,
                "overall_health": 100.0,
                "health_score": 100.0,
                "issues": {
                    "missing_data": 0,
                    "conflicts": 0,
                    "duplicates": 0,
                    "outdated": 0,
                    "invalid_units": 0,
                    "invalid_values": 0,
                    "wrong_category": 0,
                    "broken_relationships": 0,
                    "compliance": 0,
                    "image_data_mismatch": 0,
                    "low_confidence": 0
                },
                "components": {
                    "completeness": 100.0,
                    "consistency": 100.0,
                    "validity": 100.0,
                    "freshness": 100.0,
                    "compliance": 100.0,
                    "confidence": 100.0
                }
            }

        # Query all OPEN issues from database
        open_issues = db.query(CatalogIssue).filter(CatalogIssue.status == "open").all()

        missing_data = sum(1 for i in open_issues if i.issue_type == "missing")
        conflicts = sum(1 for i in open_issues if i.issue_type == "conflict")
        duplicates = sum(1 for i in open_issues if i.issue_type == "duplicate")
        outdated = sum(1 for i in open_issues if i.issue_type == "outdated")
        invalid_units = sum(1 for i in open_issues if i.issue_type == "invalid_unit")
        invalid_values = sum(1 for i in open_issues if i.issue_type == "invalid_value")
        wrong_category = sum(1 for i in open_issues if i.issue_type == "wrong_category")
        broken_relationships = sum(1 for i in open_issues if i.issue_type == "broken_relationship")
        compliance_issues = sum(1 for i in open_issues if i.issue_type == "compliance")
        image_mismatch = sum(1 for i in open_issues if i.issue_type == "image_mismatch")
        low_confidence = sum(1 for i in open_issues if i.issue_type == "low_confidence")

        # Distinct products with issues
        products_with_issues_ids = set(i.product_id for i in open_issues)
        products_with_issues = len(products_with_issues_ids)
        complete_products = max(0, total_products - products_with_issues)

        # Deterministic Component Scores (0 to 100)
        # 1. Completeness (30% weight): Missing attributes penalize completeness
        completeness = max(0.0, round(100.0 - (missing_data / max(total_products * 4, 1)) * 100.0, 1))
        
        # 2. Consistency (25% weight): Conflicts and duplicates penalize consistency
        consistency = max(0.0, round(100.0 - (conflicts * 20.0 + duplicates * 15.0), 1))
        
        # 3. Validity (15% weight): Invalid units, invalid values, wrong category penalize validity
        validity = max(0.0, round(100.0 - (invalid_units * 20.0 + invalid_values * 20.0 + wrong_category * 15.0), 1))
        
        # 4. Freshness (10% weight): Outdated/unsynchronized products penalize freshness
        freshness = max(0.0, round(100.0 - (outdated * 25.0), 1))
        
        # 5. Compliance (10% weight): Expired / missing certificates penalize compliance
        compliance = max(0.0, round(100.0 - (compliance_issues * 30.0), 1))
        
        # 6. Confidence (10% weight): Low confidence extractions penalize confidence
        confidence = max(0.0, round(100.0 - (low_confidence * 15.0), 1))

        # Overall Weighted Health Score (Deterministic formula)
        overall_health = round(
            (completeness * 0.30) +
            (consistency * 0.25) +
            (validity * 0.15) +
            (freshness * 0.10) +
            (compliance * 0.10) +
            (confidence * 0.10),
            1
        )

        return {
            "total_products": total_products,
            "products_monitored": total_products,
            "complete_products": complete_products,
            "products_with_issues": products_with_issues,
            
            # Flat counts
            "missing_data": missing_data,
            "conflicts": conflicts,
            "duplicates": duplicates,
            "outdated": outdated,
            "compliance_issues": compliance_issues,
            "invalid_units": invalid_units,
            "invalid_values": invalid_values,
            "wrong_category": wrong_category,
            "broken_relationships": broken_relationships,
            "image_mismatch": image_mismatch,
            "low_confidence": low_confidence,

            "overall_health": overall_health,
            "health_score": overall_health,

            "issues": {
                "missing_data": missing_data,
                "conflicts": conflicts,
                "duplicates": duplicates,
                "outdated": outdated,
                "invalid_units": invalid_units,
                "invalid_values": invalid_values,
                "wrong_category": wrong_category,
                "broken_relationships": broken_relationships,
                "compliance": compliance_issues,
                "image_data_mismatch": image_mismatch,
                "low_confidence": low_confidence
            },
            "components": {
                "completeness": completeness,
                "consistency": consistency,
                "validity": validity,
                "freshness": freshness,
                "compliance": compliance,
                "confidence": confidence
            }
        }

    @classmethod
    def _upsert_issue(
        cls,
        db: Session,
        product_id: int,
        issue_type: str,
        attribute_name: Optional[str],
        title: str,
        description: str,
        severity: str = "medium",
        evidence: Optional[str] = None,
        ai_rec: Optional[Dict[str, Any]] = None
    ) -> CatalogIssue:
        """
        Idempotently inserts or reopens an issue without creating duplicate records.
        """
        query = db.query(CatalogIssue).filter(
            CatalogIssue.product_id == product_id,
            CatalogIssue.issue_type == issue_type
        )
        if attribute_name is not None:
            query = query.filter(CatalogIssue.attribute_name == attribute_name)

        existing = query.first()
        if existing:
            # Update existing issue
            existing.title = title
            existing.description = description
            existing.severity = severity
            existing.evidence = evidence
            if ai_rec:
                existing.ai_recommendation = ai_rec
            if existing.status != "open":
                existing.status = "open"
                existing.resolved_at = None
                existing.resolved_by = None
                existing.resolution_value = None
            existing.updated_at = datetime.utcnow()
            return existing

        new_issue = CatalogIssue(
            product_id=product_id,
            issue_type=issue_type,
            attribute_name=attribute_name,
            title=title,
            description=description,
            severity=severity,
            status="open",
            evidence=evidence,
            ai_recommendation=ai_rec or {},
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(new_issue)
        return new_issue

    @classmethod
    def _is_equivalent(cls, val1: Optional[str], val2: Optional[str]) -> bool:
        if val1 is None or val2 is None:
            return False
        s1 = str(val1).strip().lower()
        s2 = str(val2).strip().lower()
        if s1 == s2:
            return True

        # Check unit normalization (e.g. 5500 W vs 5.5 kW)
        try:
            norm1 = UnitNormalizationService.normalize_attribute("Power", s1)
            norm2 = UnitNormalizationService.normalize_attribute("Power", s2)
            if norm1.get("normalized_value") is not None and norm2.get("normalized_value") is not None:
                if abs(norm1["normalized_value"] - norm2["normalized_value"]) < 0.001 and norm1.get("unit") == norm2.get("unit"):
                    return True
        except Exception:
            pass

        try:
            norm_v1 = UnitNormalizationService.normalize_attribute("Voltage", s1)
            norm_v2 = UnitNormalizationService.normalize_attribute("Voltage", s2)
            if norm_v1.get("normalized_value") is not None and norm_v2.get("normalized_value") is not None:
                if abs(norm_v1["normalized_value"] - norm_v2["normalized_value"]) < 0.001 and norm_v1.get("unit") == norm_v2.get("unit"):
                    return True
        except Exception:
            pass

        return False
