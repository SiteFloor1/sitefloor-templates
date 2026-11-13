# What's worth checking (construction kit, Plus)

A page (`survey.html`): pick the house's age (Victorian or Edwardian, 1920s or 1930s, 1945 to 1979, since 1980) and
see what is worth looking at before planning work on it, then "ask us to look at your house" on WhatsApp with the
age and the postcode district. Without script every age shows.

The checklist lives in `lib/survey.js`, the same for every builder: general guidance, labelled "General guidance, not
a survey". Items that state a fact carry their official source and the date checked: lead pipes (Drinking Water
Inspectorate: a home built before 1970 may have them), asbestos (HSE: any building built or refurbished before 2000),
earlier sign-offs (GOV.UK building regulations) and the planning history (GOV.UK permitted development). The rest
are what to look at, not claims.

```json
"surveyPage": { "title": "What's worth *checking*", "intro": "…", "start": "victorian", "message": "Hello …, could you come and look at our house?" }
```
