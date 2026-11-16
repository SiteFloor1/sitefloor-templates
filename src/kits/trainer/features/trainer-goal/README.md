# trainer-goal (Plus, PT-3)

Four taps (what for, training lately, days a week, an injury or condition) → the programme that fits, a sample week
from that programme's `sessions`, the trainer's line for that level, and a WhatsApp message with the answers. An
injury shows the trainer's own `injury` line (a talk first; perhaps a GP's or physio's go-ahead). Nothing promised.
Lives on the Programmes page when `trainer-programmes` is on (home.js HOSTS).

```json
"goalFinder": {
  "title": "What are you training for?", "intro": "…",
  "goals": [{ "id": "stronger", "label": "Getting stronger", "programme": "strength" }],
  "levels": [{ "id": "new", "label": "Not for years", "text": "We start lighter than you'd think…" }],
  "injury": "Tell me about it first…",
  "message": "Hello, I used your goal finder:"
}
```
