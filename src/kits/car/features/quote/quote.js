// @ts-check
/** WhatsApp quote: the message is rebuilt from the form as the visitor fills it in. */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const d = /** @type {any} */ (ctx.data);
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-qt]"));
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-qt-send]"));
  if (!form || !send || !d.quote || !d.vehicles) throw new Error("quote markup or data missing");
  const update = () => {
    const f = new FormData(form);
    const vehicle = d.vehicles.find((/** @type {any} */ v) => v.id === f.get("vehicle"));
    const car = String(f.get("car") ?? "").trim();
    const work = f.getAll("work").map(String);
    const notes = String(f.get("notes") ?? "").trim();
    send.href = ctx.waHref([
      d.quote.message,
      `Car: ${[car, vehicle ? vehicle.name.toLowerCase() : ""].filter(Boolean).join(", ") || "not given"}`,
      `Work: ${work.length ? work.join(", ") : "not sure yet"}`,
      `When: ${f.get("when") ?? "I'm flexible"}`,
      ...(notes ? [`Notes: ${notes}`] : []),
    ].join("\n"));
  };
  form.addEventListener("input", update);
  form.addEventListener("submit", (e) => { e.preventDefault(); send.click(); });
  update();
}
