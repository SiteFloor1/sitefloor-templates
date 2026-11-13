// @ts-check
/**
 * The pâtisserie window: pieces sold out on the sheet are marked and can't go in the box; the box fills piece by piece
 * up to its size; "Pay" opens the shop's own Stripe link for that box and "Send the box" its WhatsApp message.
 */
import { boxContents, boxStep, boxMessage, collectDays } from "../../lib/window.js";
import { isSoldOut } from "../../lib/tonight.js";
import { money, toPence } from "../../lib/order.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).window;
  /** @param {string} k */ const q = (k) => /** @type {any} */ (root.querySelector(`[data-wn-${k}]`));
  const lines = q("lines"), left = q("left"), when = q("when"), name = q("name"), pay = q("pay"), send = q("send");
  const els = /** @type {HTMLElement[]} */ ([...root.querySelectorAll(".wn-piece")]);
  if (!cfg || !lines || !left || !when || !name || !pay || !send) throw new Error("the window markup or data missing");
  /** @type {Record<string, number>} */ let chosen = {};
  /** @type {string[]} */ let out = [];
  const box = () => cfg.boxes.find((/** @type {any} */ b) => b.id === /** @type {HTMLInputElement|null} */ (root.querySelector('input[name="wn-box"]:checked'))?.value) ?? cfg.boxes[0];

  // Days to collect: the next seven open days; today only while there's time before closing. The message sends the date.
  const days = collectDays(ctx.data.hours, ctx.now());
  for (const d of days) when.append(Object.assign(document.createElement("option"), { value: d.date, textContent: d.label }));

  const draw = () => {
    const b = box();
    const c = boxContents(chosen, cfg.pieces, b);
    for (const el of els) {
      const id = el.dataset.dish ?? "", n = chosen[id] ?? 0, gone = out.includes(id);
      el.classList.toggle("on", n > 0);
      el.classList.toggle("is-out", gone);
      /** @type {any} */ (el.querySelector("[data-out]")).hidden = !gone;
      /** @type {any} */ (el.querySelector("[data-wn-n]")).textContent = String(n);
      /** @type {any} */ (el.querySelector("[data-wn-minus]")).disabled = n === 0;
      /** @type {any} */ (el.querySelector("[data-wn-plus]")).disabled = gone || c.full;
    }
    lines.replaceChildren(...c.lines.map((l) => Object.assign(document.createElement("li"), { textContent: `${l.qty} × ${l.piece.name}` })));
    left.textContent = c.full ? "The box is full." : `${c.left} more to choose.`;
    pay.href = b.link;
    pay.textContent = `Pay ${money(toPence(b.price))} by card`;
    pay.setAttribute("aria-disabled", String(!c.full));
    send.setAttribute("aria-disabled", String(!c.full));
    send.href = ctx.waHref(c.full ? boxMessage({ opening: cfg.message, box: b, lines: c.lines, when: days.find((d) => d.date === when.value)?.text ?? "", name: name.value.trim() }) : cfg.message);
  };

  root.addEventListener("click", (e) => {
    const t = /** @type {HTMLElement} */ (e.target);
    const btn = t.closest("[data-wn-plus], [data-wn-minus]");
    if (btn) {
      const id = /** @type {HTMLElement} */ (btn.closest(".wn-piece")).dataset.dish ?? "";
      chosen = boxStep(chosen, id, btn.hasAttribute("data-wn-plus") ? 1 : -1, box(), out);
      draw();
      return;
    }
    const link = t.closest("[data-wn-pay], [data-wn-send]");
    if (link && link.getAttribute("aria-disabled") === "true") e.preventDefault();
  });
  root.addEventListener("change", (e) => {
    if (/** @type {HTMLInputElement} */ (e.target).name === "wn-box") {
      // A smaller box keeps only what fits, in the order chosen.
      let room = box().count; const kept = /** @type {Record<string, number>} */ ({});
      for (const [id, n] of Object.entries(chosen)) { const k = Math.min(n, room); if (k) kept[id] = k; room -= k; }
      chosen = kept;
    }
    draw();
  });
  name.addEventListener("input", draw);
  ctx.watch("tonight", (/** @type {import("../../lib/tonight.js").Tonight} */ r) => {
    out = r.ok ? cfg.pieces.filter((/** @type {any} */ p) => isSoldOut(r.soldOut, p)).map((/** @type {any} */ p) => p.id) : [];
    for (const id of out) delete chosen[id];
    draw();
  });
  draw();
}
