# IT LearnHub – Student Learning and Exam Preparation Portal

**IT LearnHub** is a comprehensive, responsive, full-stack academic web application designed specifically for Information Technology students and departmental faculty.

> **Important Architecture Notice**: This is a strictly **NON-AI** project. It does not use any LLMs, Ollama, OpenAI APIs, embeddings, vector databases, or AI-generated answers. All features are built using conventional database design, full-text indexes, deterministic scoring algorithms, keyword pattern matching, and verified faculty curricula.

---

## 🚀 Features

### 🎓 For Students
- **Dashboard**: Enrolled semester overview, available tests, assignment deadlines, cumulative average score, and recent activity logs.
- **Study Materials & Notes**: Browse materials organized hierarchically by **Semester → Subject → Unit**. Supports direct downloading of notes (`.pdf`, `.docx`, `.pptx`, `.txt`).
- **Full-Text Topic Search**: Perform instant keyword searches across text extracted from uploaded syllabus notes and lecture slides with contextual snippet previews.
- **Question Bank & Practice**: Practice examination questions unit-by-unit with an interactive **Reveal Model Answer & Solution** toggle.
- **Assignment Draft Workspace**: Draft problem set solutions with real-time word/character count and automated debounced background saving.
- **Live MCQ Examination Engine**:
  - Configurable countdown timer with visual urgency alerts (< 5 minutes).
  - Dynamic Question Navigator Palette (Answered, Unanswered, Flagged for Review).
  - Auto-submission on timer expiry.
  - Negative marking penalty calculations.
- **Detailed Evaluation Reports**: Post-exam question-by-question breakdown comparing student selections against verified answer keys with explanations.
- **Score Progression Tracking**: Historical attempt log and performance trends rendered via Recharts.

### 🛡️ For Faculty & Department Administrators
- **Academic Hierarchy Management**: Complete CRUD operations for Semesters, Subjects, and Units.
- **Material Ingestion & Text Extraction**: Upload `.pdf` (PyMuPDF), `.docx` (python-docx), `.pptx` (python-pptx), and `.txt` files with automated text extraction and indexing.
- **Status Controls**: Toggle study materials between published and draft states.
- **Online Exam Builder**: Schedule exams, define duration, total marks, passing thresholds, negative penalties, and add MCQ questions with option keys.
- **Faculty Analytics Dashboard**: Real-time MongoDB aggregation metrics displaying student enrollment, total attempts, and average score distributions.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, Lucide React, Recharts, Axios, React Router v7 |
| **Backend** | Python 3.14, FastAPI, Motor, PyMongo, Pydantic v2 |
| **Document Processing** | PyMuPDF (PDF), python-docx (Word), python-pptx (PowerPoint) |
| **Security** | JWT (JSON Web Tokens), Direct Bcrypt Password Hashing |
| **Database** | MongoDB (with text indexes on titles, extracted text, and descriptions) |

---

## 📦 Project Structure

```
learning platform/
├── backend/
│   ├── app/
│   │   ├── core/         # Security, JWT tokens, config
│   │   ├── database/     # Motor client, connection lifecycle, indexes
│   │   ├── models/       # Database models
│   │   ├── routers/      # Auth, academic, materials, assignments, exams, analytics
│   │   ├── schemas/      # Pydantic request/response schemas
│   │   ├── services/     # Document text extractors (PDF, DOCX, PPTX, TXT)
│   │   └── utils/        # MongoDB BSON serializers
│   ├── tests/            # Pytest test suite (100% passing)
│   ├── uploads/          # Uploaded course materials
│   ├── seed.py           # Database initialisation and demo dataset
│   ├── requirements.txt  # Python dependencies
│   └── .env              # Backend runtime environment configuration
├── frontend/
│   ├── src/
│   │   ├── api/          # Axios client and API service modules
│   │   ├── components/   # Layout (Navbar, Sidebar), UI cards, badges
│   │   ├── context/      # Authentication context
│   │   └── pages/        # All student and faculty views
│   ├── package.json      # Frontend dependencies
│   └── vite.config.js    # Vite configuration with API proxy
├── .env.example          # Environment variables template
├── .gitignore            # Git ignore specification
└── README.md             # Project documentation
```

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18+) & **npm**
- **Python** (v3.10+) & **pip**
- **MongoDB** running locally on port 27017 or a MongoDB Atlas URI

### 2. Backend Setup
1. Open a terminal in `backend/`:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
2. Create or verify `.env` file (copied from `.env.example`):
   ```env
   MONGODB_URI=mongodb://localhost:27017
   DATABASE_NAME=it_learnhub
   JWT_SECRET_KEY=your-secure-secret-key
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   UPLOAD_DIR=uploads
   MAX_FILE_SIZE_MB=20
   FRONTEND_ORIGIN=http://localhost:5173
   ```
3. Seed the sample database (creates Semester 3, DBMS & OS subjects, 5 units, 2 assignments, and 1 complete MCQ exam):
   ```bash
   python seed.py
   ```
4. Start the FastAPI backend server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   *The backend will be available at `http://localhost:8000` (API documentation at `http://localhost:8000/docs`).*

### 3. Frontend Setup
1. In another terminal, navigate to `frontend/`:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The application will open at `http://localhost:5173`.*

---

## 🔑 Default Demo Accounts

The seed script creates the following pre-configured credentials (also available via one-click buttons on the login page):

| Role | Email | Password | Access Privileges |
|---|---|---|---|
| **Faculty / Admin** | `admin@itlearnhub.com` | `admin123` | Full curriculum CRUD, material upload/deletion, exam builder, faculty analytics |
| **Student (Alice)** | `alice@student.com` | `student123` | Notes download, keyword search, practice bank, draft auto-saving, exam taking |

---

## 🧪 Running Automated Tests

Run the full pytest suite in the `backend/` directory:
```bash
cd backend
python -m pytest tests/test_backend.py -v
```
All unit tests and integration tests verify:
- Bcrypt password hashing & verification
- JWT token issuance & signature validation
- Invalid / tampered token rejection
- `/health` endpoint
- Registration & login flow
- Access restrictions (ensuring students cannot reach admin endpoints)
- Role authorization for faculty analytics
