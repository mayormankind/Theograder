# 📘 TheoGrader — Project Context

## 🏷️ Project Title

TheoGrader — Design and Development of an Intelligent Assessment System for Automated Grading of Theoretical Examination Scripts in Nigerian Universities

---

## 🎯 Project Objective

This project builds an **AI-assisted grading system** that helps lecturers evaluate **theoretical (essay/short answer) exam scripts**.

> ⚠️ The system is NOT fully autonomous.  
> It is a **grading support tool** designed to assist, not replace, lecturers.

---

## 🧠 Core Concept

The system processes scanned exam scripts and compares student answers with a lecturer-defined rubric using **semantic similarity techniques**.

### Key Idea:

> “Automate repetitive grading while keeping human oversight.”

---

## ⚙️ Technology Stack

### Frontend / Fullstack

- Next.js (App Router)
- Handles UI, authentication, uploads, and dashboard
- ShadCN UI
- Tailwind CSS

### AI Service

- Python (FastAPI)
- Handles OCR, NLP, segmentation, and scoring

### Database

- PostgreSQL (via Prisma ORM)

---

## 🔄 System Workflow

1. Lecturer logs in (Iron Session-based authentication)
2. Uploads:
   - Exam script (image/PDF)
   - Marking rubric (structured JSON)
3. System processes (per script):
   - OCR extracts text
   - Text is segmented into answers
   - Text is cleaned and normalized
   - OpenAI embeddings generate vector representations
   - Cosine similarity is computed
   - Scores are assigned using rubric weights
4. Output:
   - Scores per question
   - Similarity breakdown (stored in JSON field)
   - Confidence score
5. Lecturer reviews and overrides if needed

---

## 🔍 OCR Strategy (Unified Vision Approach)

The system uses a **GPT-4o-mini Vision-based OCR pipeline**:

### 1. Document Conversion

- Raw multi-page PDFs are converted page-by-page to image bytes (JPEG format) using `pdf2image`. Images are processed directly.

### 2. High-Fidelity Transcription

- Each page is transcribed verbatim using a specialized `gpt-4o-mini` Vision model prompt, which preserves layout structures, handwritings, and spelling errors.

### 3. Identity Correction & normalizations

- The Next.js backend parses the output to identify student identities and performs automatic error corrections on matric numbers (e.g. `1FS/2014986` -> `IFS/20/4986`).

### Design Principle:

> Direct Vision Transcription → Verbatim Text → Unified and Robust Processing pipeline without local engine dependencies.

---

## ✂️ Answer Segmentation

Segmentation is done using **regex pattern matching**.

### Supported Patterns:

- Q1, Q2
- Question 1
- 1(a), 2(b)
- 1., 2., etc.

### Output Format:

```json
{
  "Q1": "Answer text...",
  "Q2": "Answer text..."
}
```

---

## 📂 Folder Structure (Unified Next.js)

The project follows a modular Next.js App Router structure with semantic URL routing for better organization and scalability.

```text
TheoGrader/
├── app/                      # Next.js App Router
│   ├── auth/                 # Authentication routes (/auth/login, /auth/signup, etc.)
│   │   ├── login/
│   │   ├── signup/
│   │   ├── forgot-password/
│   │   ├── reset-password/
│   │   └── verify/           # Deprecated (returns 410)
│   ├── dashboard/            # Dashboard routes (/dashboard, /dashboard/settings, etc.)
│   │   ├── page.tsx          # Main dashboard
│   │   ├── settings/
│   │   ├── rubrics/
│   │   ├── exams/
│   │   ├── grading/
│   │   ├── results/
│   │   ├── upload/
│   │   ├── create-rubric/
│   │   ├── report/
│   │   └── scripts/
│   ├── api/                  # Internal API routes
│   │   ├── auth/             # Authentication API endpoints (Iron Session)
│   │   ├── scripts/          # Script processing API
│   │   ├── grading/          # Grading list API
│   │   ├── rubrics/          # Rubric management API
│   │   └── upload/           # File upload API
│   ├── layout.tsx            # Global root layout
│   └── page.tsx              # Main Landing Page (/)
├── components/               # UI Components
│   ├── landing/              # Landing page specific components
│   ├── dashboard/            # Dashboard specific components
│   ├── auth/                 # Auth layouts and forms
│   └── ui/                   # Shadcn/UI primitive components
├── hooks/                    # Reusable React hooks
├── lib/                      # Shared utilities (Prisma, constants, etc.)
│   └── services/             # Backend service wrappers (email, AI API calls)
├── types/                    # TypeScript interfaces/types
├── public/                   # Static assets (images, icons)
└── CONTEXT.md                # Project documentation
```

### URL Structure

- `/` - Landing page
- `/auth/login` - Login page
- `/auth/signup` - Sign up page
- `/auth/forgot-password` - Forgot password
- `/auth/reset-password` - Reset password
- `/dashboard` - Main dashboard
- `/dashboard/settings` - Settings
- `/dashboard/rubrics` - Rubrics management
- `/dashboard/exams` - Exams
- `/dashboard/grading` - Grading interface
- `/dashboard/results` - Results
- `/dashboard/upload` - Upload scripts
- `/dashboard/create-rubric` - Create rubric
- `/dashboard/report` - Reports
- `/dashboard/scripts` - Scripts management

---

## 📊 Dashboard Integration Plan

The dashboard currently in `intelliGrade` (built with Vite/React) will be merged into `TheoGrader` using the following steps:

1.  **Component Porting**: Move `intelliGrade/src/components/*` to `TheoGrader/components/dashboard/`.
2.  **Style Migration**: Integrate `intelliGrade/src/index.css` into `TheoGrader/app/theograder.css` or as a module.
3.  **Route Setup**: Create `TheoGrader/app/(dashboard)/dashboard/page.tsx` as the main entry point.
4.  **State Management**: Transition from local Vite state to Next.js server/client state patterns.

---

## 🏗️ Architecture Decisions

### Authentication
- **Iron Session**: Cookie-based session management for authentication
- **No NextAuth**: Removed in favor of simpler Iron Session approach
- **OTP-based login**: Password or OTP authentication supported

### Grading Pipeline
- **Single-script processing**: Each script is processed individually via `/api/scripts/[scriptId]/process`
- **No batch processing**: Redis-backed batch system removed
- **Canonical route**: All grading goes through `/api/scripts/[scriptId]/process` POST endpoint

### Embeddings
- **OpenAI embeddings**: Using `text-embedding-3-small` model
- **No SBERT**: Removed Sentence-BERT and torch dependencies
- **In-memory caching**: Embeddings cached in AI service to reduce API calls

### Data Storage
- **Similarity data**: Stored as JSON in `breakdown` field on QuestionResult model
- **No SimilarityScore model**: Removed duplicate storage model
- **Simplified schema**: Removed unused NextAuth, Batch, and SimilarityScore models
