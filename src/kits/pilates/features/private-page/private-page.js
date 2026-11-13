// @ts-check
/** Private and duet: the request's choices and words go into the WhatsApp message as they're chosen. */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const msg = /** @type {any} */ (ctx.data).pilates?.privateMessage;
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-pp-form]"));
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-pp-send]"));
  if (!msg || !form || !send) throw new Error("private page markup missing");
  const render = () => {
    const kind = /** @type {HTMLInputElement|null} */ (form.querySelector('input[name="pp-kind"]:checked'))?.value ?? "";
    const when = [...form.querySelectorAll('input[name="pp-when"]:checked')].map((i) => /** @type {HTMLInputElement} */ (i).value);
    const aim = (/** @type {HTMLTextAreaElement|null} */ (form.querySelector("#pp-aim"))?.value ?? "").trim();
    const name = (/** @type {HTMLInputElement|null} */ (form.querySelector("#pp-name"))?.value ?? "").trim();
    send.href = ctx.waHref([msg, kind && `Session: ${kind}`, when.length ? `When suits: ${when.join(", ")}` : "", aim && `To work on: ${aim}`, name && `Name: ${name}`].filter(Boolean).join("\n"));
  };
  form.addEventListener("input", render);
  form.addEventListener("change", render);
  render();
}
