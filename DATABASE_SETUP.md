# Database Setup Guide

## 🚀 Quick Setup Instructions

### Prerequisites
- Node.js 18+ installed
- pnpm or npm installed
- Supabase project created (you mentioned this is already done)

### Step 1: Install Dependencies
Due to PowerShell execution policy restrictions, you'll need to run these commands manually:

```bash
# Navigate to project directory
cd "c:\Users\USER\Documents\github-second-quarter-\Intelligent grader\TheoGrader"

# Install Prisma and database dependencies
pnpm add prisma @prisma-client
pnpm add next-auth @auth/prisma-adapter bcryptjs
pnpm add -D tsx @types/bcryptjs

# Alternative with npm (if pnpm doesn't work)
npm install prisma @prisma/client
npm install next-auth @auth/prisma-adapter bcryptjs
npm install -D tsx @types/bcryptjs
```

### Step 2: Configure Environment Variables

Update your `.env.local` file with your Supabase credentials:

```env
# Database - Get these from your Supabase project settings
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# NextAuth.js - Generate a secret: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-here"

# AI Service
AI_SERVICE_URL="http://localhost:8000"

# Supabase (optional - for direct Supabase client usage)
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
```

### Step 3: Initialize Prisma and Create Database

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database (creates tables)
pnpm db:push

# Or create a migration (recommended for production)
pnpm db:migrate --name init

# Seed the database with sample data
pnpm db:seed
```

### Step 4: Verify Setup

```bash
# Open Prisma Studio to view database
pnpm db:studio

# This will open a browser at http://localhost:5555
# You should see:
# - Users table with admin and lecturer accounts
# - Sample exam and rubric
# - System settings
```

## 📊 Database Schema Overview

### Core Tables

#### Users
- Lecturer and administrator accounts
- Role-based access control (LECTURER, ADMIN)

#### Exams
- Exam metadata and configuration
- Linked to users who create them

#### Rubrics
- Marking schemes for exams
- Can be templates for reuse
- Contains questions and marking points

#### Scripts
- Uploaded student exam scripts
- OCR results and metadata
- Processing status tracking

#### Results
- Grading results for scripts
- Confidence scores and feedback
- Question-level breakdown

#### Batches
- Batch processing jobs
- Progress tracking for bulk operations

### Supporting Tables
- **Sessions**: Authentication sessions
- **Settings**: System configuration
- **ActivityLog**: Audit trail

## 🔧 Troubleshooting

### Common Issues

#### 1. "Prisma Client is not configured"
```bash
# Run this to regenerate the client
pnpm db:generate
```

#### 2. Database connection errors
- Verify your Supabase credentials
- Check if your IP is whitelisted in Supabase
- Ensure the database URL format is correct

#### 3. Migration conflicts
```bash
# Reset database (WARNING: This deletes all data)
pnpm db:reset
pnpm db:seed
```

#### 4. TypeScript errors
```bash
# Ensure types are generated
pnpm db:generate
```

## 🎯 Next Steps

After database setup is complete:

1. **Authentication Setup**: Configure NextAuth.js
2. **API Routes**: Create database-connected API endpoints
3. **Frontend Integration**: Connect UI components to database
4. **Testing**: Verify all database operations work correctly

## 📝 Sample Data

The seed script creates:

### Users
- **Admin**: admin@theograder.com / admin123
- **Lecturer**: lecturer@theograder.com / lecturer123

### Sample Content
- 1 CS101 Midterm Exam
- 1 Comprehensive Rubric (4 questions, 25 marks each)
- System settings and activity logs

## 🔄 Development Workflow

### Making Schema Changes
1. Update `prisma/schema.prisma`
2. Run `pnpm db:push` for quick changes
3. Or `pnpm db:migrate --name descriptive-name` for production
4. Regenerate client: `pnpm db:generate`

### Resetting Database
```bash
pnpm db:reset
pnpm db:seed
```

### Viewing Data
```bash
pnpm db:studio
```

## 📚 Useful Commands

```bash
# Generate Prisma client
pnpm db:generate

# Push schema changes (dev only)
pnpm db:push

# Create migration
pnpm db:migrate --name migration-name

# Seed database
pnpm db:seed

# View database in browser
pnpm db:studio

# Reset database
pnpm db:reset

# Deploy migrations to production
pnpm db:migrate deploy
```
