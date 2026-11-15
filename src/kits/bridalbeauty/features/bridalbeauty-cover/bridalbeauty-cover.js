// @ts-check
/**
 * The cover lines: the date (the artist's diary, on the cover as one word), trial and wedding day for the service she
 * picks, and what time we start for her ceremony and her party. Before she picks a date the line shows the next open
 * Saturday, named as such; nothing ever says booked. The choices are shared with the party quote and the pages.
 */
import { dayAnswer, dateText, ukDate, clockWords, minutesOf, morningFor, numberWord, pounds, nextOpenSaturday } from "../../lib/bridalbeauty.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const d = /** @type {any} */ (ctx.data);
  const $ = (/** @type {string} */ s) => /** @type {HTMLElement|null} */ (root.querySelector(s));
  const dateIn = /** @type {HTMLInputElement|null} */ ($("[data-cv-date]"));
  const svc = /** @type {HTMLSelectElement|null} */ ($("[data-cv-svc]"));
  const cer = /** @type {HTMLSelectElement|null} */ ($("[data-cv-cer]"));
  const ask = /** @type {HTMLAnchorElement|null} */ ($("[data-cv-ask]"));
  /** @type {import("../../lib/bridalbeauty.js").DatesResult|null} */
  let diary = null;
  let wedding = "", chosen = false;
  const state = { service: d.packages?.bride[0].id ?? "", ceremony: cer ? minutesOf(cer.value) : 0, counts: { ...(d.party?.start ?? {}) } };
  const set = (/** @type {string} */ sel, /** @type {string} */ t) => { const el = $(sel); if (el) el.textContent = t; };
  const serviceName = () => d.packages?.bride.find((/** @type {any} */ x) => x.id === state.service)?.name ?? "";

  const paintDate = () => {
    if (!dateIn || !d.dateCheck) return;
    const today = ctx.now().date;
    if (!chosen && diary) wedding = nextOpenSaturday(today, diary) || wedding;
    const a = wedding ? dayAnswer(wedding, today, diary) : { state: diary && !diary.ok ? "unknown" : "idle", word: diary && !diary.ok ? "Ask me." : "", words: "Choose your wedding date." };
    root.dataset.day = a.state;
    set("[data-cv-k]", chosen ? "Your date" : wedding ? "The next open Saturday" : "Your date");
    set("[data-cv-date-text]", wedding ? ukDate(wedding) : "Choose your date");
    set("[data-cv-word]", a.word);
    set("[data-cv-words]", a.words);
    if (wedding) dateIn.value = wedding;
    if (ask) {
      const text = dateText(d.dateCheck.message, chosen ? wedding : "", serviceName());
      ask.href = ctx.bookHref(text);
      if (ask.dataset.waText !== undefined) ask.dataset.waText = text;
      ask.textContent = a.state === "taken" ? "Join the waiting list" : chosen ? "Ask about this date" : "Ask about your date";
    }
  };
  const paintPrice = () => {
    if (!svc || !d.packages) return;
    const b = d.packages.bride.find((/** @type {any} */ x) => x.id === state.service) ?? d.packages.bride[0];
    set("[data-cv-svc-text]", b.name.toLowerCase());
    set("[data-cv-price]", pounds(b.price));
  };
  const paintStart = () => {
    if (!cer || !d.morning || !d.packages) return;
    const m = morningFor(d, state);
    set("[data-cv-start]", m.tooEarly ? "Ask me about timing." : clockWords(m.plan.start));
    const lab = $("[data-cv-startlab]");
    if (lab) lab.hidden = m.tooEarly;
    set("[data-cv-cer-text]", clockWords(state.ceremony));
    const n = m.guests.length + 1;
    set("[data-cv-people]", n === 1 ? "just you" : `${numberWord(n)} of you${m.artists > 1 ? ", two artists" : ""}`);
    const early = $("[data-cv-early]");
    if (early) { early.hidden = !m.early || m.tooEarly; early.textContent = `Before ${clockWords(minutesOf(d.morning.early.before))}, the early-start fee of ${pounds(d.morning.early.fee)} applies.`; }
  };
  const paint = () => { paintDate(); paintPrice(); paintStart(); };

  // A hidden native picker under the words: open it from anywhere on the words, where the browser allows.
  for (const input of /** @type {NodeListOf<HTMLInputElement|HTMLSelectElement>} */ (root.querySelectorAll(".bb-pick > input"))) {
    input.addEventListener("click", () => { try { /** @type {any} */ (input).showPicker?.(); } catch { /* the browser opens it itself */ } });
  }
  dateIn?.addEventListener("change", () => { if (dateIn.value) ctx.share("wedding", dateIn.value); });
  svc?.addEventListener("change", () => ctx.share("service", svc.value));
  cer?.addEventListener("change", () => ctx.share("ceremony", minutesOf(cer.value)));
  ctx.watch("wedding", (/** @type {string} */ v) => { if (v) { wedding = v; chosen = true; paint(); } });
  ctx.watch("service", (/** @type {string} */ v) => { state.service = v; if (svc && svc.value !== v) svc.value = v; paint(); });
  ctx.watch("ceremony", (/** @type {number} */ v) => { state.ceremony = v; if (cer) cer.value = `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`; paint(); });
  ctx.watch("party", (/** @type {Record<string, number>} */ v) => { state.counts = { ...v }; paintStart(); });
  root.querySelector("[data-cv-form]")?.addEventListener("submit", (e) => e.preventDefault());
  root.dataset.ready = "";
  paint();
  const provider = ctx.providers.diary;
  if (d.dateCheck && provider) provider.load(ctx).then((/** @type {any} */ r) => { diary = r; paint(); }, () => { diary = { ok: false }; paint(); });
}
