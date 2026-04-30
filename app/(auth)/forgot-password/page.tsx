"use client";

import { useState } from "react";
import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";

export default function ForgotPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false);

  const illustration = (
    <>
      <div className="auth-float-card afc-1">
        <div className="afc-row">
          <i className="fas fa-envelope-open-text"></i>
          <span>Reset link sent!</span>
        </div>
      </div>
      <div className="auth-float-card afc-2">
        <div className="afc-row">
          <i className="fas fa-shield-halved"></i>
          <span>Secure & Encrypted</span>
        </div>
      </div>
    </>
  );

  return (
    <AuthLayout
      illustration={illustration}
      quote="Security is paramount when dealing with examination data. GradeIQ takes this seriously."
      author="Dr. Fatima Abubakar, ABU Zaria"
      authorInitials="FA"
    >
      {!isSuccess ? (
        <div>
          <div className="auth-form-header">
            <div className="auth-icon-circle">
              <i className="fas fa-key"></i>
            </div>
            <h1>Reset your password</h1>
            <p>
              Enter the email associated with your account and we&apos;ll send you
              a reset link.
            </p>
          </div>
          <form
            className="auth-form"
            onSubmit={(e) => {
              e.preventDefault();
              setIsSuccess(true);
            }}
          >
            <div className="form-group">
              <label htmlFor="resetEmail">Email address</label>
              <div className="input-wrapper">
                <i className="fas fa-envelope"></i>
                <input
                  type="email"
                  id="resetEmail"
                  placeholder="lecturer@university.edu.ng"
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn-submit">
              <span className="btn-text">Send Reset Link</span>
            </button>
          </form>
        </div>
      ) : (
        <div className="auth-success-state">
          <div className="success-icon">
            <div className="success-circle">
              <i className="fas fa-envelope-circle-check"></i>
            </div>
          </div>
          <h2>Check your email</h2>
          <p>
            We&apos;ve sent a password reset link to your email. The link
            expires in 30 minutes.
          </p>
          <div className="success-actions">
            <Link href="/login" className="btn-submit">
              Back to Login
            </Link>
            <button
              className="btn-text-link"
              onClick={() => setIsSuccess(false)}
            >
              Didn&apos;t receive it? <span>Resend</span>
            </button>
          </div>
        </div>
      )}

      <p className="auth-switch">
        Remember your password? <Link href="/login">Log in</Link>
      </p>
    </AuthLayout>
  );
}
