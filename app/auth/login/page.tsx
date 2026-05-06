"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import * as z from "zod";
import AuthLayout from "@/components/auth/AuthLayout";
import {
  loginPasswordSchema,
  loginOTPRequestSchema,
  loginOTPVerifySchema,
  type LoginPasswordFormData,
} from "@/lib/validations/auth-schemas";

// ─── Types ────────────────────────────────────────────────────────────────────
type LoginFormData = LoginPasswordFormData & { otp: string };
type LoginFieldErrors = Partial<Record<keyof LoginFormData, string>>;
type LoginTouched = Partial<Record<keyof LoginFormData, boolean>>;

// ─── Single-field validator ──────────────────────────────────────────────────

function validateField(
  name: keyof LoginFormData,
  formData: LoginFormData,
  schema: z.ZodObject<any>,
): string | undefined {
  if (!(name in schema.shape)) return undefined;

  const result = schema.shape[name].safeParse(formData[name]);
  if (result.success) return undefined;
  return result.error.issues[0]?.message;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
    otp: "",
  });

  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [touched, setTouched] = useState<LoginTouched>({});

  const [loading, setLoading] = useState(false);
  const [useOTP, setUseOTP] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ── Derive which schema is active based on current login mode ─────────────

  const activeSchema = useOTP
    ? otpSent
      ? loginOTPVerifySchema
      : loginOTPRequestSchema
    : loginPasswordSchema;

  // ── onChange: update state, re-validate only if field already touched ──────

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target as {
        name: keyof LoginFormData;
        value: string;
      };

      setFormData((prev) => {
        const next = { ...prev, [name]: value };

        if (touched[name]) {
          setFieldErrors((errs) => ({
            ...errs,
            [name]: validateField(name, next, activeSchema),
          }));
        }

        return next;
      });
    },
    [touched, activeSchema],
  );

  // ── onBlur: mark field as touched, validate for the first time ─────────────

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const { name } = e.target as { name: keyof LoginFormData };

      setTouched((prev) => ({ ...prev, [name]: true }));
      setFieldErrors((prev) => ({
        ...prev,
        [name]: validateField(name, formData, activeSchema),
      }));
    },
    [formData, activeSchema],
  );

  // ── Shared: validate all fields in the active schema before submitting ──────

  function validateAll(): LoginFieldErrors {
    const errors: LoginFieldErrors = {};
    for (const key of Object.keys(
      activeSchema.shape,
    ) as (keyof LoginFormData)[]) {
      const error = validateField(key, formData, activeSchema);
      if (error) errors[key] = error;
    }
    return errors;
  }

  // ── Password login ─────────────────────────────────────────────────────────

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTouched({ email: true, password: true });
    const errors = validateAll();
    setFieldErrors(errors);

    if (Object.values(errors).some(Boolean)) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          useOTP: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Login failed");
        return;
      }

      toast.success(data.message || "Welcome back!", {
        duration: 2000,
        onDismiss: () => router.push("/dashboard"),
        onAutoClose: () => router.push("/dashboard"),
      });
    } catch (err) {
      console.error("[login:password] unexpected error:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── OTP request ────────────────────────────────────────────────────────────

  const handleOTPRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTouched({ email: true });
    const errors = validateAll();
    setFieldErrors(errors);

    if (Object.values(errors).some(Boolean)) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, useOTP: true }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to send OTP");
        return;
      }

      toast.success(data.message || "OTP sent! Check your email.");
      setOtpSent(true);
    } catch (err) {
      console.error("[login:otp-request] unexpected error:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── OTP verify ─────────────────────────────────────────────────────────────

  const handleOTPVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTouched({ email: true, otp: true });
    const errors = validateAll();
    setFieldErrors(errors);

    if (Object.values(errors).some(Boolean)) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, otp: formData.otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "OTP verification failed");
        return;
      }

      toast.success(data.message || "Verified! Redirecting…", {
        duration: 2000,
        onDismiss: () => router.push("/dashboard"),
        onAutoClose: () => router.push("/dashboard"),
      });
    } catch (err) {
      console.error("[login:otp-verify] unexpected error:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Switch login mode — reset state cleanly ───────────────────────

  const handleSwitchMode = () => {
    setUseOTP((v) => !v);
    setOtpSent(false);
    setFieldErrors({});
    setTouched({});
    // Keep email pre-filled — user shouldn't have to retype it
    setFormData((prev) => ({ ...prev, password: "", otp: "" }));
  };

  // ── Illustration 
  const illustration = [
    {
      type: "card" as const,
      dotColor: "green" as const,
      content: "Script #142 — Graded",
      score: "73/100",
    },
    { type: "card" as const, icon: "fa-brain", content: "SBERT Score: 0.89" },
    { type: "progress" as const, progress: 47, progressTotal: 200 },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AuthLayout
      illustration={illustration}
    >
      <div className="auth-form-header">
        <h1>Welcome back</h1>
        <p>Log in to your GradeIQ account to continue grading.</p>
      </div>

      <div className="auth-divider">
        <span>login with email</span>
      </div>

      {!useOTP ? (
        /* ── Password login form ── */
        <form className="auth-form" onSubmit={handlePasswordLogin} noValidate>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div
              className={`input-wrapper ${fieldErrors.email ? "input-error" : ""}`}
            >
              <i className="fas fa-envelope" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="lecturer@university.edu.ng"
                autoComplete="email"
                disabled={loading}
                aria-invalid={!!fieldErrors.email}
              />
            </div>
            {fieldErrors.email && (
              <span className="form-error" role="alert">
                {fieldErrors.email}
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
            <div
              className={`input-wrapper ${fieldErrors.password ? "input-error" : ""}`}
            >
              <i className="fas fa-lock" />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
                aria-invalid={!!fieldErrors.password}
              />
              <button
                type="button"
                className="toggle-password"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                <i
                  className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                />
              </button>
            </div>
            {fieldErrors.password && (
              <span className="form-error" role="alert">
                {fieldErrors.password}
              </span>
            )}
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            <span className="btn-text">
              {loading ? "Logging in…" : "Log in"}
            </span>
          </button>
        </form>
      ) : (
        /* ── OTP login form ── */
        <form
          className="auth-form"
          onSubmit={otpSent ? handleOTPVerify : handleOTPRequest}
          noValidate
        >
          <div className="form-group">
            <label htmlFor="otp-email">Email Address</label>
            <div
              className={`input-wrapper ${fieldErrors.email ? "input-error" : ""}`}
            >
              <i className="fas fa-envelope" />
              <input
                type="email"
                id="otp-email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="lecturer@university.edu.ng"
                autoComplete="email"
                // Lock email field once OTP has been sent
                disabled={loading || otpSent}
                aria-invalid={!!fieldErrors.email}
              />
            </div>
            {fieldErrors.email && (
              <span className="form-error" role="alert">
                {fieldErrors.email}
              </span>
            )}
          </div>

          {otpSent && (
            <div className="form-group">
              <label htmlFor="otp">One-Time Password</label>
              <div
                className={`input-wrapper ${fieldErrors.otp ? "input-error" : ""}`}
              >
                <i className="fas fa-key" />
                <input
                  type="text"
                  id="otp"
                  name="otp"
                  value={formData.otp}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  disabled={loading}
                  aria-describedby="otp-hint"
                  aria-invalid={!!fieldErrors.otp}
                />
              </div>
              {fieldErrors.otp ? (
                <span className="form-error" role="alert">
                  {fieldErrors.otp}
                </span>
              ) : (
                <span id="otp-hint" className="form-hint">
                  Check your email for the 6-digit verification code
                </span>
              )}
            </div>
          )}

          <button type="submit" className="btn-submit" disabled={loading}>
            <span className="btn-text">
              {loading ? "Processing…" : otpSent ? "Verify OTP" : "Send OTP"}
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
