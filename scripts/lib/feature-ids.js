// @ts-check
/**
 * Kit feature ids must be unique: no two kits may share one, and none may be a shared feature's id. Checked against
 * this tree and every other open branch (`origin/*`, as the fonts check does), so two builders working in parallel
 * find a clash when they make it, not when the second one merges. Ids are read from the source text (a branch's
 * kit.js can't be imported), as the registry's entries are written: `{ id: "<id>", …, dir: … }`.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { openBranches, refReaders, currentBranch } from "../docs-index.js";

const ENTRY = /\{\s*id:\s*"([\w-]+)"[^{}]*?\bdir:/g;

/** Feature ids declared in a registry or kit.js source. @param {string} text @returns {string[]} */
export const idsIn = (text) => [...text.matchAll(ENTRY)].map((m) => m[1]);

/** @typedef {{ shared: Set<string>, kits: Map<string, string[]> }} Ids */

/** @param {{ read: (rel: string) => string, has: (rel: string) => boolean, kits: string[] }} r @returns {Ids} */
function collect(r) {
  const kits = new Map();
  for (const k of r.kits) if (r.has(`src/kits/${k}/kit.js`)) kits.set(k, idsIn(r.read(`src/kits/${k}/kit.js`)));
  return { shared: new Set(r.has("src/features/registry.js") ? idsIn(r.read("src/features/registry.js")) : []), kits };
}

/** This tree's ids. @param {string} root @returns {Ids} */
export function treeIds(root) {
  const dir = path.join(root, "src/kits");
  const kits = existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort() : [];
  return collect({ read: (rel) => readFileSync(path.join(root, rel), "utf8"), has: (rel) => existsSync(path.join(root, rel)), kits });
}

/** Each other open branch's ids. @param {string} root @param {string} [current] @returns {{ ref: string, ids: Ids }[]} */
export function branchIds(root, current = currentBranch(root)) {
  return openBranches(root, current).flatMap((ref) => {
    try {
      const r = refReaders(root, ref);
      const kits = [...new Set([...r.dirs("src/kits")])].sort();
      return [{ ref, ids: collect({ ...r, kits }) }];
    } catch { return []; }
  });
}

/**
 * Clashes that involve this tree: a kit feature with a shared feature's id, two kits here with one id, or a kit here
 * whose id another kit (or a new shared feature) has on another open branch. Two other branches clashing is for them
 * to settle. @param {string} root @param {{ ref: string, ids: Ids }[]} [others] @returns {string[]}
 */
export function featureIdProblems(root, others = branchIds(root)) {
  const here = treeIds(root);
  /** @type {string[]} */
  const problems = [];
  const fix = (/** @type {string} */ kit, /** @type {string} */ id) => `kit feature ids must be unique: rename it (new kit features start with the kit's name, e.g. "${kit}-${id.replace(new RegExp(`^${kit}-`), "")}")`;
  /** @type {Map<string, string>} id → first kit here */
  const owner = new Map();
  for (const [kit, ids] of here.kits) {
    for (const id of ids) {
      const file = `src/kits/${kit}/kit.js`;
      if (here.shared.has(id)) problems.push(`${file}: feature "${id}" has the id of a shared feature (src/features/registry.js); ${fix(kit, id)}`);
      const first = owner.get(id);
      if (first && first !== kit) problems.push(`${file}: feature "${id}" is also a feature of the ${first} kit (src/kits/${first}/kit.js); ${fix(kit, id)}`);
      else if (!first) owner.set(id, kit);
      for (const { ref, ids: there } of others) {
        if (there.shared.has(id) && !here.shared.has(id)) problems.push(`${file}: feature "${id}" is a new shared feature on ${ref} (src/features/registry.js); ${fix(kit, id)}`);
        // Another kit there with this id, unless that kit has it here too (already reported above).
        const rivals = [...there.kits].filter(([other, otherIds]) => other !== kit && otherIds.includes(id) && !(here.kits.get(other) ?? []).includes(id));
        for (const [other] of rivals) problems.push(`${file}: feature "${id}" is also a feature of the ${other} kit on ${ref} (src/kits/${other}/kit.js); ${fix(kit, id)}`);
      }
    }
  }
  return problems;
}
