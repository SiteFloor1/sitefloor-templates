#!/usr/bin/env node
// @ts-check
/**
 * Local static server that behaves like Cloudflare Pages for our purposes:
 * "/team" serves team.html, "/team.html" redirects to "/team", unknown paths
 * get 404.html with status 404, and the site's own _headers file is applied (security
 * policy included), so a policy that would block something on Cloudflare blocks it here too.
 * Used by the end-to-end tests and for previews.
 *
 *   npm run serve -- dist/demos/barber 4173
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";

const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json",
  ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".woff": "font/woff", ".glb": "model/gltf-binary", ".pdf": "application/pdf", ".mp4": "video/mp4",
  ".txt": "text/plain; charset=utf-8", ".xml": "application/xml" };

/**
 * @param {string} root directory to serve
 * @param {number} port
 */
export function serve(root, port) {
  const base = path.resolve(root);
  const rules = readHeaders(base);
  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    let rel = decodeURIComponent(url.pathname);
    if (rel.endsWith(".html") && rel !== "/404.html") {
      res.writeHead(308, { Location: rel.replace(/(index)?\.html$/, "") || "/" }).end();
      return;
    }
    if (rel.endsWith("/")) rel += "index.html";
    else if (!path.extname(rel)) rel += ".html";
    const file = path.join(base, rel);
    if (!file.startsWith(base)) { res.writeHead(403).end(); return; }
    try {
      if (!(await stat(file)).isFile()) throw new Error("not a file");
      let body = await readFile(file);
      // Text is gzipped when the browser asks, as Cloudflare does, so speed tests here match the live site.
      const zip = /\.(html|css|js|json|svg|txt)$/.test(file) && /gzip/.test(String(req.headers["accept-encoding"] ?? ""));
      if (zip) body = gzipSync(body);
      // Content-Length like Cloudflare, so a download can show its progress (the 3D car files).
      res.writeHead(200, { ...headersFor(rules, url.pathname), "Content-Type": TYPES[/** @type {keyof typeof TYPES} */ (path.extname(file))] ?? "application/octet-stream", "Content-Length": body.length, ...(zip ? { "Content-Encoding": "gzip", Vary: "Accept-Encoding" } : {}) });
      res.end(body);
    } catch {
      const notFound = path.join(base, "404.html");
      res.writeHead(404, { ...headersFor(rules, url.pathname), "Content-Type": TYPES[".html"] });
      res.end(await readFile(notFound).catch(() => "Not found"));
    }
  });
  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}

/**
 * Cloudflare Pages _headers: a path pattern on its own line ("/*", "/assets/*"), then indented "Name: value" lines.
 * @param {string} base @returns {{ pattern: RegExp, headers: Record<string, string> }[]}
 */
function readHeaders(base) {
  /** @type {{ pattern: RegExp, headers: Record<string, string> }[]} */
  const rules = [];
  /** @type {string} */
  let text;
  try { text = readFileSync(path.join(base, "_headers"), "utf8"); } catch { return rules; }
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    if (!/^\s/.test(line)) {
      const glob = line.trim().replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
      rules.push({ pattern: new RegExp(`^${glob}$`), headers: {} });
    } else if (rules.length) {
      const i = line.indexOf(":");
      if (i > 0) rules[rules.length - 1].headers[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
  }
  return rules;
}

/** @param {ReturnType<typeof readHeaders>} rules @param {string} pathname */
function headersFor(rules, pathname) {
  return Object.assign({}, ...rules.filter((r) => r.pattern.test(pathname)).map((r) => r.headers));
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const [root = "dist", port = "4173"] = process.argv.slice(2);
  serve(root, Number(port)).then(() => console.log(`Serving ${root} on http://localhost:${port}`));
}
