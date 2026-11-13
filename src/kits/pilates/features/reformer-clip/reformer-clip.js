// @ts-check
/**
 * The reformer clip: the film's file is fetched only when someone taps Watch (the picture shows until then). Each
 * caption shows over the film while its moment plays and is marked in the list beside it; the film is silent and
 * stops at the end on its last frame, with Watch again to replay.
 */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const q = (/** @type {string} */ s) => /** @type {HTMLElement|null} */ (root.querySelector(s));
  const video = /** @type {HTMLVideoElement|null} */ (q("[data-rc-video]")), poster = q("[data-rc-poster]");
  const play = /** @type {HTMLButtonElement|null} */ (q("[data-rc-play]")), label = q("[data-rc-label]"), cap = q("[data-rc-cap]"), list = q("[data-rc-list]");
  if (!video || !poster || !play || !label || !cap || !list) throw new Error("reformer clip markup missing");
  const items = /** @type {HTMLElement[]} */ ([...list.querySelectorAll("li")]);
  const sync = () => {
    const t = video.currentTime;
    let shown = "";
    for (const li of items) {
      const on = t >= Number(li.dataset.from) && t < Number(li.dataset.to);
      li.toggleAttribute("data-on", on);
      if (on) shown = li.textContent ?? "";
    }
    cap.textContent = shown;
    cap.hidden = !shown;
  };
  play.addEventListener("click", () => {
    if (!video.src) video.src = video.dataset.src ?? "";
    video.hidden = false;
    poster.hidden = true;
    play.hidden = true;
    video.currentTime = 0;
    video.play().catch(() => { play.hidden = false; label.textContent = "Watch"; });
  });
  video.addEventListener("timeupdate", sync);
  video.addEventListener("ended", () => { play.hidden = false; label.textContent = "Watch again"; cap.hidden = true; for (const li of items) li.removeAttribute("data-on"); });
  video.addEventListener("click", () => { if (video.paused) video.play().catch(() => {}); else video.pause(); });
  cap.hidden = true;
}
