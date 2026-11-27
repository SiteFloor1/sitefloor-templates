// @ts-check
/**
 * The share card: the studio's poster frame with the frame guides, and under it the road, the date and the golden
 * hour, drawn on a canvas in the look's colours and fonts. Shared as a picture where the browser can (Web Share), saved
 * as a PNG otherwise. Only the visitor's own choice and calculated times; nothing is sent anywhere.
 */
/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const btn = /** @type {HTMLButtonElement} */ (root);
  /** @type {any} */ let plan = null;
  ctx.watch("plan", (/** @type {any} */ p) => { plan = p; });
  const css = getComputedStyle(btn), tok = (/** @type {string} */ n) => css.getPropertyValue(n).trim();
  btn.addEventListener("click", async () => {
    if (!plan) return;
    const img = new Image(); img.src = btn.dataset.shareSrc ?? "";
    try { await img.decode(); } catch { return; }
    const W = 1080, H = 1350, c = document.createElement("canvas"); c.width = W; c.height = H;
    const g = c.getContext("2d"); if (!g) return;
    g.fillStyle = tok("--bg"); g.fillRect(0, 0, W, H);
    const ph = 760, s = Math.max(W / img.naturalWidth, ph / img.naturalHeight);
    g.drawImage(img, (W - img.naturalWidth * s) / 2, (ph - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s);
    g.strokeStyle = tok("--on-photo"); g.lineWidth = 2; const m = 60, fw = W - 2 * m, fh = fw / 2.39, fy = (ph - fh) / 2;
    g.strokeRect(m, fy, fw, fh);
    g.globalAlpha = 0.4; g.lineWidth = 1;
    for (const k of [1, 2]) { g.beginPath(); g.moveTo(m + (fw * k) / 3, fy); g.lineTo(m + (fw * k) / 3, fy + fh); g.moveTo(m, fy + (fh * k) / 3); g.lineTo(m + fw, fy + (fh * k) / 3); g.stroke(); }
    g.globalAlpha = 1;
    g.fillStyle = tok("--text"); g.font = `500 44px ${tok("--font-display")}`; g.fillText(plan.road.name, 72, 870);
    g.fillStyle = tok("--muted"); g.font = `400 30px ${tok("--font-body")}`; g.fillText(new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(Date.parse(`${plan.ymd}T12:00:00Z`)), 72, 925);
    g.fillStyle = tok("--accent-ink"); g.font = `500 120px ${tok("--font-display")}`; g.fillText(plan.line.gold, 72, 1080);
    g.fillStyle = tok("--muted"); g.font = `400 30px ${tok("--font-body")}`; g.fillText(`${plan.line.low ? "Low sun all day" : "Golden hour"} · sunset ${plan.line.sunset} · blue hour ${plan.line.blue}`, 72, 1140);
    g.fillStyle = tok("--text"); g.font = `500 30px ${tok("--font-body")}`; g.fillText(btn.dataset.shareName ?? "", 72, 1270);
    const blob = await new Promise((ok) => c.toBlob(ok, "image/png"));
    if (!blob) return;
    const file = new File([/** @type {Blob} */ (blob)], `golden-hour-${plan.ymd}.png`, { type: "image/png" });
    const nav = /** @type {Navigator & { canShare?: (d: any) => boolean }} */ (navigator);
    if (nav.canShare?.({ files: [file] })) { try { await nav.share({ files: [file], title: `Golden hour, ${plan.road.name}` }); return; } catch (e) { if (/** @type {Error} */ (e).name === "AbortError") return; /* sharing failed: save instead */ } }
    const a = document.createElement("a"); a.href = URL.createObjectURL(file); a.download = file.name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  });
}
