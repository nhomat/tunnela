import Papa from "papaparse";
import { calculerStatutConformite } from "./types";
import type { IndexType, Periodicite, StatutConformite } from "./types";

export interface ImportedBail {
  preneur: string;
  adresse: string | null;
  loyer_annuel: number;
  indice: IndexType;
  clause_tunnel: boolean;
  plancher_pct: number | null;
  plafond_pct: number | null;
  date_prochaine_revision: string | null;
  statut: StatutConformite;
  indice_reference: number | null;
  periodicite: Periodicite;
  preneur_email: string | null;
}

export interface ImportRowError {
  row: number;
  message: string;
}

export interface ImportResult {
  valid: ImportedBail[];
  errors: ImportRowError[];
}

const CSV_HEADERS = [
  "preneur",
  "adresse",
  "loyer_annuel",
  "indice",
  "clause_tunnel",
  "plancher_pct",
  "plafond_pct",
  "date_prochaine_revision",
  "indice_reference",
  "periodicite",
  "preneur_email",
];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TRUE_VALUES = new Set(["oui", "yes", "true", "1", "vrai"]);

function parseBoolean(value: string): boolean {
  return TRUE_VALUES.has(value.trim().toLowerCase());
}

export function generateTemplateCsv(): string {
  const example = [
    "Boulangerie Dupont SARL",
    "12 rue des Rosiers, 75004 Paris",
    "50000",
    "ILC",
    "oui",
    "-1",
    "3",
    "2027-01-01",
    "120",
    "annuelle",
    "contact@boulangerie-dupont.fr",
  ];
  return Papa.unparse([CSV_HEADERS, example]);
}

export function parseLeasesCsv(text: string): ImportResult {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  const valid: ImportedBail[] = [];
  const errors: ImportRowError[] = [];

  parsed.data.forEach((row, i) => {
    const rowNumber = i + 2; // +1 for header row, +1 for 1-indexing
    const preneur = (row.preneur ?? "").trim();
    const loyerRaw = (row.loyer_annuel ?? "").trim().replace(",", ".");
    const indice = (row.indice ?? "").trim().toUpperCase();
    const dateRevision = (row.date_prochaine_revision ?? "").trim();

    if (!preneur) {
      errors.push({ row: rowNumber, message: "preneur manquant" });
      return;
    }
    const loyer_annuel = Number(loyerRaw);
    if (!loyerRaw || Number.isNaN(loyer_annuel) || loyer_annuel < 0) {
      errors.push({ row: rowNumber, message: "loyer_annuel invalide" });
      return;
    }
    if (indice !== "ILC" && indice !== "ILAT" && indice !== "ICC") {
      errors.push({ row: rowNumber, message: "indice doit être ILC, ILAT ou ICC" });
      return;
    }
    if (dateRevision && !DATE_RE.test(dateRevision)) {
      errors.push({ row: rowNumber, message: "date_prochaine_revision doit être AAAA-MM-JJ" });
      return;
    }

    const clause_tunnel = parseBoolean(row.clause_tunnel ?? "");
    const plancher_pct = row.plancher_pct?.trim() ? Number(row.plancher_pct.trim()) : null;
    const plafond_pct = row.plafond_pct?.trim() ? Number(row.plafond_pct.trim()) : null;
    const indiceReferenceRaw = row.indice_reference?.trim() ? Number(row.indice_reference.trim()) : null;
    const periodiciteRaw = (row.periodicite ?? "").trim().toLowerCase();
    const periodicite: Periodicite = periodiciteRaw === "trimestrielle" ? "trimestrielle" : "annuelle";
    const preneurEmailRaw = row.preneur_email?.trim() || null;

    valid.push({
      preneur,
      adresse: row.adresse?.trim() || null,
      loyer_annuel,
      indice: indice as IndexType,
      clause_tunnel,
      plancher_pct: plancher_pct !== null && !Number.isNaN(plancher_pct) ? plancher_pct : null,
      plafond_pct: plafond_pct !== null && !Number.isNaN(plafond_pct) ? plafond_pct : null,
      date_prochaine_revision: dateRevision || null,
      indice_reference:
        indiceReferenceRaw !== null && !Number.isNaN(indiceReferenceRaw) ? indiceReferenceRaw : null,
      periodicite,
      preneur_email: preneurEmailRaw,
      statut: calculerStatutConformite({ indice: indice as IndexType, clause_tunnel }),
    });
  });

  return { valid, errors };
}
