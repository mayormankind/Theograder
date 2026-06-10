"use client";

import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import AuthLayout from "@/components/auth/AuthLayout";
import { AlertTriangle, CheckCircle2, Circle, Key, KeyRound, Lock, RotateCcw, Shield } from "lucide-react";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/validations/auth-schemas";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [token, setToken] = useState<string>("");
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onBlur",
  });

  const newPasswordValue = watch("newPassword", "");
  const confirmPasswordValue = watch("confirmPassword", "");

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

  const onSubmit = async (data: ResetPasswordFormData) => {
    setError(null);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: data.newPassword }),
      });

      const res = await response.json();

      if (!response.ok) {
        setError(res.error || 'Password reset failed');
        return;
      }

      setSuccess(res.message);
      toast.success('Password reset successfully!');
      setTimeout(() => router.push('/auth/login'), 2000);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const illustration = [
    {
      type: 'card' as const,
      icon: Shield,
      content: 'Security Update',
      iconStyle: { color: "#3b82f6" }
    },
    {
      type: 'card' as const,
      icon: KeyRound,
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
              <AlertTriangle size={24} />
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
            <RotateCcw size={14} /> Request New Reset Link
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
            <Key size={24} />
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

      <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label htmlFor="newPassword">New Password</label>
          <div className={`input-wrapper ${errors.newPassword ? 'input-error' : ''}`}>
            <Lock size={14} />
            <input
              type="password"
              id="newPassword"
              placeholder="Enter your new password"
              disabled={isSubmitting}
              {...register("newPassword")}
            />
          </div>
          {errors.newPassword && <span className="form-error">{errors.newPassword.message}</span>}
          <span className="form-hint">Password must be at least 8 characters with uppercase and number</span>
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm New Password</label>
          <div className={`input-wrapper ${errors.confirmPassword ? 'input-error' : ''}`}>
            <Lock size={14} />
            <input
              type="password"
              id="confirmPassword"
              placeholder="Confirm your new password"
              disabled={isSubmitting}
              {...register("confirmPassword")}
            />
          </div>
          {errors.confirmPassword && <span className="form-error">{errors.confirmPassword.message}</span>}
        </div>

        <button type="submit" className="btn-submit" disabled={isSubmitting}>
          <span className="btn-text">{isSubmitting ? 'Resetting...' : 'Reset Password'}</span>
        </button>
      </form>

      <div className="password-requirements">
        <h4>Password Requirements:</h4>
        <ul>
          <li className={newPasswordValue.length >= 8 ? 'valid' : ''}>
            {newPasswordValue.length >= 8 ? <CheckCircle2 size={14} /> : <Circle size={14} />}
            At least 8 characters
          </li>
          <li className={/[A-Z]/.test(newPasswordValue) ? 'valid' : ''}>
            {/[A-Z]/.test(newPasswordValue) ? <CheckCircle2 size={14} /> : <Circle size={14} />}
            At least one uppercase letter
          </li>
          <li className={/[0-9]/.test(newPasswordValue) ? 'valid' : ''}>
            {/[0-9]/.test(newPasswordValue) ? <CheckCircle2 size={14} /> : <Circle size={14} />}
            At least one number
          </li>
          <li className={newPasswordValue === confirmPasswordValue && newPasswordValue.length > 0 ? 'valid' : ''}>
            {newPasswordValue === confirmPasswordValue && newPasswordValue.length > 0 ? <CheckCircle2 size={14} /> : <Circle size={14} />}
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
