// @ts-check
/**
 * Gallery behaviour for the home strip and the "Our work" page.
 *
 *  - Photos stored with the site are already in the page; they stay if nothing better arrives.
 *  - With an Instagram feed (Behold), the newest posts replace them as soon as the feed loads.
 *    The feed is fetched once per page view, with a timeout. On failure the stored photos
 *    stay; with none stored, a link to Instagram is shown instead of an empty grid.
 *  - On the work page: filter chips (a #tag in the address picks one), endless scrolling (with a "Show more" button for keyboard
 *    users) and an enlarged view with a booking button.
 *
 * Captions come from Instagram, so everything is built with textContent, never innerHTML.
 */
import { postsFromBehold, chipsFor, withTag } from "../../core/lib/feed.js";

const STEP = 12;
const TIMEOUT_MS = 6000;

/** @typedef {import("../../core/lib/feed.js").Post} Post */
/** @typedef {{ source: "behold"|"photos", feedUrl?: string, profile?: string, filters: { tag: string, label: string }[], photos: Post[], workHref?: string }} GalleryData */

/** @param {string} url @param {string} name @returns {Promise<Post[]|null>} */
async function loadFeed(url, name) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, credentials: "omit" });
    if (!res.ok) return null;
    const posts = postsFromBehold(await res.json(), name);
    return posts.length ? posts : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** @type {import("../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  /** @type {GalleryData} */
  const g = /** @type {any} */ (ctx.data).gallery;
  const list = /** @type {HTMLUListElement} */ (root.querySelector("[data-gallery-list]"));
  const empty = /** @type {HTMLElement} */ (root.querySelector("[data-gallery-empty]"));
  if (!g || !list || !empty) throw new Error("gallery markup or data missing");
  const view = root.hasAttribute("data-gallery-page") ? pageView(root, list, g, ctx) : stripView(root, list, g);

  view.show(g.photos);
  ctx.share("posts", g.photos); // other features (e.g. a car studio's model finder) use the same posts
  if (g.source === "behold" && g.feedUrl) {
    loadFeed(g.feedUrl, ctx.data.name).then((posts) => {
      if (posts) { view.show(posts); ctx.share("posts", posts); }
      else if (!g.photos.length) { list.hidden = true; empty.hidden = false; view.show([]); }
    });
  }
}

/** One grid tile. @param {Post} p @param {HTMLElement} inner */
function tile(p, inner) {
  const li = document.createElement("li");
  li.className = "tile";
  const img = document.createElement("img");
  img.className = "ph";
  img.src = p.src;
  img.alt = p.alt;
  img.loading = "lazy";
  img.decoding = "async";
  img.width = p.width;
  img.height = p.height;
  inner.append(img);
  if (p.video) {
    const badge = document.createElement("span");
    badge.className = "vid";
    badge.textContent = "Video";
    inner.append(badge);
  }
  li.append(inner);
  return li;
}

/**
 * Home strip: the newest few, each linking to the work page (or the post on Instagram).
 * @param {HTMLElement} root @param {HTMLUListElement} list @param {GalleryData} g
 */
function stripView(root, list, g) {
  const limit = Number(root.dataset.galleryLimit) || 8;
  return {
    /** @param {Post[]} posts */
    show(posts) {
      if (!posts.length) return;
      list.replaceChildren(...posts.slice(0, limit).map((p) => {
        const href = g.workHref ?? p.link;
        const inner = document.createElement(href ? "a" : "figure");
        if (inner instanceof HTMLAnchorElement && href) {
          inner.href = href;
          if (!g.workHref) { inner.target = "_blank"; inner.rel = "noopener"; }
        }
        return tile(p, inner);
      }));
    },
  };
}

/**
 * Work page: filters, endless scroll, enlarged view.
 * @param {HTMLElement} root @param {HTMLUListElement} list @param {GalleryData} g
 * @param {import("../../core/js/core.js").Ctx} ctx
 */
function pageView(root, list, g, ctx) {
  const chips = /** @type {HTMLElement} */ (root.querySelector("[data-gallery-chips]"));
  chips.hidden = false; // filters only work with JavaScript, so they only appear with it
  const count = root.querySelector("[data-gallery-count]");
  const more = /** @type {HTMLButtonElement} */ (root.querySelector("[data-gallery-more]"));
  const end = /** @type {HTMLElement|null} */ (root.querySelector("[data-gallery-end]"));
  const sentinel = root.querySelector("[data-gallery-sentinel]");
  const lightbox = enlarged(ctx);
  /** @type {Post[]} */ let all = [];
  // A link can open the page on one filter: work.html#bmw shows the posts tagged #bmw.
  let tag = /^#[a-z0-9_]+$/.test(location.hash) ? location.hash.slice(1) : "";
  let shown = 0;

  const matching = () => withTag(all, tag);
  const render = (/** @type {boolean} */ reset) => {
    const items = matching();
    const from = reset ? 0 : list.children.length;
    if (reset) list.replaceChildren();
    list.append(...items.slice(from, shown).map((p, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tile-open";
      btn.setAttribute("aria-label", `Open photo: ${p.alt}`);
      btn.addEventListener("click", () => lightbox.open(items, from + i));
      return tile(p, btn);
    }));
    const left = items.length > shown;
    more.hidden = !left;
    if (end) end.hidden = left || !items.length;
    if (count) count.textContent = items.length ? `Showing ${Math.min(shown, items.length)} of ${items.length}` : "No photos with that tag yet.";
  };

  chips.addEventListener("click", (e) => {
    const btn = /** @type {HTMLElement} */ (e.target).closest("button[data-tag]");
    if (!(btn instanceof HTMLButtonElement)) return;
    tag = btn.dataset.tag ?? "";
    for (const b of chips.querySelectorAll("button")) b.setAttribute("aria-pressed", String(b === btn));
    shown = STEP;
    render(true);
  });
  more.addEventListener("click", () => { shown += STEP; render(false); });
  if (sentinel && "IntersectionObserver" in window) {
    // Start loading more only once the visitor scrolls, so the first view is always one batch.
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting) && matching().length > shown) { shown += STEP; render(false); }
    }, { rootMargin: "600px 0px" });
    addEventListener("scroll", () => io.observe(sentinel), { once: true, passive: true });
  }

  return {
    /** @param {Post[]} posts */
    show(posts) {
      if (!posts.length) return;
      all = posts;
      // Only offer filters that match at least one photo.
      const live = new Set(chipsFor(all, g.filters).map((f) => f.tag));
      for (const b of chips.querySelectorAll("button[data-tag]")) {
        const t = /** @type {HTMLElement} */ (b).dataset.tag ?? "";
        /** @type {HTMLElement} */ (b).hidden = Boolean(t) && !live.has(t);
      }
      if (tag && !live.has(tag)) tag = "";
      for (const b of chips.querySelectorAll("button[data-tag]")) b.setAttribute("aria-pressed", String((/** @type {HTMLElement} */ (b).dataset.tag ?? "") === tag));
      shown = Math.max(shown, STEP);
      render(true);
    },
  };
}

/**
 * The enlarged view: a native <dialog> (Escape closes it and focus returns to the photo).
 * @param {import("../../core/js/core.js").Ctx} ctx
 */
function enlarged(ctx) {
  const dialog = /** @type {HTMLDialogElement} */ (document.querySelector("[data-gallery-dialog]"));
  const img = /** @type {HTMLImageElement} */ (dialog.querySelector("[data-lb-img]"));
  const cap = /** @type {HTMLElement} */ (dialog.querySelector("[data-lb-cap]"));
  const book = /** @type {HTMLAnchorElement} */ (dialog.querySelector("[data-lb-book]"));
  const link = /** @type {HTMLAnchorElement} */ (dialog.querySelector("[data-lb-link]"));
  /** @type {Post[]} */ let items = [];
  let at = 0;

  const paint = () => {
    const p = items[at];
    img.src = p.large ?? p.src;
    img.alt = p.alt;
    cap.textContent = [p.caption, p.date ? new Date(`${p.date}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : ""].filter(Boolean).join(" · ");
    link.hidden = !p.link;
    if (p.link) link.href = p.link;
    const ask = ctx.data.messages.likeThis ?? "Hi, can I book a cut like this one";
    book.href = ctx.bookHref(p.link ? `${ask}? ${p.link}` : `${ask}: ${p.alt}`);
  };
  const step = (/** @type {number} */ d) => { at = (at + d + items.length) % items.length; paint(); };
  dialog.querySelector("[data-lb-prev]")?.addEventListener("click", () => step(-1));
  dialog.querySelector("[data-lb-next]")?.addEventListener("click", () => step(1));
  dialog.querySelector("[data-lb-close]")?.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); }); // backdrop
  dialog.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });
  return {
    /** @param {Post[]} list @param {number} index */
    open(list, index) {
      items = list;
      at = index;
      paint();
      dialog.showModal();
    },
  };
}
