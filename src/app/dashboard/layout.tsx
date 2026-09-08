import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
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
      </div>
      <DashboardSidebar conformityRatio={conformityRatio} />
      <main className="relative flex-1 px-6 py-8 md:px-10 md:py-10">{children}</main>
    </div>
  );
}
