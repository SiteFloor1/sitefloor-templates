// A quick check of every built site, run on every pull request, including ones narrowed to one kit:
// the home page loads in a browser with one heading and no script errors, and every page answers 200.
// The thorough per-page checks are in all-sites.spec.js and a11y.spec.js.
import { test, expect, builtSites, start, pathOf, watchErrors } from "./helpers.js";

for (const s of builtSites()) {
  test(`smoke: ${s.label} loads, and all ${s.pages.length} pages answer`, async ({ page: p, request }) => {
    const srv = await start(s);
    try {
      const errors = watchErrors(p);
      const res = await p.goto(srv.base + "/");
      expect(res?.status()).toBe(200);
      await expect(p.locator("h1")).toHaveCount(1);
      for (const page of s.pages) expect((await request.get(srv.base + pathOf(page))).status(), pathOf(page)).toBe(200);
      expect(errors).toEqual([]);
    } finally {
      await p.close();
      await srv.close();
    }
  });
}
