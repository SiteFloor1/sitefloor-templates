// @ts-check
/**
 * The car studio's pictures shared by every car site (src/kits/car/assets, copied to img/kit/; credits in
 * src/kits/car/assets/CREDITS.md). The Showroom draws the 3D studio car (studio-car.glb); the PPF planner and
 * the tint page use a real saloon photographed from the side and a car from above. Shapes were traced by hand
 * over each photo, on a 1400-wide grid (w × h), so they work at any size.
 */

/** @typedef {"hatch"|"saloon"|"suv"|"van"} Body photographed sizes (a "supercar" is shown by the 3D Showroom) */
/** @typedef {[number, number][]} Poly */

/** Vehicle sizes a studio prices by (site.vehicles[].body). */
export const BODIES = /** @type {const} */ (["hatch", "saloon", "suv", "van", "supercar"]);

/**
 * Each vehicle size from the side, rendered from its 3D car (see CARS below) with clear glass, and its side glass
 * as two masks rendered from the same model: the front side windows and the rear windows (a panel van has none
 * behind). The tint visualiser darkens only the glass, through those masks.
 * @type {Record<Body, { src: string, w: number, h: number, front: string, rear: string|null, alt: string }>}
 */
export const BODY = {
  hatch: { src: "img/kit/body-hatch.webp", w: 1400, h: 577, front: "img/kit/body-hatch-front.webp", rear: "img/kit/body-hatch-rear.webp", alt: "A three-door hatchback from the side" },
  saloon: { src: "img/kit/body-saloon.webp", w: 1400, h: 464, front: "img/kit/body-saloon-front.webp", rear: "img/kit/body-saloon-rear.webp", alt: "A saloon from the side" },
  suv: { src: "img/kit/body-suv.webp", w: 1400, h: 556, front: "img/kit/body-suv-front.webp", rear: "img/kit/body-suv-rear.webp", alt: "An SUV from the side" },
  van: { src: "img/kit/body-van.webp", w: 1400, h: 574, front: "img/kit/body-van-front.webp", rear: null, alt: "A panel van from the side" },
};

/** The saloon side photo used by the planner and the tint page. */
export const SALOON = { src: "img/kit/photo-saloon.webp", w: 1400, h: 442 };

/**
 * The 3D cars, one per vehicle size, and a still picture of each rendered from the same model (credits and
 * licences in src/kits/car/assets/CREDITS.md; how they were prepared in tools/car-models/). The credit line is
 * shown wherever the car is, as CC BY asks: the modeller (linked to their profile, so no carmaker's name appears),
 * that we changed the model, and the licence (linked).
 */
const CC_BY = { licence: "CC BY 4.0", licenceUrl: "https://creativecommons.org/licenses/by/4.0/" };
const car = (/** @type {string} */ id, /** @type {string} */ by, /** @type {string} */ url, lic = CC_BY, dir = "img/kit") => ({
  model: `${dir}/${id}.glb`, poster: `${dir}/${id}.webp`, small: `${dir}/${id}-900.webp`, w: 1600, h: 1000,
  credit: { text: `3D car by ${by} (adapted)`, url, ...lic },
});
export const CARS = {
  supercar: car("studio-car", "Eric Chadwick (“Car Concept”)", "https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept", CC_BY, "img/cars"),
  saloon: car("car-saloon", "lazercar", "https://sketchfab.com/lazercar", CC_BY, "img/cars"),
  suv: car("car-suv", "Black Snow", "https://sketchfab.com/BlackSnow02", CC_BY, "img/cars"),
  hatch: car("car-hatch", "Daniel Zhabotinsky", "https://sketchfab.com/DanielZhabotinsky", CC_BY, "img/cars"),
  van: car("car-van", "Daniel Zhabotinsky", "https://sketchfab.com/DanielZhabotinsky"),
};
/** The concept supercar (kept for older references). */
export const STUDIO_CAR = CARS.supercar;

/**
 * Panels the PPF planner can show, traced on the car from above (plan.webp, 599 × 1200) and from the side
 * (SALOON, 1400 × 442). A panel can appear in one view or both.
 * @type {Record<string, { top?: Poly[], side?: Poly[] }>}
 */
export const PANEL_SHAPES = {
  bumper: { top: [[[150, 28], [300, 18], [450, 28], [520, 75], [530, 120], [70, 120], [78, 75]]],
    side: [[[1290, 195], [1395, 250], [1395, 345], [1300, 352], [1290, 280]]] },
  lights: { top: [[[80, 95], [150, 80], [155, 135], [85, 140]], [[449, 80], [519, 95], [514, 140], [444, 135]]],
    side: [[[1280, 200], [1365, 200], [1365, 240], [1280, 225]]] },
  grille: { top: [[[232, 10], [368, 10], [372, 30], [228, 30]]] },
  bonnet: { top: [[[100, 125], [500, 125], [515, 330], [85, 330]]] },
  wings: { top: [[[55, 140], [98, 130], [88, 420], [55, 430]], [[502, 130], [545, 140], [545, 430], [512, 420]]],
    side: [[[1000, 172], [1250, 196], [1292, 214], [1290, 300], [1250, 245], [1200, 218], [1130, 218], [1080, 250], [1050, 330], [1000, 330]]] },
  mirrors: { top: [[[10, 500], [75, 478], [85, 525], [20, 535]], [[525, 478], [590, 500], [580, 535], [515, 525]]],
    side: [[[858, 88], [906, 94], [906, 136], [860, 132]]] },
  doors: { top: [[[55, 545], [125, 545], [130, 900], [55, 900]], [[475, 545], [545, 545], [545, 900], [470, 900]]],
    side: [[[548, 126], [998, 126], [998, 328], [592, 328], [548, 250]]] },
  sills: { top: [[[42, 600], [56, 600], [56, 890], [42, 890]], [[544, 600], [558, 600], [558, 890], [544, 890]]],
    side: [[[420, 332], [1050, 332], [1050, 362], [420, 362]]] },
  roof: { top: [[[150, 565], [450, 565], [465, 850], [135, 850]]] },
  quarters: { top: [[[55, 905], [130, 905], [130, 1080], [80, 1100], [55, 1050]], [[470, 905], [545, 905], [545, 1050], [520, 1100], [470, 1080]]],
    side: [[[112, 122], [546, 122], [546, 250], [590, 328], [420, 328], [400, 250], [330, 216], [260, 216], [200, 240], [160, 200], [112, 192]]] },
  taillights: { top: [[[82, 1092], [96, 1094], [136, 1140], [170, 1168], [150, 1166], [100, 1135], [84, 1110]], [[517, 1092], [503, 1094], [463, 1140], [429, 1168], [449, 1166], [499, 1135], [515, 1110]]] },
  rear: { top: [[[130, 1040], [470, 1040], [510, 1110], [470, 1185], [130, 1185], [90, 1110]]],
    side: [[[15, 192], [112, 192], [160, 232], [180, 330], [22, 330]]] },
};

export const PANELS = Object.keys(PANEL_SHAPES);

/** The saloon photo's glass (traced for its recolour map), for the tint page's "what the law says" picture. */
export const SALOON_GLASS = {
  fronts: [[[560, 30], [650, 26], [750, 40], [830, 70], [862, 92], [858, 121], [570, 122]]],
  rear: [[[298, 112], [330, 80], [400, 50], [470, 36], [538, 30], [555, 120]]],
};

/** SVG path data for a list of polygons. @param {Poly[]} polys */
export const polyPath = (polys) => polys.map((p) => `M${p.map((q) => q.join(" ")).join("L")}Z`).join("");

/**
 * The driver's-seat photos (img/kit/pov-*.webp): each window by day, and the side windows and windscreen at night,
 * with the glass in each traced by hand. Even-odd paths: a second shape inside the first cuts it out (the rear-view
 * mirror is inside the car, so it isn't tinted). Keys are "<window>-<day|night>".
 * @type {Record<string, { file: string, w: number, h: number, glass: Poly[], alt: string }>}
 */
export const POV = {
  "fronts-day": { file: "pov-side", w: 1400, h: 933, alt: "Looking out of a front side window at fields and a crash barrier, the door mirror in view",
    glass: [[[180, 785], [222, 560], [400, 400], [560, 252], [700, 160], [850, 108], [1100, 48], [1300, 18], [1400, 10], [1400, 560], [1340, 762]]] },
  "fronts-night": { file: "pov-side-night", w: 1400, h: 934, alt: "Looking out of the front side window at night, the door mirror and a dark road outside",
    glass: [[[0, 0], [470, 0], [500, 250], [530, 620], [480, 780], [300, 870], [0, 900]]] },
  "windscreen-day": { file: "pov-day", w: 1060, h: 800, alt: "Looking out through the windscreen from the driver's seat, a motorway ahead and the dials below",
    glass: [[[0, 0], [1060, 0], [1060, 560], [710, 548], [60, 560], [0, 520]], [[1060, 0], [985, 0], [940, 40], [924, 105], [924, 185], [945, 212], [1060, 214]]] },
  "windscreen-night": { file: "pov-night", w: 1400, h: 933, alt: "Looking out from the driver's seat at dusk, tail lights on the road ahead and the dials glowing below",
    glass: [[[120, 160], [300, 150], [1100, 150], [1400, 270], [1400, 560], [1250, 620], [900, 650], [500, 680], [160, 720], [140, 600], [120, 400]],
      [[965, 350], [1300, 330], [1300, 480], [980, 470]]] },
  "rear-day": { file: "pov-rear", w: 1400, h: 934, alt: "Looking back through the rear window from inside, a wet road and trees behind",
    glass: [[[188, 289], [228, 245], [525, 241], [543, 289], [901, 289], [910, 241], [1225, 245], [1269, 280], [1286, 604], [1260, 683], [1208, 691], [228, 691], [184, 648]]] },
  "rear-night": { file: "pov-rear-night", w: 1400, h: 934, alt: "Looking out of a rear passenger window at night, the lights of passing traffic streaking by",
    glass: [[[1040, 0], [1400, 0], [1400, 934], [1090, 934], [1060, 600]]] },
};
