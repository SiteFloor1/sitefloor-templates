// @ts-check
/**
 * The Eid family list: rows of name, piece and length kept only in the page's address (#…), so the link can go round
 * the family and nothing is stored anywhere; "Send our order" sends the whole list and total to the shop
 * (lib/modest.js: encodeFamily, decodeFamily, familyMessage).
 */
import { encodeFamily, decodeFamily, familyMessage, pounds } from "../../lib/modest.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data), cfg = data.family;
  const rows = root.querySelector("[data-fam-rows]"), tpl = /** @type {HTMLTemplateElement|null} */ (root.querySelector("template[data-fam-row]"));
  const add = /** @type {HTMLButtonElement|null} */ (root.querySelector("[data-fam-add]")), total = root.querySelector("[data-fam-total]");
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-fam-send]")), share = root.querySelector("[data-fam-share]"), note = root.querySelector("[data-fam-note]");
  if (!cfg || !rows || !tpl || !add || !total || !send || !share || !note) return;
  const pieces = cfg.pieces;

  /** @param {HTMLSelectElement} sel @param {string} pieceId @param {number} length */
  const lengths = (sel, pieceId, length) => {
    const p = pieces.find((/** @type {any} */ x) => x.id === pieceId) ?? pieces[0];
    sel.replaceChildren(Object.assign(document.createElement("option"), { value: "0", textContent: "Not sure" }),
      ...p.lengths.map((/** @type {number} */ l) => Object.assign(document.createElement("option"), { value: String(l), textContent: String(l), selected: l === length })));
  };
  /** @param {import("../../lib/modest.js").Person} person */
  const addRow = (person) => {
    const li = /** @type {HTMLElement} */ (/** @type {DocumentFragment} */ (tpl.content.cloneNode(true)).firstElementChild);
    const [name, piece, length] = /** @type {[HTMLInputElement, HTMLSelectElement, HTMLSelectElement]} */ ([...li.querySelectorAll("input, select")]);
    name.value = person.name;
    piece.value = person.piece;
    lengths(length, piece.value, person.length);
    piece.addEventListener("change", () => { lengths(length, piece.value, 0); update(); });
    li.querySelector("[data-fam-remove]")?.addEventListener("click", () => { li.remove(); update(); });
    rows.append(li);
  };
  const read = () => [...rows.querySelectorAll("li")].map((li) => {
    const [name, piece, length] = /** @type {[HTMLInputElement, HTMLSelectElement, HTMLSelectElement]} */ ([...li.querySelectorAll("input, select")]);
    return { name: name.value.trim().slice(0, 24), piece: piece.value, length: Number(length.value) };
  });
  const update = () => {
    const people = read();
    const m = familyMessage(data.name, people, pieces);
    total.textContent = pounds(m.total);
    send.href = ctx.bookHref(m.text);
    send.toggleAttribute("aria-disabled", !people.length);
    add.disabled = people.length >= cfg.max;
    history.replaceState(null, "", people.length ? `#${encodeFamily(people)}` : location.pathname + location.search);
  };

  const start = decodeFamily(location.hash, pieces, cfg.max);
  for (const p of start.length ? start : [{ name: "", piece: pieces[0].id, length: 0 }]) addRow(p);
  rows.addEventListener("input", update);
  add.addEventListener("click", () => { addRow({ name: "", piece: pieces[0].id, length: 0 }); update(); /** @type {HTMLElement|null} */ (rows.querySelector("li:last-child input"))?.focus(); });
  share.addEventListener("click", async () => {
    update();
    const url = location.href;
    try {
      if (navigator.share) await navigator.share({ title: `Our Eid list for ${data.name}`, url });
      else { await navigator.clipboard.writeText(url); note.textContent = "Link copied: send it to the family; each of you can add yourself."; }
    } catch { note.textContent = "Copy this page's address and send it to the family."; }
  });
  update();
}
