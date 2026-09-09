import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import { exportBauxAsCsv } from "./csv-import";
import type { Bail } from "./types";

export type ExportFormat = "csv" | "xlsx" | "pdf" | "json";

const EXPORT_COLUMNS: { key: keyof Bail; label: string }[] = [
  { key: "preneur", label: "Preneur" },
  { key: "adresse", label: "Adresse" },
  { key: "loyer_annuel", label: "Loyer annuel" },
  { key: "indice", label: "Indice" },
  { key: "clause_tunnel", label: "Clause tunnel" },
  { key: "plancher_pct", label: "Plancher %" },
  { key: "plafond_pct", label: "Plafond %" },
  { key: "date_prochaine_revision", label: "Prochaine révision" },
  { key: "indice_reference", label: "Indice de référence" },
  { key: "periodicite", label: "Périodicité" },
  { key: "preneur_email", label: "Email du preneur" },
];

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toSheetRows(baux: Bail[]): Record<string, string | number>[] {
  return baux.map((b) =>
    Object.fromEntries(
      EXPORT_COLUMNS.map(({ key, label }) => {
        const value = b[key];
        if (value === null || value === undefined) return [label, ""];
        if (typeof value === "boolean") return [label, value ? "oui" : "non"];
        return [label, value as string | number];
      })
    )
  );
}

export function exportBauxAsXlsx(baux: Bail[]) {
  const worksheet = XLSX.utils.json_to_sheet(toSheetRows(baux));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Portefeuille");
  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  triggerDownload(
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    "tunnela-portefeuille.xlsx"
  );
}

export function exportBauxAsJson(baux: Bail[]) {
  const rows = toSheetRows(baux);
  triggerDownload(
    new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" }),
    "tunnela-portefeuille.json"
  );
}

export function exportBauxAsPdf(baux: Bail[]) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const margin = 12;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const columns = EXPORT_COLUMNS.filter((c) => c.key !== "preneur_email");
  const colWidth = (pageWidth - margin * 2) / columns.length;

  let y = margin;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Portefeuille de baux — Tunnela", margin, y);
  y += 9;

  function drawHeaderRow() {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    columns.forEach((col, i) => {
      doc.text(col.label, margin + i * colWidth, y);
    });
    y += 5;
    doc.setDrawColor(200);
    doc.line(margin, y - 3, pageWidth - margin, y - 3);
    doc.setFont("helvetica", "normal");
  }

  drawHeaderRow();

  const rows = toSheetRows(baux);
  for (const row of rows) {
    if (y > pageHeight - margin) {
      doc.addPage();
      y = margin;
      drawHeaderRow();
    }
    columns.forEach((col, i) => {
      const raw = String(row[col.label] ?? "");
      const truncated = doc.splitTextToSize(raw, colWidth - 2)[0] ?? "";
      doc.text(truncated, margin + i * colWidth, y);
    });
    y += 6;
  }

  doc.save("tunnela-portefeuille.pdf");
}

export function exportBaux(baux: Bail[], formats: ExportFormat[]) {
  if (formats.includes("csv")) {
    const csv = exportBauxAsCsv(baux);
    triggerDownload(new Blob([csv], { type: "text/csv;charset=utf-8;" }), "tunnela-portefeuille.csv");
  }
  if (formats.includes("xlsx")) exportBauxAsXlsx(baux);
  if (formats.includes("pdf")) exportBauxAsPdf(baux);
  if (formats.includes("json")) exportBauxAsJson(baux);
}
