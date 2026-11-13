// @ts-check
/**
 * The film in chapters. Tapping a chapter goes to it and plays (a tap is the visitor asking, so it plays even with
 * reduced motion); the current chapter is marked and its line fills as the film plays. "Watch full screen" makes the
 * film and its programme fill the screen where the browser allows it, or hands the video to the phone's own player.
 */
/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const chs = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-at]")]);
  const full = /** @type {HTMLButtonElement|null} */ (root.querySelector("[data-full]"));
  const stage = /** @type {HTMLElement|null} */ (root.closest("[data-stage]"));
  if (!chs.length || !full || !stage) throw new Error("showreel markup missing");
  const length = Number(root.dataset.length) || 0;
  const starts = chs.map((c) => Number(c.dataset.at));

  ctx.watch("film", (/** @type {{ video: HTMLVideoElement, play: (asked?: boolean) => void, load: () => void }|null} */ film) => {
    if (!film) return;
    const v = film.video;
    const mark = () => {
      const t = v.currentTime || 0;
      chs.forEach((c, i) => {
        const end = starts[i + 1] ?? length, on = t >= starts[i] && t < end;
        c.setAttribute("aria-current", on ? "true" : "false");
        const line = /** @type {HTMLElement|null} */ (c.querySelector("i"));
        if (line) line.style.transform = `scaleX(${on ? Math.min(1, (t - starts[i]) / Math.max(0.1, end - starts[i])) : t >= end ? 1 : 0})`;
      });
    };
    v.addEventListener("timeupdate", mark);
    chs.forEach((c, i) => c.addEventListener("click", () => {
      film.load();
      // Mark the chapter straight away; the line catches up as the film plays.
      chs.forEach((x, j) => x.setAttribute("aria-current", j === i ? "true" : "false"));
      // Ask for the time straight away, and again once the film's details have loaded (a browser drops a time set
      // before then), so a slow first load never loses the chapter.
      const t = starts[i] + 0.3;
      v.dataset.chapterAt = String(t);
      v.currentTime = t;
      if (v.readyState < 1) v.addEventListener("loadedmetadata", () => { if (v.dataset.chapterAt === String(t)) v.currentTime = t; }, { once: true });
      film.play(true);
    }));
    const ios = /** @type {HTMLVideoElement & { webkitEnterFullscreen?: () => void }} */ (v);
    const canFull = typeof document.documentElement.requestFullscreen === "function";
    if (canFull || ios.webkitEnterFullscreen) full.hidden = false;
    full.addEventListener("click", () => {
      film.load(); film.play(true);
      if (canFull) stage.requestFullscreen().catch(() => ios.webkitEnterFullscreen?.());
      else ios.webkitEnterFullscreen?.();
    });
  });
}
