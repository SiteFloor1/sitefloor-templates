// @ts-check
/**
 * The Menu Book. Lays the menu out on pages the size of the screen (a spread on wide screens, one page on a
 * phone), then turns them like paper: drag a page across, swipe, tap the arrows or use the arrow keys. The
 * pages' type is sized to the page, so a phone and a desktop get the same pages. Today's specials (from the
 * restaurant's sheet) appear on a slip inside the cover. A dish with a photo (a camera beside its name) drops its photo
 * onto the page like a polaroid when tapped.
 */

/** @typedef {{ el: HTMLElement, angle: number }} Leaf */

const SPREAD_MIN = 900; // px: two pages side by side from here up
const RATIO = 1.414; // A-series page

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const dlg = /** @type {HTMLDialogElement|null} */ (root.querySelector("[data-mb-dlg]"));
  const book = /** @type {HTMLElement|null} */ (root.querySelector("[data-mb-book]"));
  const src = /** @type {HTMLTemplateElement|null} */ (root.querySelector("template[data-mb-src]"));
  const count = root.querySelector("[data-mb-count]"), hint = /** @type {HTMLElement|null} */ (root.querySelector("[data-mb-hint]"));
  const prev = /** @type {HTMLButtonElement|null} */ (root.querySelector("[data-mb-prev]")), next = /** @type {HTMLButtonElement|null} */ (root.querySelector("[data-mb-next]"));
  if (!dlg || !book || !src || !count || !hint || !prev || !next || typeof dlg.showModal !== "function") throw new Error("menu book markup missing");
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pol = /** @type {HTMLElement|null} */ (root.querySelector("[data-mb-pol]"));
  const polImg = /** @type {HTMLImageElement|null} */ (root.querySelector("[data-mb-pol-img]"));
  const polCap = root.querySelector("[data-mb-pol-cap]");
  /** @type {HTMLElement|null} */ let polFrom = null;

  /** @type {HTMLElement[]} */ let pages = [];
  /** @type {Leaf[]} */ let leaves = [];
  let turned = 0; // leaves turned over
  let spread = false;
  /** @type {{ ok: boolean, specials?: { name: string, price: number|null }[] }|null} */ let today = null;

  const pageSize = () => {
    spread = innerWidth >= SPREAD_MIN;
    const maxH = innerHeight - (spread ? 150 : 130);
    const w = Math.floor(Math.min(spread ? (innerWidth - 120) / 2 : innerWidth - 28, maxH / RATIO, 620));
    return { w, h: Math.floor(w * RATIO) };
  };

  /** A blank page of the book. @param {string} cls */
  const blank = (cls) => { const p = document.createElement("div"); p.className = `mbp ${cls}`; return p; };

  /** Lays the template's content on pages w wide (their height comes from the book's --ph). @param {number} w */
  const paginate = (w) => {
    const out = /** @type {HTMLElement[]} */ ([]);
    const stage = document.createElement("div");
    stage.className = "mb-measure";
    stage.style.width = `${w}px`;
    book.append(stage);
    const fits = (/** @type {HTMLElement} */ p) => p.scrollHeight <= p.clientHeight + 1;
    const content = /** @type {DocumentFragment} */ (src.content.cloneNode(true));
    for (const part of /** @type {HTMLElement[]} */ ([...content.children])) {
      const kind = part.dataset.mbKind;
      if (kind === "cover" || kind === "welcome" || kind === "back" || kind === "image") {
        const p = blank(`mbp-${kind}`);
        p.append(...part.childNodes);
        out.push(p);
        continue;
      }
      // A part (a sitting, the drinks): sections and dishes flow from page to page.
      let p = blank("mbp-flow");
      const head = (/** @type {boolean} */ more) => {
        const t = document.createElement("p");
        t.className = more ? "mbp-cont" : "mbp-title";
        t.textContent = more ? `${part.dataset.title}, continued` : part.dataset.title ?? "";
        p.append(t);
        if (!more && part.dataset.sub) { const s = document.createElement("p"); s.className = "mbp-sub"; s.textContent = part.dataset.sub; p.append(s); }
      };
      const fresh = () => { if (p.childElementCount) out.push(p); p = blank("mbp-flow"); stage.replaceChildren(p); head(true); };
      stage.replaceChildren(p);
      head(false);
      for (const sec of /** @type {HTMLElement[]} */ ([...part.querySelectorAll("[data-mb-sec]")])) {
        const dishes = [...sec.querySelectorAll("[data-mb-dish]")];
        const shell = /** @type {HTMLElement} */ (sec.cloneNode(false));
        const titles = [...sec.children].filter((c) => !c.hasAttribute("data-mb-dish"));
        shell.append(...titles.map((t) => t.cloneNode(true)));
        p.append(shell);
        let target = shell;
        for (const d of dishes) {
          target.append(d);
          if (fits(p)) continue;
          d.remove();
          // Never leave a section heading alone at the foot of a page.
          const alone = !target.querySelector("[data-mb-dish]");
          if (alone) target.remove();
          fresh();
          target = document.createElement("div");
          target.className = "mbp-sec";
          if (alone) target.append(...titles.map((t) => t.cloneNode(true)));
          target.append(d);
          p.append(target);
        }
      }
      out.push(p);
    }
    stage.remove();
    return out;
  };

  /** Builds the leaves: in a spread each leaf is two pages (front and back); on a phone, one. */
  const build = () => {
    const { w, h } = pageSize();
    book.style.setProperty("--pw", `${w}px`);
    book.style.setProperty("--ph", `${h}px`);
    book.classList.toggle("spread", spread);
    pages = paginate(w);
    if (spread && pages.length % 2) pages.splice(pages.length - 1, 0, blank("mbp-blank")); // the back cover lands on a left page
    slip();
    book.replaceChildren();
    leaves = [];
    const per = spread ? 2 : 1;
    const n = Math.ceil(pages.length / per);
    for (let i = 0; i < n; i++) {
      const leaf = document.createElement("div");
      leaf.className = "mb-leaf";
      const front = document.createElement("div"); front.className = "mb-face mb-front";
      front.append(pages[i * per]);
      leaf.append(front);
      if (spread && pages[i * per + 1]) {
        const back = document.createElement("div"); back.className = "mb-face mb-back";
        back.append(pages[i * per + 1]);
        leaf.append(back);
      }
      const shade = document.createElement("div"); shade.className = "mb-shade";
      leaf.append(shade);
      book.append(leaf);
      leaves.push({ el: leaf, angle: 0 });
    }
    turned = Math.min(turned, leaves.length - 1);
    leaves.forEach((l, i) => set(l, i < turned ? -180 : 0, false));
    stack();
    label();
  };

  /** Today's specials on the slip inside the cover. */
  const slip = () => {
    const box = /** @type {HTMLElement|null} */ (book.parentElement?.parentElement?.querySelector("[data-mb-slip]") ?? pages.map((p) => p.querySelector("[data-mb-slip]")).find(Boolean) ?? null);
    const list = box?.querySelector("[data-mb-slip-list]");
    if (!box || !list) return;
    const items = today?.ok ? today.specials ?? [] : [];
    box.hidden = !items.length;
    list.replaceChildren(...items.map((s) => {
      const li = document.createElement("li");
      li.textContent = s.price === null ? s.name : `${s.name}  ${Number.isInteger(s.price) ? s.price : s.price.toFixed(2)}`;
      return li;
    }));
  };

  /** @param {Leaf} l @param {number} a degrees, 0 (flat on the right) to -180 (turned over) @param {boolean} animate */
  const set = (l, a, animate) => {
    l.angle = a;
    l.el.classList.toggle("anim", animate && !still);
    l.el.style.transform = `rotateY(${a}deg)`;
    const k = Math.sin((-a * Math.PI) / 180); // 0 flat, 1 standing up
    l.el.style.setProperty("--lift", k.toFixed(3));
    l.el.classList.toggle("over", a < -90);
  };
  /** Leaves on top of the pile sit above the ones under them, on both sides. */
  const stack = () => {
    leaves.forEach((l, i) => { l.el.style.zIndex = String(i < turned ? i + 1 : leaves.length - i + 1); });
    book.classList.toggle("open", turned > 0);
    book.classList.toggle("end", turned >= leaves.length - (spread ? 0 : 1));
  };
  const label = () => {
    const per = spread ? 2 : 1;
    const first = turned === 0 ? 1 : spread ? turned * 2 : turned + 1;
    count.textContent = spread && turned > 0 && first < pages.length ? `Pages ${first}–${Math.min(first + 1, pages.length)} of ${pages.length}` : `Page ${Math.min(first, pages.length)} of ${pages.length}`;
    prev.disabled = turned === 0;
    next.disabled = turned >= leaves.length - (per === 2 ? 0 : 1);
  };
  /** @param {number} dir 1 forward, -1 back */
  const turn = (dir) => {
    if (dir > 0 && turned < leaves.length - (spread ? 0 : 1)) { const l = leaves[turned]; turned++; stack(); set(l, -180, true); }
    else if (dir < 0 && turned > 0) { turned--; const l = leaves[turned]; set(l, 0, true); setTimeout(stack, still ? 0 : 450); }
    label();
    hint.hidden = true;
  };

  // Drag a page: forward from the right-hand page, back from the left (or from the left edge on a phone).
  /** @type {{ x: number, leaf: Leaf, dir: number, w: number }|null} */ let drag = null;
  let downX = 0;
  /** @type {HTMLElement|null} */ let downPh = null;
  book.addEventListener("pointerdown", (e) => {
    downX = e.clientX;
    downPh = /** @type {HTMLElement} */ (e.target).closest("[data-mb-ph]");
    if (pol && !pol.hidden) { drop(); return; }
    const r = book.getBoundingClientRect();
    const right = spread ? e.clientX > r.left + r.width / 2 : e.clientX > r.left + r.width * 0.3;
    const dir = right ? 1 : -1;
    const leaf = dir > 0 ? leaves[turned] : leaves[turned - 1];
    if (!leaf || (dir > 0 && turned >= leaves.length - (spread ? 0 : 1))) return;
    drag = { x: e.clientX, leaf, dir, w: spread ? r.width / 2 : r.width };
    if (dir > 0) { turned++; stack(); turned--; }
    book.setPointerCapture(e.pointerId);
  });
  book.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    const t = Math.max(0, Math.min(1, (drag.dir > 0 ? -dx : dx) / (drag.w * 1.1)));
    set(drag.leaf, drag.dir > 0 ? -180 * t : -180 * (1 - t), false);
  });
  /** @param {PointerEvent} e */
  const release = (e) => {
    if (!drag) return;
    const d = drag; drag = null;
    // The pointer is captured by the book, so the dish is the one under the press, remembered at pointerdown.
    const ph = downPh; downPh = null;
    if (ph && Math.abs(e.clientX - downX) < 8) { set(d.leaf, d.dir > 0 ? 0 : -180, false); stack(); show(ph); return; }
    const done = d.dir > 0 ? d.leaf.angle < -60 : d.leaf.angle > -120;
    if (d.dir > 0) {
      if (done) { turned++; set(d.leaf, -180, true); } else set(d.leaf, 0, true);
    } else if (done) { turned--; set(d.leaf, 0, true); } else set(d.leaf, -180, true);
    setTimeout(stack, still ? 0 : 450);
    label();
    if (done) hint.hidden = true;
  };
  book.addEventListener("pointerup", release);
  book.addEventListener("pointercancel", release);
  // The polaroid: the dish's photo, dropped onto the page at a slight angle; tap anywhere to lift it away.
  /** @param {HTMLElement} btn */
  const show = (btn) => {
    if (!pol || !polImg || !polCap) return;
    polFrom = btn;
    polImg.src = btn.dataset.mbPh ?? "";
    polImg.alt = btn.dataset.mbAlt ?? "";
    polCap.textContent = btn.dataset.mbName ?? "";
    pol.style.setProperty("--tilt", `${(Math.random() * 10 - 5).toFixed(1)}deg`);
    pol.hidden = false;
    pol.classList.remove("in"); void pol.offsetWidth; pol.classList.add("in");
    pol.tabIndex = -1; pol.focus({ preventScroll: true });
    hint.hidden = true;
  };
  const drop = () => { if (!pol || pol.hidden) return; pol.hidden = true; polFrom?.focus({ preventScroll: true }); polFrom = null; };
  pol?.addEventListener("click", drop);
  // Keyboard: Enter or Space on a dish's camera button (a pointer tap is handled with the page drag above).
  book.addEventListener("click", (e) => {
    const ph = /** @type {HTMLElement} */ (e.target).closest("[data-mb-ph]");
    if (ph && e.detail === 0) show(/** @type {HTMLElement} */ (ph));
  });
  dlg.addEventListener("cancel", (e) => { if (pol && !pol.hidden) { e.preventDefault(); drop(); } });
  prev.addEventListener("click", () => turn(-1));
  next.addEventListener("click", () => turn(1));
  dlg.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); turn(1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); turn(-1); }
  });
  root.querySelector("[data-mb-close]")?.addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", () => { drop(); document.body.classList.remove("mb-lock"); if (location.hash === "#menu-book") history.replaceState(null, "", location.pathname + location.search); });

  const open = () => {
    if (dlg.open) return;
    document.body.classList.add("mb-lock");
    dlg.showModal();
    turned = 0;
    build();
    hint.hidden = false;
    // The cover opens by itself, the way a waiter would hand it to you.
    if (!still) setTimeout(() => { if (dlg.open && turned === 0) turn(1); }, 650);
  };
  // Every "Open the menu" on the page opens the book (they're links to the menu without JavaScript).
  document.addEventListener("click", (e) => {
    const a = /** @type {HTMLElement} */ (e.target).closest("[data-mb-open], a[href='#menu-book']");
    if (!a || root.closest(".tier-off")) return; // in the demo's plan switcher, a plan without the book follows the link
    e.preventDefault();
    open();
  });
  if (location.hash === "#menu-book") open();
  let resizeTimer = 0;
  addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = window.setTimeout(() => { if (dlg.open) build(); }, 200); });
  ctx.watch("tonight", (/** @type {any} */ r) => { today = r; if (dlg.open) slip(); });
}
