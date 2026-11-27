// @ts-check
/** The shot list: tap shots on and off; the count and the WhatsApp message follow the choice. */
import { fill } from "../../lib/carfilm.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const msg = /** @type {any} */ (ctx.data).carfilm?.shots;
  const shots = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-shot]")]);
  const count = root.querySelector("[data-sl-count]"), send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-sl-send]"));
  if (!msg || !count || !send) throw new Error("shot list markup missing");
  const paint = () => {
    const on = shots.filter((s) => s.getAttribute("aria-pressed") === "true").map((s) => s.dataset.shot ?? "");
    count.textContent = on.length ? `${on.length} ${on.length === 1 ? "shot" : "shots"} on your list` : "Nothing chosen yet";
    send.href = ctx.bookHref(fill(msg, { shots: on.map((s) => `- ${s}`).join("\n") }));
  };
  for (const s of shots) s.addEventListener("click", () => { s.setAttribute("aria-pressed", String(s.getAttribute("aria-pressed") !== "true")); paint(); });
  paint();
}
