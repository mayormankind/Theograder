"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import AuthLayout from "@/components/auth/AuthLayout";
import {
  signupSchema,
  type SignupFormData,
} from "@/lib/validations/auth-schemas";

// ─── Password strength helpers ────────────────────────────────────────────────
function getPasswordIssues(password: string): string[] {
  const issues: string[] = [];
  if (password.length < 8) issues.push("At least 8 characters");
  if (!/[A-Z]/.test(password)) issues.push("One uppercase letter");
  if (!/[0-9]/.test(password)) issues.push("One number");
  return issues;
}

function getPasswordStrength(password: string): 0 | 1 | 2 | 3 {
  if (!password) return 0;
  const issues = getPasswordIssues(password);
  if (issues.length === 3) return 1; // weak
  if (issues.length >= 1) return 2; // fair
  return 3; // strong
}

// ─── Single-field validator ───────────────────────────────────────────────────

function validateField(
  name: keyof SignupFormData,
  formData: SignupFormData,
): string | undefined {
  if (name === "confirmPassword") {
    const result = signupSchema.safeParse(formData);
    if (result.success) return undefined;
    const issue = result.error.issues.find(
      (i) => i.path[0] === "confirmPassword",
    );
    return issue?.message;
  }

  const result = signupSchema.shape[name].safeParse(formData[name]);
  if (result.success) return undefined;
  return result.error.issues[0]?.message;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SignupPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<SignupFormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof SignupFormData, string>>
  >({});

  // touched tracks which fields the user has left at least once.
  // Errors are only shown on touched fields — except on submit, which forces all.
  const [touched, setTouched] = useState<
    Partial<Record<keyof SignupFormData, boolean>>
  >({});

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ── onChange: update state, re-validate only if field already touched ──────

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target as {
        name: keyof SignupFormData;
        value: string;
      };

      setFormData((prev) => {
        const next = { ...prev, [name]: value };

        if (touched[name]) {
          setFieldErrors((errs) => ({
            ...errs,
            [name]: validateField(name, next),
          }));
        }

        // Always keep confirmPassword in sync once it's been touched,
        // so fixing the password field clears the mismatch error immediately.
        if (name === "password" && touched.confirmPassword) {
          setFieldErrors((errs) => ({
            ...errs,
            confirmPassword: validateField("confirmPassword", next),
          }));
        }

        return next;
      });
    },
    [touched],
  );

  // ── onBlur: mark field as touched and validate for the first time ──────────

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const { name } = e.target as { name: keyof SignupFormData };

      setTouched((prev) => ({ ...prev, [name]: true }));
      setFieldErrors((prev) => ({
        ...prev,
        [name]: validateField(name, formData),
      }));
    },
    [formData],
  );

  // ── onSubmit: touch all fields, run full validation, then submit ───────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Force-touch every field so errors become visible everywhere.
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    const errors: Partial<Record<keyof SignupFormData, string>> = {
      name: validateField("name", formData),
      email: validateField("email", formData),
      password: validateField("password", formData),
      confirmPassword: validateField("confirmPassword", formData),
    };

    setFieldErrors(errors);

    if (Object.values(errors).some(Boolean)) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to create account");
        return;
      }

      // Redirect happens when the toast closes — no fragile setTimeout.
      toast.success(data.message || "Account created! Check your email.", {
        duration: 4000,
        onDismiss: () => router.push("/auth/verify-email"),
        onAutoClose: () => router.push("/auth/verify-email"),
      });
    } catch (err) {
      console.error("[signup] unexpected error:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Derived UI state ───────────────────────────────────────────────────────

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthMeta = {
    0: { label: "", cls: "" },
    1: { label: "Weak", cls: "strength-weak" },
    2: { label: "Fair", cls: "strength-fair" },
    3: { label: "Strong", cls: "strength-strong" },
  }[passwordStrength];

  // ── Illustration ───────────────────────────────────────────────────────────

  const illustration = [
    {
      type: "card" as const,
      dotColor: "green" as const,
      content: "Account Created",
      score: "Welcome!",
    },
    {
      type: "card" as const,
      icon: "fa-graduation-cap",
      content: "Upload your first rubric",
    },
    {
      type: "card" as const,
      icon: "fa-shield-halved",
      content: "NDPR Compliant",
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AuthLayout
      illustration={illustration}
    >
      <div className="auth-form-header">
        <h1>Create your account</h1>
        <p>One account per lecturer. Full access to all features.</p>
      </div>

      <div className="auth-divider">
        <span>register with email</span>
      </div>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {/* ── Full Name ── */}
        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <div
            className={`input-wrapper ${fieldErrors.name ? "input-error" : ""}`}
          >
            <i className="fas fa-user" />
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Dr. Oluwaseun Adeyemi"
              autoComplete="name"
              disabled={loading}
              aria-describedby={fieldErrors.name ? "name-error" : undefined}
              aria-invalid={!!fieldErrors.name}
            />
          </div>
          {fieldErrors.name && (
            <span id="name-error" className="form-error" role="alert">
              {fieldErrors.name}
            </span>
          )}
        </div>

        {/* ── Email ── */}
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
              aria-describedby={
                fieldErrors.email ? "email-error" : "email-hint"
              }
              aria-invalid={!!fieldErrors.email}
            />
          </div>
          {fieldErrors.email ? (
            <span id="email-error" className="form-error" role="alert">
              {fieldErrors.email}
            </span>
          ) : (
            <span id="email-hint" className="form-hint">
              Please use your official university email address
            </span>
          )}
        </div>

        {/* ── Password ── */}
        <div className="form-group">
          <label htmlFor="password">Password</label>
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
              placeholder="Min. 8 chars, 1 uppercase, 1 number"
              autoComplete="new-password"
              disabled={loading}
              aria-describedby="password-strength"
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

          {/* Strength meter — proactive feedback, shown while typing */}
          {formData.password && (
            <div
              id="password-strength"
              className="password-strength-wrapper"
              aria-live="polite"
            >
              <div className="strength-bar">
                <span
                  className={`strength-segment ${passwordStrength >= 1 ? strengthMeta.cls : ""}`}
                />
                <span
                  className={`strength-segment ${passwordStrength >= 2 ? strengthMeta.cls : ""}`}
                />
                <span
                  className={`strength-segment ${passwordStrength >= 3 ? strengthMeta.cls : ""}`}
                />
              </div>
              <span className={`strength-label ${strengthMeta.cls}`}>
                {strengthMeta.label}
              </span>
            </div>
          )}

          {fieldErrors.password && (
            <span className="form-error" role="alert">
              {fieldErrors.password}
            </span>
          )}
        </div>

        {/* ── Confirm Password ── */}
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <div
            className={`input-wrapper ${fieldErrors.confirmPassword ? "input-error" : ""}`}
          >
            <i className="fas fa-lock" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Confirm your password"
              autoComplete="new-password"
              disabled={loading}
              aria-invalid={!!fieldErrors.confirmPassword}
            />
            <button
              type="button"
              className="toggle-password"
              aria-label={
                showConfirmPassword ? "Hide password" : "Show password"
              }
              onClick={() => setShowConfirmPassword((v) => !v)}
              tabIndex={-1}
            >
              <i
                className={`fas ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"}`}
              />
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <span className="form-error" role="alert">
              {fieldErrors.confirmPassword}
            </span>
          )}
        </div>

        {/* ── Terms ── */}
        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input type="checkbox" required disabled={loading} />
            <span className="checkmark" />I agree to the{" "}
            <Link href="/terms" className="form-link">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="form-link">
              Privacy Policy
            </Link>
          </label>
        </div>

        <button type="submit" className="btn-submit" disabled={loading}>
          <span className="btn-text">
            {loading ? "Creating Account…" : "Create Account"}
          </span>
        </button>
      </form>

      <p className="auth-switch">
        Already have an account? <Link href="/auth/login">Log in</Link>
      </p>
    </AuthLayout>
  );
}
