// Calcul de révision de loyer commercial selon indices ILC / ILAT,
// avec application optionnelle d'une clause tunnel (plancher / plafond en %).

export type IndexType = "ILC" | "ILAT";

export interface IndexationInput {
  loyerBase: number; // loyer annuel ou trimestriel de référence, en €
  indiceReference: number; // valeur de l'indice à la date de référence du bail
  indiceNouveau: number; // valeur de l'indice publiée à la date de révision
  type: IndexType;
  clauseTunnel?: {
    actif: boolean;
    planchmentPct?: number; // variation minimale appliquée, ex: -1 (=-1%)
    plafondPct?: number; // variation maximale appliquée, ex: 3 (=+3%)
  };
}

export interface IndexationResult {
  variationBrutePct: number;
  variationAppliqueePct: number;
  loyerRevise: number;
  ecart: number;
  plafondApplique: boolean;
  plancherApplique: boolean;
}

export function calculerRevisionLoyer(input: IndexationInput): IndexationResult {
  const { loyerBase, indiceReference, indiceNouveau, clauseTunnel } = input;

  if (indiceReference <= 0) {
    throw new Error("L'indice de référence doit être strictement positif.");
  }

  const variationBrutePct = ((indiceNouveau - indiceReference) / indiceReference) * 100;

  let variationAppliqueePct = variationBrutePct;
  let plafondApplique = false;
  let plancherApplique = false;

  if (clauseTunnel?.actif) {
    if (
      typeof clauseTunnel.plafondPct === "number" &&
      variationAppliqueePct > clauseTunnel.plafondPct
    ) {
      variationAppliqueePct = clauseTunnel.plafondPct;
      plafondApplique = true;
    }
    if (
      typeof clauseTunnel.planchmentPct === "number" &&
      variationAppliqueePct < clauseTunnel.planchmentPct
    ) {
      variationAppliqueePct = clauseTunnel.planchmentPct;
      plancherApplique = true;
    }
  }

  const loyerRevise = loyerBase * (1 + variationAppliqueePct / 100);

  return {
    variationBrutePct: round2(variationBrutePct),
    variationAppliqueePct: round2(variationAppliqueePct),
    loyerRevise: round2(loyerRevise),
    ecart: round2(loyerRevise - loyerBase),
    plafondApplique,
    plancherApplique,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
