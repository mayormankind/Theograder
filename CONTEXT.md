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

1. Lecturer logs in
2. Uploads:
   - Exam script (image/PDF)
   - Marking rubric (structured JSON)
3. System processes:
   - OCR extracts text
   - Text is segmented into answers
   - Text is cleaned and normalized
   - Sentence-BERT generates embeddings
   - Cosine similarity is computed
   - Scores are assigned using rubric weights
4. Output:
   - Scores per question
   - Similarity breakdown
   - Confidence score
5. Lecturer reviews and overrides if needed

---

## 🔍 OCR Strategy (Hybrid System)

The system uses a **two-stage OCR pipeline**:

### 1. Primary OCR

- Tesseract (fast, offline)

### 2. Quality Check

- Evaluates:
  - Text length
  - Noise ratio
  - Readability

### 3. Fallback OCR

- GPT-4 Vision (via API)
- Used ONLY when Tesseract output is poor

### 4. Output Metadata

Each extraction returns:

- `extracted_text`
- `extraction_method` (tesseract / gpt4 / hybrid)
- `confidence_flag`

### Design Principle:

> Cheap first → Intelligent fallback → Reliable result

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
│   │   ├── verify-email/
│   │   ├── forgot-password/
│   │   ├── reset-password/
│   │   └── verify/
│   ├── dashboard/            # Dashboard routes (/dashboard, /dashboard/settings, etc.)
│   │   ├── page.tsx          # Main dashboard
│   │   ├── settings/
│   │   ├── rubrics/
│   │   ├── exams/
│   │   ├── grading/
│   │   ├── results/
│   │   ├── upload/
│   │   ├── create-rubric/
│   │   ├── processing/
│   │   ├── report/
│   │   └── scripts/
│   ├── api/                  # Internal API routes
│   │   ├── auth/             # Authentication API endpoints
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
- `/auth/verify-email` - Email verification
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
- `/dashboard/processing` - Processing status
- `/dashboard/report` - Reports
- `/dashboard/scripts` - Scripts management

---

## 📊 Dashboard Integration Plan

The dashboard currently in `intelliGrade` (built with Vite/React) will be merged into `TheoGrader` using the following steps:

1.  **Component Porting**: Move `intelliGrade/src/components/*` to `TheoGrader/components/dashboard/`.
2.  **Style Migration**: Integrate `intelliGrade/src/index.css` into `TheoGrader/app/theograder.css` or as a module.
3.  **Route Setup**: Create `TheoGrader/app/(dashboard)/dashboard/page.tsx` as the main entry point.
4.  **State Management**: Transition from local Vite state to Next.js server/client state patterns.
