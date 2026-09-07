import { describe, expect, it } from "vitest";
import { calculerRevisionLoyer } from "./indexation";

describe("calculerRevisionLoyer", () => {
  it("applique la variation brute quand aucune clause tunnel n'est active", () => {
    const result = calculerRevisionLoyer({
      loyerBase: 10_000,
      indiceReference: 100,
      indiceNouveau: 105,
      type: "ILC",
    });

    expect(result.variationBrutePct).toBe(5);
    expect(result.variationAppliqueePct).toBe(5);
    expect(result.loyerRevise).toBe(10_500);
    expect(result.ecart).toBe(500);
    expect(result.plafondApplique).toBe(false);
    expect(result.plancherApplique).toBe(false);
  });

  it("écrête au plafond de la clause tunnel quand la variation brute le dépasse", () => {
    const result = calculerRevisionLoyer({
      loyerBase: 10_000,
      indiceReference: 100,
      indiceNouveau: 112,
      type: "ILC",
      clauseTunnel: { actif: true, plafondPct: 3, planchmentPct: -1 },
    });

    expect(result.variationBrutePct).toBe(12);
    expect(result.variationAppliqueePct).toBe(3);
    expect(result.loyerRevise).toBe(10_300);
    expect(result.plafondApplique).toBe(true);
    expect(result.plancherApplique).toBe(false);
  });

  it("écrête au plancher de la clause tunnel quand la variation brute est trop négative", () => {
    const result = calculerRevisionLoyer({
      loyerBase: 10_000,
      indiceReference: 100,
      indiceNouveau: 90,
      type: "ILAT",
      clauseTunnel: { actif: true, plafondPct: 3, planchmentPct: -2 },
    });

    expect(result.variationBrutePct).toBe(-10);
    expect(result.variationAppliqueePct).toBe(-2);
    expect(result.loyerRevise).toBe(9_800);
    expect(result.plafondApplique).toBe(false);
    expect(result.plancherApplique).toBe(true);
  });

  it("n'applique pas la clause tunnel si elle est présente mais inactive", () => {
    const result = calculerRevisionLoyer({
      loyerBase: 10_000,
      indiceReference: 100,
      indiceNouveau: 112,
      type: "ILC",
      clauseTunnel: { actif: false, plafondPct: 3 },
    });

    expect(result.variationAppliqueePct).toBe(12);
    expect(result.plafondApplique).toBe(false);
  });

  it("reste dans le tunnel sans écrêtage quand la variation brute est dans les bornes", () => {
    const result = calculerRevisionLoyer({
      loyerBase: 10_000,
      indiceReference: 100,
      indiceNouveau: 101.5,
      type: "ILC",
      clauseTunnel: { actif: true, plafondPct: 3, planchmentPct: -1 },
    });

    expect(result.variationAppliqueePct).toBe(1.5);
    expect(result.plafondApplique).toBe(false);
    expect(result.plancherApplique).toBe(false);
  });

  it("rejette un indice de référence nul ou négatif", () => {
    expect(() =>
      calculerRevisionLoyer({
        loyerBase: 10_000,
        indiceReference: 0,
        indiceNouveau: 100,
        type: "ILC",
      })
    ).toThrow();

    expect(() =>
      calculerRevisionLoyer({
        loyerBase: 10_000,
        indiceReference: -5,
        indiceNouveau: 100,
        type: "ILC",
      })
    ).toThrow();
  });
});
