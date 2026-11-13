#!/usr/bin/env python3
"""Datum Hire photo grade: one photographic world for every image.

Crops a source photo, applies the house grade and exports a WebP.

Grade (matches sitefloor-internal/docs/design/datum-screen/img/):
  - saturation x0.6 (main hero keeps x0.85 via --sat 0.85)
  - blacks lifted very slightly toward damson (the page ground is #120E15),
    so shadows sit in dark plum instead of dead black, detail kept
  - highlights pulled neutral, then a touch cool (never warm, never blue)
  - gentle filmic shoulder; no crushing

Usage:
  grade.py SRC OUT --size 1900x1267 --crop CX,CY,W [--sat 0.6] [--exposure 1.0] [--blur X0,Y0,X1,Y1 ...]
    --crop  centre (CX,CY) and width W of the crop, all as fractions of the
            source; the height follows from the output aspect ratio and the
            box is shifted to stay inside the frame.
    --exposure  linear exposure multiplier (e.g. 0.7) to settle a dusk source into the set.
    --blur  boxes (source fractions) to blur heavily, e.g. number plates.
"""
import argparse
import io
import sys

import numpy as np
from PIL import Image, ImageFilter

DAMSON = np.array([17, 11, 19], dtype=np.float32) / 255.0  # black point, a touch under #120E15
COOL = np.array([-0.010, -0.002, 0.010], dtype=np.float32)  # highlight bias


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def grade(img, sat=0.6, exposure=1.0):
    a = np.asarray(img.convert("RGB"), dtype=np.float32) / 255.0
    if exposure != 1.0:  # linear-light exposure, for pushing dusk sources toward night
        a = np.power(np.power(a, 2.2) * exposure, 1 / 2.2)
    lum = a @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    # 1. saturation (a little lower in the shadows so their colour casts give way to damson)
    s = sat * (0.7 + 0.3 * smoothstep(0.08, 0.5, lum))[..., None]
    a = lum[..., None] + s * (a - lum[..., None])
    # 2. highlights neutral-cool
    wh = smoothstep(0.55, 1.0, lum)[..., None]
    a = a + (lum[..., None] - a) * (0.45 * wh)
    a = a + COOL * wh
    # 3. gentle filmic shoulder (keeps highlight detail)
    a = np.clip(a, 0, None)
    a = a * (1 + a / 6.0) / (1 + a / 1.15) * (1 + 1 / 1.15) / (1 + 1 / 6.0)
    # 4. shadows toward damson: lift the black point to plum, fade it out by the mids
    ws = (1.0 - smoothstep(0.0, 0.45, lum))[..., None]
    a = a + DAMSON * (1.0 - a) * (0.55 + 0.45 * ws)
    a = np.clip(a, 0, 1)
    return Image.fromarray((a * 255 + 0.5).astype(np.uint8), "RGB")


def crop_box(src_w, src_h, out_w, out_h, cx, cy, wf):
    w = wf * src_w
    h = w * out_h / out_w
    if h > src_h:
        h = src_h
        w = h * out_w / out_h
    x0 = min(max(cx * src_w - w / 2, 0), src_w - w)
    y0 = min(max(cy * src_h - h / 2, 0), src_h - h)
    return (round(x0), round(y0), round(x0 + w), round(y0 + h))


def budget(w, h):
    px = w * h
    if px <= 960 * 640 * 1.5:
        return 55_000
    return int(55_000 + (px - 614_400) * 0.0855)  # ~220 KB at 1900x1267, ~300 KB at 2400x1350


def _encode(img, target):
    for q in (78, 75, 72, 69, 66, 63, 60):
        buf = io.BytesIO()
        img.save(buf, "WEBP", quality=q, method=6)
        data = buf.getvalue()
        if len(data) <= target:
            return data, q, True
    return data, q, False


def denoise(img, h):
    """Light chroma-first denoise for high-ISO night grain (keeps edges)."""
    import cv2
    a = cv2.cvtColor(np.asarray(img), cv2.COLOR_RGB2BGR)
    a = cv2.fastNlMeansDenoisingColored(a, None, h, h * 1.5, 5, 15)
    return Image.fromarray(cv2.cvtColor(a, cv2.COLOR_BGR2RGB))


def export(img, out, target):
    data, q, ok = _encode(img, target)
    note = ""
    for h in (2, 3, 4, 6):
        if ok:
            break
        data, q, ok = _encode(denoise(img, h), target)
        note = f" dn{h}"
    with open(out, "wb") as f:
        f.write(data)
    return len(data), f"{q}{note}"


def main(argv=None):
    p = argparse.ArgumentParser()
    p.add_argument("src")
    p.add_argument("out")
    p.add_argument("--size", required=True)
    p.add_argument("--crop", default="0.5,0.5,1")
    p.add_argument("--sat", type=float, default=0.6)
    p.add_argument("--blur", action="append", default=[])
    p.add_argument("--flip", action="store_true")
    p.add_argument("--exposure", type=float, default=1.0)
    o = p.parse_args(argv)
    ow, oh = (int(v) for v in o.size.lower().split("x"))
    cx, cy, wf = (float(v) for v in o.crop.split(","))
    im = Image.open(o.src)
    im.load()
    im = im.convert("RGB")
    W, H = im.size
    for b in o.blur:
        x0, y0, x1, y1 = (float(v) for v in b.split(","))
        box = (int(x0 * W), int(y0 * H), int(x1 * W), int(y1 * H))
        region = im.crop(box)
        rw, rh = region.size
        region = region.resize((max(1, rw // 24), max(1, rh // 24)), Image.BILINEAR).resize((rw, rh), Image.BILINEAR)
        region = region.filter(ImageFilter.GaussianBlur(max(rw, rh) / 14))
        im.paste(region, box)
    box = crop_box(W, H, ow, oh, cx, cy, wf)
    c = im.crop(box)
    if c.size[0] < ow:
        print(f"WARNING upscale {c.size} -> {ow}x{oh} for {o.out}", file=sys.stderr)
    if o.flip:
        c = c.transpose(Image.FLIP_LEFT_RIGHT)
    c = c.resize((ow, oh), Image.LANCZOS)
    c = grade(c, o.sat, o.exposure)
    c = c.filter(ImageFilter.UnsharpMask(radius=0.8, percent=35, threshold=2))
    n, q = export(c, o.out, budget(ow, oh))
    print(f"{o.out} {ow}x{oh} {n} B q{q} src{box[2]-box[0]}px")


if __name__ == "__main__":
    main()
