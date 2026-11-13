// @ts-check
/**
 * Photo feed for the gallery: the shop's Instagram (through Behold) or photos
 * stored with the site. Both become the same list of posts, so the gallery
 * code never needs to know where a photo came from.
 *
 * Behold (behold.so) is an approved Instagram partner: the shop connects its
 * Instagram once and Behold publishes a JSON feed with resized WebP images.
 * The feed is fetched by the visitor's browser, so new posts appear without
 * rebuilding the site. See src/features/gallery/README.md.
 */

/**
 * @typedef {object} Post
 * @property {string} id
 * @property {string} src        image for the grid (about 700px wide)
 * @property {string} [large]    image for the enlarged view
 * @property {number} width
 * @property {number} height
 * @property {string} alt
 * @property {string} caption    caption without hashtags (may be empty)
 * @property {string[]} tags     lowercase hashtags without "#"
 * @property {string} [link]     the post on Instagram
 * @property {boolean} video
 * @property {string} [date]     YYYY-MM-DD
 */

export const BEHOLD_FEED = /^https:\/\/feeds\.behold\.so\/[A-Za-z0-9_-]{6,64}$/;
export const INSTAGRAM_PROFILE = /^https:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._]{1,30}\/?$/;
/** Behold serves images from behold.pictures and, for carousel children, cdn.behold.pictures. */
const SAFE_IMAGE = /^https:\/\/([a-z0-9-]+\.)?behold\.pictures\//;
const INSTAGRAM_POST = /^https:\/\/(www\.)?instagram\.com\//;
const MAX_ALT = 125;

/** First sentence of a caption, short enough to be alt text. @param {string} text */
function shortText(text) {
  const t = text.replace(/\s+/g, " ").trim();
  const first = t.split(/(?<=[.!?])\s/)[0] ?? "";
  return first.length <= MAX_ALT ? first : `${first.slice(0, MAX_ALT - 1).replace(/\s\S*$/, "")}…`;
}

/**
 * Behold JSON feed → posts. Anything unexpected (wrong shape, images not on
 * Behold's CDN) is dropped rather than shown.
 * @param {any} json @param {string} name business name, for alt text when a caption is empty
 * @returns {Post[]}
 */
export function postsFromBehold(json, name) {
  const list = Array.isArray(json?.posts) ? json.posts : [];
  return list.map((/** @type {any} */ p) => beholdPost(p, name)).filter((/** @type {Post|null} */ p) => p !== null);
}

/** @param {any} size @returns {{ width: number, height: number }} */
const dimensions = (size) => ({ width: Number(size.width) || 700, height: Number(size.height) || 875 });

/** @param {any} size @returns {boolean} */
const onBehold = (size) => SAFE_IMAGE.test(String(size?.mediaUrl));

/** One Behold post, or null if its images aren't on Behold's CDN. @param {any} p @param {string} name @returns {Post|null} */
function beholdPost(p, name) {
  const sizes = p?.sizes ?? {};
  const grid = sizes.medium ?? sizes.small;
  const large = sizes.large ?? grid;
  if (!onBehold(grid) || !onBehold(large)) return null;
  const caption = typeof p.prunedCaption === "string" ? p.prunedCaption.trim() : "";
  const tags = Array.isArray(p.hashtags) ? p.hashtags : [];
  return {
    id: String(p.id),
    src: grid.mediaUrl,
    large: large.mediaUrl,
    ...dimensions(grid),
    alt: caption ? shortText(caption) : `Photo from ${name}'s Instagram`,
    caption,
    tags: tags.map((/** @type {string} */ t) => String(t).toLowerCase().replace(/^#/, "")),
    link: INSTAGRAM_POST.test(String(p.permalink)) ? p.permalink : undefined,
    video: p.mediaType === "VIDEO",
    date: typeof p.timestamp === "string" ? p.timestamp.slice(0, 10) : undefined,
  };
}

/**
 * Photos stored with the site → posts.
 * @param {{ src: string, alt: string, caption?: string, by?: string, width: number, height: number, tags?: string[] }[]} photos
 * @param {(src: string) => string} url turns "img/x.webp" into the page's URL for it
 * @returns {Post[]}
 */
export function postsFromPhotos(photos, url) {
  return photos.map((p, i) => ({
    id: `photo-${i}`,
    src: url(p.src),
    width: p.width,
    height: p.height,
    alt: p.alt,
    caption: [p.caption, p.by ? `by ${p.by}` : ""].filter(Boolean).join(" · "),
    tags: (p.tags ?? []).map((t) => t.toLowerCase()),
    video: false,
  }));
}

/**
 * Filter chips worth showing: the shop's chosen tags that at least one post has,
 * in the shop's order.
 * @param {Post[]} posts @param {{ tag: string, label: string }[]} filters
 */
export function chipsFor(posts, filters) {
  const present = new Set(posts.flatMap((p) => p.tags));
  return filters.filter((f) => present.has(f.tag));
}

/** @param {Post[]} posts @param {string} tag "" for all */
export const withTag = (posts, tag) => (tag ? posts.filter((p) => p.tags.includes(tag)) : posts);
