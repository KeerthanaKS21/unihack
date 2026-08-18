import os
import re
import hashlib
import time
from pathlib import Path
from fastapi import UploadFile, HTTPException
from app.core.config import settings

def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent path traversal and shell injection.
    """
    # Remove directory paths
    base_name = os.path.basename(filename)
    # Replace non-alphanumeric (except dot, dash, underscore)
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

def determine_document_type(filename: str) -> str:
    """
    Determine document category based on filename conventions.
    """
    lower = filename.lower()
    if "cert" in lower or "compliance" in lower or "iec" in lower or "atex" in lower:
        return "CERTIFICATE"
    elif "manual" in lower or "guide" in lower or "user" in lower:
        return "MANUAL"
    elif "catalog" in lower or "price" in lower or "supplier" in lower:
        return "CATALOG"
    elif lower.endswith(('.png', '.jpg', '.jpeg', '.webp')):
        return "IMAGE"
    else:
        return "DATASHEET"

async def save_uploaded_file(file: UploadFile) -> dict:
    """
    Validates, hashes, and stores an uploaded file into the uploads directory.
    Returns metadata dict.
    """
    original_name = file.filename or "uploaded_file"
    extension = original_name.split('.')[-1].lower() if '.' in original_name else ""
    
    if extension not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File extension '.{extension}' is not permitted. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    # Read content
    content = await file.read()
    file_size = len(content)
    
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File size ({format_file_size(file_size)}) exceeds maximum limit of {settings.MAX_FILE_SIZE_MB}MB"
        )

    # Compute SHA-256 hash
    sha256_hash = hashlib.sha256(content).hexdigest()

    # Generate safe server-side file name
    clean_name = sanitize_filename(original_name)
    timestamp = int(time.time())
    server_file_name = f"{timestamp}_{clean_name}"
    
    storage_path = Path(settings.UPLOAD_DIR) / server_file_name
    
    with open(storage_path, "wb") as f:
        f.write(content)

    return {
        "file_name": server_file_name,
        "original_file_name": original_name,
        "file_path": str(storage_path),
        "file_size": file_size,
        "file_size_formatted": format_file_size(file_size),
        "mime_type": file.content_type or "application/octet-stream",
        "content_hash": sha256_hash,
        "document_type": determine_document_type(original_name)
    }
