# URL Migration Guide

## Overview

This guide documents the URL structure changes made to improve routing organization and scalability. The migration moves from flat root-level routes to semantic grouped routes under `/auth/*` and `/dashboard/*`.

## Why This Change?

### Problems with Old Structure

- **Flat namespace pollution** - All auth routes (`/login`, `/signup`, `/verify-email`) competed at the root level
- **No semantic grouping** - URLs didn't clearly indicate their purpose
- **Scalability issues** - As the app grows, root-level routes become unmanageable
- **Non-standard pattern** - Most production apps use `/auth/*` for authentication flows
- **Inconsistent dashboard routes** - Some were under `/dashboard`, others at root level like `/settings`

### Benefits of New Structure

- **Clear semantic hierarchy** - URLs self-document their purpose
- **Better scalability** - Easy to add new routes under logical groupings
- **Industry standard** - Follows RESTful conventions
- **Easier middleware/auth guards** - Can protect `/dashboard/*` with a single rule
- **Better analytics** - Clearer URL grouping in analytics tools

## URL Changes

### Authentication Routes

| Old URL | New URL | Action Required |
|---------|---------|-----------------|
| `/login` | `/auth/login` | Update all links and redirects |
| `/signup` | `/auth/signup` | Update all links and redirects |
| `/verify-email` | `/auth/verify-email` | Update all links and redirects |
| `/forgot-password` | `/auth/forgot-password` | Update all links and redirects |
| `/reset-password` | `/auth/reset-password` | Update all links and redirects |
| `/verify` | `/auth/verify` | Update all links and redirects |

### Dashboard Routes

| Old URL | New URL | Action Required |
|---------|---------|-----------------|
| `/dashboard` | `/dashboard` | No change (already correct) |
| `/settings` | `/dashboard/settings` | Update all links and redirects |
| `/rubrics` | `/dashboard/rubrics` | Update all links and redirects |
| `/exams` | `/dashboard/exams` | Update all links and redirects |
| `/grading` | `/dashboard/grading` | Update all links and redirects |
| `/results` | `/dashboard/results` | Update all links and redirects |
| `/upload` | `/dashboard/upload` | Update all links and redirects |
| `/create-rubric` | `/dashboard/create-rubric` | Update all links and redirects |
| `/processing` | `/dashboard/processing` | Update all links and redirects |
| `/report` | `/dashboard/report` | Update all links and redirects |
| `/scripts` | `/dashboard/scripts` | Update all links and redirects |

## Migration Checklist

### ✅ Completed Changes

The following changes have already been applied to the codebase:

- [x] Created new `app/auth/*` directory structure
- [x] Moved all auth pages to `app/auth/*`
- [x] Created new `app/dashboard/*` directory structure
- [x] Moved all dashboard pages to `app/dashboard/*`
- [x] Updated landing page navigation links (Navbar, Hero, CTASection)
- [x] Updated email service verification URLs
- [x] Updated dashboard layout navigation helper
- [x] Removed unused `(landing)` route group
- [x] Updated CONTEXT.md with new structure
- [x] Created ROUTING.md documentation

### 🔍 Manual Review Required

The following areas may need manual review depending on your specific implementation:

#### 1. External Links

Check for any hardcoded URLs in:
- Email templates (beyond the email-service.ts already updated)
- Documentation files
- README files
- External integrations
- Third-party service configurations

#### 2. Bookmark/Redirect Handling

If you have existing users with bookmarks to old URLs, consider implementing redirects:

```typescript
// app/login/page.tsx - Redirect to new URL
import { redirect } from 'next/navigation';

export default function LoginPage() {
  redirect('/auth/login');
}
```

#### 3. Middleware Configuration

Update middleware to protect new dashboard routes:

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

export const config = {
  matcher: ['/dashboard/:path*'],
};
```

#### 4. Analytics Tracking

Update any analytics tools that track page views:
- Google Analytics
- Mixpanel
- Amplitude
- Custom analytics

#### 5. SEO Considerations

If any old URLs were indexed by search engines:
- Implement 301 redirects if SEO is a concern
- Update sitemap.xml
- Submit updated sitemap to search engines

## Code Migration Examples

### Updating Link Components

**Before:**
```tsx
<Link href="/login">Log in</Link>
<Link href="/signup">Sign up</Link>
<Link href="/settings">Settings</Link>
```

**After:**
```tsx
<Link href="/auth/login">Log in</Link>
<Link href="/auth/signup">Sign up</Link>
<Link href="/dashboard/settings">Settings</Link>
```

### Updating Router Push

**Before:**
```tsx
router.push('/login');
router.push('/dashboard');
router.push('/settings');
```

**After:**
```tsx
router.push('/auth/login');
router.push('/dashboard');
router.push('/dashboard/settings');
```

### Updating Dashboard Navigation

**Before:**
```tsx
const handleNavigate = (page: Page) => {
  router.push(`/${page}`);
};
```

**After:**
```tsx
const handleNavigate = (page: Page) => {
  router.push(`/dashboard/${page}`);
};
```

## Testing Checklist

After migration, test the following:

### Authentication Flows
- [ ] Navigate to `/auth/login` - should load login page
- [ ] Navigate to `/auth/signup` - should load signup page
- [ ] Complete signup flow - should redirect to `/auth/verify-email`
- [ ] Click verification email link - should go to `/auth/verify-email?token=xxx`
- [ ] After verification - should redirect to `/auth/login`
- [ ] Login successfully - should redirect to `/dashboard`
- [ ] Navigate to `/auth/forgot-password` - should load forgot password page
- [ ] Submit forgot password - should show success state
- [ ] Click reset email link - should go to `/auth/reset-password?token=xxx`
- [ ] Reset password successfully - should redirect to `/auth/login`

### Dashboard Navigation
- [ ] Navigate to `/dashboard` - should load main dashboard
- [ ] Click Settings in sidebar - should go to `/dashboard/settings`
- [ ] Click Rubrics in sidebar - should go to `/dashboard/rubrics`
- [ ] Click Exams in sidebar - should go to `/dashboard/exams`
- [ ] Click Results in sidebar - should go to `/dashboard/results`
- [ ] Click Upload in navbar - should go to `/dashboard/upload`
- [ ] Navigate between all dashboard pages - should work correctly

### Landing Page
- [ ] Navigate to `/` - should load landing page
- [ ] Click "Log in" in navbar - should go to `/auth/login`
- [ ] Click "Get Started" in navbar - should go to `/auth/signup`
- [ ] Click "Start Grading Smarter" in hero - should go to `/auth/signup`
- [ ] Click "Create Your Free Account" in CTA - should go to `/auth/signup`

### Old URLs (Optional - if implementing redirects)
- [ ] Navigate to `/login` - should redirect to `/auth/login`
- [ ] Navigate to `/signup` - should redirect to `/auth/signup`
- [ ] Navigate to `/settings` - should redirect to `/dashboard/settings`

## Rollback Plan

If issues arise, you can rollback by:

1. Revert file changes using git:
   ```bash
   git checkout HEAD -- app/
   ```

2. Restore old route groups:
   - Rename `app/auth` back to `app/(auth)`
   - Rename `app/dashboard` back to `app/(dashboard)`

3. Revert link updates in components

## Support

If you encounter issues during migration:

1. Check `ROUTING.md` for the complete URL structure
2. Review the file changes in this commit
3. Test navigation using the testing checklist above
4. Check browser console for any routing errors

## Summary

This migration improves the application's routing structure by:
- Grouping authentication routes under `/auth/*`
- Grouping dashboard routes under `/dashboard/*`
- Following industry-standard URL conventions
- Improving scalability and maintainability
- Making middleware configuration simpler

All internal links and navigation have been updated. External integrations and user-facing URLs should be reviewed and updated as needed.
