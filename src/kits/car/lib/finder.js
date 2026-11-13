// @ts-check
/**
 * "Have you done my car?": the studio's own posts, matched by the hashtags it uses for each make and
 * model (e.g. #bmw and #bmw3series). Nothing is matched by guessing from captions.
 */

/** @typedef {{ name: string, tag: string, vehicle: string }} Model */
/** @typedef {{ name: string, tag: string, models: Model[] }} Make */
/** @typedef {{ tags: string[] }} TaggedPost */

/**
 * @template {TaggedPost} P
 * @param {P[]} posts @param {Make} make @param {Model|null} model
 * @returns {{ exact: P[], sameMake: P[] }} posts of that model, and other posts of that make
 */
export function postsFor(posts, make, model) {
  const ofMake = posts.filter((p) => p.tags.includes(make.tag) || make.models.some((m) => p.tags.includes(m.tag)));
  if (!model) return { exact: ofMake, sameMake: [] };
  const exact = ofMake.filter((p) => p.tags.includes(model.tag));
  return { exact, sameMake: ofMake.filter((p) => !exact.includes(p)) };
}
