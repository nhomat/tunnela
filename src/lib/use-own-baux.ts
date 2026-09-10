import { useEffect, useState } from "react";
import { createClient } from "./supabase/client";
import type { Bail } from "./types";

export function useOwnBaux() {
  const [baux, setBaux] = useState<Bail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase.from("baux").select("*").eq("user_id", user.id);
      if (data) setBaux(data as Bail[]);
      setLoading(false);
    })();
  }, []);

  return { baux, loading };
}
