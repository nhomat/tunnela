import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard-shell";
import { calculerStatutConformite } from "@/lib/types";
import type { Bail } from "@/lib/types";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    redirect("/login");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let conformityRatio: number | undefined;
  try {
    const { data } = await supabase
      .from("baux")
      .select("indice, clause_tunnel")
      .returns<Pick<Bail, "indice" | "clause_tunnel">[]>();

    if (data && data.length > 0) {
      const conformes = data.filter((b) => calculerStatutConformite(b) === "conforme").length;
      conformityRatio = conformes / data.length;
    } else if (data) {
      conformityRatio = 0;
    }
  } catch {
    conformityRatio = undefined;
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden md:flex-row">
      <div className="page-blobs">
        <span className="blob blob-laiton dashboard-blob" />
        <span className="blob blob-cobalt dashboard-blob-b" />
        <span className="dot-grid-2d page-dot-grid" aria-hidden="true" />
        <span className="tunnel-ring-3d page-ring-3d" aria-hidden="true" />
      </div>
      <DashboardShell conformityRatio={conformityRatio}>{children}</DashboardShell>
    </div>
  );
}
