# letting-journal: the journal (Plus)

An index and a page per article (a collection, counted as one page): long-let articles that answer what tenants and
owners ask, each with who it's for, a date, the date its rules were last checked against GOV.UK, and its sources.
Settings (`journal`): `title`, `intro`, `items`: `{ slug, title, summary, audience, date, checked, sections: [{ h, p: [paragraphs] }], sources: [{ title, url }] }`.
Every source must be a GOV.UK page (or legislation.gov.uk); the settings check refuses others.
