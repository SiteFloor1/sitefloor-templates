// @ts-check
/** The style lexicon's kinds of word, in the order the filter lists them, and the filter itself. */

export const KINDS = {
  lapel: "Lapels",
  pocket: "Pockets",
  button: "Buttons and fastening",
  back: "Vents and the back",
  shoulder: "Shoulders and sleeves",
  trouser: "Trousers",
  cloth: "Cloth and making",
};

/** Only the kinds the house's words use, so the filter never offers a choice that shows nothing. @param {{ kind: string }[]} items */
export const usedKinds = (items) => Object.entries(KINDS).filter(([k]) => items.some((x) => x.kind === k)).map(([id, label]) => ({ id, label }));

/** Words of one kind (all when kind is ""), in the house's order. @template {{ kind: string }} T @param {T[]} items @param {string} kind */
export const wordsOf = (items, kind) => (kind ? items.filter((x) => x.kind === kind) : items);
