"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { toast } from "sonner";
import AuthLayout from "@/components/auth/AuthLayout";
import { Key, Mail, MailCheck, MailOpen, ShieldCheck } from "lucide-react";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/lib/validations/auth-schemas";

export default function ForgotPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });

      const res = await response.json();

      if (!response.ok) {
        toast.error(res.error || "Failed to send reset link");
        return;
      }

      toast.success(res.message);
      setIsSuccess(true);
    } catch (err) {
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  const illustration = [
    {
      type: "card" as const,
      icon: MailOpen,
      content: "Reset link sent!",
    },
    {
      type: "card" as const,
      icon: ShieldCheck,
      content: "Secure & Encrypted",
    },
  ];

  return (
    <AuthLayout illustration={illustration}>
      {!isSuccess ? (
        <div>
          <div className="auth-form-header">
            <div className="auth-icon-circle">
              <Key size={20} />
            </div>
            <h1>Reset your password</h1>
            <p>
              Enter the email associated with your account and we&apos;ll send
              you a reset link.
            </p>
          </div>
          <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <div className={`input-wrapper ${errors.email ? "input-error" : ""}`}>
                <Mail size={14} />
                <input
                  type="email"
                  id="email"
                  placeholder="lecturer@university.edu.ng"
                  disabled={isSubmitting}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <span className="form-error">{errors.email.message}</span>
              )}
            </div>
            <button type="submit" className="btn-submit" disabled={isSubmitting}>
              <span className="btn-text">
                {isSubmitting ? "Sending..." : "Send Reset Link"}
              </span>
            </button>
          </form>
        </div>
      ) : (
        <div className="auth-success-state">
          <div className="success-icon">
            <div className="success-circle">
              <MailCheck size={24} />
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
