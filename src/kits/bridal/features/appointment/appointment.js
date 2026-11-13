// @ts-check
/**
 * The appointment request: "Request an appointment" opens the sheet; the WhatsApp message is built from the form as
 * it changes. The wedding date is shared
 * with the order-by date and the diary; gowns kept on the shortlist (same page or remembered) join the request.
 */
import { appointmentText } from "../../lib/gowns.js";
import { ukDate } from "../../../../core/lib/diary.js";
import { weddingField } from "../../partials/date-field.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).appointment;
  const houses = /** @type {{ id: string, name: string }[]} */ (/** @type {any} */ (ctx.data).houses ?? []);
  const form = root.querySelector("[data-ap-form]");
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-ap-send]"));
  const party = /** @type {HTMLSelectElement|null} */ (root.querySelector("[data-ap-party]"));
  const notes = /** @type {HTMLTextAreaElement|null} */ (root.querySelector("[data-ap-notes]"));
  const gownLine = /** @type {HTMLElement|null} */ (root.querySelector("[data-ap-gowns]"));
  const sheet = /** @type {HTMLDialogElement|null} */ (root.querySelector("[data-ap-sheet]"));
  const open = /** @type {HTMLElement|null} */ (root.querySelector("[data-ap-open]")), close = root.querySelector("[data-ap-close]");
  if (!cfg || !form || !send || !party || !notes || !gownLine || !sheet || !open || !close || typeof sheet.showModal !== "function") throw new Error("appointment markup missing");
  open.addEventListener("click", (e) => { e.preventDefault(); sheet.showModal(); });
  close.addEventListener("click", () => sheet.close());
  sheet.addEventListener("click", (e) => { if (e.target === sheet) sheet.close(); });
  sheet.addEventListener("close", () => open.focus());
  // Another section (the hero, the diary) can ask for the sheet.
  ctx.watch("request", (/** @type {unknown} */ v) => { if (v) { sheet.showModal(); ctx.share("request", false); } });
  let wedding = "";
  /** @type {string[]} */ let gowns = [];

  const update = () => {
    const when = /** @type {HTMLInputElement|null} */ (form.querySelector("input[name=ap-when]:checked"))?.value;
    const chosen = [...form.querySelectorAll("input[name=ap-house]:checked")].map((i) => houses.find((h) => h.id === /** @type {HTMLInputElement} */ (i).value)?.name ?? "");
    send.href = ctx.bookHref(appointmentText({
      opening: cfg.message, wedding: wedding ? ukDate(wedding) : "", party: Number(party.value), when,
      houses: chosen.filter(Boolean), gowns, notes: notes.value.trim(),
    }));
    gownLine.hidden = !gowns.length;
    gownLine.textContent = gowns.length ? `Gowns from your shortlist: ${gowns.join(", ")}` : "";
  };
  weddingField(root, ctx, (ymd) => { wedding = ymd; update(); });
  form.addEventListener("change", update);
  notes.addEventListener("input", update);
  ctx.watch("shortlist", (/** @type {string[]} */ names) => { gowns = names ?? []; update(); });
  // A shortlist kept on the gowns page (Signature) comes with the request from any page.
  const data = /** @type {any} */ (ctx.data);
  if (data.shortlist && data.gowns) {
    try {
      const ids = JSON.parse(localStorage.getItem("sf-shortlist") ?? "[]");
      if (Array.isArray(ids)) gowns = data.gowns.items.filter((/** @type {any} */ g) => ids.includes(g.id)).map((/** @type {any} */ g) => g.name);
    } catch { /* storage off or unreadable: no shortlist */ }
  }
  update();
}
