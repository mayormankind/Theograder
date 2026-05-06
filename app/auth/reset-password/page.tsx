"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import AuthLayout from "@/components/auth/AuthLayout";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/validations/auth-schemas";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<ResetPasswordFormData>({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [token, setToken] = useState<string>("");
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ResetPasswordFormData, string>>>({});

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

  // Validate a single field in real-time
  const validateField = (name: keyof ResetPasswordFormData, value: string) => {
    try {
      resetPasswordSchema.shape[name].parse(value);
      setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    } catch (error) {
      if (error instanceof Error) {
        setFieldErrors(prev => ({ ...prev, [name]: error.message }));
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
    // Real-time validation
    validateField(name as keyof ResetPasswordFormData, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    // Validate form
    const result = resetPasswordSchema.safeParse(formData);
    if (!result.success) {
      const errors: Partial<Record<keyof ResetPasswordFormData, string>> = {};
      result.error.issues.forEach((err: any) => {
        if (err.path[0]) {
          errors[err.path[0] as keyof ResetPasswordFormData] = err.message;
        }
      });
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    try {
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

  const illustration = [
    {
      type: 'card' as const,
      icon: 'fa-shield-alt',
      content: 'Security Update',
      iconStyle: { color: "#3b82f6" }
    },
    {
      type: 'card' as const,
      icon: 'fa-key',
      content: 'New Password Set',
      iconStyle: { color: "#10b981" }
    }
  ];

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
              className={fieldErrors.newPassword ? 'input-error' : ''}
            />
          </div>
          {fieldErrors.newPassword && <span className="form-error">{fieldErrors.newPassword}</span>}
          <span className="form-hint">Password must be at least 8 characters with uppercase and number</span>
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
              className={fieldErrors.confirmPassword ? 'input-error' : ''}
            />
          </div>
          {fieldErrors.confirmPassword && <span className="form-error">{fieldErrors.confirmPassword}</span>}
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
          <li className={/[A-Z]/.test(formData.newPassword) ? 'valid' : ''}>
            <i className={`fas ${/[A-Z]/.test(formData.newPassword) ? 'fa-check-circle' : 'fa-circle'}`}></i>
            At least one uppercase letter
          </li>
          <li className={/[0-9]/.test(formData.newPassword) ? 'valid' : ''}>
            <i className={`fas ${/[0-9]/.test(formData.newPassword) ? 'fa-check-circle' : 'fa-circle'}`}></i>
            At least one number
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
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
          <p style={{ color: '#64748b', fontSize: '16px' }}>Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
