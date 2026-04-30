"use client";

import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";

export default function SignupPage() {
  const illustration = (
    <>
      <div className="auth-float-card afc-1">
        <div className="afc-row">
          <div className="afc-dot green"></div>
          <span>Account Created</span>
        </div>
        <div className="afc-score">Welcome!</div>
      </div>
      <div className="auth-float-card afc-2">
        <div className="afc-row">
          <i className="fas fa-graduation-cap"></i>
          <span>Upload your first rubric</span>
        </div>
      </div>
      <div className="auth-float-card afc-3">
        <div className="afc-row">
          <i className="fas fa-shield-halved"></i>
          <span>NDPR Compliant</span>
        </div>
      </div>
    </>
  );

  return (
    <AuthLayout
      illustration={illustration}
      quote="The rubric-based grading is brilliant. It grades exactly how I would — but in minutes."
      author="Prof. Ngozi Kalu, UNN"
      authorInitials="NK"
    >
      <div className="auth-form-header">
        <h1>Create your account</h1>
        <p>One account per lecturer. Full access to all features.</p>
      </div>

      <button className="btn-oauth" id="googleSignup">
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
        <span>or register with email</span>
      </div>

      <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="firstName">First name</label>
            <div className="input-wrapper">
              <i className="fas fa-user"></i>
              <input
                type="text"
                id="firstName"
                placeholder="Oluwaseun"
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="lastName">Last name</label>
            <div className="input-wrapper">
              <i className="fas fa-user"></i>
              <input
                type="text"
                id="lastName"
                placeholder="Adeyemi"
                required
              />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="signupEmail">University email</label>
          <div className="input-wrapper">
            <i className="fas fa-envelope"></i>
            <input
              type="email"
              id="signupEmail"
              placeholder="lecturer@university.edu.ng"
              required
            />
          </div>
          <span className="form-hint">
            Please use your official university email address
          </span>
        </div>

        <div className="form-group">
          <label htmlFor="university">University</label>
          <div className="input-wrapper select-wrapper">
            <i className="fas fa-building-columns"></i>
            <select id="university" required defaultValue="">
              <option value="" disabled>
                Select your university
              </option>
              <option>University of Lagos</option>
              <option>University of Ibadan</option>
              <option>Obafemi Awolowo University</option>
              <option>University of Nigeria, Nsukka</option>
              <option>Ahmadu Bello University</option>
              <option>Federal University of Technology, Akure</option>
              <option>Lagos State University</option>
              <option>Covenant University</option>
              <option>Other</option>
            </select>
            <i className="fas fa-chevron-down select-arrow"></i>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="department">Department</label>
          <div className="input-wrapper">
            <i className="fas fa-flask"></i>
            <input
              type="text"
              id="department"
              placeholder="e.g. Computer Science"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="signupPassword">Password</label>
          <div className="input-wrapper">
            <i className="fas fa-lock"></i>
            <input
              type="password"
              id="signupPassword"
              placeholder="Create a strong password"
              required
              minLength={8}
            />
            <button
              type="button"
              className="toggle-password"
              aria-label="Toggle password"
            >
              <i className="fas fa-eye"></i>
            </button>
          </div>
          <div className="password-strength">
            <div className="strength-bars">
              <div className="strength-bar"></div>
              <div className="strength-bar"></div>
              <div className="strength-bar"></div>
              <div className="strength-bar"></div>
            </div>
            <span className="strength-text">Password strength</span>
          </div>
        </div>

        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input type="checkbox" required />
            <span className="checkmark"></span>
            I agree to the <Link href="#" className="form-link">Terms of Service</Link> and <Link href="#" className="form-link">Privacy Policy</Link>
          </label>
        </div>

        <button type="submit" className="btn-submit">
          <span className="btn-text">Create Account</span>
        </button>
      </form>

      <p className="auth-switch">
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </AuthLayout>
  );
}
