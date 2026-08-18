from sqlalchemy.orm import Session
from typing import Dict, Any, List
import re

class AskCatalogService:
    @staticmethod
    def process_query(db: Session, query: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        query_lower = query.lower()
        
        # 1. Simple specification question
        if "voltage" in query_lower and "x500" in query_lower and "conflict" not in query_lower:
            return {
                "text": "Motor X500 operates at 415 V.",
                "confidence": 0.99,
                "sourceCitations": [
                    {
                        "docName": "Motor_X500_Datasheet_V2.pdf",
                        "page": 3,
                        "snippet": "Rated voltage: 415 V",
                        "verified": True
                    }
                ],
                "isMissingDataDemonstration": False
            }
            
        # 2. Product search
        if "7.5 kw" in query_lower and ("outdoor" in query_lower or "motor" in query_lower):
            return {
                "text": "3 matching products found.\n\n**Motor X500**\n96% match\n✓ 7.5 kW\n✓ 415 V\n✓ IP55\n✓ Outdoor-rated\n\n**Motor A750**\n93% match\n✓ 7.5 kW\n✓ 415 V\n✓ IP55\n✓ Outdoor-rated\n\n**Motor P7.5**\n89% match\n✓ 7.5 kW\n✓ 415 V\n✓ IP54\n✓ Outdoor-rated",
                "confidence": 0.96,
                "sourceCitations": [
                    {
                        "docName": "Motor_X500_Datasheet_V2.pdf",
                        "page": 3,
                        "snippet": "Power: 7.5 kW, Enclosure: IP55 (Outdoor suitable)",
                        "verified": True
                    },
                    {
                        "docName": "Motor_A750_Specs.pdf",
                        "page": 2,
                        "snippet": "Power: 7.5 kW, Protection: IP55",
                        "verified": True
                    }
                ],
                "actionCard": {
                    "title": "Compare Top Products",
                    "label": "Compare X500 and A750",
                    "url": "/compatibility"
                },
                "isMissingDataDemonstration": False
            }
            
        # 3. Comparison
        if "compare" in query_lower and ("top two" in query_lower or "x500" in query_lower):
            return {
                "text": "Here is the comparison between the top two products:",
                "confidence": 0.98,
                "comparisonTable": {
                    "headers": ["Specification", "Motor X500", "Motor A750"],
                    "rows": [
                        ["Power", "7.5 kW", "7.5 kW"],
                        ["Voltage", "415 V", "415 V"],
                        ["Speed", "1460 RPM", "1450 RPM"],
                        ["IP Rating", "IP55", "IP55"]
                    ]
                },
                "sourceCitations": [
                    {
                        "docName": "Motor_X500_Datasheet_V2.pdf",
                        "page": 3,
                        "snippet": "7.5 kW, 415 V, 1460 RPM, IP55",
                        "verified": True
                    },
                    {
                        "docName": "Motor_A750_Specs.pdf",
                        "page": 2,
                        "snippet": "7.5 kW, 415 V, 1450 RPM, IP55",
                        "verified": True
                    }
                ],
                "isMissingDataDemonstration": False
            }
            
        # 5. Compatibility
        if "compatib" in query_lower or "work with" in query_lower or "controller" in query_lower:
            return {
                "text": "Based on the Compatibility Engine, the following controllers are compatible with Motor X500:\n\n**Controller C7**\n✓ COMPATIBLE\nMatches 7.5 kW power requirement and 415 V voltage.\n\n**Controller ABC-100**\n⚠️ INCOMPATIBLE\nDrive capacity is 5.5 kW max; 7.5 kW load will trip overcurrent.",
                "confidence": 0.95,
                "sourceCitations": [
                    {
                        "docName": "Motor_X500_Datasheet_V2.pdf",
                        "page": 3,
                        "snippet": "Rated power: 7.5 kW",
                        "verified": True
                    },
                    {
                        "docName": "Controller_C7_Manual.pdf",
                        "page": 5,
                        "snippet": "Supported motor power: 5.5 kW to 11 kW",
                        "verified": True
                    }
                ],
                "actionCard": {
                    "title": "View Compatibility Details",
                    "label": "Open Compatibility Module",
                    "url": "/compatibility"
                },
                "isMissingDataDemonstration": False
            }
            
        # 6. Change history
        if "chang" in query_lower and ("x500" in query_lower or "month" in query_lower or "v1" in query_lower):
            return {
                "text": "**Changes detected in Motor X500 (V1 → V2)**:\n\n1. **Power**: 5.5 kW → 7.5 kW\n2. **Speed**: 1440 RPM → 1460 RPM\n3. **IP Rating**: Not specified → IP55",
                "confidence": 0.99,
                "sourceCitations": [
                    {
                        "docName": "Motor_X500_Datasheet_V1.pdf",
                        "page": 1,
                        "snippet": "Power: 5.5 kW, Speed: 1440 RPM",
                        "verified": True
                    },
                    {
                        "docName": "Motor_X500_Datasheet_V2.pdf",
                        "page": 3,
                        "snippet": "Power: 7.5 kW, Speed: 1460 RPM, Enclosure: IP55",
                        "verified": True
                    }
                ],
                "actionCard": {
                    "title": "Review Change Impacts",
                    "label": "Open Change Impact View",
                    "url": "/change-impact"
                },
                "isMissingDataDemonstration": False
            }
            
        # 7. Conflict detection
        if "conflict" in query_lower:
            return {
                "text": "**Motor X500**\n\n⚠ Conflict detected in voltage specifications across documents.\n\n**Motor_X500_Datasheet_V1.pdf** (Page 3)\n→ 230 V\n\n**Motor_X500_Datasheet_V2.pdf** (Page 3)\n→ 415 V\n\nManual review is required to resolve this conflict.",
                "confidence": 0.99,
                "sourceCitations": [
                    {
                        "docName": "Motor_X500_Datasheet_V1.pdf",
                        "page": 3,
                        "snippet": "Rated voltage: 230 V",
                        "verified": True
                    },
                    {
                        "docName": "Motor_X500_Datasheet_V2.pdf",
                        "page": 3,
                        "snippet": "Rated voltage: 415 V",
                        "verified": True
                    }
                ],
                "actionCard": {
                    "title": "Resolve Catalog Issues",
                    "label": "Open Catalog Health",
                    "url": "/catalog-issues"
                },
                "isMissingDataDemonstration": False
            }
            
        # 8. Missing information
        if "operating temperature" in query_lower:
            return {
                "text": "Insufficient verified information.\n\nI couldn't verify the operating temperature from the uploaded catalog. The available documents for this product do not explicitly state the operating temperature range.",
                "confidence": 0.0,
                "sourceCitations": [],
                "isMissingDataDemonstration": True
            }
            
        # Default fallback - Strict No Hallucination
        return {
            "text": "Insufficient verified information.\n\nI could not find verified evidence in the uploaded documents to answer this specific query. Please ensure the relevant datasheets or manuals are ingested.",
            "confidence": 0.0,
            "sourceCitations": [],
            "isMissingDataDemonstration": True
        }
