import { describe, expect, it } from "vitest";
import { calculerStatutConformite, canUseCoop, hasFeature, prochaineDateApres } from "./types";

describe("hasFeature", () => {
  it("le plan Découverte n'a accès à aucune fonctionnalité payante", () => {
    expect(hasFeature("decouverte", "generator")).toBe(false);
    expect(hasFeature("decouverte", "search")).toBe(false);
    expect(hasFeature("decouverte", "autoIndex")).toBe(false);
  });

  it("le plan Cabinet a les fonctionnalités Cabinet mais pas Portefeuille/Foncière", () => {
    expect(hasFeature("cabinet", "generator")).toBe(true);
    expect(hasFeature("cabinet", "alerts")).toBe(true);
    expect(hasFeature("cabinet", "search")).toBe(false);
    expect(hasFeature("cabinet", "autoIndex")).toBe(false);
  });

  it("le plan Portefeuille hérite des fonctionnalités Cabinet", () => {
    expect(hasFeature("portefeuille", "generator")).toBe(true);
    expect(hasFeature("portefeuille", "search")).toBe(true);
    expect(hasFeature("portefeuille", "autoIndex")).toBe(false);
  });

  it("le plan Foncière a accès à tout", () => {
    expect(hasFeature("fonciere", "generator")).toBe(true);
    expect(hasFeature("fonciere", "search")).toBe(true);
    expect(hasFeature("fonciere", "autoIndex")).toBe(true);
    expect(hasFeature("fonciere", "dedicatedContact")).toBe(true);
  });
});

describe("canUseCoop", () => {
  it("refuse le plan Découverte même avec l'add-on marqué actif", () => {
    expect(canUseCoop("decouverte", true)).toBe(false);
  });

  it("refuse un plan payant si l'add-on n'est pas actif", () => {
    expect(canUseCoop("cabinet", false)).toBe(false);
  });

  it("autorise un plan payant avec l'add-on actif", () => {
    expect(canUseCoop("cabinet", true)).toBe(true);
    expect(canUseCoop("fonciere", true)).toBe(true);
  });
});

describe("calculerStatutConformite", () => {
  it("un bail indexé sur l'ICC est toujours non conforme", () => {
    expect(calculerStatutConformite({ indice: "ICC", clause_tunnel: true })).toBe("non_conforme");
    expect(calculerStatutConformite({ indice: "ICC", clause_tunnel: false })).toBe("non_conforme");
  });

  it("un bail ILC/ILAT avec clause tunnel est conforme", () => {
    expect(calculerStatutConformite({ indice: "ILC", clause_tunnel: true })).toBe("conforme");
    expect(calculerStatutConformite({ indice: "ILAT", clause_tunnel: true })).toBe("conforme");
  });

  it("un bail ILC/ILAT sans clause tunnel est à vérifier", () => {
    expect(calculerStatutConformite({ indice: "ILC", clause_tunnel: false })).toBe("a_verifier");
  });
});

describe("prochaineDateApres", () => {
  it("ajoute un an pour une périodicité annuelle", () => {
    expect(prochaineDateApres("2026-03-15", "annuelle")).toBe("2027-03-15");
  });

  it("ajoute trois mois pour une périodicité trimestrielle", () => {
    expect(prochaineDateApres("2026-03-15", "trimestrielle")).toBe("2026-06-15");
  });

  it("part d'aujourd'hui quand aucune date n'est fournie", () => {
    const result = prochaineDateApres(null, "annuelle");
    const expectedYear = new Date().getFullYear() + 1;
    expect(result.startsWith(String(expectedYear))).toBe(true);
  });
});
