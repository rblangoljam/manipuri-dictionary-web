"use client";

import { useState } from "react";

export function SettingsForm({
  initialName,
  initialEmail,
}: {
  initialName: string;
  initialEmail: string;
}) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const inputClass =
    "w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500";
  const labelClass = "block text-sm font-medium mb-1.5";

  const handleProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to update");
      } else {
        setMessage(data.message);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to update");
      } else {
        setMessage(data.message);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to update");
      } else {
        setMessage(data.message);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {message && (
        <p className="text-sm text-success bg-success/10 rounded-lg px-3 py-2">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Name */}
      <form onSubmit={handleProfile} className="space-y-3">
        <h2 className="text-lg font-semibold">Profile</h2>
        <div>
          <label htmlFor="name" className={labelClass}>Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-60 transition-colors"
        >
          {loading ? "Saving…" : "Save name"}
        </button>
      </form>

      {/* Email */}
      <form onSubmit={handleEmail} className="space-y-3 border-t border-border pt-6">
        <h2 className="text-lg font-semibold">Email</h2>
        <div>
          <label htmlFor="email" className={labelClass}>Email address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-60 transition-colors"
        >
          {loading ? "Saving…" : "Save email"}
        </button>
      </form>

      {/* Password */}
      <form onSubmit={handlePassword} className="space-y-3 border-t border-border pt-6">
        <h2 className="text-lg font-semibold">Password</h2>
        <div>
          <label htmlFor="currentPassword" className={labelClass}>Current password</label>
          <input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={inputClass}
            autoComplete="current-password"
            required
          />
        </div>
        <div>
          <label htmlFor="newPassword" className={labelClass}>New password</label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={inputClass}
            autoComplete="new-password"
            required
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className={labelClass}>Confirm new password</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClass}
            autoComplete="new-password"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-60 transition-colors"
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}