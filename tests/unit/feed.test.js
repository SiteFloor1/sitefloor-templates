import { test } from "node:test";
import assert from "node:assert/strict";
import { postsFromBehold, postsFromPhotos, chipsFor, withTag } from "../../src/core/lib/feed.js";

const img = (n, w = 700) => ({ mediaUrl: `https://cdn.behold.pictures/abc/${n}.webp`, width: w, height: Math.round(w * 1.25) });
const feed = {
  username: "shop",
  posts: [
    { id: "1", mediaType: "IMAGE", permalink: "https://www.instagram.com/p/AAA/", timestamp: "2026-10-20T10:00:00+0000",
      prunedCaption: "Fresh mid skin fade for Saturday. Booked via the link in bio.", hashtags: ["SkinFade", "#leeds"], sizes: { medium: img(1), large: img(1, 1000) } },
    { id: "2", mediaType: "VIDEO", permalink: "https://www.instagram.com/reel/BBB/", prunedCaption: "", hashtags: [], sizes: { medium: img(2), large: img(2, 1000) } },
    { id: "3", mediaType: "IMAGE", permalink: "javascript:alert(1)", prunedCaption: "x", sizes: { medium: { mediaUrl: "https://evil.example/x.webp", width: 1, height: 1 } } },
  ],
};

test("a Behold feed becomes posts: Behold images only, safe links, tags lowercased, alt from the caption", () => {
  const posts = postsFromBehold(feed, "Northgate");
  assert.equal(posts.length, 2); // the post with a foreign image host is dropped
  assert.deepEqual(posts[0].tags, ["skinfade", "leeds"]);
  assert.equal(posts[0].alt, "Fresh mid skin fade for Saturday.");
  assert.equal(posts[0].large, "https://cdn.behold.pictures/abc/1.webp");
  assert.equal(posts[0].date, "2026-10-20");
  assert.equal(posts[1].alt, "Photo from Northgate's Instagram");
  assert.equal(posts[1].video, true);
  assert.deepEqual(postsFromBehold({ nope: true }, "x"), []);
  assert.equal(postsFromBehold({ posts: [{ ...feed.posts[0], permalink: "https://evil.example/p" }] }, "x")[0].link, undefined);
});

test("stored photos become posts, and filters only offer tags that have photos", () => {
  const posts = postsFromPhotos([{ src: "img/a.webp", alt: "A", caption: "Line-up", by: "Kofi", width: 720, height: 900, tags: ["SkinFade"] }], (s) => `/${s}`);
  assert.equal(posts[0].src, "/img/a.webp");
  assert.equal(posts[0].caption, "Line-up · by Kofi");
  const chips = chipsFor(posts, [{ tag: "skinfade", label: "Skin fades" }, { tag: "beard", label: "Beards" }]);
  assert.deepEqual(chips.map((c) => c.tag), ["skinfade"]);
  assert.equal(withTag(posts, "beard").length, 0);
  assert.equal(withTag(posts, "").length, 1);
});

test("Behold's documented feed example: images on behold.pictures (no subdomain) and carousel children on cdn.", () => {
  // Shape and hosts copied from https://behold.so/docs/json-feeds (October 2026).
  const size = (host, id, name) => ({ mediaUrl: `https://${host}/FpfDPCRPqWepfHqHLPOHVtlBr8s1/lEo51UnC6UFxwb3cxdPG/${id}/${name}.webp` });
  const sizes = (host, id) => ({ small: size(host, id, "small"), medium: size(host, id, "medium"), large: size(host, id, "large"), full: size(host, id, "full") });
  const documented = {
    username: "behold.so", biography: "", profilePictureUrl: "", website: "", followersCount: 1, followsCount: 1,
    posts: [
      { id: "17842915793354225", timestamp: "2024-02-05T19:04:15+0000", permalink: "https://www.instagram.com/p/C3BkLm3O5Yd/", mediaType: "IMAGE",
        mediaUrl: "https://scontent-dfw5-1.cdninstagram.com/v/t51.29350-15/118702810_n.jpg", sizes: sizes("behold.pictures", "17842915793354225"),
        caption: "Mid fade #skinfade", prunedCaption: "Mid fade", hashtags: ["skinfade"], mentions: [], colorPalette: {} },
      { id: "18059393134510955", timestamp: "2024-02-04T10:00:00+0000", permalink: "https://www.instagram.com/p/C3AAAAA/", mediaType: "CAROUSEL_ALBUM",
        sizes: sizes("cdn.behold.pictures", "18059393134510955"), prunedCaption: "", hashtags: [] },
    ],
  };
  const posts = postsFromBehold(documented, "Northgate");
  assert.equal(posts.length, 2);
  assert.equal(posts[0].src, "https://behold.pictures/FpfDPCRPqWepfHqHLPOHVtlBr8s1/lEo51UnC6UFxwb3cxdPG/17842915793354225/medium.webp");
  assert.equal(posts[1].large.startsWith("https://cdn.behold.pictures/"), true);
  // Look-alike hosts are still refused.
  assert.equal(postsFromBehold({ posts: [{ ...documented.posts[0], sizes: sizes("behold.pictures.evil.example", "1") }] }, "x").length, 0);
  assert.equal(postsFromBehold({ posts: [{ ...documented.posts[0], sizes: sizes("notbehold.pictures", "1") }] }, "x").length, 0);
});
