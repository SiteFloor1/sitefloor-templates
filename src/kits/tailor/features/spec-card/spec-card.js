// @ts-check
/**
 * The specification card: the card follows the form as it changes; the choices travel in the link after # (so the
 * WhatsApp message carries a link that opens the same card, and a refresh keeps it); print shows only the card.
 */
import { specText, aGarment } from "../../lib/tailor.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data), cfg = data.spec;
  const q = (/** @type {string} */ s) => /** @type {HTMLElement|null} */ (root.querySelector(s));
  const form = /** @type {HTMLFormElement|null} */ (q("[data-sp-form]")), list = q("[data-sp-list]"), forLine = q("[data-sp-for]"), date = q("[data-sp-date]");
  const send = /** @type {HTMLAnchorElement|null} */ (q("[data-sp-send]"));
  if (!cfg || !form || !list || !forLine || !date || !send) throw new Error("specification card markup missing");
  const groups = /** @type {HTMLFieldSetElement[]} */ ([...root.querySelectorAll("[data-sp-group]")]);
  const today = ctx.now().date;
  date.textContent = new Date(`${today}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

  const garmentId = () => /** @type {HTMLInputElement|null} */ (form.querySelector("input[name=sp-garment]:checked"))?.dataset.id ?? "";
  // A group listed for some garments only (a shirt's collar; a coat's lapel) shows only while one of those is chosen.
  const fit = () => {
    const id = garmentId();
    for (const g of groups) { const only = g.dataset.spOnly; g.hidden = Boolean(only && id && !only.split(" ").includes(id)); }
  };
  const picked = () => groups.filter((g) => !g.hidden).map((g) => ({ g, input: /** @type {HTMLInputElement|null} */ (g.querySelector("input:checked")) })).filter((x) => x.input);
  const garment = () => /** @type {HTMLInputElement|null} */ (form.querySelector("input[name=sp-garment]:checked"))?.value ?? "";
  const hash = () => "spec=" + [garment() && `for:${encodeURIComponent(garment())}`, ...picked().map(({ g, input }) => `${g.dataset.spGroup}:${input?.value}`)].filter(Boolean).join(",");

  const render = () => {
    fit();
    const chosen = picked();
    forLine.textContent = garment() ? `For ${aGarment(garment())}` : "";
    list.replaceChildren(...chosen.map(({ g, input }) => {
      const li = document.createElement("li"), img = document.createElement("img"), t = document.createElement("p");
      img.src = input?.dataset.src ?? ""; img.alt = input?.dataset.alt ?? ""; img.width = 120; img.height = 150; img.decoding = "async";
      t.innerHTML = "<span></span><b></b>";
      /** @type {HTMLElement} */ (t.firstChild).textContent = g.dataset.name ?? "";
      /** @type {HTMLElement} */ (t.lastChild).textContent = input?.dataset.label ?? "";
      li.append(img, t);
      return li;
    }));
    const cloth = chosen.find((x) => x.g.dataset.spGroup === "cloth")?.input;
    const lines = chosen.filter((x) => x.g.dataset.spGroup !== "cloth").map(({ g, input }) => ({ group: g.dataset.name ?? "", label: input?.dataset.label ?? "" }));
    const h = hash();
    history.replaceState(null, "", `#${h}`);
    const link = `${location.origin}${location.pathname}#${h}`;
    send.href = ctx.bookHref(`${specText(cfg.message, lines, cloth ? { name: cloth.dataset.label ?? "", cloth: cloth.dataset.cloth ?? "" } : null, garment())}\n\nThe card: ${link}`);
  };

  // A card from a link: #spec=for:Overcoat,lapel:peak,cloth:midnight
  const fromHash = () => {
    const m = /^#spec=(.+)$/.exec(location.hash);
    if (!m) return;
    for (const part of m[1].split(",")) {
      const [k, v] = part.split(":");
      let val;
      try { val = decodeURIComponent(v ?? ""); } catch { continue; } // a link cut short (ends in %): skip that part
      const name = k === "for" ? "sp-garment" : `sp-${k}`;
      const input = /** @type {HTMLInputElement|null} */ ([...form.querySelectorAll(`input[name="${CSS.escape(name)}"]`)].find((i) => /** @type {HTMLInputElement} */ (i).value === val) ?? null);
      if (input) input.checked = true;
    }
  };
  fromHash();
  form.addEventListener("change", render);
  q("[data-sp-print]")?.addEventListener("click", () => window.print());
  render();
}
