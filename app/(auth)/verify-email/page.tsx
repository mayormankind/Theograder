"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    // Check for verification token in URL
    const token = searchParams.get('token');
    const emailParam = searchParams.get('email');
    
    if (emailParam) {
      setEmail(emailParam);
    }
    
    if (token) {
      verifyEmail(token);
    }
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/auth/verify?token=${token}`);
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Verification failed');
        return;
      }
      
      setSuccess(data.message);
      setIsVerified(true);
      
      // Redirect to login after successful verification
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
      
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    if (!email) {
      setError('Please provide your email address');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Failed to resend verification email');
        return;
      }
      
      setSuccess(data.message);
      
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
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
        {isVerified ? (
          <div className="verify-animation">
            <div className="verify-envelope verified">
              <i className="fas fa-check-circle"></i>
            </div>
          </div>
        ) : loading ? (
          <div className="verify-animation">
            <div className="verify-envelope loading">
              <i className="fas fa-spinner fa-spin"></i>
            </div>
          </div>
        ) : (
          <div className="verify-animation">
            <div className="verify-envelope">
              <i className="fas fa-envelope"></i>
              <div className="verify-badge">
                <i className="fas fa-check"></i>
              </div>
            </div>
          </div>
        )}
        <h1>{isVerified ? 'Email Verified!' : 'Verify your email'}</h1>
        <p>
          {isVerified ? (
            'Your account has been successfully verified. Redirecting to login...'
          ) : (
            <>
              We&apos;ve sent a verification link to
              <br />
              <strong>{email || 'your email address'}</strong>
            </>
          )}
        </p>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          <span>{success}</span>
        </div>
      )}

      {!isVerified && (
        <>
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
            <button 
              className="btn-submit btn-outline-submit" 
              onClick={resendVerification}
              disabled={loading}
            >
              <i className="fas fa-redo"></i> {loading ? 'Sending...' : 'Resend Verification Email'}
            </button>
          </div>
        </>
      )}

      <p className="auth-switch">
        Wrong email? <Link href="/signup">Go back</Link>
      </p>
    </AuthLayout>
  );
}
