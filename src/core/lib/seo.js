// @ts-check
/**
 * SEO output generated from a site's own config: JSON-LD, robots.txt,
 * sitemap.xml and Cloudflare _headers. Nothing here is hand-written per site,
 * so a client can never inherit another site's details.
 */
import { DAY_KEYS } from "./hours.js";
import { KITS } from "../../features/registry.js";

const SCHEMA_DAY = { sun: "Sunday", mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday" };

/**
 * schema.org LocalBusiness (or a subtype such as BarberShop).
 * Ratings and reviews are deliberately left out: Google treats reviews a
 * business publishes about itself as self-serving and ignores or penalises them.
 * @param {any} site
 * @param {string} [imageUrl] absolute URL of a representative photo
 */
export function localBusinessJsonLd(site, imageUrl) {
  /** @type {Record<string, any>} */
  const data = {
    "@context": "https://schema.org",
    "@type": site.business.schemaType,
    name: site.business.name,
    description: site.business.description,
    url: `${site.url}/`,
    telephone: site.contact.phone.replace(/\s/g, ""),
    address: {
      "@type": "PostalAddress",
      streetAddress: site.location.streetAddress,
      addressLocality: site.location.locality,
      postalCode: site.location.postcode,
      addressCountry: site.location.country,
    },
    openingHoursSpecification: DAY_KEYS.flatMap((d) =>
      (site.hours.weekly[d] ?? []).map((/** @type {[string,string]} */ r) => ({
        "@type": "OpeningHoursSpecification", dayOfWeek: SCHEMA_DAY[d], opens: r[0], closes: r[1],
      }))),
  };
  if (site.business.priceRange) data.priceRange = site.business.priceRange;
  if (imageUrl) data.image = imageUrl;
  if (site.location.geo) data.geo = { "@type": "GeoCoordinates", latitude: site.location.geo.lat, longitude: site.location.geo.lng };
  if (Array.isArray(site.business.sameAs) && site.business.sameAs.length) data.sameAs = site.business.sameAs;
  return data;
}

/**
 * JSON for an inline <script type="application/ld+json">: "<" is escaped so
 * config text can never close the script element.
 * @param {unknown} value
 */
export function safeJson(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(new RegExp(String.fromCharCode(0x2028), "g"), "\\u2028")
    .replace(new RegExp(String.fromCharCode(0x2029), "g"), "\\u2029");
}

/**
 * Only a client site, marked indexable, built for production is ever indexed.
 * @param {any} site @param {"production"|"preview"} env
 */
export function shouldIndex(site, env) {
  return site.mode === "client" && site.indexable === true && env === "production";
}

/** @param {any} site @param {"production"|"preview"} env */
export function robotsTxt(site, env) {
  return shouldIndex(site, env)
    ? `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`
    : "User-agent: *\nDisallow: /\n";
}

/**
 * The pages kept out of the sitemap and search: the page of each unlisted feature this site uses, and the pages of its
 * collection (named "<page>-<id>"). Another site's unlisted features never hide this site's pages.
 * @param {string[]} pages built page names, without ".html" @param {{ id: string, page?: string, unlisted?: boolean }[]} features
 * @param {string[]} siteFeatures the features the site has switched on
 */
export function unlistedPages(pages, features, siteFeatures) {
  const own = features.filter((f) => f.unlisted && f.page && siteFeatures.includes(f.id));
  return pages.filter((p) => own.some((f) => f.page === p || p.startsWith(`${f.page}-`)));
}

/**
 * @param {any} site @param {string[]} paths pretty paths, e.g. ["/", "/team"]
 * @param {string} lastmod YYYY-MM-DD
 */
export function sitemapXml(site, paths, lastmod) {
  const urls = paths.map((p) => `  <url><loc>${site.url}${p}</loc><lastmod>${lastmod}</lastmod></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/**
 * Cloudflare Pages _headers: security headers for every page, long caching
 * for hashed assets, and noindex on anything that must not be indexed.
 * @param {any} site @param {"production"|"preview"} env
 */
export function headersFile(site, env) {
  const connect = ["'self'"];
  const img = ["'self'", "data:"];
  const script = ["'self'"];
  // What this site's kit adds (src/kits/<kit>/kit.js → csp): whether it reads a published Google Sheet, and any other sources.
  const kit = KITS.find((k) => k.id === site.kit)?.csp?.(site) ?? {};
  // Live data from a published Google Sheet (the walk-in queue, or the kit's own); the CSV redirects to googleusercontent.com.
  if (site.queue?.source === "sheet" || kit.sheets) connect.push("https://docs.google.com", "https://*.googleusercontent.com");
  if (site.gallery?.source === "behold") { connect.push("https://feeds.behold.so"); img.push("https://behold.pictures", "https://*.behold.pictures"); }
  connect.push(...(kit.connect ?? []));
  img.push(...(kit.img ?? []));
  script.push(...(kit.script ?? []));
  const csp = [
    "default-src 'self'",
    `script-src ${script.join(" ")}`,
    "style-src 'self' 'unsafe-inline'", // inline style attributes are used for computed widths/positions only
    `img-src ${img.join(" ")}`,
    "font-src 'self'",
    ...(kit.frame?.length ? [`frame-src ${kit.frame.join(" ")}`] : []),
    `connect-src ${connect.join(" ")}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self' https://wa.me",
  ].join("; ");
  const lines = [
    "/*",
    `  Content-Security-Policy: ${csp}`,
    "  X-Content-Type-Options: nosniff",
    "  Referrer-Policy: strict-origin-when-cross-origin",
    "  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()",
    "  Strict-Transport-Security: max-age=31536000", // not includeSubDomains: a client may have other subdomains that aren't HTTPS
    "  X-Frame-Options: DENY",
  ];
  if (!shouldIndex(site, env)) lines.push("  X-Robots-Tag: noindex, nofollow");
  lines.push("", "/assets/*", "  Cache-Control: public, max-age=31536000, immutable", "");
  return lines.join("\n");
}
