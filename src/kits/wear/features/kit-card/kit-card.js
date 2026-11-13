// @ts-check
/**
 * Kit card: a 1080×1920 picture for stories, drawn when the visitor asks: the first piece's photograph, the brand's
 * name, today's date, the weather sentence and the kit. Colours and fonts come from the look's tokens.
 */

/** @param {HTMLElement} root @param {import("../../../../core/js/core.js").Ctx} ctx */
export function init(root, ctx) {
  const canvas = /** @type {HTMLCanvasElement|null} */ (root.querySelector("[data-kc-canvas]"));
  const btn = root.querySelector("[data-kc-save]");
  const note = root.querySelector("[data-kc-note]");
  if (!canvas || !btn || !canvas.getContext) return;
  const pieces = [...root.querySelectorAll("[data-kc-piece]")].map((li) => ({ id: /** @type {HTMLElement} */ (li).dataset.kcPiece ?? "", src: /** @type {HTMLElement} */ (li).dataset.src ?? "", label: /** @type {HTMLElement} */ (li).dataset.label ?? "" }));
  if (!pieces.length) return;
  /** @type {any} */ let today = null;
  ctx.watch("wear-today", (v) => { today = v; root.hidden = false; });
  btn.addEventListener("click", async () => {
    if (!today) return;
    const g = /** @type {CanvasRenderingContext2D} */ (canvas.getContext("2d"));
    const css = getComputedStyle(document.documentElement);
    const tok = (/** @type {string} */ n) => css.getPropertyValue(n).trim();
    const W = canvas.width, H = canvas.height;
    const kit = pieces.filter((p) => today.pieces.includes(p.id));
    const img = new Image();
    img.src = (kit[0] ?? pieces[0]).src;
    await img.decode().catch(() => null);
    g.fillStyle = tok("--bg");
    g.fillRect(0, 0, W, H);
    if (img.naturalWidth) {
      const s = Math.max(W / img.naturalWidth, (H * 0.68) / img.naturalHeight);
      g.drawImage(img, (W - img.naturalWidth * s) / 2, 0, img.naturalWidth * s, img.naturalHeight * s);
    }
    const fade = g.createLinearGradient(0, H * 0.45, 0, H * 0.7);
    fade.addColorStop(0, "transparent");
    fade.addColorStop(1, tok("--bg"));
    g.fillStyle = fade;
    g.fillRect(0, H * 0.45, W, H * 0.25);
    await document.fonts?.ready;
    const display = tok("--font-display");
    const body = tok("--font-body");
    g.fillStyle = tok("--text");
    g.font = `500 34px ${body}`;
    g.letterSpacing = "10px";
    g.fillText(String(root.dataset.name ?? "").toUpperCase(), 80, 110);
    g.letterSpacing = "0px";
    g.fillStyle = tok("--muted");
    g.font = `400 34px ${body}`;
    g.fillText(new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }), 80, H * 0.72);
    g.fillStyle = tok("--text");
    g.font = `300 72px ${display}`;
    wrap(g, today.sentence, 80, H * 0.72 + 110, W - 160, 84);
    g.fillStyle = tok("--accent");
    g.font = `300 72px ${display}`;
    const y = wrap(g, today.say, 80, H * 0.72 + 290, W - 160, 84);
    g.fillStyle = tok("--text");
    g.font = `400 40px ${body}`;
    kit.forEach((p, i) => g.fillText(p.label, 80, y + 90 + i * 56));
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "kit-card.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file] }); return; } catch { /* fall through to a download */ } }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "kit-card.png";
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      if (note) note.textContent = "Saved.";
    }, "image/png");
  });
}

/** Draws wrapped text and returns the y after the last line. @param {CanvasRenderingContext2D} g @param {string} text @param {number} x @param {number} y @param {number} max @param {number} lh */
function wrap(g, text, x, y, max, lh) {
  let line = "";
  for (const word of text.split(" ")) {
    const test = line ? `${line} ${word}` : word;
    if (g.measureText(test).width > max && line) { g.fillText(line, x, y); line = word; y += lh; } else line = test;
  }
  if (line) g.fillText(line, x, y);
  return y;
}
