// Turns a downloaded car model into the Showroom's format (src/core/assets/cars/car-<id>.glb; the van in src/kits/car/assets):
// badges removed, the parts a visitor changes renamed to the names studio-3d.js looks for ("Paint 1", "Rim2",
// "Glass windscreen" / "Glass fronts" / "Glass rear"), the interior simplified, WebP textures, meshopt.
// Not part of the build. Run with the model tools installed without saving them:
//   npm i --no-save @gltf-transform/core@4 @gltf-transform/extensions@4 @gltf-transform/functions@4 meshoptimizer sharp
//   node tools/car-models/prep.js <profile id> <path to the downloaded scene.gltf>
import { readFileSync } from "node:fs";
import { NodeIO, getBounds, PropertyType } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, weld, prune, textureCompress, meshopt, flatten, simplifyPrimitive } from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";
import sharp from "sharp";

const [id, src] = process.argv.slice(2);
const profile = JSON.parse(readFileSync(new URL("./profiles.json", import.meta.url), "utf8"))[id];
if (!profile || !src) throw new Error("usage: node tools/car-models/prep.js <profile id> <scene.gltf>");
const re = (/** @type {string|undefined} */ s) => (s ? new RegExp(s, "i") : null);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.encoder": MeshoptEncoder });
const doc = await io.read(src);
const root = doc.getRoot();
await doc.transform(flatten());

// 1. Badges, number plates, floors.
const drop = re(profile.drop);
for (const n of root.listNodes()) if (drop && n.getMesh() && drop.test(`${n.getName()} ${n.getMesh()?.listPrimitives().map((p) => p.getMaterial()?.getName()).join(" ")}`)) n.dispose();

// 2. The parts a visitor changes, under the names the Showroom looks for.
const one = (/** @type {string} */ name, /** @type {any} */ from) => root.listMaterials().find((m) => m.getName() === name) ?? from.clone().setName(name);
const paint = re(profile.paint), rims = re(profile.rims), wheels = re(profile.wheels);
const bounds = getBounds(root.listScenes()[0]);
const axis = profile.front[1] === "x" ? 0 : 2, sign = profile.front[0] === "-" ? -1 : 1;
const mid = (bounds.min[axis] + bounds.max[axis]) / 2;
for (const n of root.listNodes()) {
  const mesh = n.getMesh();
  if (!mesh) continue;
  for (const p of mesh.listPrimitives()) {
    const m = p.getMaterial();
    if (!m) continue;
    const name = m.getName();
    if (wheels?.test(n.getName())) { splitRim(p, n, m); continue; }
    if (paint?.test(name)) { p.setMaterial(one("Paint 1", m)); continue; }
    if (rims?.test(name)) { p.setMaterial(one("Rim2", m)); continue; }
    for (const g of profile.glass) {
      if (!(re(g.node)?.test(n.getName()) ?? true) || !(re(g.material)?.test(name) ?? true)) continue;
      if (g.part === "split") splitFrontBack(p, n, m);
      else p.setMaterial(one(`Glass ${g.part}`, m));
      break;
    }
  }
}

/**
 * A wheel in one piece (tyre and rim share a material): triangles near the hub become "Rim2", so the wheel colour
 * changes the rim only. "wheels" is the wheel nodes' name, "rimRadius" the rim's share of the wheel's radius.
 */
function splitRim(/** @type {any} */ p, /** @type {any} */ n, /** @type {any} */ m) {
  const pos = p.getAttribute("POSITION"), idx = p.getIndices();
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pos.getCount(); i++) { const v = pos.getElement(i, []); for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], v[k]); hi[k] = Math.max(hi[k], v[k]); } }
  const size = [0, 1, 2].map((k) => hi[k] - lo[k]), c = [0, 1, 2].map((k) => (hi[k] + lo[k]) / 2);
  const width = size.indexOf(Math.min(...size)), [a, b] = [0, 1, 2].filter((k) => k !== width);
  const r = (Math.max(size[a], size[b]) / 2) * (profile.rimRadius ?? 0.7);
  const rim = [], tyre = [];
  for (let t = 0; t < idx.getCount(); t += 3) {
    const tri = [idx.getScalar(t), idx.getScalar(t + 1), idx.getScalar(t + 2)];
    const d = tri.map((i) => { const v = pos.getElement(i, []); return Math.hypot(v[a] - c[a], v[b] - c[b]); });
    (Math.max(...d) < r ? rim : tyre).push(...tri);
  }
  const mk = (/** @type {number[]} */ list) => doc.createAccessor().setType("SCALAR").setArray(new Uint32Array(list)).setBuffer(idx.getBuffer());
  const q = p.clone();
  p.setIndices(mk(tyre));
  q.setIndices(mk(rim)).setMaterial(one("Rim2", m));
  n.getMesh().addPrimitive(q);
}

/** A windscreen and rear screen in one piece: front triangles become the windscreen, the rest the rear. */
function splitFrontBack(/** @type {any} */ p, /** @type {any} */ n, /** @type {any} */ m) {
  const pos = p.getAttribute("POSITION"), idx = p.getIndices();
  const mat = n.getWorldMatrix();
  const at = (/** @type {number} */ i) => { const v = pos.getElement(i, []); return mat[axis] * v[0] + mat[4 + axis] * v[1] + mat[8 + axis] * v[2] + mat[12 + axis]; };
  const front = [], back = [];
  for (let t = 0; t < idx.getCount(); t += 3) {
    const tri = [idx.getScalar(t), idx.getScalar(t + 1), idx.getScalar(t + 2)];
    ((tri.reduce((a, i) => a + at(i), 0) / 3 - mid) * sign > 0 ? front : back).push(...tri);
  }
  const mk = (/** @type {number[]} */ list) => doc.createAccessor().setType("SCALAR").setArray(new Uint32Array(list)).setBuffer(idx.getBuffer());
  const q = p.clone();
  p.setIndices(mk(front)).setMaterial(one("Glass windscreen", m));
  q.setIndices(mk(back)).setMaterial(one("Glass rear", m));
  n.getMesh().addPrimitive(q);
}

// 3. Lighter: everything but paint, glass and wheels is simplified; then compression.
await MeshoptSimplifier.ready;
// Materials are not merged: "Paint 1" and the glass parts must stay apart from look-alikes.
await doc.transform(dedup({ propertyTypes: [PropertyType.ACCESSOR, PropertyType.TEXTURE] }), weld());
const keep = /^(Paint 1|Rim2|Glass )/;
// Hidden or round parts (tyres, brake discs, dashboard knobs): "loose" in the profile. Their texture seams stop the
// simplifier, so they go plain (tyres stay black rubber, discs grey metal), are welded again and simplified harder.
const loose = profile.loose ? new RegExp(profile.loose) : null;
const isLoose = (/** @type {any} */ p) => !!loose?.test(p.getMaterial()?.getName() ?? "");
/** A loose part goes plain: no textures or UVs, one colour from the profile. @param {any} p */
const plain = (p) => {
  for (const a of ["TEXCOORD_0", "TEXCOORD_1", "TANGENT"]) p.setAttribute(a, null);
  const mt = p.getMaterial();
  const hex = Object.entries(profile.looseColors ?? {}).find(([k]) => new RegExp(k).test(mt?.getName() ?? ""))?.[1] ?? "#2a2a2a";
  const c = [1, 3, 5].map((i) => (parseInt(hex.slice(i, i + 2), 16) / 255) ** 2.2);
  mt?.setBaseColorTexture(null).setNormalTexture(null).setMetallicRoughnessTexture(null).setOcclusionTexture(null).setBaseColorFactor([c[0], c[1], c[2], 1]);
};
if (loose) {
  for (const m of root.listMeshes()) for (const p of m.listPrimitives()) if (isLoose(p)) plain(p);
  await doc.transform(weld());
}
for (const m of root.listMeshes()) for (const p of m.listPrimitives()) {
  const mat = p.getMaterial()?.getName() ?? "";
  const r = mat === "Rim2" ? profile.rimRatio ?? profile.keepRatio ?? 1 : keep.test(mat) ? profile.keepRatio ?? 1 : profile.ratio ?? 0.3;
  const l = isLoose(p);
  if (r < 1 || l) simplifyPrimitive(p, { simplifier: MeshoptSimplifier, ratio: l ? 0.05 : r, error: l ? profile.looseError ?? 0.03 : mat === "Rim2" ? profile.rimError ?? profile.error ?? 0.004 : profile.error ?? 0.004 });
}
await doc.transform(prune(), textureCompress({ encoder: sharp, targetFormat: "webp", resize: [profile.textures ?? 1024, profile.textures ?? 1024], quality: 78 }), meshopt({ encoder: MeshoptEncoder, level: "high" }));
// The saloon, SUV and hatch are shared by every kit that draws a 3D car (src/core/assets/cars); the van is the car kit's.
const out = new URL(["saloon", "suv", "hatch"].includes(id) ? `../../src/core/assets/cars/car-${id}.glb` : `../../src/kits/car/assets/car-${id}.glb`, import.meta.url).pathname;
await io.write(out, doc);
const parts = root.listMaterials().map((m) => m.getName()).filter((n) => keep.test(n));
console.log(id, "→", out, "parts:", parts.join(", "));
