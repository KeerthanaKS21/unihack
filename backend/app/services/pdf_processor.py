import os
import re
import logging
from typing import Dict, Any, List, Optional
from pathlib import Path

logger = logging.getLogger("pdf_processor")

class PDFProcessor:
    """
    Modular PDF text & table extraction engine utilizing PyMuPDF (fitz) and pypdf.
    Preserves page numbers, extracts technical tables, and discovers key-value attributes.
    """

    @staticmethod
    def extract_pdf_content(file_path: str) -> Dict[str, Any]:
        """
        Extract text, technical tables, and structural attributes from a PDF file.
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

                # 1. Extract Tables if supported
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
                except Exception as table_err:
                    logger.debug(f"Table extraction notice for page {page_num}: {table_err}")

                # 2. Extract Key-Value Technical Attributes via Regex Patterns
                kv_patterns = [
                    (r'(?:Rated\s+)?Power\s*[:=]\s*([0-9\.]+\s*(?:kW|HP|W|MW))', 'Rated Power'),
                    (r'(?:Rated\s+)?Voltage\s*[:=]\s*([0-9\.]+\s*(?:V|kV|VAC|VDC)(?:\s*[\u00b1\+\-0-9%]+)?)', 'Rated Voltage'),
                    (r'(?:Rated\s+)?Speed\s*[:=]\s*([0-9\.]+\s*(?:RPM|rpm|r/min))', 'Synchronous Speed'),
                    (r'Frequency\s*[:=]\s*([0-9\.]+\s*(?:Hz|kHz))', 'Frequency'),
                    (r'(?:Protection|Enclosure|IP\s*Rating)\s*[:=]\s*(IP[0-9]{2})', 'Enclosure Protection'),
                    (r'(?:Total\s+)?Weight\s*[:=]\s*([0-9\.]+\s*(?:kg|lbs|g))', 'Unit Weight'),
                    (r'Efficiency\s*[:=]\s*([0-9\.]+\s*%)', 'Full Load Efficiency'),
                    (r'(?:Model|Part\s*Number|Type)\s*[:=]\s*([A-Z0-9\-_]{3,20})', 'Model Identifier'),
                    (r'(?:Mounting|Frame|Housing)\s*[:=]\s*([A-Za-z0-9\-\s]{3,20})', 'Mounting Type'),
                    (r'(?:Standard|Compliance)\s*[:=]\s*([A-Za-z0-9\-\s\/\.]{3,30})', 'Compliance Standard')
                ]

                for pattern, attr_name in kv_patterns:
                    match = re.search(pattern, page_text, re.IGNORECASE)
                    if match and attr_name not in extracted_attributes:
                        val = match.group(1).strip()
                        extracted_attributes[attr_name] = val
                        source_citations.append({
                            "page": page_num,
                            "attribute": attr_name,
                            "snippet": match.group(0).strip(),
                            "confidence": 0.98
                        })

                # 3. Create Page Snippets for Search Grounding
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
            # Fallback with pypdf
            try:
                from pypdf import PdfReader
                reader = PdfReader(file_path)
                total_pages = len(reader.pages)

                for page_idx, page in enumerate(reader.pages):
                    page_num = page_idx + 1
                    page_text = page.extract_text() or ""
                    full_text_corpus.append(page_text)

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

        # Summary calculation
        all_text = " ".join(full_text_corpus)
        summary = f"Processed {total_pages} page(s). Discovered {len(extracted_attributes)} specification attributes with layout grounding."

        return {
            "pages_count": max(1, total_pages),
            "extracted_summary": summary,
            "extracted_attributes": extracted_attributes,
            "source_citations": source_citations,
            "pages": extracted_pages
        }
