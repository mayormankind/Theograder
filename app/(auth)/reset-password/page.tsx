"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import AuthLayout from "@/components/auth/AuthLayout";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [token, setToken] = useState<string>("");
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    // Check for reset token in URL
    const tokenParam = searchParams.get('token');
    
    if (!tokenParam) {
      setError('Reset token is required. Please use the link from your email.');
      setTokenValid(false);
      return;
    }
    
    setToken(tokenParam);
    setTokenValid(true);
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Validate passwords match
      if (formData.newPassword !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      // Validate password strength
      if (formData.newPassword.length < 8) {
        setError('Password must be at least 8 characters long');
        return;
      }

      const response = await fetch('/api/auth/forgot-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Password reset failed');
        return;
      }
      
      setSuccess(data.message);
      toast.success('Password reset successfully!');
      
      // Redirect to login after successful reset
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
      
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
          <i className="fas fa-shield-alt" style={{ color: "#3b82f6" }}></i>
          <span>Security Update</span>
        </div>
      </div>
      <div className="auth-float-card afc-2">
        <div className="afc-row">
          <i className="fas fa-key" style={{ color: "#10b981" }}></i>
          <span>New Password Set</span>
        </div>
      </div>
    </>
  );

  if (tokenValid === null) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #e2e8f0', 
            borderTop: '4px solid #3b82f6', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ color: '#64748b', fontSize: '16px' }}>Validating reset token...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <AuthLayout
        illustration={illustration}
        quote="Security is our top priority. All password resets are encrypted and time-limited."
        author="TheoGrader Security Team"
        authorInitials="TS"
      >
        <div className="auth-form-header">
          <div className="verify-animation">
            <div className="verify-envelope error">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
          </div>
          <h1>Invalid Reset Link</h1>
          <p>This password reset link is invalid or has expired.</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        <div className="verify-actions">
          <Link href="/auth/forgot-password" className="btn-submit btn-outline-submit" style={{ display: 'inline-block', textAlign: 'center' }}>
            <i className="fas fa-redo"></i> Request New Reset Link
          </Link>
        </div>

        <p className="auth-switch">
          Remember your password? <Link href="/auth/login">Log in</Link>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      illustration={illustration}
      quote="A strong password is your first line of defense in protecting your grading data."
      author="Dr. Sarah Chen, Security Lead"
      authorInitials="SC"
    >
      <div className="auth-form-header">
        <div className="verify-animation">
          <div className="verify-envelope">
            <i className="fas fa-key"></i>
          </div>
        </div>
        <h1>Reset Your Password</h1>
        <p>Enter your new password below.</p>
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

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="newPassword">New Password</label>
          <div className="input-wrapper">
            <i className="fas fa-lock"></i>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="Enter your new password"
              required
              disabled={loading}
              minLength={8}
            />
          </div>
          <span className="form-hint">Password must be at least 8 characters long</span>
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm New Password</label>
          <div className="input-wrapper">
            <i className="fas fa-lock"></i>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your new password"
              required
              disabled={loading}
              minLength={8}
            />
          </div>
        </div>

        <button type="submit" className="btn-submit" disabled={loading}>
          <span className="btn-text">{loading ? 'Resetting...' : 'Reset Password'}</span>
        </button>
      </form>

      <div className="password-requirements">
        <h4>Password Requirements:</h4>
        <ul>
          <li className={formData.newPassword.length >= 8 ? 'valid' : ''}>
            <i className={`fas ${formData.newPassword.length >= 8 ? 'fa-check-circle' : 'fa-circle'}`}></i>
            At least 8 characters
          </li>
          <li className={formData.newPassword === formData.confirmPassword && formData.newPassword.length > 0 ? 'valid' : ''}>
            <i className={`fas ${formData.newPassword === formData.confirmPassword && formData.newPassword.length > 0 ? 'fa-check-circle' : 'fa-circle'}`}></i>
            Passwords match
          </li>
        </ul>
      </div>

      <p className="auth-switch">
        Remember your password? <Link href="/auth/login">Log in</Link>
      </p>

      <style jsx>{`
        .password-requirements {
          margin-top: 20px;
          padding: 15px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .password-requirements h4 {
          margin: 0 0 10px 0;
          font-size: 14px;
          font-weight: 600;
          color: #475569;
        }

        .password-requirements ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .password-requirements li {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #64748b;
          margin-bottom: 5px;
        }

        .password-requirements li.valid {
          color: #10b981;
        }

        .password-requirements li i {
          font-size: 12px;
        }

        .verify-envelope.error {
          background: #fef2f2;
          border-color: #ef4444;
          color: #ef4444;
        }

        .verify-envelope.error i {
          color: #ef4444;
        }
      `}</style>
    </AuthLayout>
  );
}
