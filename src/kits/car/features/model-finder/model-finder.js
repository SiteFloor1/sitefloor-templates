// @ts-check
/**
 * Model finder: matches the studio's posts by the hashtags it uses for each make and model, and lists its own
 * prices for that model's size. Captions come from Instagram, so everything is built with textContent.
 */
import { postsFor } from "../../lib/finder.js";
import { hoursText, jobById, line } from "../../lib/pricing.js";

const SHOW = 6; // posts shown at once; the rest are a tap away on the work page

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const d = /** @type {any} */ (ctx.data);
  const models = /** @type {HTMLElement|null} */ (root.querySelector("[data-mf-models]"));
  const list = root.querySelector("[data-mf-posts]"), verdict = root.querySelector("[data-mf-verdict]");
  const prices = root.querySelector("[data-mf-prices]"), size = root.querySelector("[data-mf-size]");
  const ask = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-mf-ask]"));
  if (!d.models || !models || !list || !verdict || !prices || !size || !ask) throw new Error("model finder markup or data missing");
  /** @type {any[]} */
  let posts = d.gallery?.photos ?? [];
  const el = (/** @type {string} */ tag, /** @type {string} */ text = "", /** @type {string} */ cls = "") => Object.assign(document.createElement(tag), { textContent: text, className: cls });

  const make = () => d.models.makes.find((/** @type {any} */ m) => m.tag === /** @type {HTMLInputElement|null} */ (root.querySelector("input[name=mf-make]:checked"))?.value) ?? d.models.makes[0];
  const model = () => make().models.find((/** @type {any} */ m) => m.tag === /** @type {HTMLInputElement|null} */ (root.querySelector("input[name=mf-model]:checked"))?.value) ?? null;

  const chips = () => {
    models.replaceChildren(...make().models.map((/** @type {any} */ m, /** @type {number} */ i) => {
      const label = el("label", "", "sr-chip");
      label.append(Object.assign(document.createElement("input"), { type: "radio", name: "mf-model", value: m.tag, checked: i === 0 }), el("span", m.name));
      return label;
    }));
  };

  const paint = () => {
    const mk = make(), md = model();
    const { exact, sameMake } = postsFor(posts, mk, md);
    const name = md ? `${mk.name} ${md.name}` : mk.name;
    verdict.textContent = exact.length ? `Yes: ${exact.length} ${name} job${exact.length === 1 ? "" : "s"} below.`
      : sameMake.length ? `No ${name} posted yet, but ${sameMake.length} other ${mk.name}${sameMake.length === 1 ? "" : "s"}.` : `No ${mk.name} posted yet. Ask us: we fit every make.`;
    list.replaceChildren(...[...exact, ...sameMake].slice(0, SHOW).map((p) => {
      const li = el("li", "", exact.includes(p) ? "" : "mf-other");
      li.append(Object.assign(document.createElement("img"), { src: p.src, alt: p.alt, loading: "lazy", width: p.width ?? 400, height: p.height ?? 500 }));
      if (p.caption) li.append(el("small", p.caption));
      return li;
    }));
    const vehicle = d.vehicles.find((/** @type {any} */ v) => v.id === md?.vehicle) ?? null;
    size.textContent = vehicle ? `Our prices for a ${md.name} (${vehicle.name.toLowerCase()})` : "";
    prices.replaceChildren(...(vehicle ? d.models.priceJobs.map((/** @type {string} */ id) => {
      const l = line(jobById(d.jobs, id), vehicle.id);
      const row = el("div");
      const dd = el("dd", `£${l.price.toLocaleString("en-GB")}`);
      dd.append(el("small", hoursText(l.hours)));
      row.append(el("dt", l.name), dd);
      return row;
    }) : []));
    const all = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-mf-all]"));
    if (all) {
      all.href = `${all.href.split("#")[0]}#${mk.tag}`;
      if (all.firstChild) all.firstChild.textContent = `See every ${mk.name} job `;
    }
    ask.href = ctx.waHref(`Hi, can you do my ${name}?${exact[0]?.link ? ` Like this one: ${exact[0].link}` : ""}`);
  };

  root.addEventListener("change", (e) => {
    if (/** @type {HTMLInputElement} */ (e.target).name === "mf-make") chips();
    paint();
  });
  ctx.watch("posts", (p) => { posts = p; paint(); });
  chips();
  paint();
}
