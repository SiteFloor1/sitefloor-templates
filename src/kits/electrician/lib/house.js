// @ts-check
/**
 * What the house in 3D is made of: the rooms the model has and the kinds of fitting it can draw. A client sets which
 * rooms appear, how many of each fitting each room has and its price for each kind (site.json "house3d"); the model's
 * shape is the kit's (a glass pavilion with a stone first floor, a sunken cinema, a terrace, a pool and a garden), not
 * a copy of anyone's home. Shared by the validator, the page and the 3D scene.
 */

/**
 * The model's rooms and where each sits (metres; x across the front, y up, z towards the garden; the glass front of the
 * ground floor is at z = 4). `box` is [x0, x1, y0, y1, z0, z1]. The garden and the pool are outside.
 */
export const ROOMS = /** @type {const} */ ({
  "living": { label: "Living room", box: [-9, -2.4, 0, 3.2, -4, 4] },
  "kitchen": { label: "Kitchen", box: [-2.4, 3.6, 0, 3.2, -4, 4] },
  "garden-room": { label: "Garden room", box: [3.6, 8.4, 0, 3.2, -4, 4] },
  "hall": { label: "Landing", box: [-4.4, -1.6, 3.45, 6.6, -4.6, 3.4] },
  "bedroom": { label: "Bedroom", box: [-11, -4.4, 3.45, 6.6, -4.6, 3.4] },
  "bathroom": { label: "Bathroom", box: [-1.6, 2.6, 3.45, 6.6, -4.6, 3.4] },
  "cinema": { label: "Cinema room", box: [-9, -2.4, -3.4, -0.3, -4, 4] },
  "garden": { label: "Garden", box: [-16, 13, -0.1, 4, 7.5, 16] },
  "pool": { label: "Pool", box: [-1, 9, -1.5, 0, 8.6, 11.4] },
});

/** Kinds of fitting the model can draw, and the scenes it knows. */
export const FITTINGS = /** @type {const} */ (["downlight", "wall", "pendant", "strip", "uplight", "keypad", "bollard", "underwater", "starlight"]);
export const SCENES = /** @type {const} */ (["evening", "cinema", "away", "off"]);

/**
 * How bright each room is in each scene (0 off to 1 full), as the keypad on the page sets it. Cinema keeps a glow on
 * the landing and the garden so nobody walks in the dark; Away lights a few rooms the way someone at home would.
 * @type {Record<string, Partial<Record<string, number>>>}
 */
export const SCENE_LEVELS = {
  evening: { "kitchen": 0.85, "living": 0.75, "garden-room": 0.9, "hall": 0.55, "bedroom": 0.45, "bathroom": 0.5, "cinema": 0.3, "garden": 0.9, "pool": 0.9 },
  cinema: { "cinema": 0.14, "hall": 0.2, "living": 0.12, "kitchen": 0.1, "garden": 0.35, "pool": 0.4 },
  away: { "living": 0.6, "bedroom": 0.5, "hall": 0.3, "garden": 0.5 },
  off: {},
};

/** The order the house lights up in when it first opens: the way in, then the rooms, then outside. */
export const LIGHT_UP_ORDER = ["garden", "hall", "living", "kitchen", "garden-room", "pool", "bedroom", "bathroom", "cinema"];
