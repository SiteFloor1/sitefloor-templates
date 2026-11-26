// @ts-check
/**
 * DEMO ONLY. Simulated show-day rows for the Wrenna demo's winter showcase: three sample codes, updated yesterday.
 * Never bundled into client sites.
 */

/** @type {import("../kits/ballet/features/ballet-showday/ballet-showday.js").ShowDayProvider} */
export const simulatedShowDay = {
  async load() {
    const row = (/** @type {Record<string, string>} */ r) => ({ code: "", class: "", arrive: "", door: "", costume: "", hair: "", collect: "", notes: "", ...r });
    return {
      ok: true,
      updatedAt: Date.now() - 86_400_000,
      rows: [
        row({ code: "LB-TUE", class: "Little ballet (Tuesday)", arrive: "1.15pm", door: "Stage door, round the side of the theatre", costume: "Pink tutu and headband (we bring them)", hair: "Low bun, no clips showing", collect: "4.30pm from the foyer", notes: "Pink ballet socks and a bottle of water, named." }),
        row({ code: "B1-WED", class: "Ballet one (Wednesday)", arrive: "12.45pm", door: "Stage door, round the side of the theatre", costume: "Lilac dress (we bring it)", hair: "High bun, hairnet", collect: "4.30pm from the foyer" }),
        row({ code: "SEN-THU", class: "Senior ballet (Thursday)", arrive: "11.30am", door: "Stage door", costume: "Own pointe shoes; costumes in dressing room 2", hair: "Classical bun, stage make-up", collect: "After the bows, about 5.15pm", notes: "Seniors stay for both performances." }),
      ],
    };
  },
};
