"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Brain, Eye, EyeOff, Key, Lock, Mail } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import {
  loginPasswordSchema,
  loginOTPRequestSchema,
  loginOTPVerifySchema,
  type LoginPasswordFormData,
  type LoginOTPRequestFormData,
  type LoginOTPVerifyFormData,
} from "@/lib/validations/auth-schemas";

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();

  const [useOTP, setUseOTP] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const passwordForm = useForm<LoginPasswordFormData>({
    resolver: zodResolver(loginPasswordSchema),
    mode: "onBlur",
  });

  const otpRequestForm = useForm<LoginOTPRequestFormData>({
    resolver: zodResolver(loginOTPRequestSchema),
    mode: "onBlur",
  });

  const otpVerifyForm = useForm<LoginOTPVerifyFormData>({
    resolver: zodResolver(loginOTPVerifySchema),
    mode: "onBlur",
  });

  useEffect(() => { document.title = "Login | TheoGrader"; }, []);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          router.push("/dashboard");
        }
      } catch (error) {
        // User is not logged in, continue to login page
      }
    };
    checkAuth();
  }, [router]);

  // ── Submit handlers ────────────────────────────────────────────────────────

  const onPasswordSubmit = passwordForm.handleSubmit(async (data) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password, useOTP: false }),
      });
      const res = await response.json();
      if (!response.ok) { toast.error(res.error || "Login failed"); return; }
      toast.success(res.message || "Welcome back!", {
        duration: 2000,
        onDismiss: () => router.push("/dashboard"),
        onAutoClose: () => router.push("/dashboard"),
      });
    } catch (err) {
      toast.error("An unexpected error occurred. Please try again.");
    }
  });

  const onOTPRequest = otpRequestForm.handleSubmit(async (data) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, useOTP: true }),
      });
      const res = await response.json();
      if (!response.ok) { toast.error(res.error || "Failed to send OTP"); return; }
      toast.success(res.message || "OTP sent! Check your email.");
      otpVerifyForm.setValue("email", data.email);
      setOtpSent(true);
    } catch (err) {
      toast.error("An unexpected error occurred. Please try again.");
    }
  });

  const onOTPVerify = otpVerifyForm.handleSubmit(async (data) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, otp: data.otp }),
      });
      const res = await response.json();
      if (!response.ok) { toast.error(res.error || "OTP verification failed"); return; }
      toast.success(res.message || "Verified! Redirecting…", {
        duration: 2000,
        onDismiss: () => router.push("/dashboard"),
        onAutoClose: () => router.push("/dashboard"),
      });
    } catch (err) {
      toast.error("An unexpected error occurred. Please try again.");
    }
  });

  // ── Switch login mode — reset state cleanly ───────────────────────────────

  const handleSwitchMode = () => {
    const currentEmail = useOTP
      ? (otpSent ? otpVerifyForm.getValues("email") : otpRequestForm.getValues("email"))
      : passwordForm.getValues("email");
    setUseOTP((v) => !v);
    setOtpSent(false);
    if (!useOTP) {
      otpRequestForm.reset({ email: currentEmail });
      otpVerifyForm.reset({ email: currentEmail, otp: "" });
    } else {
      passwordForm.reset({ email: currentEmail, password: "" });
    }
  };

  // ── Illustration 
  const illustration = [
    {
      type: "card" as const,
      dotColor: "green" as const,
      content: "Script #142 — Graded",
      score: "73/100",
    },
    { type: "card" as const, icon: Brain, content: "SBERT Score: 0.89" },
    { type: "progress" as const, progress: 47, progressTotal: 200 },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AuthLayout
      illustration={illustration}
    >
      <div className="auth-form-header">
        <h1>Welcome back</h1>
        <p>Log in to your TheoGrader account to continue grading.</p>
      </div>

      <div className="auth-divider">
        <span>login with email</span>
      </div>

      {!useOTP ? (
        /* ── Password login form ── */
        <form className="auth-form" onSubmit={onPasswordSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className={`input-wrapper ${passwordForm.formState.errors.email ? "input-error" : ""}`}>
              <Mail size={14} />
              <input
                type="email"
                id="email"
                placeholder="lecturer@university.edu.ng"
                autoComplete="email"
                disabled={passwordForm.formState.isSubmitting}
                aria-invalid={!!passwordForm.formState.errors.email}
                {...passwordForm.register("email")}
              />
            </div>
            {passwordForm.formState.errors.email && (
              <span className="form-error" role="alert">
                {passwordForm.formState.errors.email.message}
              </span>
            )}
          </div>

          <div className="form-group">
            <div className="label-row">
              <label htmlFor="password">Password</label>
              <Link href="/auth/forgot-password" className="form-link">
                Forgot password?
              </Link>
            </div>
            <div className={`input-wrapper ${passwordForm.formState.errors.password ? "input-error" : ""}`}>
              <Lock size={14} />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={passwordForm.formState.isSubmitting}
                aria-invalid={!!passwordForm.formState.errors.password}
                {...passwordForm.register("password")}
              />
              <button
                type="button"
                className="toggle-password"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {passwordForm.formState.errors.password && (
              <span className="form-error" role="alert">
                {passwordForm.formState.errors.password.message}
              </span>
            )}
          </div>

          <button type="submit" className="btn-submit" disabled={passwordForm.formState.isSubmitting}>
            <span className="btn-text">
              {passwordForm.formState.isSubmitting ? "Logging in…" : "Log in"}
            </span>
          </button>
        </form>
      ) : !otpSent ? (
        /* ── OTP request form ── */
        <form className="auth-form" onSubmit={onOTPRequest} noValidate>
          <div className="form-group">
            <label htmlFor="otp-email">Email Address</label>
            <div className={`input-wrapper ${otpRequestForm.formState.errors.email ? "input-error" : ""}`}>
              <Mail size={14} />
              <input
                type="email"
                id="otp-email"
                placeholder="lecturer@university.edu.ng"
                autoComplete="email"
                disabled={otpRequestForm.formState.isSubmitting}
                aria-invalid={!!otpRequestForm.formState.errors.email}
                {...otpRequestForm.register("email")}
              />
            </div>
            {otpRequestForm.formState.errors.email && (
              <span className="form-error" role="alert">
                {otpRequestForm.formState.errors.email.message}
              </span>
            )}
          </div>
          <button type="submit" className="btn-submit" disabled={otpRequestForm.formState.isSubmitting}>
            <span className="btn-text">
              {otpRequestForm.formState.isSubmitting ? "Processing…" : "Send OTP"}
            </span>
          </button>
        </form>
      ) : (
        /* ── OTP verify form ── */
        <form className="auth-form" onSubmit={onOTPVerify} noValidate>
          <div className="form-group">
            <label htmlFor="otp-email-locked">Email Address</label>
            <div className="input-wrapper">
              <Mail size={14} />
              <input
                type="email"
                id="otp-email-locked"
                autoComplete="email"
                disabled
                {...otpVerifyForm.register("email")}
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="otp">One-Time Password</label>
            <div className={`input-wrapper ${otpVerifyForm.formState.errors.otp ? "input-error" : ""}`}>
              <Key size={14} />
              <input
                type="text"
                id="otp"
                placeholder="Enter 6-digit code"
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
                disabled={otpVerifyForm.formState.isSubmitting}
                aria-describedby="otp-hint"
                aria-invalid={!!otpVerifyForm.formState.errors.otp}
                {...otpVerifyForm.register("otp")}
              />
            </div>
            {otpVerifyForm.formState.errors.otp ? (
              <span className="form-error" role="alert">
                {otpVerifyForm.formState.errors.otp.message}
              </span>
            ) : (
              <span id="otp-hint" className="form-hint">
                Check your email for the 6-digit verification code
              </span>
            )}
          </div>
          <button type="submit" className="btn-submit" disabled={otpVerifyForm.formState.isSubmitting}>
            <span className="btn-text">
              {otpVerifyForm.formState.isSubmitting ? "Processing…" : "Verify OTP"}
            </span>
          </button>
        </form>
      )}

      {/* ── Switch login mode ── */}
      <div className="auth-switch-method">
        <button
          type="button"
          className="btn-text-link"
          onClick={handleSwitchMode}
        >
          {useOTP ? "Use password instead" : "Use OTP instead"}
        </button>
        <span className="otp-hint">
          {useOTP
            ? "Log in with your email and password"
            : "Log in with a one-time code sent to your email"}
        </span>
      </div>

      <p className="auth-switch">
        Don&apos;t have an account? <Link href="/auth/signup">Sign up</Link>
      </p>
    </AuthLayout>
  );
}
