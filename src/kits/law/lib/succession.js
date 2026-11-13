// @ts-check
/**
 * The succession map: the firm's own illustration of how an estate can pass across generations (a will, a trust).
 * The firm writes every word and every arrow; this only checks the drawing makes sense and lays it out.
 * It is always shown as an illustration, never advice: no figures, no tax, no outcome.
 */

/** @typedef {{ id: string, label: string, gen: number, kind?: "person"|"trust" }} Node */
/** @typedef {{ gen: number, title: string, text: string, flows: [string, string][] }} Step */
/** @typedef {{ id: string, label: string, nodes: Node[], steps: Step[] }} Scenario */

const ID = /^[a-z0-9-]{1,40}$/;

/** @param {any} s @returns {string[]} problems, as "path: message" with paths relative to the scenario */
export function scenarioProblems(s) {
  /** @type {string[]} */ const out = [];
  if (!s || typeof s !== "object") return ["scenario: an object"];
  const nodes = Array.isArray(s.nodes) ? s.nodes : [];
  if (!nodes.length) out.push("nodes: at least two people or a trust");
  const ids = new Set();
  nodes.forEach((/** @type {any} */ n, /** @type {number} */ i) => {
    if (!ID.test(n?.id ?? "")) out.push(`nodes[${i}].id: lowercase letters, numbers and dashes`);
    else if (ids.has(n.id)) out.push(`nodes[${i}].id: "${n.id}" is used twice`);
    ids.add(n?.id);
    if (typeof n?.label !== "string" || !n.label.trim()) out.push(`nodes[${i}].label: required`);
    if (![1, 2, 3, 4].includes(n?.gen)) out.push(`nodes[${i}].gen: the generation, 1 to 4`);
    if (n?.kind !== undefined && !["person", "trust"].includes(n.kind)) out.push(`nodes[${i}].kind: "person" or "trust"`);
  });
  const gen = new Map(nodes.map((/** @type {any} */ n) => [n?.id, n?.gen]));
  const steps = Array.isArray(s.steps) ? s.steps : [];
  if (!steps.length) out.push("steps: at least one step");
  let last = 0;
  steps.forEach((/** @type {any} */ st, /** @type {number} */ i) => {
    if (!Number.isInteger(st?.gen) || st.gen <= last) out.push(`steps[${i}].gen: each step a later generation than the one before`);
    last = st?.gen ?? last;
    for (const k of ["title", "text"]) if (typeof st?.[k] !== "string" || !st[k].trim()) out.push(`steps[${i}].${k}: required`);
    if (!Array.isArray(st?.flows) || !st.flows.length) { out.push(`steps[${i}].flows: at least one arrow, ["from", "to"]`); return; }
    st.flows.forEach((/** @type {any} */ f, /** @type {number} */ j) => {
      if (!Array.isArray(f) || f.length !== 2 || !ids.has(f[0]) || !ids.has(f[1])) out.push(`steps[${i}].flows[${j}]: two node ids, ["from", "to"]`);
      else if (f[0] === f[1]) out.push(`steps[${i}].flows[${j}]: an arrow needs two different nodes`);
      else if (gen.get(f[1]) < gen.get(f[0])) out.push(`steps[${i}].flows[${j}]: an estate passes down the generations, not up`);
    });
  });
  return out;
}

/**
 * Where each node sits in a drawing `w` wide: one row per generation, nodes spread evenly along it.
 * @param {Scenario} s @param {number} w @param {number} rowH
 * @returns {{ id: string, label: string, kind: string, x: number, y: number }[]}
 */
export function layout(s, w, rowH) {
  const gens = [...new Set(s.nodes.map((n) => n.gen))].sort((a, b) => a - b);
  return s.nodes.map((n) => {
    const row = s.nodes.filter((m) => m.gen === n.gen);
    const i = row.indexOf(n);
    return { id: n.id, label: n.label, kind: n.kind ?? "person", x: Math.round(((i + 1) * w) / (row.length + 1)), y: Math.round(rowH / 2 + gens.indexOf(n.gen) * rowH) };
  });
}

/** Arrows shown once the visitor has reached a step (0-based). @param {Scenario} s @param {number} upTo */
export const flowsUpTo = (s, upTo) => s.steps.slice(0, upTo + 1).flatMap((st, i) => st.flows.map(([from, to]) => ({ from, to, step: i })));
