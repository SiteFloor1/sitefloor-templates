// @ts-check
/** Restaurant build step: the printed menu (menu.pdf) made from site.json, unless the restaurant supplies its own PDF. */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { menuPdf } from "./lib/menu-pdf.js";

/** @param {{ site: any, outDir: string, root: string, look: any }} o */
export async function afterBuild(o) {
  if (!o.site.features.includes("menu-pdf") || o.site.menuPdf?.file) return;
  if (!o.look?.print) throw new Error(`look "${o.site.look}" has no "print" settings for the printed menu (look.json)`);
  await writeFile(path.join(o.outDir, "menu.pdf"), await menuPdf(o.site, o.look.print, o.root));
}
