// @ts-check
/**
 * Route cards: the drawn route saved as a 1080×1350 picture for stories, with the run's name, when it is, the distance
 * and climb (worked out from the route's own points) and the brand's name. Colours and fonts come from the look.
 */

/** @param {HTMLElement} root */
export function init(root) {
  const btn = /** @type {HTMLButtonElement|null} */ (root.querySelector("[data-route-save]"));
  const svg = /** @type {SVGSVGElement|null} */ (root.querySelector("[data-route-svg]"));
  if (!btn || !svg) return;
  btn.hidden = false;
  btn.addEventListener("click", async () => {
    const css = getComputedStyle(document.documentElement);
    const tok = (/** @type {string} */ n) => css.getPropertyValue(n).trim();
    const W = 1080, H = 1350;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const g = /** @type {CanvasRenderingContext2D} */ (c.getContext("2d"));
    g.fillStyle = tok("--bg");
    g.fillRect(0, 0, W, H);
    // Draw the route itself from the SVG's path, scaled into the card.
    const path = new Path2D(svg.querySelector("path")?.getAttribute("d") ?? "");
    g.save();
    g.translate(90, 200);
    g.scale(900 / 600, 900 / 600);
    g.strokeStyle = tok("--accent");
    g.lineWidth = 5;
    g.lineJoin = "round";
    g.lineCap = "round";
    g.stroke(path);
    const start = svg.querySelector("circle");
    g.fillStyle = tok("--text");
    g.beginPath();
    g.arc(Number(start?.getAttribute("cx") ?? 0), Number(start?.getAttribute("cy") ?? 0), 9, 0, Math.PI * 2);
    g.fill();
    g.restore();
    await document.fonts?.ready;
    g.fillStyle = tok("--text");
    g.font = `500 32px ${tok("--font-body")}`;
    g.letterSpacing = "10px";
    g.fillText(String(root.dataset.brand ?? "").toUpperCase(), 90, 110);
    g.letterSpacing = "0px";
    g.font = `300 76px ${tok("--font-display")}`;
    g.fillText(root.dataset.routeName ?? "", 90, 1180);
    g.fillStyle = tok("--muted");
    g.font = `400 38px ${tok("--font-body")}`;
    const climb = root.dataset.climb ? ` · ${root.dataset.climb} m climb` : "";
    g.fillText(`${root.dataset.when ?? ""} · ${root.dataset.km} km${climb}`, 90, 1250);
    c.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `${(root.dataset.routeName ?? "route").toLowerCase().replace(/\W+/g, "-")}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file] }); return; } catch { /* download instead */ } }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = file.name;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }, "image/png");
  });
}
