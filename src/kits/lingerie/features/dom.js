// @ts-check
/**
 * Small browser helpers the lingerie features share (the only file in this folder that touches the page): the data a
 * feature writes into its own markup, a calendar file to save, the shop's sheet as rows, and a WhatsApp link with no
 * number (WhatsApp asks whom to send it to).
 */
import { parseCsv } from "../../../core/lib/sheet.js";

/** The JSON a feature's template wrote into its <script type="application/json" data-lx>. @param {HTMLElement} root */
export function readData(root) {
  const el = root.querySelector("script[data-lx]");
  if (!el?.textContent) throw new Error("feature data missing");
  return JSON.parse(el.textContent);
}

/** Save a calendar file. @param {string} name file name @param {string} text .ics content */
export function saveIcs(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/calendar;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** UTC "YYYYMMDDTHHMMSSZ" for a calendar file's DTSTAMP. */
export function icsStamp() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

/**
 * The shop's published sheet as rows; null on any failure (fail closed).
 * @param {string} url @returns {Promise<string[][]|null>}
 */
export async function sheetRows(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: "no-store", credentials: "omit" });
    return res.ok ? parseCsv(await res.text()) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** A WhatsApp link with no number: WhatsApp asks whom to send it to. @param {string} text */
export function waAnyone(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/** @template {Element} T @param {ParentNode} root @param {string} sel @returns {T} */
export function must(root, sel) {
  const el = root.querySelector(sel);
  if (!el) throw new Error(`missing ${sel}`);
  return /** @type {T} */ (el);
}
