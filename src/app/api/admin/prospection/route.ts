import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Tableaux Monday.com de la campagne de prospection Tunnela.
const CONTACTS_BOARD_ID = 5103660842;
const READY_BOARD_ID = 5103759552;

type MondayColumn = { id: string; title: string };
type MondayColumnValue = { id: string; text: string | null };
type MondayItem = { id: string; name: string; column_values: MondayColumnValue[] };
type MondayBoard = { columns: MondayColumn[]; items_page: { items: MondayItem[] } };

function columnId(columns: MondayColumn[], ...titles: string[]): string | null {
  for (const title of titles) {
    const found = columns.find((c) => c.title.trim().toLowerCase() === title.trim().toLowerCase());
    if (found) return found.id;
  }
  return null;
}

function valueFor(item: MondayItem, id: string | null): string {
  if (!id) return "";
  return item.column_values.find((c) => c.id === id)?.text?.trim() ?? "";
}

async function mondayQuery(token: string, query: string) {
  const res = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: token },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    throw new Error(`Monday API a répondu ${res.status}`);
  }
  const json = (await res.json()) as { data?: Record<string, MondayBoard[]>; errors?: { message: string }[] };
  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }
  if (!json.data) {
    throw new Error("Réponse Monday API vide");
  }
  return json.data;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { data: own } = await supabase
    .from("abonnements")
    .select("is_admin")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!own?.is_admin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const token = process.env.MONDAY_API_TOKEN;
  if (!token) {
    return NextResponse.json({ configured: false });
  }

  try {
    const query = `
      query {
        contacts: boards(ids: [${CONTACTS_BOARD_ID}]) {
          columns { id title }
          items_page(limit: 500) {
            items { id name column_values { id text } }
          }
        }
        ready: boards(ids: [${READY_BOARD_ID}]) {
          columns { id title }
          items_page(limit: 500) {
            items { id name column_values { id text } }
          }
        }
      }
    `;
    const data = await mondayQuery(token, query);
    const contactsBoard = data.contacts?.[0];
    const readyBoard = data.ready?.[0];

    if (!contactsBoard || !readyBoard) {
      return NextResponse.json({ error: "Tableau Monday introuvable (vérifiez l'accès du token)" }, { status: 502 });
    }

    const typeId = columnId(contactsBoard.columns, "Type");
    const contacteId = columnId(contactsBoard.columns, "Contacté", "Contacte");
    const reponseId = columnId(contactsBoard.columns, "Réponse", "Reponse");

    const byType: Record<string, number> = {};
    const byReponse: Record<string, number> = {};
    let contactedCount = 0;

    for (const item of contactsBoard.items_page.items) {
      const type = valueFor(item, typeId) || "Non renseigné";
      byType[type] = (byType[type] ?? 0) + 1;
      if (valueFor(item, contacteId).toLowerCase() === "oui") contactedCount += 1;
      const reponse = valueFor(item, reponseId) || "Sans réponse";
      byReponse[reponse] = (byReponse[reponse] ?? 0) + 1;
    }

    const emailId = columnId(readyBoard.columns, "Email");
    const telId = columnId(readyBoard.columns, "Téléphone", "Telephone");
    const societeId = columnId(readyBoard.columns, "Cabinet / Société", "Cabinet/Société", "Société", "Societe");
    const typeReadyId = columnId(readyBoard.columns, "Type");
    const featureId = columnId(
      readyBoard.columns,
      "Fonctionnalité(s) recommandée(s)",
      "Fonctionnalité(s)",
      "Fonctionnalités"
    );
    const statutId = columnId(readyBoard.columns, "Statut");

    const readyList = readyBoard.items_page.items.map((item) => ({
      nom: item.name,
      email: valueFor(item, emailId),
      telephone: valueFor(item, telId),
      societe: valueFor(item, societeId),
      type: valueFor(item, typeReadyId),
      fonctionnalite: valueFor(item, featureId),
      statut: valueFor(item, statutId),
    }));

    return NextResponse.json({
      configured: true,
      ok: true,
      contacts: {
        total: contactsBoard.items_page.items.length,
        contactedCount,
        byType,
        byReponse,
      },
      ready: {
        total: readyList.length,
        list: readyList,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue lors de l'appel à Monday.com";
    return NextResponse.json({ configured: true, ok: false, error: message }, { status: 502 });
  }
}
