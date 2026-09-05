# Intelligent Land Record Digitization & Validation System (NovaaX)

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF.svg)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20PostGIS-3ECF8E.svg)](https://supabase.com/)
[![EasyOCR](https://img.shields.io/badge/EasyOCR-Multilingual%20(EN%2FHI%2FMR)-orange.svg)](https://github.com/JaidedAI/EasyOCR)

NovaaX is an AI-assisted, human-in-the-loop land record digitization and validation platform. It converts legacy physical land documents (scanned PDFs, 7/12 extracts, khatauni records, handwritten documents, and cadastral maps) into structured, cryptographically validated, and GIS-mapped digital land records.

---

## 🌟 Key Features

- **Multilingual OCR & Preprocessing:** Local EasyOCR engine supporting English (`en`), Hindi (`hi`), and Marathi (`mr`) with OpenCV/Pillow preprocessing (RGBA compositing, bilateral noise reduction, adaptive contrast enhancement, and stroke variance handwriting detection).
- **Structured Schema Extraction:** Rule-based and NLP extraction of 12 core land record fields: `landowner_name`, `survey_number`, `khata_number`, `khasra_number`, `plot_area`, `village`, `tehsil`, `district`, `state`, `land_classification`, `ownership_type`, `mutation_number`, and `registration_number`.
- **Field-Level Confidence Scoring:** Granular confidence scoring per field (`HIGH ≥ 90%`, `MEDIUM 70–89%`, `LOW < 70%`).
- **Human-in-the-Loop Verification Queue:** Low-confidence and handwritten extractions are automatically routed to human verification officers with side-by-side document comparison, delta correction tracking, and approval/rejection workflows.
- **Independent Business Rule Engine:** Validates mandatory fields, positive numeric plot areas, duplicate survey numbers, and cross-references against master land records.
- **Cadastral GIS Mapping:** Interactive Leaflet GIS viewer displaying parcel polygons, boundary coordinates, landholder details, and ownership statuses.
- **Role-Based Access Control (RBAC):** Built-in roles (`Citizen`, `Data Entry Operator`, `Verification Officer`, `Administrator`) with geographic scoping and audit trails.
- **Tamper-Evident Audit Logging:** Comprehensive action logging recording timestamps, actors, IP addresses, stages, and field modification deltas.
- **Executive Analytics:** Real-time metrics on digitization throughput, confidence distribution, queue latency, and regional digitization progress.

---

## 🏗 System Architecture

```text
[ Physical Land Records / Scans / PDFs ]
                   │
                   ▼
┌────────────────────────────────────────────────────────┐
│                   Frontend (React + Vite)              │
│  - Citizen Portal      - Verification Officer Queue    │
│  - Digitized Records   - Cadastral GIS (Leaflet)       │
│  - Analytics Dashboard - Tamper-Evident Audit Viewer   │
└──────────────────────────┬─────────────────────────────┘
                           │ REST / JSON (JWT / RBAC)
                           ▼
┌────────────────────────────────────────────────────────┐
│             Backend (FastAPI Modular Monolith)         │
│  ├── /api/v1/documents    (Upload & storage ingestion) │
│  ├── /api/v1/processing   (Job lifecycle orchestration)│
│  ├── /api/v1/records      (Land record CRUD & search)  │
│  ├── /api/v1/verification (Review queue & deltas)      │
│  ├── /api/v1/validation   (Independent rule engine)   │
│  ├── /api/v1/gis          (Spatial coordinates API)    │
│  ├── /api/v1/analytics    (Throughput & quality KPIs)  │
│  └── /api/v1/audit        (Audit log event streaming)  │
└──────────────┬───────────────────────────┬─────────────┘
               │                           │
               ▼                           ▼
┌──────────────────────────────┐ ┌───────────────────────────┐
│     AI / OCR Pipeline        │ │   Supabase Data Layer     │
│  - Pillow / OpenCV Preproc   │ │  - PostgreSQL + PostGIS   │
│  - EasyOCR (EN, HI, MR)      │ │  - Row Level Security     │
│  - RuleNLP Extractor         │ │  - Storage (land-records) │
│  - Handwriting Classifier    │ │  - Master Land Records    │
└──────────────────────────────┘ └───────────────────────────┘
```

---

## 📁 Repository Structure

```text
NovaaX/
├── backend/                      # FastAPI Modular Monolith
│   ├── app/
│   │   ├── api/v1/               # Versioned REST controllers
│   │   │   └── endpoints/        # Domain route handlers
│   │   ├── audit/                # Audit event service
│   │   ├── auth/                 # RBAC & dependency injection
│   │   ├── core/                 # Config, errors, Supabase client
│   │   ├── documents/            # Document ingestion & storage
│   │   ├── extraction/           # EasyOCR, RuleNLP, Preprocessing
│   │   ├── processing/           # Processing pipeline state machine
│   │   ├── validation/           # Business rule engine
│   │   └── verification/         # Verification queue & delta tracker
│   ├── tests/                    # Pytest test suite (19 unit/integration tests)
│   ├── main.py                   # FastAPI application factory
│   ├── requirements.txt          # Python dependencies
│   ├── Dockerfile                # Container definition
│   ├── Procfile                  # Process file for Python web hosts
│   └── .env.example              # Backend environment template
│
├── frontend/                     # React 18 + Vite TypeScript SPA
│   ├── src/
│   │   ├── components/           # Reusable UI components & layouts
│   │   ├── context/              # Auth & Language Contexts
│   │   ├── pages/                # Page views (Records, Queue, GIS, Analytics, etc.)
│   │   ├── services/             # API client & mock services
│   │   ├── types/                # Domain TypeScript models
│   │   ├── App.tsx               # Client router & navigation
│   │   └── main.tsx              # Application entrypoint
│   ├── public/                   # Static assets
│   ├── package.json              # Frontend dependencies & scripts
│   ├── tailwind.config.js        # Styling configuration
│   ├── vercel.json               # Vercel SPA rewrite configuration
│   └── .env.example              # Frontend environment template
│
├── sample-data/                  # Multilingual sample test documents
│   ├── documents/                # Sample files (EN, HI, MR, Handwritten)
│   ├── expected-results/         # Expected extraction baselines
│   └── master-data/              # Reference survey & cadastral data
│
├── scripts/                      # Utility scripts
├── run_samples_pipeline.py       # Standalone pipeline runner for 4 sample docs
├── pytest.ini                    # Pytest configuration
├── .gitignore                    # Version control exclusions
├── .env.example                  # Root unified environment template
└── README.md                     # Project documentation
```

---

## ⚙️ Environment Variables

### Root / Unified (`.env.example`)

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `ENVIRONMENT` | Application mode (`development`, `production`) | `development` |
| `BACKEND_HOST` | FastAPI host bind address | `0.0.0.0` |
| `BACKEND_PORT` | FastAPI port | `8000` |
| `BACKEND_CORS_ORIGINS` | Comma-separated list or JSON array of allowed origins | `http://localhost:5173,http://localhost:3000` |
| `SUPABASE_URL` | Supabase project URL | `https://your-project.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase public anonymous API key | `your-anon-key` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role secret (backend only) | `your-service-role-key` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://...` |
| `OCR_PROVIDER` | OCR engine (`easyocr` for real inference, `mock` for fast CI) | `easyocr` |
| `EXTRACTION_PROVIDER` | Structured extraction engine (`rule_nlp`, `mock`) | `rule_nlp` |
| `OCR_LANGUAGES` | Language codes for EasyOCR | `en,hi,mr` |
| `VITE_API_BASE_URL` | Base API URL used by the frontend | `http://localhost:8000/api/v1` |

---

## 🚀 Local Development Setup

### Prerequisites
- **Node.js**: v18.0 or higher
- **Python**: v3.10 or higher
- **Git**

### 1. Clone & Configure
```bash
git clone https://github.com/your-username/NovaaX.git
cd NovaaX

# Copy environment template
cp .env.example .env
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Linux / macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
Interactive API documentation will be available at `http://localhost:8000/docs`.

### 3. Frontend Setup
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
The web application will be running at `http://localhost:5173`.

---

## 🧪 Testing & Sample Pipeline

### Run Unit & Integration Tests (Pytest)
```powershell
$env:PYTHONPATH="backend"; $env:PYTHONIOENCODING="utf-8"
backend\venv\Scripts\pytest
```
*Result: 19 test cases covering API routes, OCR extraction, Devanagari parsing, confidence calculation, and handwriting classification.*

### Run Sample Documents Pipeline (Offline)
Process all 4 sample documents (`sample_english.jpg`, `sample_hindi.jpg`, `sample_marathi.png`, and `sample_handwritten.jpg`):

```powershell
# Real EasyOCR Multilingual Inference
$env:PYTHONPATH="backend"; $env:PYTHONIOENCODING="utf-8"
backend\venv\Scripts\python run_samples_pipeline.py

# Fast Headless Mock Mode
$env:OCR_PROVIDER="mock"
backend\venv\Scripts\python run_samples_pipeline.py
```

---

## 🌐 Deployment Guide

### Frontend Deployment (Vercel)

1. Connect your GitHub repository to [Vercel](https://vercel.com).
2. Set the **Root Directory** to `frontend`.
3. Set **Framework Preset** to `Vite`.
4. Configure the environment variables in the Vercel project dashboard:
   - `VITE_API_BASE_URL` = `https://your-backend-api.onrender.com/api/v1`
   - `VITE_SUPABASE_URL` = `https://your-project.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `your-supabase-anon-key`
5. Deploy. The included [`frontend/vercel.json`](file:///c:/Users/aksha/Desktop/NovaaX/frontend/vercel.json) handles client-side SPA routing rewrites automatically.

### Backend Deployment (Render / Railway / Fly / Cloud Run)

#### Option A: Docker Container
Use the provided [`backend/Dockerfile`](file:///c:/Users/aksha/Desktop/NovaaX/backend/Dockerfile):
```bash
cd backend
docker build -t novaax-backend .
docker run -p 8000:8000 --env-file ../.env novaax-backend
```

#### Option B: Native Python Web Service (Render / Railway)
1. Point service root to `backend`.
2. Build Command: `pip install -r requirements.txt`
3. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Set Environment Variables:
   - `ENVIRONMENT` = `production`
   - `BACKEND_CORS_ORIGINS` = `https://your-frontend.vercel.app`
   - `SUPABASE_URL` = `https://your-project.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = `your-service-role-key`
   - `OCR_PROVIDER` = `easyocr` (or `mock` for lightweight tiers)

---

## 🛡 Security & Compliance

- **Zero Hardcoded Secrets**: All sensitive keys (service role keys, DB passwords) are environment-driven.
- **RBAC & Authorization**: Enforced authoritatively on the backend using dependency injection (`get_current_user`).
- **Human-in-the-Loop**: Machine-generated extractions are candidates until verified and approved by authorized personnel.
- **Complete Lineage**: Full audit trail preserved across Document → OCR → Extraction → Validation → Correction → Approval.

---

## 📜 License

Developed for the Smart India Hackathon (SIH) MVP.
All rights reserved.
