// Builds everything the tests need. Fixtures are built as production so the
// indexable/robots/sitemap behaviour of real client sites is exercised.
import { execFileSync } from "node:child_process";

export default function globalSetup() {
  execFileSync("node", ["scripts/build.js", "--all"], { stdio: "inherit" });
  execFileSync("node", ["scripts/build.js", "--fixtures", "--env", "production"], { stdio: "inherit" });
}
