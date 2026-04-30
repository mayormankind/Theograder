"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";

export default function LoginPage() {
  const router = useRouter();
  
  const illustration = (
    <>
      <div className="auth-float-card afc-1">
        <div className="afc-row">
          <div className="afc-dot green"></div>
          <span>Script #142 — Graded</span>
        </div>
        <div className="afc-score">73/100</div>
      </div>
      <div className="auth-float-card afc-2">
        <div className="afc-row">
          <i className="fas fa-brain"></i>
          <span>SBERT Score: 0.89</span>
        </div>
      </div>
      <div className="auth-float-card afc-3">
        <div className="afc-row">
          <div className="afc-bar">
            <div className="afc-bar-fill" style={{ width: "47%" }}></div>
          </div>
        </div>
        <span>Processing 47/200 scripts...</span>
      </div>
    </>
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login for now
    router.push("/dashboard");
  };

  return (
    <AuthLayout
      illustration={illustration}
      quote="GradeIQ cut my grading time from 3 weeks to 2 days. I can't go back."
      author="Dr. Oluwaseun Adeyemi, UNILAG"
      authorInitials="OA"
    >
      <div className="auth-form-header">
        <h1>Welcome back</h1>
        <p>Log in to your GradeIQ account to continue grading.</p>
      </div>
      
      <button className="btn-oauth" id="googleAuth" onClick={() => router.push("/dashboard")}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M19.6 10.23c0-.68-.06-1.36-.18-2.02H10v3.84h5.38a4.6 4.6 0 01-2 3.02v2.5h3.24c1.89-1.74 2.98-4.3 2.98-7.34z"
            fill="#4285F4"
          />
          <path
            d="M10 20c2.7 0 4.96-.9 6.62-2.43l-3.24-2.5c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.76-5.58-4.12H1.08v2.58A9.99 9.99 0 0010 20z"
            fill="#34A853"
          />
          <path
            d="M4.42 11.9a6.01 6.01 0 010-3.8V5.52H1.08a9.99 9.99 0 000 8.96l3.34-2.58z"
            fill="#FBBC05"
          />
          <path
            d="M10 3.98a5.42 5.42 0 013.84 1.5l2.88-2.88A9.64 9.64 0 0010 0 9.99 9.99 0 001.08 5.52l3.34 2.58C5.2 5.74 7.4 3.98 10 3.98z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </button>

      <div className="auth-divider">
        <span>or continue with email</span>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email address</label>
          <div className="input-wrapper">
            <i className="fas fa-envelope"></i>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="lecturer@university.edu.ng"
              required
            />
          </div>
        </div>
        
        <div className="form-group">
          <div className="label-row">
            <label htmlFor="password">Password</label>
            <Link href="/forgot-password" className="form-link">
              Forgot password?
            </Link>
          </div>
          <div className="input-wrapper">
            <i className="fas fa-lock"></i>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              className="toggle-password"
              aria-label="Toggle password visibility"
            >
              <i className="fas fa-eye"></i>
            </button>
          </div>
        </div>

        <button type="submit" className="btn-submit">
          <span className="btn-text">Log in</span>
        </button>
      </form>

      <p className="auth-switch">
        Don&apos;t have an account? <Link href="/signup">Sign up</Link>
      </p>
    </AuthLayout>
  );
}

