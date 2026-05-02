"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import AuthLayout from "@/components/auth/AuthLayout";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    otp: ''
  });
  const [loading, setLoading] = useState(false);
  const [useOTP, setUseOTP] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          useOTP: false
        })
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Login failed');
        return;
      }

      toast.success(data.message);
      
      // Store user session and redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);

    } catch (err) {
      console.error('Login error:', err);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          useOTP: true
        })
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to send OTP');
        return;
      }

      toast.success(data.message);
      setOtpSent(true);

    } catch (err) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          otp: formData.otp
        })
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'OTP verification failed');
        return;
      }

      toast.success(data.message);
      
      // Store user session and redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);

    } catch (err) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

      <div className="auth-divider">
        <span>login with email</span>
      </div>

      {!useOTP ? (
        <form className="auth-form" onSubmit={handlePasswordLogin}>
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <div className="input-wrapper">
              <i className="fas fa-envelope"></i>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="lecturer@university.edu.ng"
                required
                disabled={loading}
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
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="toggle-password"
                aria-label="Toggle password visibility"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
              </button>
            </div>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            <span className="btn-text">{loading ? 'Logging in...' : 'Log in'}</span>
          </button>
        </form>
      ) : (
        <form className="auth-form" onSubmit={otpSent ? handleOTPVerify : handleOTPRequest}>
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <div className="input-wrapper">
              <i className="fas fa-envelope"></i>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="lecturer@university.edu.ng"
                required
                disabled={loading || otpSent}
              />
            </div>
          </div>

          {otpSent && (
            <div className="form-group">
              <label htmlFor="otp">One-Time Password</label>
              <div className="input-wrapper">
                <i className="fas fa-key"></i>
                <input
                  type="text"
                  id="otp"
                  name="otp"
                  value={formData.otp}
                  onChange={handleChange}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  required
                  disabled={loading}
                />
              </div>
              <span className="form-hint">Check your email for the verification code</span>
            </div>
          )}

          <button type="submit" className="btn-submit" disabled={loading}>
            <span className="btn-text">
              {loading ? 'Processing...' : otpSent ? 'Verify OTP' : 'Send OTP'}
            </span>
          </button>
        </form>
      )}

      <div className="auth-switch-method">
        <button 
          className="btn-text-link" 
          onClick={() => {
            setUseOTP(!useOTP);
            setOtpSent(false);
          }}
        >
          {useOTP ? 'Use password instead' : 'Use OTP instead'}
        </button>
      </div>

      <p className="auth-switch">
        Don&apos;t have an account? <Link href="/signup">Sign up</Link>
      </p>
    </AuthLayout>
  );
}

