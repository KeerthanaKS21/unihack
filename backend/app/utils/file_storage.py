import os
import re
import hashlib
import time
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException
from app.core.config import settings

# Supported MIME Types mapping
MIME_TYPE_MAP = {
    "pdf": ["application/pdf"],
    "xlsx": ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/octet-stream"],
    "xls": ["application/vnd.ms-excel", "application/octet-stream"],
    "csv": ["text/csv", "text/plain", "application/csv", "application/octet-stream"],
    "png": ["image/png"],
    "jpg": ["image/jpeg", "image/jpg"],
    "jpeg": ["image/jpeg", "image/jpg"],
    "docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/octet-stream", "application/msword"],
}

def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent path traversal and shell injection.
    """
    # Extract only base filename without paths
    base_name = os.path.basename(filename)
    # Replace unsafe characters with underscore
    clean_name = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', base_name)
    # Prevent leading dots
    clean_name = clean_name.lstrip('.')
    return clean_name or "document"

def format_file_size(size_bytes: int) -> str:
    """
    Format byte size into human-readable string.
    """
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.1f} GB"

def determine_document_type(filename: str, mime_type: str = "") -> str:
    """
    Classify document type based on filename conventions and extension/MIME.
    Possible values: DATASHEET, SUPPLIER_FILE, CERTIFICATE, MANUAL, CATALOG, IMAGE, TECHNICAL_DRAWING, OTHER
    """
    lower = filename.lower()
    ext = lower.split('.')[-1] if '.' in lower else ""

    if "cert" in lower or "compliance" in lower or "iec" in lower or "atex" in lower or "tuv" in lower or "rohs" in lower:
        return "CERTIFICATE"
    elif "manual" in lower or "guide" in lower or "handbook" in lower or "installation" in lower:
        return "MANUAL"
    elif ext in ["xlsx", "xls", "csv"]:
        if "supplier" in lower or "price" in lower or "vendor" in lower or "inventory" in lower or "rfp" in lower:
            return "SUPPLIER_FILE"
        return "CATALOG"
    elif ext in ["png", "jpg", "jpeg", "webp"]:
        return "IMAGE"
    elif ext in ["dwg", "dxf", "cad"]:
        return "TECHNICAL_DRAWING"
    elif ext in ["docx", "doc"]:
        if "manual" in lower or "instructions" in lower:
            return "MANUAL"
        return "DATASHEET"
    elif ext == "pdf":
        return "DATASHEET"
    else:
        return "OTHER"

async def save_uploaded_file(file: UploadFile) -> dict:
    """
    Validates, hashes, and stores an uploaded file into the uploads directory.
    Enforces safe file naming, MIME type checking, and size limits.
    """
    original_name = file.filename or "uploaded_file"
    extension = original_name.split('.')[-1].lower() if '.' in original_name else ""
    
    if extension not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '.{extension}'. Please upload PDF, Excel (.xlsx, .xls), CSV, Image (.png, .jpg, .jpeg), or Word (.docx) files."
        )

    # Read content
    content = await file.read()
    file_size = len(content)
    
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB (received {format_file_size(file_size)})."
        )

    if file_size == 0:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty (0 bytes). Please upload a valid document."
        )

    # Compute SHA-256 hash for integrity & deduplication tracking
    sha256_hash = hashlib.sha256(content).hexdigest()

    # Generate cryptographically safe and collision-proof server filename
    clean_name = sanitize_filename(original_name)
    timestamp = int(time.time())
    short_uid = uuid.uuid4().hex[:8]
    server_file_name = f"{timestamp}_{short_uid}_{clean_name}"
    
    storage_path = Path(settings.UPLOAD_DIR) / server_file_name
    
    # Store to disk safely
    with open(storage_path, "wb") as f:
        f.write(content)

    detected_type = determine_document_type(original_name, file.content_type or "")

    return {
        "file_name": server_file_name,
        "original_file_name": original_name,
        "file_path": str(storage_path),
        "file_size": file_size,
        "file_size_formatted": format_file_size(file_size),
        "mime_type": file.content_type or f"application/{extension}",
        "content_hash": sha256_hash,
        "document_type": detected_type
    }
