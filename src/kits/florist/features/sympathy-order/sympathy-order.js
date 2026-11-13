// @ts-check
/** Sympathy flowers: the choices become a plain message on WhatsApp; a service date needs the florist's notice. */
import { addDays } from "../../../../core/lib/hours.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const S = /** @type {any} */ (ctx.data).florist?.sympathy;
  const form = root.querySelector("[data-sym-form]");
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-sym-send]"));
  const date = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-sym-date]"));
  const card = /** @type {HTMLTextAreaElement|null} */ (root.querySelector("[data-sym-card]"));
  const say = root.querySelector("[data-sym-say]");
  if (!S || !form || !send || !date || !card || !say) throw new Error("sympathy: markup or data missing");
  date.min = addDays(ctx.now().date, S.leadDays);
  const val = (/** @type {string} */ sel) => /** @type {HTMLInputElement|null} */ (form.querySelector(sel))?.value.trim() ?? "";
  const refresh = () => {
    const lines = [S.message, "", val('input[name="sym-piece"]:checked')];
    const who = val("[data-sym-for]");
    if (who) lines.push(`In memory of ${who}`);
    lines.push(`To: ${val('input[name="sym-place"]:checked')}`);
    if (date.value) lines.push(`Service: ${new Date(`${date.value}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })}`);
    if (card.value.trim()) lines.push("", "Card:", card.value.trim());
    send.href = ctx.waHref(lines.join("\n"));
    say.textContent = date.value && date.value < date.min ? `That's sooner than we can promise. Send it anyway and we'll tell you honestly what we can do.` : "";
  };
  for (const b of root.querySelectorAll("[data-sym-line]")) b.addEventListener("click", () => { card.value = b.textContent ?? ""; refresh(); card.focus(); });
  form.addEventListener("input", refresh);
  form.addEventListener("change", refresh);
  send.addEventListener("click", refresh);
  refresh();
}
