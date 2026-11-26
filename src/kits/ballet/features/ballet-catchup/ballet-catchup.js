// @ts-check
/**
 * Catch-up classes: for the session picked, the class's other sessions and the classes at the same level, each with a
 * WhatsApp message asking to come to that one instead. Nothing is booked; the school replies.
 */
import { catchUps, sessionWords } from "../../lib/ballet.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data);
  const select = /** @type {HTMLSelectElement|null} */ (root.querySelector("[data-cu-missed]"));
  const list = root.querySelector("[data-cu-list]");
  if (!data.classes || !data.catchUp || !select || !list) throw new Error("catch-up markup or data missing");
  const draw = () => {
    const [id, day, time] = select.value.split("|");
    const missed = { day, time };
    const options = catchUps(data.classes.items, id, missed);
    const missedName = data.classes.items.find((/** @type {any} */ c) => c.id === id)?.name ?? "";
    if (!options.length) {
      list.replaceChildren(Object.assign(document.createElement("li"), { textContent: "No other class at this level this week. Ask the school." }));
      return;
    }
    list.replaceChildren(...options.map(({ cls, session }) => {
      const li = document.createElement("li");
      const text = `${data.catchUp.message} we missed ${missedName}, ${sessionWords(missed)}. Could we come to ${cls.name}, ${sessionWords(session)}, instead?`;
      li.append(Object.assign(document.createElement("b"), { textContent: sessionWords(session) }), " ",
        Object.assign(document.createElement("span"), { textContent: cls.name }), " ",
        Object.assign(document.createElement("a"), { className: "rd-link", href: ctx.bookHref(text), textContent: "Ask for this one", target: "_blank", rel: "noopener" }));
      return li;
    }));
  };
  select.addEventListener("change", draw);
  // Start on the first session that has somewhere else to go, so the answer shows what the tool does.
  const first = [...select.options].find((o) => { const [id, day, time] = o.value.split("|"); return catchUps(data.classes.items, id, { day, time }).length; });
  if (first) select.value = first.value;
  draw();
}
