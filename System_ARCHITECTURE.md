# TheoGrader - System Architecture Documentation

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication Architecture](#authentication-architecture)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Security Considerations](#security-considerations)
6. [Email Service Integration](#email-service-integration)
7. [Frontend Components](#frontend-components)
8. [Data Flow Diagrams](#data-flow-diagrams)
9. [Error Handling Strategy](#error-handling-strategy)
10. [Future Enhancements](#future-enhancements)

---

## Overview

TheoGrader is an intelligent assessment system for automated grading of theoretical examination scripts in Nigerian universities. The system consists of:

- **Frontend**: Next.js 16 with App Router, React 19, TypeScript, Tailwind CSS, ShadCN UI
- **Backend**: Python FastAPI (AI service) + Next.js API routes (authentication)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Custom implementation with email verification, OTP support, and password reset

### Technology Stack

```yaml
Frontend:
  - Next.js 16 (App Router)
  - React 19
  - TypeScript
  - Tailwind CSS v4
  - ShadCN UI
  - Sonner (Toast notifications)

Backend (Auth):
  - Next.js API Routes
  - Prisma ORM
  - bcryptjs (Password hashing)
  - crypto (Token generation)
  - nodemailer (Email service)

Backend (AI Service):
  - Python FastAPI
  - GPT-4o-mini Vision OCR
  - OpenAI text-embedding-3-small (with local caching)
  - NLTK

Database:
  - PostgreSQL
  - Prisma ORM

Storage:
  - Supabase Storage (Bucket: 'uploads')
```

---

## File Storage Architecture

TheoGrader uses **Supabase Storage** for persisting examination scripts and other documents.

### Storage Configuration
- **Bucket Name**: `uploads`
- **Access Control**: Publicly accessible via generated URLs.
- **Directory Structure**: `[userId]/[examId]/[fileName]`

### Implementation Details
Storage operations are centralized in `lib/supabase.ts` using the following helpers:
- `uploadFileToSupabase(file, bucket, path)`: Handles multipart uploads.
- `getPublicUrl(bucket, path)`: Retrieves the CDN URL for a file.
- `deleteFileFromSupabase(bucket, path)`: Removes files from the bucket.

### Data Flow for Uploads
1. User selects files in the **Upload Page**.
2. Frontend calls `POST /api/upload` for each file.
3. Backend uploads the file to Supabase Storage.
4. Backend stores the **storage path** (not the URL) in the `Script` table's `filePath` column.
5. AI service retrieves the file using the Supabase path or public URL for processing.

---

## Authentication Architecture

### Authentication Flow

The authentication system implements a multi-layered security approach:

1. **User Registration**: Email/password signup with email verification
2. **Email Verification**: Token-based verification to activate accounts
3. **Login Methods**: 
   - Password-based authentication
   - OTP-based authentication (email-sent one-time codes)
4. **Password Recovery**: Token-based password reset
5. **Session Management**: JWT-based sessions (NextAuth.js integration ready)

### Authentication Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                          │
├─────────────────────────────────────────────────────────────┤
│  - Signup Page          - Login Page                        │
│  - Verify Email Page    - Forgot Password Page              │
│  - Reset Password Page  - Auth Layout Component             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Routes Layer                          │
├─────────────────────────────────────────────────────────────┤
│  POST /api/auth/signup    - User registration               │
│  POST /api/auth/login     - Password/OTP login              │
│  PUT  /api/auth/login     - OTP verification                │
│  GET  /api/auth/verify    - Email verification              │
│  POST /api/auth/verify    - Resend verification email       │
│  POST /api/auth/forgot-password - Request password reset    │
│  PUT  /api/auth/forgot-password - Reset password            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                      │
├─────────────────────────────────────────────────────────────┤
│  - Validation (client & server)                              │
│  - Password hashing (bcryptjs)                               │
│  - Token generation (crypto)                                 │
│  - Email service integration                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Data Layer                               │
├─────────────────────────────────────────────────────────────┤
│  - PostgreSQL Database                                       │
│  - Prisma ORM                                                │
│  - User, VerificationToken, Session models                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   External Services                          │
├─────────────────────────────────────────────────────────────┤
│  - Email Service (Gmail SMTP via nodemailer)                │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Core Authentication Models

#### User Model
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  role      UserRole @default(LECTURER)
  avatar    String?
  
  // Authentication fields
  emailVerified DateTime?
  isActive     Boolean @default(false)
  lastLoginAt  DateTime?
  
  // OTP fields
  otpCode      String?
  otpExpiresAt DateTime?
  
  // Password reset fields
  resetToken   String?
  resetExpiresAt DateTime?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  exams     Exam[]
  rubrics   Rubric[]
  sessions  Session[]
  results   Result[]
  accounts  Account[]
  verificationTokens VerificationToken[]

  @@map("users")
}
```

#### VerificationToken Model
```prisma
model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  userId     String?

  user       User?    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([identifier, token])
  @@map("verification_tokens")
}
```

#### Session Model
```prisma
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}
```

### Security Features

- **Password Hashing**: bcryptjs with 12 salt rounds
- **Token Security**: 32-byte cryptographically secure random tokens
- **Token Expiration**: 
  - Verification tokens: 24 hours
  - Reset tokens: 1 hour
  - OTP codes: 10 minutes
- **Email Normalization**: All emails stored in lowercase
- **Account Activation**: Users must verify email before login (isActive = false until verified)

---

## API Endpoints

### Authentication Endpoints

#### 1. User Registration
```
POST /api/auth/signup
```

**Request Body:**
```json
{
  "name": "Dr. Oluwaseun Adeyemi",
  "email": "lecturer@university.edu.ng",
  "password": "securePassword123"
}
```

**Response (201):**
```json
{
  "message": "Account created successfully. Please check your email to verify your account.",
  "userId": "clxxx...",
  "emailSent": true
}
```

**Validation:**
- Name: Required, min 2 characters
- Email: Required, valid email format, unique
- Password: Required, min 8 characters

**Process:**
1. Validate input
2. Check if user exists
3. Hash password with bcryptjs
4. Generate verification token
5. Create user with verification token
6. Send verification email
7. Return success response

---

#### 2. Password Login
```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "lecturer@university.edu.ng",
  "password": "securePassword123",
  "useOTP": false
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "clxxx...",
    "email": "lecturer@university.edu.ng",
    "name": "Dr. Oluwaseun Adeyemi",
    "role": "LECTURER",
    "avatar": null
  }
}
```

**Error Responses:**
- 400: Missing email or password
- 401: Invalid credentials or account not active
- 500: Database connection error

**Process:**
1. Validate input
2. Find user by email
3. Check if account is active
4. Verify password with bcryptjs
5. Update last login timestamp
6. Return user data

---

#### 3. OTP Request
```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "lecturer@university.edu.ng",
  "useOTP": true
}
```

**Response (200):**
```json
{
  "message": "OTP sent to your email"
}
```

**Process:**
1. Validate email
2. Find user by email
3. Generate 6-digit OTP
4. Set OTP expiration (10 minutes)
5. Update user with OTP
6. Send OTP email
7. Return success

---

#### 4. OTP Verification
```
PUT /api/auth/login
```

**Request Body:**
```json
{
  "email": "lecturer@university.edu.ng",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "clxxx...",
    "email": "lecturer@university.edu.ng",
    "name": "Dr. Oluwaseun Adeyemi",
    "role": "LECTURER",
    "avatar": null
  }
}
```

**Process:**
1. Validate email and OTP
2. Find user by email
3. Verify OTP matches
4. Check OTP expiration
5. Clear OTP from user record
6. Update last login timestamp
7. Return user data

---

#### 5. Email Verification
```
GET /api/auth/verify?token=<verification_token>
```

**Response (200):**
```json
{
  "message": "Email verified successfully. Your account is now active.",
  "user": {
    "id": "clxxx...",
    "email": "lecturer@university.edu.ng",
    "name": "Dr. Oluwaseun Adeyemi",
    "role": "LECTURER"
  }
}
```

**Process:**
1. Extract token from URL
2. Find valid verification token
3. Update user as verified and active
4. Delete verification token
5. Send welcome email
6. Return success

---

#### 6. Resend Verification Email
```
POST /api/auth/verify
```

**Request Body:**
```json
{
  "email": "lecturer@university.edu.ng"
}
```

**Response (200):**
```json
{
  "message": "Verification email sent successfully"
}
```

**Process:**
1. Validate email
2. Find user by email
3. Check if already verified
4. Delete existing verification tokens
5. Generate new verification token
6. Send verification email
7. Return success

---

#### 7. Request Password Reset
```
POST /api/auth/forgot-password
```

**Request Body:**
```json
{
  "email": "lecturer@university.edu.ng"
}
```

**Response (200):**
```json
{
  "message": "If an account with this email exists, a password reset link has been sent."
}
```

**Security Note:** Always returns success message to prevent email enumeration

**Process:**
1. Validate email
2. Find user by email (if not found, return success anyway)
3. Delete existing reset tokens
4. Generate reset token
5. Set expiration (1 hour)
6. Update user with reset token
7. Send password reset email
8. Return success

---

#### 8. Reset Password
```
PUT /api/auth/forgot-password
```

**Request Body:**
```json
{
  "token": "reset_token_here",
  "newPassword": "newSecurePassword123"
}
```

**Response (200):**
```json
{
  "message": "Password reset successfully"
}
```

**Process:**
1. Validate token and new password
2. Find user with valid reset token
3. Hash new password
4. Update user password
5. Clear reset token
6. Return success

---

## Security Considerations

### Password Security
- **Hashing Algorithm**: bcryptjs with 12 salt rounds
- **Minimum Length**: 8 characters
- **Storage**: Only hashed passwords stored in database
- **Validation**: Client and server-side validation

### Token Security
- **Generation**: crypto.randomBytes(32) for 64-character hex strings
- **Uniqueness**: Database constraints ensure uniqueness
- **Expiration**: All tokens have expiration times
- **Cleanup**: Tokens deleted after use

### Email Security
- **No Enumeration**: Password reset always returns success
- **Rate Limiting**: Recommended to implement (not yet implemented)
- **Secure Links**: Verification/reset links are one-time use
- **Token Validation**: Server validates all tokens before action

### Input Validation
- **Client-side**: Real-time validation with visual feedback
- **Server-side**: Comprehensive validation before processing
- **SQL Injection**: Prisma ORM prevents SQL injection
- **XSS**: React's built-in XSS protection

### Session Security
- **JWT Strategy**: NextAuth.js with JWT sessions
- **Secure Cookies**: Recommended for production
- **HTTP Only**: Recommended for session cookies
- **CSRF Protection**: Recommended to implement

---

## Email Service Integration

### Email Service Architecture

```typescript
class EmailService {
  private transporter: nodemailer.Transporter;

  // Initialize with Gmail SMTP
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Email Templates
  - sendVerificationEmail()
  - sendPasswordResetEmail()
  - sendOTPEmail()
  - sendWelcomeEmail()
}
```

### Email Templates

#### Verification Email
- Subject: "Verify Your Email Address - TheoGrader"
- Content: Verification link with 24-hour expiration
- Design: Professional HTML template with branding

#### Password Reset Email
- Subject: "Reset Your Password - TheoGrader"
- Content: Reset link with 1-hour expiration
- Design: Professional HTML template with warning styling

#### OTP Email
- Subject: "Your Verification Code - TheoGrader"
- Content: 6-digit OTP with 10-minute expiration
- Design: Large, prominent OTP display

#### Welcome Email
- Subject: "Welcome to TheoGrader! 🎉"
- Content: Account activation confirmation and next steps
- Design: Celebratory design with onboarding guidance

### Environment Variables Required

```env
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
SMTP_FROM="TheoGrader" <your-email@gmail.com>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Frontend Components

### Authentication Pages

#### 1. Signup Page (`/signup`)
- **Components**: AuthLayout, form with validation
- **Features**:
  - Real-time field validation
  - Password strength indicator
  - Password confirmation matching
  - Terms of service checkbox
  - Redirect to verification after success

#### 2. Login Page (`/login`)
- **Components**: AuthLayout, dual-mode form
- **Features**:
  - Password-based login
  - OTP-based login
  - Toggle between modes
  - Field validation with error indicators
  - Account not active detection with resend link
  - Forgot password link

#### 3. Verify Email Page (`/verify-email`)
- **Components**: AuthLayout, verification status display
- **Features**:
  - Token-based verification
  - Manual email input for resend
  - Step-by-step instructions
  - Resend verification button
  - Auto-redirect after verification

#### 4. Forgot Password Page (`/forgot-password`)
- **Components**: AuthLayout, email input form
- **Features**:
  - Email input with validation
  - Success message display
  - Back to login link

#### 5. Reset Password Page (`/reset-password`)
- **Components**: AuthLayout, password reset form
- **Features**:
  - New password input
  - Password confirmation
  - Token validation
  - Success redirect to login

### Shared Components

#### AuthLayout
- **Purpose**: Consistent layout for all auth pages
- **Features**:
  - Split-screen design (illustration + form)
  - Theme toggle (dark/light)
  - Responsive design
  - Animated floating cards
  - Quote/testimonial display

#### Form Components
- **InputWrapper**: Icon + input + validation
- **TogglePassword**: Password visibility toggle
- **FieldError**: Error message display
- **Alert**: Warning/error/success messages

### CSS Architecture

```css
/* Form Styles */
- .auth-form: Main form container
- .form-group: Field container
- .input-wrapper: Input with icon
- .toggle-password: Visibility toggle
- .form-error: Error message
- .input-error: Error state styling

/* Alert Styles */
- .alert: Base alert container
- .alert-warning: Warning alert
- .alert-error: Error alert
- .alert-success: Success alert

/* Authentication Specific */
- .auth-body: Page container
- .auth-layout: Split layout
- .auth-left: Illustration side
- .auth-right: Form side
```

---

## Data Flow Diagrams

### Registration Flow

```
User → Signup Page → POST /api/auth/signup
                              ↓
                         Validate Input
                              ↓
                         Check User Exists
                              ↓
                         Hash Password
                              ↓
                    Generate Verification Token
                              ↓
                         Create User
                              ↓
                    Send Verification Email
                              ↓
                    Redirect to /verify-email
                              ↓
User → Click Email Link → GET /api/auth/verify?token=xxx
                              ↓
                         Validate Token
                              ↓
                    Activate User Account
                              ↓
                    Delete Verification Token
                              ↓
                    Send Welcome Email
                              ↓
                    Redirect to /login
```

### Login Flow (Password)

```
User → Login Page → POST /api/auth/login
                              ↓
                         Validate Input
                              ↓
                         Find User
                              ↓
                    Check Account Active
                              ↓
                    Verify Password (bcrypt)
                              ↓
                    Update Last Login
                              ↓
                    Return User Data
                              ↓
                    Redirect to /dashboard
```

### Login Flow (OTP)

```
User → Login Page → POST /api/auth/login (useOTP: true)
                              ↓
                         Validate Email
                              ↓
                         Find User
                              ↓
                    Generate 6-digit OTP
                              ↓
                    Set OTP Expiration (10min)
                              ↓
                    Update User with OTP
                              ↓
                    Send OTP Email
                              ↓
                    Show OTP Input Field
                              ↓
User → Enter OTP → PUT /api/auth/login
                              ↓
                         Validate OTP
                              ↓
                    Check OTP Expiration
                              ↓
                    Clear OTP from User
                              ↓
                    Update Last Login
                              ↓
                    Return User Data
                              ↓
                    Redirect to /dashboard
```

### Password Reset Flow

```
User → Forgot Password → POST /api/auth/forgot-password
                              ↓
                         Validate Email
                              ↓
                    Find User (or fail silently)
                              ↓
                    Generate Reset Token
                              ↓
                    Set Expiration (1 hour)
                              ↓
                    Update User with Token
                              ↓
                    Send Reset Email
                              ↓
                    Show Success Message
                              ↓
User → Click Email Link → /reset-password?token=xxx
                              ↓
User → Enter New Password → PUT /api/auth/forgot-password
                              ↓
                         Validate Token
                              ↓
                    Hash New Password
                              ↓
                    Update User Password
                              ↓
                    Clear Reset Token
                              ↓
                    Redirect to /login
```

---

## Error Handling Strategy

### Client-Side Error Handling

#### Field Validation
- **Real-time validation**: Errors cleared on input change
- **Visual indicators**: Red borders and error messages
- **Form-level validation**: Prevents submission with errors

#### API Error Handling
```typescript
try {
  const response = await fetch('/api/auth/login', {...});
  const data = await response.json();
  
  if (!response.ok) {
    // Handle specific error cases
    if (data.error?.includes('not active')) {
      setAccountNotActive(true);
      setUserEmail(formData.email);
    }
    toast.error(data.error || 'Login failed');
    return;
  }
  
  toast.success(data.message);
} catch (err) {
  toast.error('An unexpected error occurred. Please try again.');
}
```

### Server-Side Error Handling

#### Validation Errors
```typescript
if (!email) {
  return NextResponse.json(
    { error: 'Email is required' },
    { status: 400 }
  );
}
```

#### Database Errors
```typescript
if (error instanceof Error) {
  if (error.message.includes('database')) {
    return NextResponse.json(
      { error: 'Database connection error. Please check your database setup.' },
      { status: 500 }
    );
  }
}
```

#### Generic Errors
```typescript
catch (error) {
  console.error('Login error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

### Error Messages

| Error Type | Message | HTTP Status |
|------------|---------|-------------|
| Missing field | "Email is required" | 400 |
| Invalid format | "Invalid email format" | 400 |
| Weak password | "Password must be at least 8 characters" | 400 |
| User exists | "A user with this email already exists" | 409 |
| Invalid credentials | "Invalid credentials" | 401 |
| Account not active | "Account is not active. Please verify your email first." | 401 |
| Invalid token | "Invalid or expired verification token" | 400 |
| Email already verified | "Email is already verified" | 400 |
| Database error | "Database connection error. Please check your database setup." | 500 |
| Internal error | "Internal server error" | 500 |

---

## Future Enhancements

### Short-term (Priority: High)

1. **Rate Limiting**
   - Implement rate limiting on auth endpoints
   - Prevent brute force attacks
   - Use Redis or in-memory storage

2. **Session Management**
   - Integrate NextAuth.js fully
   - Implement JWT session storage
   - Add session refresh logic

3. **Two-Factor Authentication (2FA)**
   - Add TOTP (Time-based One-Time Password)
   - Support authenticator apps (Google Authenticator)
   - Backup codes for recovery

4. **Social Login**
   - Google OAuth integration
   - Microsoft OAuth for university accounts
   - Future: Academic institution SSO

### Medium-term (Priority: Medium)

5. **Account Security**
   - Password strength meter with requirements
   - Password history (prevent reuse)
   - Account lockout after failed attempts
   - Security audit log

6. **Email Improvements**
   - Email queue system (Bull/Redis)
   - Email template management
   - Multi-language support
   - Email analytics

7. **User Profile**
   - Profile picture upload
   - Profile editing
   - Account deletion
   - Data export (GDPR compliance)

### Long-term (Priority: Low)

8. **Advanced Security**
   - Biometric authentication (WebAuthn)
   - Device fingerprinting
   - Anomaly detection
   - IP-based restrictions

9. **Admin Features**
   - User management dashboard
   - Bulk user operations
   - Audit logs viewer
   - Security reports

10. **Compliance**
    - GDPR compliance tools
    - Data retention policies
    - Consent management
    - Privacy policy generator

---

## Development Guidelines

### Code Quality Standards

#### DRY (Don't Repeat Yourself)
- Extract common validation logic to utility functions
- Reuse form components across pages
- Centralize error messages in constants
- Share CSS classes for consistent styling

#### KISS (Keep It Simple, Stupid)
- Avoid over-engineering authentication
- Use straightforward data flow
- Minimize external dependencies
- Keep API responses simple

#### Clean Code
- Use descriptive variable names
- Write self-documenting code
- Add comments for complex logic
- Follow TypeScript best practices

### Testing Strategy

#### Unit Tests
- Validation functions
- Password hashing utilities
- Token generation logic
- Email service methods

#### Integration Tests
- API endpoint testing
- Database operations
- Email sending (mocked)
- Full authentication flows

#### E2E Tests
- Signup flow
- Login flow (password)
- Login flow (OTP)
- Password reset flow
- Email verification flow

### Deployment Checklist

- [ ] Set up production database
- [ ] Configure environment variables
- [ ] Set up SMTP service
- [ ] Enable HTTPS
- [ ] Configure rate limiting
- [ ] Set up monitoring
- [ ] Configure error tracking (Sentry)
- [ ] Set up backup strategy
- [ ] Review security headers
- [ ] Test all authentication flows
- [ ] Verify email delivery
- [ ] Load testing

---

## Conclusion

This authentication system provides a secure, user-friendly foundation for the TheoGrader platform. The architecture follows best practices for security, scalability, and maintainability. The modular design allows for easy enhancement and integration with the broader system.

### Key Strengths
- **Security**: Multi-layered security with proper hashing, tokenization, and validation
- **User Experience**: Clear error messages, visual feedback, and intuitive flows
- **Maintainability**: Clean code, modular architecture, and comprehensive documentation
- **Scalability**: Designed to handle growth with rate limiting and session management ready
- **Flexibility**: Multiple authentication methods with easy extensibility

### Next Steps
1. Implement rate limiting
2. Integrate NextAuth.js for session management
3. Add comprehensive testing
4. Set up monitoring and error tracking
5. Deploy to production environment

---

**Document Version**: 1.0  
**Last Updated**: May 4, 2026  
**Maintained By**: TheoGrader Development Team
