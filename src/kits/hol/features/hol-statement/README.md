# hol-statement: an owner's month (HOL-8, Plus)

A sample monthly statement in the company's own layout: `statement.home`, `month`, `nights`, `guests` (what guests
paid), `costs` (each { label, amount }), `paid` and `paidOn`. The fee line is worked out from `fees.percent`; the
build refuses a statement whose sums don't add up (guests paid − fee − costs = paid). Always labelled a sample; on a
demo, "for a fictional home".
