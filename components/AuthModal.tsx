"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
};

export function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const supabase = createClient();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) throw signInError;
        if (data.user) {
          onAuthSuccess(data.user);
          onClose();
        }
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim() || undefined,
            },
          },
        });

        if (signUpError) throw signUpError;

        if (data.session) {
          if (data.user) onAuthSuccess(data.user);
          setMessage("Account created and logged in!");
          setTimeout(() => onClose(), 1000);
        } else {
          setMessage("Account created! Please check your email to confirm your registration.");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    setMode(mode === "signin" ? "signup" : "signin");
    setError(null);
    setMessage(null);
  }

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close" onClick={onClose} aria-label="Close modal">
          ✕
        </button>

        <div className="auth-header">
          <div className="auth-brand-orb">✦</div>
          <h2>{mode === "signin" ? "Welcome back" : "Create your account"}</h2>
          <p className="auth-subtitle">
            {mode === "signin"
              ? "Sign in with your email and password"
              : "Sign up to start saving your chat workspaces"}
          </p>
        </div>

        {error && <div className="auth-alert auth-error">{error}</div>}
        {message && <div className="auth-alert auth-success">{message}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div className="auth-field">
              <label htmlFor="auth-name">Full Name</label>
              <input
                id="auth-name"
                type="text"
                placeholder="Jordan Hayes"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="auth-email">Email address</label>
            <input
              id="auth-email"
              type="email"
              placeholder="name@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              placeholder="••••••••"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? "Processing..." : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="auth-footer">
          <span>
            {mode === "signin" ? "Don't have an account?" : "Already have an account?"}
          </span>{" "}
          <button type="button" className="auth-switch-btn" onClick={toggleMode}>
            {mode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
