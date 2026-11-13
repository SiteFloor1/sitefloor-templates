import { test } from "node:test";
import assert from "node:assert/strict";
import { listJoin, teamQuestion, homeQuestions, questionTopics, checkQuestions } from "../../src/core/lib/questions.js";

const site = {
  features: ["team", "questions"],
  staff: [{ name: "Kofi", tags: ["afro"] }, { name: "Ash", tags: ["afro", "beard"] }, { name: "Rio", tags: ["kids", "afro"] }],
  team: { title: "T", filters: [{ tag: "afro", label: "Afro and textured hair" }, { tag: "curly", label: "Curly hair" }, { tag: "kids", label: "Kids" }], filtersQuestion: "Who's best for my hair?" },
  questions: [{ topic: "Parking", q: "Where can I park?", a: "Call Lane." }, { topic: "Paying", q: "Card?", a: "Yes.", home: true }],
};

test("the team question is written from the staff list, skipping specialities nobody has", () => {
  assert.equal(listJoin(["A"]), "A");
  assert.equal(listJoin(["A", "B", "C"]), "A, B and C");
  const q = teamQuestion(site);
  assert.equal(q.q, "Who's best for my hair?");
  assert.equal(q.a, "Afro and textured hair: Kofi, Ash and Rio. Kids: Rio.");
  assert.equal(teamQuestion({ ...site, features: ["questions"] }), null); // no team page, no question
});

test("home shows the marked questions; topics keep their first-seen order", () => {
  assert.deepEqual(homeQuestions(site).map((q) => q.q), ["Who's best for my hair?", "Card?"]);
  assert.deepEqual(questionTopics(site).map((g) => g.topic), ["Choosing who to book", "Parking", "Paying"]);
});

test("questions read like a customer asking; visit and team filter settings are checked", () => {
  const errors = [];
  checkQuestions({ questions: [{ topic: "x", q: "Parking", a: "" }], visitInfo: { title: "Visit" }, team: { filters: [{ tag: "Afro Hair", label: "" }] } }, (p, m) => errors.push(`${p}: ${m}`));
  for (const f of ["questions[0].q", "questions[0].a", "visitInfo: give at least one", "team.filters[0].tag", "team.filters[0].label"]) assert.ok(errors.some((e) => e.includes(f)), f);
});
