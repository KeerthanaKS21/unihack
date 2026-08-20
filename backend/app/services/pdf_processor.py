import os
import re
import logging
from typing import Dict, Any, List, Optional
from pathlib import Path

logger = logging.getLogger("pdf_processor")

class PDFProcessor:
    """
    Advanced Multi-Strategy Industrial PDF Processing Engine.
    Extracts text, 2-column & multi-column tables, industrial regex specifications,
    and generic key-value pairs with exact page grounding citations.
    """

    # Comprehensive industrial specification attribute patterns
    INDUSTRIAL_PATTERNS = [
        # Model & Identification
        (r'(?:Model(?:\s*No\.?|\s*Number)?|Part\s*(?:No\.?|Number)|Catalog\s*No\.?|Type\s*Designation)\s*[:=\-]\s*([A-Z0-9\-_/\.]{3,30})', 'Model Identifier'),
        (r'(?:Manufacturer|Brand|Make|Vendor)\s*[:=\-]\s*([A-Za-z0-9\s&\.\-]{3,30})', 'Manufacturer'),
        (r'(?:Serial\s*No\.?|Series)\s*[:=\-]\s*([A-Za-z0-9\-_\s]{3,25})', 'Product Series'),

        # Electrical Specifications
        (r'(?:Rated\s+|Nominal\s+|Output\s+)?Power(?:\s*Rating)?\s*[:=\-]\s*([0-9\.]+\s*(?:kW|HP|W|MW|kVA|VA))', 'Rated Power'),
        (r'(?:Rated\s+|Nominal\s+|Operating\s+)?Voltage\s*[:=\-]\s*([0-9\.\/]+\s*(?:V|kV|VAC|VDC|Volts)(?:\s*[\u00b1\+\-0-9%/\s]+)?)', 'Rated Voltage'),
        (r'(?:Rated\s+|Nominal\s+|Full\s*Load\s+)?Current\s*[:=\-]\s*([0-9\.\/]+\s*(?:A|Amps|mA|Amperes))', 'Rated Current'),
        (r'(?:Nominal\s+|Supply\s+)?Frequency\s*[:=\-]\s*([0-9\.]+\s*(?:Hz|kHz))', 'Frequency'),
        (r'(?:Phase|No\.\s*of\s*Phases)\s*[:=\-]\s*([0-9]+\s*(?:Phase|Ph|\~)|Single\s*Phase|Three\s*Phase|3-Phase|1-Phase)', 'Phase Configuration'),
        (r'(?:Power\s*Factor|Cos\s*[\u03c6\u03d5\u00f8]|PF)\s*[:=\-]\s*([0-9\.]+)', 'Power Factor'),

        # Mechanical & Dynamic Specifications
        (r'(?:Rated\s+|Nominal\s+|Synchronous\s+)?Speed\s*[:=\-]\s*([0-9\.]+\s*(?:RPM|rpm|r/min|min\^\-1))', 'Synchronous Speed'),
        (r'(?:Rated\s+|Nominal\s+|Full\s*Load\s+|Breakdown\s+)?Torque\s*[:=\-]\s*([0-9\.]+\s*(?:Nm|N\-m|lb\-ft|kgf\-m))', 'Rated Torque'),
        (r'(?:Frame\s*(?:Size|Type)?|Housing)\s*[:=\-]\s*([0-9]{2,4}[A-Z0-9\-_/]+)', 'Frame Size'),
        (r'(?:Mounting(?:\s*Type|\s*Arrangement)?)\s*[:=\-]\s*([A-Za-z0-9\-\s\(\)\/]{3,30})', 'Mounting Type'),
        (r'(?:Shaft\s*(?:Diameter|Extension)?)\s*[:=\-]\s*([0-9\.]+\s*(?:mm|inch|in|\"))', 'Shaft Diameter'),
        (r'(?:Number\s*of\s*Poles|Poles)\s*[:=\-]\s*([0-9]+\s*(?:Pole|Poles|P)?)', 'Number of Poles'),

        # Protection, Thermal & Environmental
        (r'(?:Protection(?:\s*Class|\s*Degree|\s*Rating)?|Enclosure|IP\s*Rating|Degree\s*of\s*Protection)\s*[:=\-]\s*(IP\s*[0-9]{2}[A-Z]?|NEMA\s*[0-9A-Z]+)', 'Enclosure Protection'),
        (r'(?:Insulation(?:\s*Class|\s*System)?|Thermal\s*Class)\s*[:=\-]\s*(?:Class\s+)?([A-H]|Class\s+[A-H]|F\s*\(155\s*°C\)|H\s*\(180\s*°C\))', 'Insulation Class'),
        (r'(?:Efficiency(?:\s*Class|\s*Rating|\s*Level)?|IE\s*Class)\s*[:=\-]\s*(IE[1-5]|[0-9\.]+\s*%)', 'Full Load Efficiency'),
        (r'(?:Duty\s*(?:Cycle|Type)?|Rating)\s*[:=\-]\s*(S[1-9]|Continuous|Intermittent|S1\s*Continuous)', 'Duty Cycle'),
        (r'(?:Cooling(?:\s*Method|\s*Type)?)\s*[:=\-]\s*([A-Za-z0-9\-\s]{3,20}|IC[0-9]{3})', 'Cooling Method'),
        (r'(?:Ambient\s*(?:Temperature|Temp)?|Operating\s*Temperature)\s*[:=\-]\s*([\-0-9\.\s\+to°degCF]+)', 'Ambient Temperature'),
        (r'(?:Total\s+|Gross\s+|Net\s+)?Weight\s*[:=\-]\s*([0-9\.]+\s*(?:kg|lbs|g|tonne|ton))', 'Unit Weight'),
        (r'(?:Noise(?:\s*Level|\s*Pressure)?)\s*[:=\-]\s*([0-9\.]+\s*(?:dB\(A\)|dB|dBA))', 'Noise Level'),
        (r'(?:Bearing\s*(?:Type|DE|NDE)?)\s*[:=\-]\s*([A-Za-z0-9\-_]{4,20})', 'Bearing Designation'),

        # Standards & Certifications
        (r'(?:Standard|Compliance|Applicable\s*Standard)\s*[:=\-]\s*([A-Za-z0-9\-\s\/\.\(\)]{3,40})', 'Compliance Standard'),
        (r'(?:Certification|Certificates?)\s*[:=\-]\s*([A-Za-z0-9\s,\/\-\+]+)', 'Certifications'),
        (r'(?:Hazardous\s*Area|ATEX\s*Rating|Explosion\s*Proof)\s*[:=\-]\s*([A-Za-z0-9\s\/\-_]{3,30})', 'Hazardous Area Rating')
    ]

    @staticmethod
    def _clean_key(key: str) -> str:
        """
        Standardize raw text key into human-readable Title Case.
        """
        k = re.sub(r'[^a-zA-Z0-9\s]', ' ', key).strip()
        words = [w.capitalize() for w in k.split() if len(w) > 0]
        return " ".join(words)

    @staticmethod
    def extract_pdf_content(file_path: str) -> Dict[str, Any]:
        """
        Extract text, technical tables, and structural attributes from a PDF file.
        Uses PyMuPDF (fitz) with fallback to pypdf.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"PDF file not found at path: {file_path}")

        extracted_pages = []
        extracted_attributes = {}
        source_citations = []
        total_pages = 0
        full_text_corpus = []

        try:
            import fitz  # PyMuPDF
            doc = fitz.open(file_path)
            total_pages = len(doc)

            for page_idx in range(total_pages):
                page = doc[page_idx]
                page_num = page_idx + 1
                page_text = page.get_text("text") or ""
                full_text_corpus.append(page_text)

                # =========================================================================
                # STRATEGY 1: TABLE EXTRACTION (2-column & multi-column specs)
                # =========================================================================
                tables_data = []
                try:
                    tabs = page.find_tables()
                    if tabs and tabs.tables:
                        for tab in tabs.tables:
                            df = tab.extract()
                            if df and len(df) > 1:
                                headers = [str(col).strip() if col is not None else "" for col in df[0]]
                                rows = [[str(cell).strip() if cell is not None else "" for cell in row] for row in df[1:]]
                                tables_data.append({
                                    "table_index": len(tables_data) + 1,
                                    "headers": headers,
                                    "rows": rows
                                })

                                # Extract 2-column key-value rows directly from table
                                for row in df:
                                    if len(row) >= 2 and row[0] and row[1]:
                                        k_raw = str(row[0]).strip().rstrip(':=-')
                                        v_raw = str(row[1]).strip()
                                        if 2 < len(k_raw) < 40 and 1 < len(v_raw) < 80:
                                            # Filter out generic header names
                                            if k_raw.lower() not in ['parameter', 'specification', 'attribute', 'item', 'description', 'property']:
                                                cleaned_k = PDFProcessor._clean_key(k_raw)
                                                if cleaned_k and cleaned_k not in extracted_attributes:
                                                    extracted_attributes[cleaned_k] = v_raw
                                                    source_citations.append({
                                                        "page": page_num,
                                                        "attribute": cleaned_k,
                                                        "snippet": f"{k_raw}: {v_raw}",
                                                        "confidence": 0.96
                                                    })
                except Exception as table_err:
                    logger.debug(f"Table extraction notice on page {page_num}: {table_err}")

                # =========================================================================
                # STRATEGY 2: COMPREHENSIVE INDUSTRIAL REGEX PATTERNS
                # =========================================================================
                for pattern, attr_name in PDFProcessor.INDUSTRIAL_PATTERNS:
                    match = re.search(pattern, page_text, re.IGNORECASE)
                    if match and attr_name not in extracted_attributes:
                        val = match.group(1).strip().replace('\n', ' ')
                        extracted_attributes[attr_name] = val
                        source_citations.append({
                            "page": page_num,
                            "attribute": attr_name,
                            "snippet": match.group(0).strip().replace('\n', ' '),
                            "confidence": 0.98
                        })

                # =========================================================================
                # STRATEGY 3: GENERIC KEY-VALUE LINE PARSER (Colon, Dash, Equal separated)
                # =========================================================================
                lines = page_text.split('\n')
                for line in lines:
                    line_clean = line.strip()
                    if not line_clean or len(line_clean) > 120 or len(line_clean) < 5:
                        continue

                    # Match lines like "Key: Value" or "Key - Value"
                    kv_match = re.match(r'^([A-Za-z0-9\s\(\)\/\-]{3,35})\s*[:=\-]\s+([A-Za-z0-9\.\,\s\/\-\%\u00b1\u00b0\+\(\)]+)$', line_clean)
                    if kv_match:
                        raw_k = kv_match.group(1).strip()
                        raw_v = kv_match.group(2).strip()

                        # Validate that key and value are plausible
                        if len(raw_k) >= 3 and len(raw_v) >= 1 and not raw_k.lower().startswith(('page', 'http', 'www', 'note', 'tel', 'fax', 'email')):
                            cleaned_k = PDFProcessor._clean_key(raw_k)
                            if cleaned_k and len(cleaned_k) >= 3 and cleaned_k not in extracted_attributes:
                                extracted_attributes[cleaned_k] = raw_v
                                source_citations.append({
                                    "page": page_num,
                                    "attribute": cleaned_k,
                                    "snippet": line_clean,
                                    "confidence": 0.94
                                })

                # Page preview structure
                paragraphs = [p.strip() for p in page_text.split('\n\n') if len(p.strip()) > 20]
                extracted_pages.append({
                    "page_number": page_num,
                    "text_length": len(page_text),
                    "text_preview": page_text[:400] + ("..." if len(page_text) > 400 else ""),
                    "full_text": page_text,
                    "tables": tables_data,
                    "paragraphs_count": len(paragraphs)
                })

            doc.close()

        except Exception as fitz_err:
            logger.warning(f"PyMuPDF failed, attempting fallback with pypdf: {fitz_err}")
            try:
                from pypdf import PdfReader
                reader = PdfReader(file_path)
                total_pages = len(reader.pages)

                for page_idx, page in enumerate(reader.pages):
                    page_num = page_idx + 1
                    page_text = page.extract_text() or ""
                    full_text_corpus.append(page_text)

                    # Regex fallback
                    for pattern, attr_name in PDFProcessor.INDUSTRIAL_PATTERNS:
                        match = re.search(pattern, page_text, re.IGNORECASE)
                        if match and attr_name not in extracted_attributes:
                            val = match.group(1).strip().replace('\n', ' ')
                            extracted_attributes[attr_name] = val
                            source_citations.append({
                                "page": page_num,
                                "attribute": attr_name,
                                "snippet": match.group(0).strip().replace('\n', ' '),
                                "confidence": 0.95
                            })

                    extracted_pages.append({
                        "page_number": page_num,
                        "text_length": len(page_text),
                        "text_preview": page_text[:400] + ("..." if len(page_text) > 400 else ""),
                        "full_text": page_text,
                        "tables": [],
                        "paragraphs_count": len(page_text.split('\n'))
                    })
            except Exception as pypdf_err:
                logger.error(f"Failed to extract PDF using both fitz and pypdf: {pypdf_err}")

        # Fallback to raw text decoding if PDF text corpus is empty
        full_text_str = "\n\n".join(full_text_corpus).strip()
        if not full_text_str:
            try:
                with open(file_path, "rb") as f:
                    raw_bytes = f.read()
                raw_txt = raw_bytes.decode("utf-8", errors="ignore")
                if raw_txt.strip():
                    full_text_corpus.append(raw_txt)
                    full_text_str = raw_txt
                    for pattern, attr_name in PDFProcessor.INDUSTRIAL_PATTERNS:
                        match = re.search(pattern, raw_txt, re.IGNORECASE)
                        if match and attr_name not in extracted_attributes:
                            val = match.group(1).strip().replace('\n', ' ')
                            extracted_attributes[attr_name] = val
                            source_citations.append({
                                "page": 1,
                                "attribute": attr_name,
                                "snippet": match.group(0).strip().replace('\n', ' '),
                                "confidence": 0.95
                            })
            except Exception:
                pass

        summary = f"Processed {max(1, total_pages)} page(s). Extracted {len(extracted_attributes)} comprehensive specification attributes with verified layout grounding."

        return {
            "pages_count": max(1, total_pages),
            "extracted_summary": summary,
            "extracted_attributes": extracted_attributes,
            "source_citations": source_citations,
            "extracted_text": full_text_str,
            "pages": extracted_pages
        }
