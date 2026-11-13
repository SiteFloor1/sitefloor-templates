// @ts-check
/**
 * The letter-of-wishes guide: general information about a letter of wishes in England and Wales, each point from a
 * named source, checked on the date below. Never advice; the page says to speak to a solicitor. The firm can change the
 * page's title and opening line in site.json, not these facts.
 */
export const CHECKED = "2026-11-04";

export const SOURCES = {
  gazette: { label: "The Gazette, “A letter of wishes explained” (Lodders Solicitors, 6 February 2020)", url: "https://www.thegazette.co.uk/wills-and-probate/content/103504" },
  forsters: { label: "Forsters LLP, “Letter of wishes” (24 February 2022)", url: "https://www.forsters.co.uk/news-and-views/letter-of-wishes" },
  govuk: { label: "GOV.UK, “Search probate records for documents including wills”", url: "https://www.gov.uk/search-will-probate" },
};

/** @type {{ title: string, points: string[], from: (keyof typeof SOURCES)[] }[]} */
export const SECTIONS = [
  { title: "What it is", from: ["gazette", "forsters"],
    points: ["A letter written alongside a will or a trust, to the executors and trustees, saying how you would like them to use the choices the will or trust leaves to them.", "It matters most where they have discretion, for example a trust that lets trustees decide who benefits and when."] },
  { title: "It isn't legally binding", from: ["gazette", "forsters"],
    points: ["Unlike a will, a letter of wishes doesn't bind anyone. It guides the people who make the decisions.", "In practice, trustees rarely depart from a settlor's wishes without a good reason."] },
  { title: "What people put in it", from: ["gazette", "forsters"],
    points: ["How and when beneficiaries should be provided for, for example at certain ages or life events.", "What trustees should weigh when deciding on payments, and who should benefit if the named beneficiaries have died.", "Wishes about giving to charity, family business shares and how investments should be approached.", "Personal matters: funeral wishes, who should have particular personal items, and who to tell."] },
  { title: "It stays private", from: ["govuk", "gazette", "forsters"],
    points: ["Once probate is granted, anyone can order a copy of the probate record, including the will, from GOV.UK.", "A letter of wishes isn't part of that record, so it can say things you wouldn't put in a will. Courts order it to be shown only in limited circumstances."] },
  { title: "Writing and keeping it", from: ["gazette", "forsters"],
    points: ["Write it in plain English, then sign and date it. It doesn't need witnesses.", "Keep it with your will. You can change it at any time without changing the will or the trust deed.", "Review it every few years, and sooner when the family's circumstances change."] },
];
