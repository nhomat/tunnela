"use client";

import { useRouter } from "next/navigation";
import { useApp } from "@/components/providers";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function CompteSuspenduPage() {
  const { t } = useApp();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="card max-w-md text-center">
          <h1 className="mb-3 font-serif text-2xl">{t.suspended.title}</h1>
          <p className="mb-6 text-sm text-[var(--foreground)]/70">{t.suspended.body}</p>
          <a href="mailto:contact@tunnela.fr" className="btn-primary transition-base inline-flex">
            {t.suspended.contact}
          </a>
          <button
            type="button"
            onClick={handleLogout}
            className="transition-base mt-4 block w-full text-sm text-[var(--foreground)]/60 hover:text-[var(--accent)]"
          >
            {t.dashboard.logout}
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
