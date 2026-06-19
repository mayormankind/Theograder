"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import AuthLayout from "@/components/auth/AuthLayout";
import { Eye, EyeOff, GraduationCap, Lock, Mail, ShieldCheck, User } from "lucide-react";
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
  useEffect(() => { document.title = "Sign Up | TheoGrader"; }, []);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: SignupFormData) => {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name.trim(),
          email: data.email,
          password: data.password,
        }),
      });

      const res = await response.json();

      if (!response.ok) {
        toast.error(res.error || "Failed to create account");
        return;
      }

      toast.success(res.message || "Account created! Check your email.", {
        duration: 4000,
        onDismiss: () => router.push("/auth/verify-email"),
        onAutoClose: () => router.push("/auth/verify-email"),
      });
    } catch (err) {
      console.error("[signup] unexpected error:", err);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  // ── Derived UI state ───────────────────────────────────────────────────────

  const passwordValue = watch("password") ?? "";
  const passwordStrength = getPasswordStrength(passwordValue);
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
      icon: GraduationCap,
      content: "Upload your first rubric",
    },
    {
      type: "card" as const,
      icon: ShieldCheck,
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

      <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* ── Full Name ── */}
        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <div
            className={`input-wrapper ${errors.name ? "input-error" : ""}`}
          >
            <User size={14} />
            <input
              type="text"
              id="name"
              placeholder="Dr. Oluwaseun Adeyemi"
              autoComplete="name"
              disabled={isSubmitting}
              aria-describedby={errors.name ? "name-error" : undefined}
              aria-invalid={!!errors.name}
              {...register("name")}
            />
          </div>
          {errors.name && (
            <span id="name-error" className="form-error" role="alert">
              {errors.name.message}
            </span>
          )}
        </div>

        {/* ── Email ── */}
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <div
            className={`input-wrapper ${errors.email ? "input-error" : ""}`}
          >
            <Mail size={14} />
            <input
              type="email"
              id="email"
              placeholder="lecturer@university.edu.ng"
              autoComplete="email"
              disabled={isSubmitting}
              aria-describedby={errors.email ? "email-error" : "email-hint"}
              aria-invalid={!!errors.email}
              {...register("email")}
            />
          </div>
          {errors.email ? (
            <span id="email-error" className="form-error" role="alert">
              {errors.email.message}
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
            className={`input-wrapper ${errors.password ? "input-error" : ""}`}
          >
            <Lock size={14} />
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              placeholder="Min. 8 chars, 1 uppercase, 1 number"
              autoComplete="new-password"
              disabled={isSubmitting}
              aria-describedby="password-strength"
              aria-invalid={!!errors.password}
              {...register("password")}
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

          {/* Strength meter — proactive feedback, shown while typing */}
          {passwordValue && (
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

          {errors.password && (
            <span className="form-error" role="alert">
              {errors.password.message}
            </span>
          )}
        </div>

        {/* ── Confirm Password ── */}
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <div
            className={`input-wrapper ${errors.confirmPassword ? "input-error" : ""}`}
          >
            <Lock size={14} />
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              placeholder="Confirm your password"
              autoComplete="new-password"
              disabled={isSubmitting}
              aria-invalid={!!errors.confirmPassword}
              {...register("confirmPassword")}
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
              {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <span className="form-error" role="alert">
              {errors.confirmPassword.message}
            </span>
          )}
        </div>

        {/* ── Terms ── */}
        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input type="checkbox" required disabled={isSubmitting} />
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

        <button type="submit" className="btn-submit" disabled={isSubmitting}>
          <span className="btn-text">
            {isSubmitting ? "Creating Account…" : "Create Account"}
          </span>
        </button>
      </form>

      <p className="auth-switch">
        Already have an account? <Link href="/auth/login">Log in</Link>
      </p>
    </AuthLayout>
  );
}
