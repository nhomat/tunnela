// Génération de textes juridiques (clause tunnel, avenant de substitution
// d'indice ICC -> ILC/ILAT). Le texte est toujours produit en français,
// quelle que soit la langue de l'interface (voir contraintes éditoriales).

export interface ClauseTunnelParams {
  bailleur: string;
  preneur: string;
  adresse: string;
  indice: "ILC" | "ILAT";
  symetrique: boolean;
  plancherPct: number;
  plafondPct: number;
  periodicite: "annuelle" | "trimestrielle";
}

export interface AvenantICCParams {
  bailleur: string;
  preneur: string;
  adresse: string;
  nouvelIndice: "ILC" | "ILAT";
  dateEffet: string; // format libre, ex "1er janvier 2027"
}

function libelleIndice(indice: "ILC" | "ILAT"): string {
  return indice === "ILC"
    ? "Indice des Loyers Commerciaux (ILC)"
    : "Indice des Loyers des Activités Tertiaires (ILAT)";
}

export function genererClauseTunnel(params: ClauseTunnelParams): string {
  const { bailleur, preneur, adresse, indice, symetrique, plancherPct, plafondPct, periodicite } =
    params;

  const nature = symetrique
    ? "une clause de variation encadrée symétrique, limitant l'ampleur de la variation du loyer tant à la hausse qu'à la baisse"
    : "une clause de variation encadrée asymétrique, protégeant le Preneur d'une baisse du loyer en-deçà du loyer actuellement dû, tout en plafonnant la hausse applicable";

  return `CLAUSE DE VARIATION ENCADRÉE DU LOYER (« CLAUSE TUNNEL »)

Entre les soussignés :

${bailleur}, ci-après dénommé « le Bailleur »,

et

${preneur}, ci-après dénommé « le Preneur »,

concernant le bail commercial portant sur les locaux sis :
${adresse},

il est convenu ce qui suit.

Article 1 — Objet

Conformément à l'article L.145-38-1 du Code de commerce, issu de la loi
n° 2026-403 du 26 mai 2026, les parties conviennent de soumettre la révision
du loyer visé au présent bail à ${nature}, dite « clause tunnel ».

Article 2 — Indice de référence

La révision du loyer est calculée par référence à l'évolution du ${libelleIndice(indice)}, à l'exclusion de tout autre indice, sauf avenant contraire signé des deux parties.

Article 3 — Périodicité

La révision du loyer selon les modalités de la présente clause intervient
selon une périodicité ${periodicite}.

Article 4 — Plancher et plafond

La variation du loyer applicable à chaque échéance de révision, exprimée en
pourcentage par rapport au loyer de la période précédente, ne pourra :
  — excéder ${plafondPct.toFixed(2)} % (plafond) ;
  — être inférieure à ${plancherPct.toFixed(2)} % (plancher).

Lorsque la variation résultant de l'évolution de l'indice mentionné à
l'article 2 excède ces bornes, seule la variation correspondant au plafond
ou au plancher, selon le cas, est appliquée. Le solde éventuel n'est ni
reporté, ni capitalisé sur les périodes de révision ultérieures, sauf
stipulation contraire expresse.

Article 5 — Portée

La présente clause s'applique à toute date de révision du loyer prévue au
bail visé ci-dessus, jusqu'à son terme ou jusqu'à modification par avenant
signé des deux parties.

Fait à ___________________, le ___________________, en deux exemplaires
originaux.

Le Bailleur                                Le Preneur
${bailleur}                                ${preneur}

Signature :                                Signature :
`;
}

export interface NotificationRevisionParams {
  bailleur: string;
  preneur: string;
  adresse: string;
  ancienLoyer: number;
  nouveauLoyer: number;
  variationPct: number;
  indice: "ILC" | "ILAT" | "ICC";
  dateEffet: string; // format libre, ex "1er janvier 2027"
  clauseTunnelAppliquee?: boolean;
}

function formatMontant(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function genererNotificationRevision(params: NotificationRevisionParams): string {
  const {
    bailleur,
    preneur,
    adresse,
    ancienLoyer,
    nouveauLoyer,
    variationPct,
    indice,
    dateEffet,
    clauseTunnelAppliquee,
  } = params;

  const mention = clauseTunnelAppliquee
    ? " Cette variation résulte de l'application de la clause de variation encadrée (« clause tunnel ») prévue au bail, l'évolution brute de l'indice ayant excédé les bornes contractuelles."
    : "";

  return `NOTIFICATION DE RÉVISION DE LOYER

${bailleur}

À l'attention de : ${preneur}
Objet : notification de révision du loyer commercial — ${adresse}

Madame, Monsieur,

Conformément aux stipulations du bail commercial portant sur les locaux
sis ${adresse}, et en application de l'indice ${indice}, nous vous
notifions par la présente la révision du loyer applicable à compter du
${dateEffet}.

Loyer annuel actuel : ${formatMontant(ancienLoyer)} €
Nouveau loyer annuel : ${formatMontant(nouveauLoyer)} €
Variation appliquée : ${variationPct >= 0 ? "+" : ""}${variationPct.toFixed(2)} %${mention}

Cette révision s'inscrit dans le cadre de l'article L.145-38-1 du Code de
commerce. Nous restons à votre disposition pour toute précision sur ce
calcul.

Nous vous prions d'agréer, Madame, Monsieur, l'expression de nos
salutations distinguées.

${bailleur}
`;
}

export function genererAvenantICC(params: AvenantICCParams): string {
  const { bailleur, preneur, adresse, nouvelIndice, dateEffet } = params;

  return `AVENANT DE SUBSTITUTION D'INDICE (ICC → ${nouvelIndice})

Entre les soussignés :

${bailleur}, ci-après dénommé « le Bailleur »,

et

${preneur}, ci-après dénommé « le Preneur »,

concernant le bail commercial portant sur les locaux sis :
${adresse},

il est convenu ce qui suit.

Préambule

Le bail susvisé prévoit une révision du loyer sur la base de l'indice du
coût de la construction (ICC), aujourd'hui inadapté aux locaux à usage
commercial. Les parties souhaitent, dans le cadre offert par
l'article L.145-38-1 du Code de commerce, substituer à cet indice un indice
mieux adapté à la nature de l'activité exercée dans les lieux loués.

Article 1 — Substitution d'indice

À compter du ${dateEffet}, l'indice de référence applicable aux révisions
du loyer du présent bail est le ${libelleIndice(nouvelIndice)}, en
remplacement de l'indice du coût de la construction (ICC) précédemment
stipulé.

Article 2 — Indice de référence initial

La première révision opérée sur la base du nouvel indice prendra pour
référence la valeur du ${nouvelIndice} publiée au trimestre correspondant à
la date d'effet mentionnée à l'article 1.

Article 3 — Maintien des autres stipulations

Toutes les autres clauses et conditions du bail, non modifiées par le
présent avenant, demeurent inchangées et continuent de produire leur plein
et entier effet, notamment toute clause de variation encadrée (« clause
tunnel ») éventuellement en vigueur, qui s'applique désormais par référence
au nouvel indice mentionné à l'article 1.

Fait à ___________________, le ___________________, en deux exemplaires
originaux.

Le Bailleur                                Le Preneur
${bailleur}                                ${preneur}

Signature :                                Signature :
`;
}
