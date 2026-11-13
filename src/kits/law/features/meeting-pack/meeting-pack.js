// @ts-check
/**
 * The first-meeting pack: reads the pack from the link (after #) in the browser, shows only the person, way in and
 * things to bring it names, and offers the meeting as a calendar file. #make shows the firm's link maker.
 */
import { decodePack, encodePack, packWhen, packIcs } from "../../lib/pack.js";
import { addDaysYmd } from "../../lib/matter.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const $ = (/** @type {string} */ s) => /** @type {any} */ (root.querySelector(s));
  const all = (/** @type {string} */ s) => /** @type {HTMLElement[]} */ ([...root.querySelectorAll(s)]);
  const card = $("#mp-card"), none = $("#mp-none"), make = $("#mp-make");
  if (!card || !none || !make) throw new Error("meeting pack markup missing");
  const known = {
    people: all("[data-mp-person]").map((e) => e.dataset.mpPerson ?? ""),
    ways: all("[data-mp-way]").map((e) => e.dataset.mpWay ?? ""),
    bring: all("[data-mp-item]").map((e) => e.dataset.mpItem ?? ""),
  };
  /** @type {import("../../lib/pack.js").Pack|null} */ let pack = null;

  const show = () => {
    const hash = location.hash.slice(1);
    make.hidden = hash !== "make";
    if (hash === "make") { card.hidden = true; none.hidden = true; return; }
    const r = decodePack(hash, known);
    if (!r.ok) {
      pack = null; card.hidden = true; none.hidden = false;
      if (r.why !== "empty") $("[data-mp-why]").textContent = `This link doesn't open a meeting (${r.why} isn't right). Call us on ${ctx.data.phone} and we'll send it again.`;
      return;
    }
    pack = r.pack;
    none.hidden = true; card.hidden = false;
    const forName = $("[data-mp-for]");
    forName.hidden = !pack.n; forName.textContent = pack.n ? `For ${pack.n}` : "";
    $("[data-mp-when]").textContent = `${packWhen(pack)}, for ${pack.m} minutes`;
    const past = pack.d < ctx.now().date;
    $("[data-mp-past]").hidden = !past;
    $("[data-mp-ics]").hidden = past;
    for (const e of all("[data-mp-person]")) e.hidden = e.dataset.mpPerson !== pack.p;
    const ways = $("[data-mp-ways]");
    if (ways) { ways.hidden = !pack.e; for (const e of all("[data-mp-way]")) e.hidden = e.dataset.mpWay !== pack.e; }
    $("[data-mp-bring]").hidden = !pack.b.length;
    for (const e of all("[data-mp-item]")) e.hidden = !pack.b.includes(e.dataset.mpItem ?? "");
  };

  $("[data-mp-ics]").addEventListener("click", () => {
    if (!pack) return;
    const who = all("[data-mp-person]").find((e) => e.dataset.mpPerson === pack?.p)?.querySelector("b")?.textContent ?? "";
    const ics = packIcs({ pack, who, firm: ctx.data.name, place: root.dataset.place ?? ctx.data.name, timeZone: ctx.data.hours.timezone, stamp: new Date() });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = `meeting-${pack.d}.ics`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  make.addEventListener("submit", (/** @type {Event} */ e) => {
    e.preventDefault();
    const bring = all("[data-mk-bring]").filter((x) => /** @type {HTMLInputElement} */ (x).checked).map((x) => /** @type {HTMLInputElement} */ (x).value);
    /** @type {any} */ const p = { v: 1, d: $("#mk-d").value, t: $("#mk-t").value, m: Number($("#mk-m").value), p: $("#mk-p").value, b: bring };
    if ($("#mk-e")?.value) p.e = $("#mk-e").value;
    if ($("#mk-n").value.trim()) p.n = $("#mk-n").value.trim();
    const code = encodePack(p);
    const check = decodePack(code, known);
    const out = $("[data-mk-out]");
    out.hidden = false;
    $("#mk-link").value = check.ok ? `${location.origin}${location.pathname}#${code}` : `Check ${check.why}`;
  });
  $("[data-mk-copy]").addEventListener("click", () => { const i = $("#mk-link"); navigator.clipboard?.writeText(i.value).catch(() => i.select()); });

  // Demo only: the example pack's meeting is moved to the next weekday after today, so it never shows a past meeting.
  const ex = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-mp-example]"));
  if (ex) {
    const r = decodePack(ex.getAttribute("href") ?? "", known);
    if (r.ok) {
      let d = addDaysYmd(ctx.now().date, 1);
      while ([0, 6].includes(new Date(`${d}T12:00:00Z`).getUTCDay())) d = addDaysYmd(d, 1);
      ex.href = `#${encodePack({ ...r.pack, d })}`;
    }
  }
  window.addEventListener("hashchange", show);
  show();
  root.setAttribute("data-ready", "");
}
