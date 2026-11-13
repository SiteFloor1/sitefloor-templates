// @ts-check
/**
 * The printed menu, made from the same menu data as the site every time it's built, so the PDF never
 * disagrees with the website. A4, two columns, the look's own typefaces and colours (look.json → "print"):
 * one sitting after another, then the drinks, then the full allergen chart. Every page carries the
 * restaurant's allergen statement. Node only (build time); uses pdfkit.
 */
import PDFDocument from "pdfkit";
import { readFileSync } from "node:fs";
import path from "node:path";
import { ALLERGENS, DIETS } from "../../../core/lib/allergens.js";

/** @typedef {{ display: string, displayItalic: string, body: string, bodyBold: string, paper: string, ink: string, accent: string, muted: string, rule?: string }} PrintStyle */

const A4 = { w: 595.28, h: 841.89 };
const M = 48; // page margin
const GAP = 30; // column gap
const COL = (A4.w - 2 * M - GAP) / 2;
const FOOT = 64; // footer height

/** @param {number} n */
const price = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(2));
/** @param {string} hm */
const t12 = (hm) => {
  const [h, m] = hm.split(":").map(Number);
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, "0")}` : ""}${h < 12 ? "am" : "pm"}`;
};

/**
 * @param {any} site @param {PrintStyle} style @param {string} root repo root (fonts are paths under node_modules)
 * @returns {Promise<Buffer>}
 */
export function menuPdf(site, style, root) {
  const doc = new PDFDocument({ size: "A4", margin: 0, autoFirstPage: false, info: { Title: `${site.business.name}: menu`, Author: site.business.name, Creator: "Sitefloor" } });
  /** @type {Buffer[]} */ const parts = [];
  doc.on("data", (b) => parts.push(b));
  const done = new Promise((res) => doc.on("end", () => res(Buffer.concat(parts))));
  const font = (/** @type {string} */ p) => readFileSync(path.join(root, "node_modules", p));
  doc.registerFont("display", font(style.display));
  doc.registerFont("displayItalic", font(style.displayItalic));
  doc.registerFont("body", font(style.body));
  doc.registerFont("bodyBold", font(style.bodyBold));
  const menu = site.menu;
  let pageNo = 0;

  const footer = () => {
    const y = A4.h - FOOT + 10;
    doc.save().moveTo(M, y - 6).lineTo(A4.w - M, y - 6).lineWidth(0.5).strokeColor(style.rule ?? style.muted).stroke().restore();
    doc.font("body").fontSize(6.8).fillColor(style.muted)
      .text(menu.statement, M, y, { width: A4.w - 2 * M - 40, lineGap: 1 });
    doc.text(`Allergens from our allergen chart, checked ${new Date(`${menu.chartChecked}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}. ${DIETS.map((d) => `${d.mark} ${d.name.toLowerCase()}`).join(" · ")}. Please tell us about any allergy when you order.`, { width: A4.w - 2 * M - 40, lineGap: 1 });
    doc.font("bodyBold").fontSize(7).fillColor(style.accent).text(String(pageNo), A4.w - M - 20, y, { width: 20, align: "right" });
  };
  const newPage = () => {
    if (pageNo) footer();
    doc.addPage({ size: "A4", margin: 0 });
    pageNo++;
    doc.rect(0, 0, A4.w, A4.h).fill(style.paper);
    // A hairline frame, like a printed card.
    doc.save().rect(22, 22, A4.w - 44, A4.h - 44).lineWidth(0.6).strokeColor(style.rule ?? style.muted).stroke().restore();
  };

  /** The restaurant's name and a sitting's heading across the top of a page. @param {string} title @param {string} sub */
  const masthead = (title, sub) => {
    doc.font("body").fontSize(7.5).fillColor(style.muted).text(site.hero?.kicker?.toUpperCase() ?? "", M, 50, { width: A4.w - 2 * M, align: "center", characterSpacing: 2.4 });
    doc.font("displayItalic").fontSize(34).fillColor(style.ink).text(site.business.name, M, 64, { width: A4.w - 2 * M, align: "center" });
    const y = doc.y + 6;
    for (const d of [0, 3]) doc.save().moveTo(A4.w / 2 - 60, y + d).lineTo(A4.w / 2 + 60, y + d).lineWidth(0.6).strokeColor(style.accent).stroke().restore();
    doc.font("display").fontSize(18).fillColor(style.ink).text(title, M, y + 14, { width: A4.w - 2 * M, align: "center" });
    if (sub) doc.font("body").fontSize(8).fillColor(style.muted).text(sub, M, doc.y + 2, { width: A4.w - 2 * M, align: "center", characterSpacing: 0.6 });
    return doc.y + 18;
  };

  /**
   * Lays a part (a sitting or the drinks) into two columns. A part that nearly fits on one page is set a little
   * smaller so it does (down to 84%); a part that fits is balanced across both columns; a longer one runs on.
   * @param {{ title: string, sub: string, sections: any[] }} part
   */
  const flow = (part) => {
    newPage();
    let top = masthead(part.title, part.sub);
    const bottom = A4.h - FOOT - 14;
    // Blocks: a section heading travels with its first dish.
    /** @param {number} k */
    const blocks = (k) => part.sections.flatMap((sec) => sec.dishes.map((/** @type {any} */ d, /** @type {number} */ i) => ({ sec: i === 0 ? sec : null, d, h: (i === 0 ? headHeight(sec, k) : 0) + dishHeight(d, k) + (i === sec.dishes.length - 1 ? 10 * k : 0) })));
    let k = 1;
    let list = blocks(k);
    const total = () => list.reduce((t, b) => t + b.h, 0);
    while (k > 0.84 && total() > 2 * (bottom - top) * 0.97) { k -= 0.04; list = blocks(k); }
    const fits = total() <= 2 * (bottom - top) * 0.97;
    let col = 0, y = top;
    const half = total() / 2;
    let used = 0;
    for (const b of list) {
      // Balanced: move to the right column once the left holds about half (never splitting a block).
      if (fits && col === 0 && used > 0 && used + b.h / 2 > half) { col = 1; y = top; }
      if (y + b.h > bottom) {
        if (col === 0) { col = 1; y = top; }
        else {
          newPage();
          doc.font("displayItalic").fontSize(14).fillColor(style.ink).text(`${part.title}, continued`, M, 52, { width: A4.w - 2 * M, align: "center" });
          top = doc.y + 16; col = 0; y = top;
        }
      }
      const x = M + col * (COL + GAP);
      if (b.sec) y = drawHead(b.sec, x, y, k);
      drawDish(b.d, x, y, k);
      y += dishHeight(b.d, k) + (b.h - (b.sec ? headHeight(b.sec, k) : 0) - dishHeight(b.d, k));
      used += b.h;
    }
  };
  /** @param {any} sec @param {number} k */
  const headHeight = (sec, k) => {
    doc.font("bodyBold").fontSize(7.6 * k);
    let h = doc.heightOfString(sec.name.toUpperCase(), { width: COL, characterSpacing: 2.6 }) + 2;
    if (sec.note) { doc.font("displayItalic").fontSize(9 * k); h += doc.heightOfString(sec.note, { width: COL }); }
    return h + 8 * k;
  };
  /** @param {any} sec @param {number} x @param {number} y @param {number} k */
  const drawHead = (sec, x, y, k) => {
    doc.font("bodyBold").fontSize(7.6 * k).fillColor(style.accent).text(sec.name.toUpperCase(), x, y, { width: COL, align: "center", characterSpacing: 2.6 });
    let yy = doc.y + 2;
    if (sec.note) { doc.font("displayItalic").fontSize(9 * k).fillColor(style.muted).text(sec.note, x, yy, { width: COL, align: "center" }); yy = doc.y; }
    return yy + 8 * k;
  };

  /** @param {any} d */
  const meta = (d) => {
    const marks = DIETS.filter((x) => (d.diets ?? []).includes(x.id)).map((x) => x.mark).join(" · ");
    const names = ALLERGENS.filter((a) => d.allergens.includes(a.id)).map((a) => a.name.toLowerCase());
    return [marks, names.length ? `Contains: ${names.join(", ")}` : "None of the 14 allergens", d.spice ? ["", "Mild", "Medium", "Hot"][d.spice] : ""].filter(Boolean).join("   ");
  };
  /** @param {any} d @param {number} k */
  const dishHeight = (d, k) => {
    doc.font("display").fontSize(11.5 * k);
    let h = doc.heightOfString(d.name, { width: COL - 44 }) + 3;
    if (d.desc) { doc.font("body").fontSize(8 * k); h += doc.heightOfString(d.desc, { width: COL }) + 2; }
    doc.font("body").fontSize(6.8 * k); h += doc.heightOfString(meta(d), { width: COL }) + 11 * k;
    return h;
  };
  /** @param {any} d @param {number} x @param {number} y @param {number} k */
  const drawDish = (d, x, y, k) => {
    doc.font("display").fontSize(11.5 * k).fillColor(style.ink);
    const nameH = doc.heightOfString(d.name, { width: COL - 44 });
    doc.text(d.name, x, y, { width: COL - 44 });
    const pw = doc.widthOfString(price(d.price));
    doc.text(price(d.price), x + COL - pw, y, { width: pw + 1, lineBreak: false });
    if (nameH < 16 * k) {
      const nameEnd = Math.min(x + doc.widthOfString(d.name) + 6, x + COL - 44);
      for (let dx = nameEnd; dx < x + COL - pw - 6; dx += 3.2) doc.circle(dx, y + 9 * k, 0.45).fill(style.muted);
    }
    let yy = y + nameH + 3;
    if (d.desc) { doc.font("body").fontSize(8 * k).fillColor(style.muted).text(d.desc, x, yy, { width: COL }); yy = doc.y + 2; }
    doc.font("body").fontSize(6.8 * k).fillColor(style.muted).text(meta(d), x, yy, { width: COL, oblique: 8 });
  };

  // One part per sitting (dishes only), then the drinks.
  const days = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" };
  for (const s of menu.sittings) {
    const sections = menu.sections.filter((/** @type {any} */ x) => !x.drinks && x.sittings.includes(s.id));
    if (!sections.length) continue;
    const dayText = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"].filter((d) => s.days.includes(d)).map((d) => days[/** @type {keyof typeof days} */ (d)]).join(" ");
    flow({ title: s.name, sub: `${dayText} · ${t12(s.from)} to ${t12(s.to)}${s.lastOrders ? ` · last orders ${t12(s.lastOrders)}` : ""}`.toUpperCase(), sections });
  }
  const drinks = menu.sections.filter((/** @type {any} */ x) => x.drinks);
  if (drinks.length) flow({ title: "To drink", sub: "", sections: drinks });

  // The allergen chart: every dish and drink against the 14.
  newPage();
  doc.font("displayItalic").fontSize(20).fillColor(style.ink).text("Allergen chart", M, 52, { width: A4.w - 2 * M, align: "center" });
  doc.font("body").fontSize(7.5).fillColor(style.muted).text("A dot means the dish contains it. Ask us about anything not listed.", M, doc.y + 2, { width: A4.w - 2 * M, align: "center" });
  const nameW = 170, cw = (A4.w - 2 * M - nameW) / 14;
  let y = doc.y + 70;
  doc.save();
  ALLERGENS.forEach((a, i) => {
    doc.save().rotate(-60, { origin: [M + nameW + i * cw + cw / 2, y - 6] });
    doc.font("body").fontSize(7).fillColor(style.ink).text(a.name, M + nameW + i * cw + cw / 2, y - 10, { lineBreak: false });
    doc.restore();
  });
  doc.restore();
  for (const sec of menu.sections) {
    if (y > A4.h - FOOT - 40) { newPage(); y = 70; }
    doc.font("bodyBold").fontSize(6.8).fillColor(style.accent).text(sec.name.toUpperCase(), M, y + 4, { characterSpacing: 1.6 });
    y += 16;
    for (const d of sec.dishes) {
      if (y > A4.h - FOOT - 24) { newPage(); y = 70; }
      doc.save().moveTo(M, y + 11).lineTo(A4.w - M, y + 11).lineWidth(0.3).strokeColor(style.rule ?? style.muted).stroke().restore();
      doc.font("body").fontSize(7.6).fillColor(style.ink).text(d.name, M, y + 2, { width: nameW - 8, lineBreak: false, ellipsis: true });
      ALLERGENS.forEach((a, i) => { if (d.allergens.includes(a.id)) doc.circle(M + nameW + i * cw + cw / 2, y + 5.5, 2.2).fill(style.ink); });
      y += 13;
    }
  }
  footer();
  doc.end();
  return done;
}
