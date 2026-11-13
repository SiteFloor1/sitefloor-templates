// Automated accessibility checks (axe-core, WCAG 2.2 A/AA rules) on every page of every built site.
// Automated checks catch roughly a third of issues; keyboard tests live in the other specs.
import AxeBuilder from "@axe-core/playwright";
import { test, expect, testedSites, start, pathOf, featuresStarted, OPEN_TIME, CLOSED_TIME } from "./helpers.js";

for (const s of testedSites()) {
  test.describe(`accessibility: ${s.label}`, () => {
    let srv;
    test.beforeAll(async () => { srv = await start(s); });
    test.afterAll(async () => { await srv.close(); });
    for (const page of s.pages) for (const [when, time] of [["open", OPEN_TIME], ["closed", CLOSED_TIME]]) {
      test(`${pathOf(page)} (shop ${when}) has no serious or critical axe violations`, async ({ page: p }) => {
        await p.clock.setFixedTime(time);
        await p.route(/docs\.google\.com|feeds\.behold\.so/, (r) => r.abort("failed"));
        await p.emulateMedia({ reducedMotion: "reduce" }); // reveal animations off, so contrast is measured on final colours
        await p.goto(srv.base + pathOf(page));
        await featuresStarted(p); // axe reads the page as visitors meet it, not half-way through start-up
        const results = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
        const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
        expect(bad.map((v) => `${v.id}: ${v.help} (${v.nodes.length}) e.g. ${v.nodes[0]?.target}`)).toEqual([]);
      });
    }
  });
}
