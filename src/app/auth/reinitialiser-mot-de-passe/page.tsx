"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/providers";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PasswordInput } from "@/components/password-input";
import { PageLoading } from "@/components/table-skeleton";

export default function ResetPasswordPage() {
  const { t } = useApp();
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!cancelled) {
          setHasSession(Boolean(user));
          setCheckingSession(false);
        }
      } catch {
        if (!cancelled) {
          setHasSession(false);
          setCheckingSession(false);
        }
      }
    }

    checkSession();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < 8) {
      setErrorMessage(t.auth.passwordTooShort);
      setStatus("error");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage(t.auth.passwordMismatch);
      setStatus("error");
      return;
    }

    setStatus("saving");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setErrorMessage(t.auth.error);
        setStatus("error");
        return;
      }

      setStatus("saved");
      setTimeout(() => {
        router.push("/dashboard/baux");
        router.refresh();
      }, 1500);
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
          {checkingSession ? (
            <PageLoading />
          ) : !hasSession ? (
            <>
              <h1 className="font-serif text-2xl">{t.auth.resetPasswordTitle}</h1>
              <p className="mt-6 text-sm text-[var(--danger)]">{t.auth.resetLinkInvalid}</p>
              <p className="mt-6 text-sm text-[var(--foreground)]/70">
                <Link href="/mot-de-passe-oublie" className="text-[var(--accent)] underline">
                  {t.auth.requestNewLink}
                </Link>
              </p>
            </>
          ) : status === "saved" ? (
            <>
              <h1 className="font-serif text-2xl">{t.auth.resetPasswordTitle}</h1>
              <p className="mt-6 text-sm text-[var(--success)]">{t.auth.resetPasswordSuccess}</p>
            </>
          ) : (
            <>
              <h1 className="font-serif text-2xl">{t.auth.resetPasswordTitle}</h1>
              <p className="mt-2 text-sm text-[var(--foreground)]/70">{t.auth.resetPasswordBody}</p>
              <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                <div>
                  <label htmlFor="new-password" className="mb-1 block text-sm font-medium">
                    {t.auth.newPassword}
                  </label>
                  <PasswordInput
                    id="new-password"
                    value={password}
                    onChange={setPassword}
                    autoComplete="new-password"
                    minLength={8}
                    showLabel={t.auth.showPassword}
                  />
                </div>

                <div>
                  <label htmlFor="confirm-password" className="mb-1 block text-sm font-medium">
                    {t.auth.confirmPassword}
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    className="input transition-base"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </div>

                {status === "error" && (
                  <p className="text-xs text-[var(--danger)]">{errorMessage}</p>
                )}

                <button
                  type="submit"
                  disabled={status === "saving"}
                  className="btn-primary transition-base disabled:opacity-60"
                >
                  {t.auth.resetPasswordSubmit}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
