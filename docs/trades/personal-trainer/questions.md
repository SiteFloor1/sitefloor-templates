# Personal trainers and small gyms: customer questions

What this trade's customers ask before they get in touch (kit `trainer`, branch `trade/trainer`). How to read it and the questions every trade gets: [`docs/CUSTOMER-QUESTIONS.md`](../../CUSTOMER-QUESTIONS.md).

## Independent personal trainer or small private studio
Researched 15 Nov 2026 from: independent UK trainers' FAQ and price pages (mobile trainers in London, Bath, Uxbridge,
the Surrey Hills and Bournemouth; studio trainers in Kent); PT terms and conditions published by independent trainers,
a London transformation studio, university and council sports centres and a national gym chain; first-session guides
from a fitness industry register, gym chains and trainer-education providers; a London lifestyle magazine's round-up of
private studios; the professional body's register and careers pages; the Royal Parks' and London boroughs' park fitness
licence pages; directory listings and reviews of mobile trainers. Every price, policy, qualification and area on a
client site comes from the client.

**Money and commitment**
| Customers ask | What answers it |
|---|---|
| What does one session cost? Is a block of 5, 10 or 20 cheaper per session? | `trainer-prices`: single price and blocks with the per-session figure worked out from the trainer's own prices |
| How long does a block last before sessions expire? | `trainer-prices` (each block's "use within", in the trainer's words) |
| Is the first session or consultation free? | `trainer-start` (the trainer's own answer) |
| Can I train with a friend or partner and split it? | `trainer-prices` (duo price, if offered) |
| Do you do monthly online coaching, and what's in it? | the online page; `trainer-prices` |

**Where and when**
| Customers ask | What answers it |
|---|---|
| Where do we train: your studio, a gym, my home, a park, online? | `trainer-where`: each place the trainer actually works, with what's there |
| Do you come to my area? | `trainer-coverage` (Plus): postcode districts the trainer lists, no API |
| If we train in a park, are you licensed? (Royal Parks and most London boroughs require it) | `trainer-where`: the licence named only if the trainer holds it |
| Do I need equipment at home? Do you bring it? | `trainer-where` and the questions |
| What times are free this week? Early mornings, lunchtimes, weekends? | `trainer-slots`: free slots from the trainer's Google Sheet, hidden when stale |
| Is there parking, showers, a changing room? | Plan your visit (studio or gym only) |

**Is this right for me?**
| Customers ask | What answers it |
|---|---|
| Is this right for my goal: strength, fitness, a race, back pain, after a baby? | `trainer-goal` (Plus): goal, experience, days a week → the right block and a sample week |
| I'm a complete beginner and nervous about the gym. Will it be too hard? | `trainer-start`: what the first session is, step by step |
| What happens in the first session? Forms, measurements, a workout? | `trainer-start` (health questionnaire, goals, a movement check, a light session, in the trainer's words) |
| I have an injury or a medical condition. Can you still train me? | the questions: the trainer's own words; a GP's go-ahead where the questionnaire asks for it; never a treatment claim |
| Can you help with nutrition, or only training? | the questions; only what the trainer is qualified for |
| Do you train women, men, older people, pre and postnatal? | programme pages; specialist qualifications named only if held |

**Trust**
| Customers ask | What answers it |
|---|---|
| Are you qualified? Level 3? Registered? Insured? First aid? | `trainer-credentials`: only qualifications held, each with the awarding body and year; a link to the trainer's public register entry where they have one (never "registered" without it) |
| Can I see results from people like me? | `trainer-stories` (Plus, client-only): written consent, the client's own words and photos; never a promised result |
| How long before I see a difference? | the questions: the trainer's honest answer; no weight-loss figures or promises |
| Real reviews? | Google reviews, copied with name and date |

**Keeping it going**
| Customers ask | What answers it |
|---|---|
| What's the cancellation policy? (24 hours is near-universal; a late cancel loses the session) | the questions and the block planner's summary, in the trainer's words |
| What if I'm late, or you cancel? | the questions |
| Can I put my sessions in my calendar? | `trainer-block` (Signature): the block as one .ics |
| What do I bring or wear, and what should I do the day before? | `trainer-checklist` (Signature) |
| Do you train teams at work, or a family together? | the corporate and family page (Signature) |
