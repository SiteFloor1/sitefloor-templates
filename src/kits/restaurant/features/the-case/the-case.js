// @ts-check
/**
 * The glass case: loads each bake's photo as the case comes into view, shows a tapped bake's details (its
 * allergens and diet marks from the menu, its state from the sheet), and builds "put one aside" on WhatsApp.
 * The states and tags themselves come from the specials script ([data-bake], data-state).
 */
import { allergenNames } from "../../../../core/lib/allergens.js";
import { money, toPence } from "../../lib/order.js";

const WAITS = [10, 20, 30, 45, 60];

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  /** @type {{ bakes: { id: string, name: string, price: number, allergens: string[] }[], hold: string|null }} */
  const counter = /** @type {any} */ (ctx.data).counter;
  const info = /** @type {HTMLElement|null} */ (root.querySelector("[data-tc-info]"));
  // Printed as plain items so they aren't dead buttons without JavaScript; made buttons here.
  const items = [...root.querySelectorAll("[data-tc-bake]")].map((el) => {
    const b = document.createElement("button");
    for (const at of el.attributes) b.setAttribute(at.name, at.value);
    b.type = "button"; b.setAttribute("aria-pressed", "false"); b.setAttribute("aria-controls", "tc-info");
    b.append(...el.childNodes); el.replaceWith(b);
    return b;
  });
  if (!counter || !info || !items.length) throw new Error("the case markup or data missing");

  const load = () => { for (const img of root.querySelectorAll("img[data-src]")) { img.setAttribute("src", img.getAttribute("data-src") ?? ""); img.removeAttribute("data-src"); } };
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((e) => { if (e.some((x) => x.isIntersecting)) { load(); io.disconnect(); } }, { rootMargin: "600px 0px" });
    io.observe(root);
  } else load();

  /** @type {string|null} */ let open = null;
  let wait = 20;
  const show = () => {
    for (const b of items) b.setAttribute("aria-pressed", String(b.dataset.tcBake === open));
    const bake = counter.bakes.find((b) => b.id === open);
    const btn = items.find((b) => b.dataset.tcBake === open);
    if (!bake || !btn) return;
    const state = btn.dataset.state ?? "";
    const tag = btn.querySelector("[data-bake-tag]")?.textContent ?? "";
    const desc = root.querySelector(`[data-tc-desc="${bake.id}"]`)?.textContent?.trim() ?? "";
    const an = allergenNames(bake);
    const h = document.createElement("h3"); h.className = "tc-ih"; h.textContent = bake.name;
    const p = document.createElement("p"); p.className = "tc-ip"; p.textContent = money(toPence(bake.price)) + (tag ? ` · ${tag}` : "");
    const parts = [h, p];
    if (desc) { const d = document.createElement("p"); d.className = "tc-id"; d.textContent = desc; parts.push(d); }
    const a = document.createElement("p"); a.className = "tc-ia"; a.textContent = an.length ? `Contains: ${an.join(", ").toLowerCase()}.` : "None of the 14 allergens.";
    parts.push(a);
    if (state === "out") {
      const o = document.createElement("p"); o.className = "tc-io"; o.textContent = "Sold out for now. Ask us when the next tray is due.";
      parts.push(o);
    } else if (counter.hold) {
      const row = document.createElement("div"); row.className = "tc-hold";
      const lab = document.createElement("label"); lab.className = "rs-field"; lab.textContent = "I'll be there in about";
      const sel = document.createElement("select");
      for (const m of WAITS) { const o = document.createElement("option"); o.value = String(m); o.textContent = `${m} minutes`; o.selected = m === wait; sel.append(o); }
      lab.append(sel);
      const go = document.createElement("a"); go.className = "btn"; go.target = "_blank"; go.rel = "noopener";
      const href = () => ctx.waHref([counter.hold, "", `1 × ${bake.name}, ${money(toPence(bake.price))}`, `I'll be there in about ${wait} minutes.`, an.length ? `Allergens: ${an.join(", ")}` : ""].filter((l, i) => l !== "" || i === 1).join("\n").trim());
      go.href = href(); go.textContent = "Put one aside for me";
      sel.addEventListener("change", () => { wait = Number(sel.value); go.href = href(); });
      const n = document.createElement("p"); n.className = "rs-small"; n.textContent = "A request on WhatsApp; we reply to say it's set aside.";
      row.append(lab, go, n);
      parts.push(row);
    }
    info.replaceChildren(...parts);
  };
  for (const b of items) b.addEventListener("click", () => { open = open === b.dataset.tcBake ? null : b.dataset.tcBake ?? null; if (open) show(); else { for (const x of items) x.setAttribute("aria-pressed", "false"); } });
  ctx.watch("tonight", () => { if (open) show(); });
}
