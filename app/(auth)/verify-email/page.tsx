"use client";

import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";

export default function VerifyEmailPage() {
  const illustration = (
    <>
      <div className="auth-float-card afc-1">
        <div className="afc-row">
          <i className="fas fa-check-circle" style={{ color: "#2dd4a8" }}></i>
          <span>Almost there!</span>
        </div>
      </div>
    </>
  );

  return (
    <AuthLayout
      illustration={illustration}
      quote="The AI-powered grading system has significantly improved our workflow and consistency across large classes."
      author="Dr. Ibrahim Bello, FUTA"
      authorInitials="IB"
    >
      <div className="auth-form-header">
        <div className="verify-animation">
          <div className="verify-envelope">
            <i className="fas fa-envelope"></i>
            <div className="verify-badge">
              <i className="fas fa-check"></i>
            </div>
          </div>
        </div>
        <h1>Verify your email</h1>
        <p>
          We&apos;ve sent a verification link to
          <br />
          <strong>lecturer@university.edu.ng</strong>
        </p>
      </div>

      <div className="verify-steps">
        <div className="verify-step">
          <div className="vs-icon">
            <i className="fas fa-envelope-open"></i>
          </div>
          <div className="vs-text">
            <strong>Open your email</strong>
            <span>Check your inbox (and spam folder)</span>
          </div>
        </div>
        <div className="verify-step">
          <div className="vs-icon">
            <i className="fas fa-link"></i>
          </div>
          <div className="vs-text">
            <strong>Click the verification link</strong>
            <span>The link is valid for 24 hours</span>
          </div>
        </div>
        <div className="verify-step">
          <div className="vs-icon">
            <i className="fas fa-rocket"></i>
          </div>
          <div className="vs-text">
            <strong>Start grading!</strong>
            <span>You&apos;ll be redirected to your dashboard</span>
          </div>
        </div>
      </div>

      <div className="verify-actions">
        <button className="btn-submit btn-outline-submit">
          <i className="fas fa-redo"></i> Resend Verification Email
        </button>
      </div>

      <p className="auth-switch">
        Wrong email? <Link href="/signup">Go back</Link>
      </p>
    </AuthLayout>
  );
}
