"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { registerSchema } from "@/lib/validation/auth";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setErrors({});
    setServerError(null);

    const parsed = registerSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
    });

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const errMap: Record<string, string> = {};
      Object.entries(fieldErrors).forEach(([key, msgs]) => {
        if (msgs && msgs[0]) errMap[key] = msgs[0];
      });
      setErrors(errMap);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.fieldErrors) {
          const errMap: Record<string, string> = {};
          Object.entries(data.fieldErrors).forEach(([key, msgs]) => {
            if (Array.isArray(msgs) && msgs[0]) errMap[key] = msgs[0];
          });
          setErrors(errMap);
        } else {
          setServerError(data.error || "Registration failed");
        }
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch {
      setServerError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="w-12 h-12 rounded-full bg-success/20 text-success flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Account created!</h1>
        <p className="text-muted-foreground">
          Your account has been created successfully. Redirecting to sign in…
        </p>
        <Link href="/login" className="block mt-4 text-brand-600 dark:text-brand-400 font-medium">
          Sign in now
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Create your account</h1>
        <p className="text-muted-foreground text-sm">
          Join the dictionary community
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1.5">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            placeholder="Your name"
            aria-invalid={!!errors.name}
          />
          {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
          />
          {errors.email && <p className="mt-1 text-xs text-danger">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full px-3 py-2 pr-10 rounded-lg border border-border bg-surface text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              placeholder="At least 8 characters"
              aria-invalid={!!errors.password}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-2 hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-danger">{errors.password}</p>}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1.5">
            Confirm password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full px-3 py-2 pr-10 rounded-lg border border-border bg-surface text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              placeholder="Confirm your password"
              aria-invalid={!!errors.confirmPassword}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-2 hover:text-foreground"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="mt-1 text-xs text-danger">{errors.confirmPassword}</p>}
        </div>

        {serverError && (
          <p role="alert" className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">
            {serverError}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Creating account…" : "Create Account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}