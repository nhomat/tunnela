"use client";

import { useState } from "react";
import { useApp } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function ReserverUnCallPage() {
  const { t } = useApp();
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [societe, setSociete] = useState("");
  const [telephone, setTelephone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact/book-call", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nom, email, societe, telephone, message }),
      });
      if (!res.ok) throw new Error();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto flex-1 px-6 py-16">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="font-serif text-3xl">{t.bookCall.title}</h1>
          <p className="mt-3 text-[var(--foreground)]/70">{t.bookCall.subtitle}</p>
        </div>

        <div className="card tunnel-enter mx-auto mt-10 max-w-lg">
          {status === "sent" ? (
            <p className="text-center text-sm text-[var(--success)]">{t.bookCall.success}</p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <label className="text-sm">
                <span className="mb-1 block font-medium">{t.bookCall.nameLabel}</span>
                <input
                  required
                  className="input transition-base"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">{t.auth.emailLabel}</span>
                <input
                  type="email"
                  required
                  className="input transition-base"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1 block font-medium">{t.bookCall.companyLabel}</span>
                  <input
                    className="input transition-base"
                    value={societe}
                    onChange={(e) => setSociete(e.target.value)}
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium">{t.bookCall.phoneLabel}</span>
                  <input
                    type="tel"
                    className="input transition-base"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                  />
                </label>
              </div>
              <label className="text-sm">
                <span className="mb-1 block font-medium">{t.bookCall.messageLabel}</span>
                <textarea
                  className="input transition-base min-h-24"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t.bookCall.messagePlaceholder}
                />
              </label>

              {status === "error" && (
                <p className="text-sm text-[var(--danger)]">{t.bookCall.error}</p>
              )}

              <button
                type="submit"
                disabled={status === "sending"}
                className="btn-primary transition-base disabled:opacity-60"
              >
                {status === "sending" ? "…" : t.bookCall.submit}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
