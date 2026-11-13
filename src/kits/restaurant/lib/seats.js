// @ts-check
/**
 * The seat finder: the café's own seats, each with what it has (a socket, the window, a sofa…). Pick what you
 * need and the seats that have all of it light up. A choice is a preference passed on with an order or a
 * table request, never a reservation.
 */

/** What a seat can have, with the words the finder uses. */
export const SEAT_NEEDS = [
  { id: "socket", name: "A socket" },
  { id: "window", name: "By the window" },
  { id: "sofa", name: "A sofa" },
  { id: "quiet", name: "Somewhere quiet" },
  { id: "group", name: "Room for four or more" },
  { id: "dog", name: "Space for a dog" },
  { id: "buggy", name: "Space for a buggy" },
  { id: "step-free", name: "Step-free" },
  { id: "outside", name: "Outside" },
];
export const SEAT_NEED_IDS = SEAT_NEEDS.map((n) => n.id);

/** @typedef {{ id: string, label: string, has: string[], seats: number }} Seat */

/**
 * Seats with everything asked for.
 * @param {Seat[]} seats @param {string[]} needs
 * @returns {string[]} ids
 */
export function seatsFor(seats, needs) {
  return seats.filter((s) => needs.every((n) => s.has.includes(n))).map((s) => s.id);
}

/**
 * The line for the chosen seat: "the window bench (window, socket)".
 * @param {Seat} s
 */
export function seatLabel(s) {
  const words = s.has.map((h) => SEAT_NEEDS.find((n) => n.id === h)?.name.toLowerCase()).filter(Boolean).slice(0, 3);
  return words.length ? `${s.label.toLowerCase()} (${words.join(", ")})` : s.label.toLowerCase();
}
