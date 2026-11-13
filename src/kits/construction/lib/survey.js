// @ts-check
/**
 * The survey checklist: what is worth checking on a house of each age before planning work on it. General guidance,
 * not a survey and not advice on a particular house: the page says so and points to a surveyor or engineer. Only items
 * with an official source (lead pipes, asbestos, earlier approvals, the planning history) state a fact, with the source
 * and the date checked; every other item says what to look at or what to ask, never what is true of a house.
 */
import { SOURCES as PLANNING } from "./planning.js";

export const SURVEY_CHECKED = "2026-11-05";

/** Official pages the checklist cites, with the date each was checked. */
export const SURVEY_SOURCES = {
  lead: { label: "Drinking Water Inspectorate: lead in drinking water", url: "https://www.dwi.gov.uk/lead-in-drinking-water", checked: SURVEY_CHECKED },
  asbestos: { label: "HSE: why asbestos is dangerous and where it can be found", url: "https://www.hse.gov.uk/asbestos/introduction/why-and-where.htm", checked: SURVEY_CHECKED },
  regs: PLANNING.regs,
  pd: PLANNING.pd,
};

/** @typedef {{ name: string, line: string, source?: keyof typeof SURVEY_SOURCES }} Check */

const LEAD = /** @type {Check} */ ({ name: "Lead water pipes", line: "A home built before 1970 may have lead pipes. Unpainted lead pipe is dull grey, often with a swollen joint by the tap; scraped gently with a coin, it shows shiny silver metal.", source: "lead" });
const ASBESTOS = /** @type {Check} */ ({ name: "Asbestos", line: "It can be present in any building built or refurbished before 2000. Have it surveyed before any work disturbs ceilings, floors, boards or a garage roof.", source: "asbestos" });

/** Checks for every house, whatever its age. @type {Check[]} */
export const EVERY_HOUSE = [
  { name: "Earlier work, signed off", line: "Ask for the building control completion certificate for any extension, loft conversion, removed wall or rewiring done before.", source: "regs" },
  { name: "The planning history", line: "The council's planning register shows earlier applications, and whether an Article 4 direction or a condition has removed permitted development rights.", source: "pd" },
];

/** House ages and what is worth checking on each. */
export const HOUSE_AGES = {
  victorian: {
    label: "Victorian or Edwardian", said: "a Victorian or Edwardian house", years: "before 1919",
    checks: /** @type {Check[]} */ ([
      LEAD, ASBESTOS,
      { name: "Chimney breasts", line: "If one has been taken out downstairs, check what holds up the one above it." },
      { name: "Damp", line: "Look low on the walls and under windows, and at whether paths outside sit higher than the floor inside. Ask a surveyor what the walls are built of." },
      { name: "Timber floors", line: "Check the air bricks outside are clear, and lift a board where one feels soft near an outside wall." },
      { name: "The back addition", line: "Cracks where it meets the main house, and the valley gutter between the roofs." },
      { name: "Cracks over openings", line: "Diagonal cracks above doors and windows, especially near trees or drains, are worth a structural engineer's look." },
    ]),
  },
  interwar: {
    label: "1920s or 1930s", said: "a 1920s or 1930s house", years: "1919 to 1945",
    checks: /** @type {Check[]} */ ([
      LEAD, ASBESTOS,
      { name: "Wall ties", line: "Look for horizontal cracks in the mortar every few courses, and ask a surveyor whether the wall ties need checking." },
      { name: "The bay", line: "Cracks where the bay meets the main wall, and any lean in the bay itself." },
      { name: "Render and pebbledash", line: "Look closely at the corners and around the windows for cracks." },
      { name: "The wiring", line: "Look at the fuse box and the cables you can see. If you don't know when it was last tested, ask an electrician to test it." },
      { name: "The roof from inside", line: "From the loft: daylight between tiles, damp timbers, or no felt under the tiles." },
    ]),
  },
  postwar: {
    label: "1945 to 1979", said: "a house built between 1945 and 1979", years: "1945 to 1979",
    checks: /** @type {Check[]} */ ([
      LEAD, ASBESTOS,
      { name: "How it was built", line: "Ask a surveyor what the walls and frame are made of before planning to open any of them up." },
      { name: "Flat roofs", line: "On extensions and garages, look for standing water and patches." },
      { name: "Double glazing", line: "Look for mist between the panes, and ask whether any units need replacing." },
      { name: "Insulation", line: "How deep the loft insulation is, and whether the cavity has been filled." },
    ]),
  },
  modern: {
    label: "Since 1980", said: "a house built since 1980", years: "1980 on",
    checks: /** @type {Check[]} */ ([
      { ...ASBESTOS, line: "If the house was built or refurbished before 2000, it can be present. Have it surveyed before any work disturbs ceilings, floors or boards." },
      { name: "Behind the brick", line: "Ask what the walls are built of, block or timber frame, before cutting into them or fixing anything heavy." },
      { name: "Ventilation", line: "Check the trickle vents open and the extractor fans work, and look for condensation on cold walls." },
      { name: "Drains and the ground", line: "Ask for the drainage plan before building over or near a drain, and for any build warranty still running." },
      { name: "A conservatory", line: "Whether it was signed off, and whether doors separate it from the house." },
    ]),
  },
};

/** @typedef {keyof typeof HOUSE_AGES} HouseAge */

/** The words under every checklist. */
export const NOT_A_SURVEY = "General guidance, not a survey. For a house you're buying, a chartered surveyor's survey; for cracks or movement, a structural engineer.";

/** The checklist for one age: its own checks, then the ones for every house. @param {string} age @returns {Check[]} */
export function checklist(age) {
  const a = HOUSE_AGES[/** @type {HouseAge} */ (age)];
  return a ? [...a.checks, ...EVERY_HOUSE] : [];
}

/** The WhatsApp message asking the builder to survey a house of this age. @param {string} opening @param {string} age @param {string} where */
export function surveyMessage(opening, age, where) {
  const a = HOUSE_AGES[/** @type {HouseAge} */ (age)];
  return [opening, a ? `· ${a.said[0].toUpperCase()}${a.said.slice(1)}` : "", where ? `· Postcode district: ${where}` : ""].filter(Boolean).join("\n");
}
