// @ts-check
/** Live music now: who is playing, or who is next and when, from the café's own sets. Updates every minute. */
import { musicNow } from "../../lib/tearoom.js";
import { toMinutes, formatTime12 } from "../../../../core/lib/hours.js";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const sets = /** @type {any} */ (ctx.data).music;
  const line = root.querySelector("[data-mu-now]");
  if (!sets || !line) throw new Error("music markup or data missing");
  const draw = () => {
    const now = ctx.now();
    const { playing, next } = musicNow(sets, now);
    if (playing) { line.textContent = `Playing now: ${playing.who.toLowerCase()}, until ${formatTime12(toMinutes(playing.to))}`; root.dataset.state = "playing"; return; }
    root.dataset.state = "";
    if (!next) { line.textContent = ""; return; }
    const when = next.inDays === 0 ? "tonight" : next.inDays === 1 ? "tomorrow" : DAYS[(now.weekday + next.inDays) % 7];
    line.textContent = `Next: ${next.set.who.toLowerCase()}, ${when} from ${formatTime12(toMinutes(next.set.from))}`;
  };
  draw();
  ctx.everyMinute(draw);
}
