// @ts-check
/** Old pensions: builds the tracing list from the rows the visitor fills in. Nothing leaves the page. */
import { readEntries, tracingText } from "../../lib/tracing.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-tr-form]"));
  const rows = root.querySelector("[data-tr-rows]");
  const tpl = /** @type {HTMLTemplateElement|null} */ (root.querySelector("[data-tr-row]"));
  const out = root.querySelector("[data-tr-out]");
  const tools = /** @type {HTMLElement|null} */ (root.querySelector("[data-tr-tools]"));
  if (!form || !rows || !tpl || !out || !tools) throw new Error("tracing markup missing");
  form.classList.remove("if-wait");
  const add = () => { if (rows.children.length < 20) rows.append(tpl.content.cloneNode(true)); };
  const read = () => readEntries([...rows.children].map((r) => Object.fromEntries(["employer", "from", "to", "kind"].map((n) => [n, /** @type {HTMLInputElement} */ (r.querySelector(`[name="${n}"]`)).value]))));
  const paint = () => {
    const text = tracingText(read(), ctx.data.name);
    out.textContent = text || "Add an employer to start your list.";
    tools.hidden = !text;
  };
  form.addEventListener("input", paint);
  form.addEventListener("submit", (e) => e.preventDefault());
  root.querySelector("[data-tr-add]")?.addEventListener("click", () => { add(); paint(); });
  const copy = /** @type {HTMLButtonElement} */ (root.querySelector("[data-tr-copy]"));
  copy.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(out.textContent ?? ""); copy.textContent = "Copied"; }
    catch { copy.textContent = "Select the list to copy it"; }
    setTimeout(() => { copy.textContent = "Copy the list"; }, 2500);
  });
  root.querySelector("[data-tr-print]")?.addEventListener("click", () => window.print());
}
