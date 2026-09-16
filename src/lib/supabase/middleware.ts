import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIX = "/dashboard";

// Chemins toujours accessibles, même en mode maintenance : les routes API
// (pour que la bascule admin et les webhooks continuent de fonctionner),
// /login (pour qu'un admin puisse se connecter et désactiver le mode) et
// /maintenance elle-même (pour éviter une boucle de réécriture).
const MAINTENANCE_EXEMPT_PREFIXES = ["/api", "/login", "/maintenance"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    // Supabase not configured yet (local setup / preview without env vars):
    // let public pages render and let dashboard pages fail at the data
    // layer instead of taking the whole site down.
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname.startsWith(PROTECTED_PREFIX)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const exempt = MAINTENANCE_EXEMPT_PREFIXES.some((prefix) => request.nextUrl.pathname.startsWith(prefix));
  if (!exempt) {
    const { data: config } = await supabase
      .from("app_config")
      .select("maintenance_mode")
      .eq("id", 1)
      .maybeSingle();

    if (config?.maintenance_mode) {
      let isAdmin = false;
      if (user) {
        const { data: own } = await supabase
          .from("abonnements")
          .select("is_admin")
          .eq("user_id", user.id)
          .maybeSingle();
        isAdmin = Boolean(own?.is_admin);
      }
      if (!isAdmin) {
        return NextResponse.rewrite(new URL("/maintenance", request.url));
      }
    }
  }

  return response;
}
