// @ts-check
/**
 * The gym's home page sections, in their default order (HOSTS below moves some to their own page). The count sits in the
 * hero (the look draws it). A look can lead with different sections by listing every id in its own order (look.json →
 * "homeOrder").
 */
export const HOME_PARTS = {
  "gym-hyrox": "kits/gym/features/gym-hyrox/gym-hyrox.njk",
  "gym-recovery": "kits/gym/features/gym-recovery/gym-recovery.njk",
  "gym-timetable": "kits/gym/features/gym-timetable/gym-timetable.njk",
  "gym-memberships": "kits/gym/features/gym-memberships/gym-memberships.njk",
  "gym-friend": "kits/gym/features/gym-friend/gym-friend.njk",
  "gym-daypass": "kits/gym/features/gym-daypass/gym-daypass.njk",
  "questions": "features/questions/questions.njk",
  "visit": "features/visit/visit.njk",
};

/**
 * A section that has a page of its own leaves the home page when that page is on (memberships and the guest rules go to
 * the memberships page, the day pass to the free trial page, the questions and directions to Plan your visit), so the
 * home page stays short. Without the page, it stays on the home page.
 */
export const HOSTS = {
  "gym-memberships": "gym-membership-page",
  "gym-friend": "gym-membership-page",
  "gym-daypass": "gym-trial",
  "questions": "plan-visit",
  "visit": "plan-visit",
};

/** A look's home order must list every section exactly once. @param {unknown} order @returns {string|null} */
export function homeOrderProblem(order) {
  if (order === undefined) return null;
  const ids = Object.keys(HOME_PARTS);
  if (!Array.isArray(order)) return `homeOrder must be a list of: ${ids.join(", ")}`;
  const unknown = order.filter((id) => !ids.includes(id));
  if (unknown.length) return `homeOrder has unknown sections: ${unknown.join(", ")}`;
  const missing = ids.filter((id) => !order.includes(id));
  if (missing.length) return `homeOrder leaves out: ${missing.join(", ")}`;
  if (new Set(order).size !== order.length) return "homeOrder lists a section twice";
  return null;
}
