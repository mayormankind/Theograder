"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import AuthLayout from "@/components/auth/AuthLayout";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to create account');
        return;
      }

      toast.success(data.message);
      
      // Redirect to verification page after successful signup
      setTimeout(() => {
        router.push('/auth/verify-email');
      }, 2000);

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

      <div className="auth-divider">
        <span>register with email</span>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <div className="input-wrapper">
            <i className="fas fa-user"></i>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Dr. Oluwaseun Adeyemi"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address</label>
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
          <span className="form-hint">
            Please use your official university email address
          </span>
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <div className="input-wrapper">
            <i className="fas fa-lock"></i>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a strong password (min. 8 characters)"
              required
              minLength={8}
              disabled={loading}
            />
            <button
              type="button"
              className="toggle-password"
              aria-label="Toggle password"
              onClick={() => setShowPassword(!showPassword)}
            >
              <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <div className="input-wrapper">
            <i className="fas fa-lock"></i>
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
              minLength={8}
              disabled={loading}
            />
            <button
              type="button"
              className="toggle-password"
              aria-label="Toggle confirm password"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <i className={`fas ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
            </button>
          </div>
        </div>

        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input type="checkbox" required disabled={loading} />
            <span className="checkmark"></span>
            I agree to the <Link href="#" className="form-link">Terms of Service</Link> and <Link href="#" className="form-link">Privacy Policy</Link>
          </label>
        </div>

        <button type="submit" className="btn-submit" disabled={loading}>
          <span className="btn-text">{loading ? 'Creating Account...' : 'Create Account'}</span>
        </button>
      </form>

      <p className="auth-switch">
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </AuthLayout>
  );
}
