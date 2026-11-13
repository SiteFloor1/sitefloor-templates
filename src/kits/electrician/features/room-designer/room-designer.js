// @ts-check
/** The room designer: the form's choices priced with lightingQuote (the client's own prices). */
import { lightingQuote, pounds, quoteText } from "../../lib/quotes.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const d = /** @type {any} */ (ctx.data).designer;
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-design-form]"));
  const lines = /** @type {HTMLElement|null} */ (root.querySelector("[data-design-lines]"));
  const total = /** @type {HTMLElement|null} */ (root.querySelector("[data-design-total]"));
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-design-send]"));
  if (!d || !form || !lines || !total || !send) throw new Error("room designer markup missing");
  const update = () => {
    const val = (/** @type {string} */ n) => /** @type {HTMLInputElement|null} */ (form.querySelector(`input[name=${n}]:checked`))?.value ?? "";
    const room = d.rooms.find((/** @type {any} */ r) => r.id === val("dz-room"));
    const size = d.sizes.find((/** @type {any} */ s) => s.id === val("dz-size"));
    const layers = [...form.querySelectorAll("input[name=dz-layer]:checked")].map((i) => /** @type {HTMLInputElement} */ (i).value);
    const q = lightingQuote(d, size?.id ?? "", layers);
    lines.replaceChildren(...(q.lines.length ? q.lines.map((l) => { const li = document.createElement("li"); const a = document.createElement("span"); const b = document.createElement("b"); a.textContent = `${l.count} × ${l.name}`; b.textContent = pounds(l.total); li.append(a, b); return li; }) : [Object.assign(document.createElement("li"), { textContent: "Choose a layer of light." })]));
    total.textContent = q.lines.length ? pounds(q.total) : "—";
    send.href = ctx.waHref(`${d.message}\n\nRoom: ${room?.name ?? ""} (${size?.label ?? ""})\n${quoteText(q.lines)}\nWebsite price: ${pounds(q.total)}`);
  };
  form.addEventListener("change", update);
  update();
}
