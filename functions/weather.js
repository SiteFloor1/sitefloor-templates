// The shared weather function (Cloudflare Pages Functions, free plan): /weather?place=<id>.
// Every client site deploys it from this folder; all the logic is in src/core/lib/weather-edge.js (unit-tested).
/* global caches */
import { weather } from "../src/core/lib/weather-edge.js";

/** @param {{ request: Request, env: { ASSETS: { fetch: (r: Request|URL) => Promise<Response> } }, waitUntil: (p: Promise<unknown>) => void }} c */
export const onRequestGet = (c) =>
  // @ts-ignore caches.default exists on Cloudflare
  weather(c.request, { assets: c.env.ASSETS, cache: caches.default, fetch, waitUntil: (p) => c.waitUntil(p) });
