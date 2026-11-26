// @ts-check
/**
 * What every driving site says in gov.uk's and the DVSA's own terms, kept in one place with where it came from and
 * when it was checked. The instructor's site links each to its source; none of it is the instructor's claim. When gov.uk
 * changes, change it here and every site follows.
 */

export const CHECKED = "2026-11-17";

/** The DVSA's "Ready to Pass?" checklist: you'll usually be ready when you can say yes to these five. */
export const READY = {
  source: "https://www.gov.uk/ready-to-pass",
  points: [
    "You don't need prompts from your instructor.",
    "You don't make serious or dangerous mistakes.",
    "You can pass mock driving tests.",
    "You've practised ways of managing your nerves.",
    "Your instructor agrees you're ready.",
  ],
};

/** The car driving test, in the order it happens (gov.uk, "What happens during the test"). */
export const TEST_DAY = {
  source: "https://www.gov.uk/driving-test/what-happens-during-test",
  minutes: "about 40 minutes",
  steps: [
    { name: "Eyesight check", text: "Read a number plate from 20 metres." },
    { name: "Show me, tell me", text: "Two vehicle safety questions: one before you drive, one while you're driving." },
    { name: "General driving", text: "Different roads and traffic, with the examiner giving directions." },
    { name: "A reversing exercise", text: "One of: parallel park, park in a bay, or pull up on the right and reverse." },
    { name: "Independent driving", text: "About 20 minutes following a sat nav or traffic signs." },
  ],
  bring: ["Your photocard driving licence", "Your theory test pass certificate number", "A car, if you're not using ours"],
};

/** gov.uk pages every driving site links to. */
export const LINKS = {
  provisional: { label: "Apply for a provisional licence", url: "https://www.gov.uk/apply-first-provisional-driving-licence" },
  theory: { label: "Book your theory test", url: "https://www.gov.uk/book-theory-test" },
  practical: { label: "Book your driving test", url: "https://www.gov.uk/book-driving-test" },
  change: { label: "Change your driving test", url: "https://www.gov.uk/change-driving-test" },
  fees: { label: "Driving test costs", url: "https://www.gov.uk/driving-test-cost" },
  centres: { label: "Find a driving test centre", url: "https://www.gov.uk/find-driving-test-centre" },
  ready: { label: "Ready to Pass?", url: "https://www.gov.uk/ready-to-pass" },
  practice: { label: "Practising with family or friends", url: "https://www.gov.uk/driving-lessons-learning-to-drive/practising-with-family-or-friends" },
  passPlus: { label: "Pass Plus", url: "https://www.gov.uk/pass-plus" },
};

/** The only place the test-fee source may point. */
export const FEES_SOURCE = "https://www.gov.uk/driving-test-cost";
