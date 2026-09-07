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
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [invalid, setInvalid] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isSignup = mode === "signup";

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
