#!/usr/bin/env node
// @ts-check
/**
 * Starts a new client site from a kit's template. The new site.json is full
 * of REPLACE_ME markers; the build refuses to run until every one is filled.
 *
 *   npm run new-client -- --kit barber --slug kings-cuts --plan plus
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { PLANS } from "../src/features/registry.js";

const { values } = parseArgs({ options: { kit: { type: "string" }, slug: { type: "string" }, plan: { type: "string" } } });
const { kit, slug, plan } = values;
if (!kit || !slug || !plan) throw new Error("Usage: npm run new-client -- --kit barber --slug kings-cuts --plan starter|plus|signature");
if (!/^[a-z0-9-]+$/.test(slug)) throw new Error("--slug: lowercase letters, numbers and dashes only");
if (!PLANS.includes(/** @type {any} */ (plan))) throw new Error(`--plan must be one of ${PLANS.join(", ")}`);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."); // works from any folder
const template = path.join(ROOT, "src", "kits", kit, "client-template.json");
if (!existsSync(template)) throw new Error(`No client template for kit "${kit}" (${template})`);
const dir = path.join(ROOT, "sites", "clients", slug);
if (existsSync(dir)) throw new Error(`${dir} already exists`);

const site = JSON.parse(await readFile(template, "utf8"));
site.id = slug;
site.plan = plan;
await mkdir(path.join(dir, "img"), { recursive: true });
await writeFile(path.join(dir, "site.json"), `${JSON.stringify(site, null, 2)}\n`);
const shown = path.relative(process.cwd(), dir);
console.log(`Created ${shown}/site.json
Next:
  1. Fill in every REPLACE_ME (business details from the intake form).
  2. Answer the trade's questions with the client (docs/CUSTOMER-QUESTIONS.md) and fill "questions".
     Add features for the ${plan} plan to "features" (see docs/FEATURES.md) and their config;
     anything above the plan goes in "addons" too.
  3. Put the client's photos in ${shown}/img (WebP, compressed) and list each in ${shown}/img/CREDITS.md.
  4. npm run build -- --site clients/${slug}   (repeat until it passes)
  5. npm run check`);
