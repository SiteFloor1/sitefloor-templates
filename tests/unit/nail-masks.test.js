// The showpiece's nail masks: colour may only land on the nails. Each hand has hand-checked points just off every nail
// (skin or background, 7 px out) that must stay clear, and just inside every nail edge (4 px in) that must be covered,
// so a mask that spills onto skin or leaves a rim of the old polish fails here.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { nailTone, recolour, nailBase } from "../../src/kits/nails/lib/shade.js";

/** Reads an 8-bit grayscale, non-interlaced PNG (what the masks are). @param {Buffer} buf */
function readGrayPng(buf) {
  assert.equal(buf.readUInt32BE(12), 0x49484452, "IHDR first");
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20), depth = buf[24], type = buf[25], interlace = buf[28];
  assert.ok(depth === 8 && type === 0 && interlace === 0, "mask is an 8-bit grayscale PNG");
  const parts = [];
  for (let p = 8; p < buf.length;) {
    const len = buf.readUInt32BE(p), kind = buf.toString("latin1", p + 4, p + 8);
    if (kind === "IDAT") parts.push(buf.subarray(p + 8, p + 8 + len));
    p += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(parts)), px = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (w + 1)], row = raw.subarray(y * (w + 1) + 1, (y + 1) * (w + 1));
    for (let x = 0; x < w; x++) {
      const a = x > 0 ? px[y * w + x - 1] : 0, b = y > 0 ? px[(y - 1) * w + x] : 0, c = x > 0 && y > 0 ? px[(y - 1) * w + x - 1] : 0;
      let v = row[x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      px[y * w + x] = v & 255;
    }
  }
  return { w, h, px };
}

const probes = JSON.parse(readFileSync("tests/unit/nail-mask-probes.json", "utf8"));
const demo = JSON.parse(readFileSync("sites/demos/nail-salon/site.json", "utf8"));

for (const hand of demo.hero.hands) {
  test(`the ${hand.label} hand's mask covers its nails and nothing else`, () => {
    const { w, h, px } = readGrayPng(readFileSync(`sites/demos/nail-salon/${hand.mask}`));
    assert.deepEqual([w, h], [hand.width, hand.height], "mask matches the photo");
    const p = probes[hand.id];
    assert.ok(p && p.off.length > 30 && p.on.length > 20, `checked points for ${hand.id}`);
    const spill = p.off.filter(([x, y]) => px[y * w + x] > 10);
    const rim = p.on.filter(([x, y]) => px[y * w + x] < 200); // under ~80% coverage the old polish shows through
    assert.equal(spill.length, 0, `colour would land off the nails at ${JSON.stringify(spill.slice(0, 5))}`);
    assert.equal(rim.length, 0, `the old polish would show inside the nails at ${JSON.stringify(rim.slice(0, 5))}`);
  });
}

test("evening out the old polish's broad light keeps skin untouched and the new shade even", () => {
  // A 40x1 strip: skin, then a nail whose right half is a much lighter French tip.
  const w = 40, h = 1, src = new Uint8ClampedArray(w * 4), mask = new Uint8ClampedArray(w * 4), out = new Uint8ClampedArray(w * 4);
  for (let x = 0; x < w; x++) {
    const v = x < 10 ? 150 : x < 25 ? 170 : 235, m = x < 10 ? 0 : 255;
    src.set([v, v - 20, v - 30, 255], x * 4); mask.set([m, m, m, 255], x * 4);
  }
  const base = nailBase(src, mask), tone = nailTone(src, mask, w, h, 4);
  recolour(src, mask, out, "#1F2740", base, tone);
  for (let x = 0; x < 10; x++) assert.deepEqual([...out.slice(x * 4, x * 4 + 3)], [...src.slice(x * 4, x * 4 + 3)], "skin untouched");
  const plain = new Uint8ClampedArray(w * 4); recolour(src, mask, plain, "#1F2740", base);
  const step = (a) => Math.abs(a[36 * 4 + 2] - a[14 * 4 + 2]);
  assert.ok(step(out) < step(plain) / 2, "the tip and the bed come out close to one colour");
});
