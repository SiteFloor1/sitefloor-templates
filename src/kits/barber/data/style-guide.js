// @ts-check
/**
 * Barber style-guide copy. Trade knowledge shared by every barber site;
 * a client can override author and date in site.json → styleGuide.
 */

export const FACE_SHAPES = [
  { id: "oval", name: "Oval", shape: { forehead: 100, cheeks: 118, jaw: 90, length: 190, chin: 40, hair: "crop" },
    tag: "Slightly longer than wide, softly rounded jaw. The easy one.",
    goFor: "Almost anything. Textured crop with a mid fade is the classic.",
    avoid: "Heavy fringes. Your proportions are the advantage, so show them.",
    askFor: "Mid skin fade, grade 3 on top, textured crop." },
  { id: "round", name: "Round", shape: { forehead: 114, cheeks: 136, jaw: 116, length: 166, chin: 58, hair: "quiff" },
    tag: "Width and length about equal, full cheeks, soft jaw.",
    goFor: "Height on top and tight sides. High fade with a quiff or pompadour.",
    avoid: "Buzz cuts all over and anything bulky at the sides.",
    askFor: "High skin fade, leave 6cm on top for a quiff." },
  { id: "square", name: "Square", shape: { forehead: 120, cheeks: 124, jaw: 122, length: 176, chin: 72, hair: "part" },
    tag: "Forehead, cheeks and jaw all similar. Strong, angular jaw.",
    goFor: "Classic, clean cuts. Taper with a side part, or a crew cut.",
    avoid: "Very rounded, puffy shapes that fight the jaw.",
    askFor: "Low taper, side part, scissor the top." },
  { id: "long", name: "Long", shape: { forehead: 98, cheeks: 104, jaw: 92, length: 214, chin: 36, hair: "fringe" },
    tag: "Noticeably longer than wide. Long chin or high forehead.",
    goFor: "Keep some width at the sides and bring a fringe forward.",
    avoid: "High skin fades with tall quiffs. They add length.",
    askFor: "Low taper, grade 3 sides, textured fringe." },
  { id: "heart", name: "Heart", shape: { forehead: 130, cheeks: 120, jaw: 78, length: 186, chin: 16, hair: "textured" },
    tag: "Wider forehead and cheekbones, narrow pointed chin.",
    goFor: "Medium length on top with a soft fringe. A beard adds width at the chin.",
    avoid: "Short sides with lots of height. It widens the top.",
    askFor: "Mid taper, 4cm on top, light fringe, shape the beard." },
];

export const FADE_TYPES = [
  { name: "Low fade", fade: "line", height: "low", text: "Starts just above the ear. Subtle, office-friendly, grows out well." },
  { name: "Mid fade", fade: "line", height: "mid", text: "Starts at the temple. The most asked-for cut in the shop." },
  { name: "High fade", fade: "line", height: "high", text: "Starts near the parting. Sharp contrast, needs a trim every two weeks." },
  { name: "Taper", fade: "taper", height: "mid", text: "Only the sideburns and neckline go short. The most natural look." },
  { name: "Burst fade", fade: "burst", height: "mid", text: "Curves around the ear in a semicircle. Great with a mohawk or curls." },
  { name: "Drop fade", fade: "drop", height: "mid", text: "Drops down behind the ear towards the neck. Follows your head shape." },
];

export const GRADES = [
  ["0", "Skin", "Foil shaver, no hair at all"],
  ["0.5", "1.5mm", "Shadow, scalp shows through"],
  ["1", "3mm", "Very short, classic buzz"],
  ["2", "6mm", "Short and even"],
  ["3", "9mm", "The most common top for a fade"],
  ["4", "12mm", "Short but soft, scalp hidden"],
  ["6", "19mm", "Enough to push around"],
  ["8", "25mm", "Longest clipper guard. Scissors after this"],
];

export const ASK_TIPS = [
  ["Bring one photo, not five.", "Ideally of someone with hair like yours, not just a cut you like."],
  ["Say the fade height and the grade.", "“Mid skin fade, grade 3 on top, scissor the fringe” is a perfect order."],
  ["Say how you style it.", "If you never use product, say so. It changes how we cut the top."],
  ["Mention the neckline.", "Tapered looks natural as it grows. Squared looks sharper but needs tidying sooner."],
  ["Book every 2 to 3 weeks", "for skin fades. Tapers and scissor cuts last 4 to 6."],
];
