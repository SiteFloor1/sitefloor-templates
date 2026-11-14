// Builds everything the tests need. Fixtures are built as production so the
// indexable/robots/sitemap behaviour of real client sites is exercised.
// Both are built as on the test day (test-day.json), with demo dates as written, so the tests see the data they were
// written for; src/demo/dates.js, which moves them on the real day, is tested on its own (tests/unit/demo-dates.test.js).
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

export default function globalSetup() {
  const { day } = JSON.parse(readFileSync(new URL("./test-day.json", import.meta.url), "utf8"));
  execFileSync("node", ["scripts/build.js", "--all", "--today", day, "--as-written"], { stdio: "inherit" });
  execFileSync("node", ["scripts/build.js", "--fixtures", "--env", "production", "--today", day, "--as-written"], { stdio: "inherit" });
}
