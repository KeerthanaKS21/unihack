# VeriSpec AI | Industrial Product Intelligence Platform

**AI-Powered Product Intelligence for Industrial Commerce** unifies fragmented datasheets, PDFs, supplier catalogs, and ERP records into a single verified product intelligence layer.

---

## Project Structure

```
unihack/
├── backend/                        # FastAPI REST API & Database Foundation
│   ├── app/
│   │   ├── core/                   # Configuration & environment settings
│   │   ├── db/                     # Database engine, models, and migrations
│   │   ├── schemas/                # Pydantic validation schemas
│   │   ├── routes/                 # FastAPI route controllers
│   │   ├── services/               # Modular business logic services
│   │   └── utils/                  # Safe file storage & hashing
│   ├── alembic/                    # Database migration scripts
│   ├── uploads/                    # Document intake storage
│   ├── requirements.txt            # Python dependencies
│   ├── seed.py                     # Realistic industrial dataset seeder
│   └── README.md                   # Backend documentation
│
├── frontend/                       # Next.js 14 Web Interface
│   ├── src/
│   │   ├── app/                    # Next.js App Router (13 core modules)
│   │   ├── components/             # Reusable UI components, modals & drawers
│   │   ├── context/                # Reactive state & backend sync store
│   │   ├── lib/                    # REST API client
│   │   ├── mock/                   # Realistic baseline industrial data
│   │   └── types/                  # TypeScript interface definitions
│   ├── package.json
│   ├── tailwind.config.ts
│   └── README.md                   # Frontend documentation
```

---

## Quick Start

### 1. Start the Backend API
```bash
cd backend
pip install -r requirements.txt
python seed.py
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- **Swagger Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Start the Frontend App
```bash
cd frontend
npm install
npm run dev
```
- **Web Interface**: [http://localhost:3000](http://localhost:3000)
