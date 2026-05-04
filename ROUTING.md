# Routing Documentation

## Overview

This document describes the routing structure of the TheoGrader application. The app uses Next.js App Router with semantic URL organization for better scalability and maintainability.

## URL Structure

### Public Routes

| URL | Description | File Location |
|-----|-------------|---------------|
| `/` | Landing page | `app/page.tsx` |

### Authentication Routes

All authentication routes are grouped under `/auth/*` for clear semantic organization.

| URL | Description | File Location |
|-----|-------------|---------------|
| `/auth/login` | Login page (password & OTP) | `app/auth/login/page.tsx` |
| `/auth/signup` | Sign up / registration | `app/auth/signup/page.tsx` |
| `/auth/verify-email` | Email verification | `app/auth/verify-email/page.tsx` |
| `/auth/forgot-password` | Request password reset | `app/auth/forgot-password/page.tsx` |
| `/auth/reset-password` | Reset password with token | `app/auth/reset-password/page.tsx` |
| `/auth/verify` | Legacy verification redirect | `app/auth/verify/page.tsx` |

### Dashboard Routes

All dashboard routes are grouped under `/dashboard/*` for clear semantic organization and easier middleware protection.

| URL | Description | File Location |
|-----|-------------|---------------|
| `/dashboard` | Main dashboard home | `app/dashboard/page.tsx` |
| `/dashboard/settings` | User settings | `app/dashboard/settings/page.tsx` |
| `/dashboard/rubrics` | Rubrics management | `app/dashboard/rubrics/page.tsx` |
| `/dashboard/exams` | Exams management | `app/dashboard/exams/page.tsx` |
| `/dashboard/grading` | Grading interface | `app/dashboard/grading/page.tsx` |
| `/dashboard/results` | Grading results | `app/dashboard/results/page.tsx` |
| `/dashboard/upload` | Upload scripts | `app/dashboard/upload/page.tsx` |
| `/dashboard/create-rubric` | Create new rubric | `app/dashboard/create-rubric/page.tsx` |
| `/dashboard/processing` | Processing status | `app/dashboard/processing/page.tsx` |
| `/dashboard/report` | Reports | `app/dashboard/report/page.tsx` |
| `/dashboard/scripts` | Scripts management | `app/dashboard/scripts/page.tsx` |

### API Routes

API routes follow RESTful conventions and are grouped by functionality.

| URL | Method | Description | File Location |
|-----|--------|-------------|---------------|
| `/api/auth/signup` | POST | User registration | `app/api/auth/signup/route.ts` |
| `/api/auth/login` | POST | Password/OTP login | `app/api/auth/login/route.ts` |
| `/api/auth/login` | PUT | OTP verification | `app/api/auth/login/route.ts` |
| `/api/auth/verify` | GET | Email verification | `app/api/auth/verify/route.ts` |
| `/api/auth/verify` | POST | Resend verification email | `app/api/auth/verify/route.ts` |
| `/api/auth/forgot-password` | POST | Request password reset | `app/api/auth/forgot-password/route.ts` |
| `/api/auth/forgot-password` | PUT | Reset password | `app/api/auth/forgot-password/route.ts` |
| `/api/rubrics` | GET | List rubrics | `app/api/rubrics/route.ts` |
| `/api/rubrics` | POST | Create rubric | `app/api/rubrics/route.ts` |
| `/api/rubrics/[id]` | GET | Get rubric by ID | `app/api/rubrics/[id]/route.ts` |
| `/api/rubrics/[id]` | PUT | Update rubric | `app/api/rubrics/[id]/route.ts` |
| `/api/rubrics/[id]` | DELETE | Delete rubric | `app/api/rubrics/[id]/route.ts` |
| `/api/rubrics/[id]/duplicate` | POST | Duplicate rubric | `app/api/rubrics/[id]/duplicate/route.ts` |
| `/api/upload` | POST | Upload files | `app/api/upload/route.ts` |

## Navigation Patterns

### Client-Side Navigation

Use Next.js `Link` component for navigation:

```tsx
import Link from 'next/link';

// Auth navigation
<Link href="/auth/login">Log in</Link>
<Link href="/auth/signup">Sign up</Link>

// Dashboard navigation
<Link href="/dashboard">Dashboard</Link>
<Link href="/dashboard/settings">Settings</Link>
```

### Programmatic Navigation

Use `useRouter` hook for programmatic navigation:

```tsx
import { useRouter } from 'next/navigation';

const router = useRouter();

// Auth navigation
router.push('/auth/login');
router.push('/auth/signup');

// Dashboard navigation
router.push('/dashboard');
router.push('/dashboard/settings');
```

### Dashboard Navigation Helper

The dashboard layout provides a navigation helper:

```tsx
const handleNavigate = (page: Page) => {
  router.push(`/dashboard/${page}`);
};
```

## Route Groups

### Removed Route Groups

The following route groups have been removed in favor of semantic URL paths:

- `(auth)` - Removed, now using `/auth/*` paths
- `(landing)` - Removed, landing page is at root `/`
- `(dashboard)` - Removed, now using `/dashboard/*` paths

### Benefits of Semantic URLs

1. **Clear hierarchy** - URLs self-document their purpose
2. **Better scalability** - Easy to add new routes under logical groupings
3. **Industry standard** - Follows RESTful conventions
4. **Easier middleware** - Can protect `/dashboard/*` with a single rule
5. **Better analytics** - Clearer URL grouping in analytics tools

## Middleware Considerations

### Protecting Dashboard Routes

To protect all dashboard routes, configure middleware to check authentication for paths starting with `/dashboard`:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('auth-token');
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }
  
  return NextResponse.next();
}
```

### Public Routes

The following routes are public (no authentication required):
- `/` - Landing page
- `/auth/*` - All authentication routes

### Protected Routes

The following routes require authentication:
- `/dashboard/*` - All dashboard routes

## Future Route Additions

When adding new routes, follow these conventions:

### Authentication Routes

Place under `/auth/`:
```text
app/auth/new-feature/page.tsx → /auth/new-feature
```

### Dashboard Routes

Place under `/dashboard/`:
```text
app/dashboard/new-feature/page.tsx → /dashboard/new-feature
```

### API Routes

Place under `/api/` with semantic grouping:
```text
app/api/feature-name/route.ts → /api/feature-name
```

## Migration Notes

If you have existing code using old routes, update them as follows:

### Old → New Mapping

| Old URL | New URL |
|---------|---------|
| `/login` | `/auth/login` |
| `/signup` | `/auth/signup` |
| `/verify-email` | `/auth/verify-email` |
| `/forgot-password` | `/auth/forgot-password` |
| `/reset-password` | `/auth/reset-password` |
| `/settings` | `/dashboard/settings` |
| `/rubrics` | `/dashboard/rubrics` |
| `/exams` | `/dashboard/exams` |
| `/grading` | `/dashboard/grading` |
| `/results` | `/dashboard/results` |
| `/upload` | `/dashboard/upload` |
| `/create-rubric` | `/dashboard/create-rubric` |
| `/processing` | `/dashboard/processing` |
| `/report` | `/dashboard/report` |
| `/scripts` | `/dashboard/scripts` |

See `MIGRATION_GUIDE.md` for detailed migration instructions.
