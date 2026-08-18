# VeriSpec AI | Backend Foundation (Phase 2)

AI-Powered Product Intelligence for Industrial Commerce — Backend REST APIs, PostgreSQL Schema, and Document Ingestion Foundation.

---

## Tech Stack
- **Framework**: Python 3.12, FastAPI, Pydantic v2
- **ORM & Database**: SQLAlchemy 2.0, Alembic, PostgreSQL (with SQLite zero-config development fallback)
- **File Storage**: Local `uploads/` directory with SHA-256 deduplication and secure sanitization
- **API Docs**: Swagger UI (`/docs`) & ReDoc (`/redoc`)

---

## Setup & Running Locally

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Initialize Database & Seed Data
```bash
python seed.py
```

### 4. Start the FastAPI Server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## API Endpoints Overview

| Module | Endpoint | Method | Description |
|---|---|:---:|---|
| **Dashboard** | `/api/dashboard/summary` | `GET` | Aggregated executive KPIs, quality trends & recent activity |
| **Documents** | `/api/documents/upload` | `POST` | Multipart document intake, safe storage & indexing |
| | `/api/documents` | `GET` | Paginated upload history with search and status filters |
| | `/api/documents/{id}` | `GET` | Detailed document metadata |
| **Products** | `/api/products` | `GET`, `POST` | Product catalog CRUD, pagination, and multi-field search |
| | `/api/products/{id}` | `GET`, `PUT`, `DELETE` | Product 360° specification detail and management |
| | `/api/products/{id}/versions` | `GET`, `POST` | Version history management (`v1.4`, `v2.0`) |
| | `/api/products/{id}/changes` | `GET` | Specification deltas between versions |
| **Change Impacts** | `/api/change-impacts` | `GET` | Cross-domain operational impact matrix |
| | `/api/change-impacts/pending-count` | `GET` | Unreviewed impacts notification counter |
| | `/api/change-impacts/{id}/review` | `POST` | Human-in-the-loop impact sign-off |
| **Catalog Health** | `/api/catalog-health` | `GET` | Live 9-vector data hygiene & health score calculation |
| **Catalog Issues** | `/api/catalog-issues` | `GET` | Conflict, missing data, and duplicate resolution workspace |
| | `/api/catalog-issues/{id}/resolve` | `POST` | 1-click issue resolution with chosen correction value |
| **Suppliers** | `/api/suppliers` | `GET`, `POST` | Supplier partner directory |
| | `/api/supplier-products` | `GET`, `POST` | Parametric procurement search with constraint violations |
| **Certificates** | `/api/certificates` | `GET`, `POST` | Compliance standards tracking (CE, RoHS, ATEX) |
| | `/api/certificates/expiring` | `GET` | Compliance expiry monitoring (< 90 days) |
| **Compatibility** | `/api/compatibility/{id}` | `GET` | 4-node drivetrain topology & multi-parameter checks |
| **Quotes** | `/api/quotes` | `GET`, `POST` | Industrial RFQ and quotation management |
| | `/api/quotes/{id}/approve` | `POST` | Quotation dispatch sign-off |
| | `/api/quotes/{id}/request-revision` | `POST` | Live revision simulation (quantity & lead time adjustments) |
