# ifa-milestones (IFA-10, Signature)

On the pensions topic page (`milestones.topic`): a year of birth in, and out come the year someone can usually first take
money from a personal or workplace pension and their State Pension age year, under the law today (`lib/milestones.js`,
checked 16 Nov 2026 against GOV.UK). No money, no growth, no projection.

Fails closed: birth years before 1960 (the minimum age was 50 until April 2010) and change-over birth years (1960–61, 1971–73, 1977–78) get no year, only GOV.UK's checker; if the rules
haven't been re-checked for 180 days (`CHECKED` in `lib/milestones.js`) the input isn't built and only the link shows.
Re-check the sources and move `CHECKED` forward at least twice a year.

```json
"milestones": { "topic": "pensions" }
```
