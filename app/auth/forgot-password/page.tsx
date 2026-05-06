"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import AuthLayout from "@/components/auth/AuthLayout";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/lib/validations/auth-schemas";

export default function ForgotPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof ForgotPasswordFormData, string>>
  >({});

  // Validate a single field in real-time
  const validateField = (name: keyof ForgotPasswordFormData, value: string) => {
    try {
      forgotPasswordSchema.shape[name].parse(value);
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    } catch (error) {
      if (error instanceof Error) {
        setFieldErrors((prev) => ({ ...prev, [name]: error.message }));
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Real-time validation
    validateField(name as keyof ForgotPasswordFormData, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFieldErrors({});

    // Validate form
    const result = forgotPasswordSchema.safeParse(formData);
    if (!result.success) {
      const errors: Partial<Record<keyof ForgotPasswordFormData, string>> = {};
      result.error.issues.forEach((err: any) => {
        if (err.path[0]) {
          errors[err.path[0] as keyof ForgotPasswordFormData] = err.message;
        }
      });
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to send reset link");
        return;
      }

      toast.success(data.message);
      setIsSuccess(true);
    } catch (err) {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const illustration = [
    {
      type: "card" as const,
      icon: "fa-envelope-open-text",
      content: "Reset link sent!",
    },
    {
      type: "card" as const,
      icon: "fa-shield-halved",
      content: "Secure & Encrypted",
    },
  ];

  return (
    <AuthLayout illustration={illustration}>
      {!isSuccess ? (
        <div>
          <div className="auth-form-header">
            <div className="auth-icon-circle">
              <i className="fas fa-key"></i>
            </div>
            <h1>Reset your password</h1>
            <p>
              Enter the email associated with your account and we&apos;ll send
              you a reset link.
            </p>
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
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="lecturer@university.edu.ng"
                  required
                  disabled={loading}
                  className={fieldErrors.email ? "input-error" : ""}
                />
              </div>
              {fieldErrors.email && (
                <span className="form-error">{fieldErrors.email}</span>
              )}
            </div>
            <button type="submit" className="btn-submit" disabled={loading}>
              <span className="btn-text">
                {loading ? "Sending..." : "Send Reset Link"}
              </span>
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
            <Link href="/auth/login" className="btn-submit">
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
        Remember your password? <Link href="/auth/login">Log in</Link>
      </p>
    </AuthLayout>
  );
}
