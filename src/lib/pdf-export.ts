import { jsPDF } from "jspdf";

const MARGIN = 20;
const LINE_HEIGHT = 5.5;

export function exportTextAsPdf(title: string, body: string, filename: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGIN * 2;

  let y = MARGIN;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  const titleLines = doc.splitTextToSize(title, contentWidth);
  doc.text(titleLines, MARGIN, y);
  y += titleLines.length * (LINE_HEIGHT + 1) + 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);

  const rawLines = body.split("\n");
  for (const rawLine of rawLines) {
    if (rawLine.trim() === "") {
      y += LINE_HEIGHT;
      continue;
    }
    const wrapped: string[] = doc.splitTextToSize(rawLine, contentWidth);
    for (const line of wrapped) {
      if (y > pageHeight - MARGIN) {
        doc.addPage();
        y = MARGIN;
      }
      doc.text(line, MARGIN, y);
      y += LINE_HEIGHT;
    }
  }

  doc.save(filename);
}
