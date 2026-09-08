"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/providers";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PasswordInput } from "@/components/password-input";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  return <AuthForm mode="login" />;
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { t } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [telephone, setTelephone] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [invalid, setInvalid] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  const isSignup = mode === "signup";

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setErrorMessage(t.auth.error);
      setStatus("error");
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!EMAIL_RE.test(email)) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    setStatus("sending");

    const supabase = createClient();

    if (!isSignup && password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setErrorMessage(t.auth.invalidCredentials);
        setStatus("error");
        return;
      }
      router.push("/dashboard/baux");
      router.refresh();
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          ...(isSignup && telephone.trim() ? { data: { telephone: telephone.trim() } } : {}),
        },
      });
      if (error) throw error;
      setStatus("sent");
    } catch {
      setErrorMessage(t.auth.error);
      setStatus("error");
    }
  }

  return (
    <>
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="card tunnel-enter w-full max-w-sm">
          <h1 className="font-serif text-2xl">
            {isSignup ? t.auth.signupTitle : t.auth.loginTitle}
          </h1>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="btn-secondary transition-base mt-5 flex w-full items-center justify-center gap-2 disabled:opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62Z"
              />
              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18Z"
              />
              <path
                fill="#FBBC05"
                d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.16.28-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03l3-2.33Z"
              />
              <path
                fill="#EA4335"
                d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58Z"
              />
            </svg>
            {t.auth.continueWithGoogle}
          </button>

          <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-[var(--foreground)]/50">
            <span className="h-px flex-1 bg-[var(--border-color)]" />
            {t.auth.orDivider}
            <span className="h-px flex-1 bg-[var(--border-color)]" />
          </div>

          {status === "sent" ? (
            <p className="mt-6 text-sm text-[var(--success)]">{t.auth.checkEmail}</p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium">
                  {t.auth.emailLabel}
                </label>
                <input
                  id="email"
                  type="email"
                  className="input transition-base"
                  placeholder={t.auth.emailPlaceholder}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (invalid) setInvalid(false);
                  }}
                  aria-invalid={invalid}
                  required
                />
                {invalid && (
                  <p className="mt-1 text-xs text-[var(--danger)]">{t.auth.invalidEmail}</p>
                )}
              </div>

              {isSignup && (
                <div>
                  <label htmlFor="telephone" className="mb-1 block text-sm font-medium">
                    {t.auth.phoneLabel}
                  </label>
                  <input
                    id="telephone"
                    type="tel"
                    className="input transition-base"
                    placeholder={t.auth.phonePlaceholder}
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    autoComplete="tel"
                  />
                </div>
              )}

              {!isSignup && (
                <div>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <label htmlFor="password" className="block text-sm font-medium">
                      {t.auth.passwordLabel}
                    </label>
                    <Link
                      href="/mot-de-passe-oublie"
                      className="text-xs text-[var(--accent)] underline"
                    >
                      {t.auth.forgotPassword}
                    </Link>
                  </div>
                  <PasswordInput
                    id="password"
                    placeholder={t.auth.passwordOptional}
                    value={password}
                    onChange={setPassword}
                    autoComplete="current-password"
                    showLabel={t.auth.showPassword}
                  />
                </div>
              )}

              {status === "error" && (
                <p className="text-xs text-[var(--danger)]">{errorMessage}</p>
              )}

              <button
                type="submit"
                disabled={status === "sending"}
                className="btn-primary transition-base disabled:opacity-60"
              >
                {!isSignup && password ? t.auth.signIn : t.auth.sendLink}
              </button>
            </form>
          )}

          <p className="mt-6 text-sm text-[var(--foreground)]/70">
            {isSignup ? t.auth.hasAccount : t.auth.noAccount}{" "}
            <Link
              href={isSignup ? "/login" : "/signup"}
              className="text-[var(--accent)] underline"
            >
              {isSignup ? t.nav.login : t.nav.signup}
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
