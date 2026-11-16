# letting-moveday: move-in day planner (Signature)

The tenant's showpiece. A page: pick the day the keys are handed over (and, if earlier, the day the deposit was
paid); the plan lays out the day and the weeks after, and "Add to my calendar" saves it as a calendar file (timed
steps at the agent's local time, the rest all-day). The deposit step is the law: protected, with the scheme and the
prescribed information given, within 30 days of the deposit being paid (lib/moveday.js, GOV.UK, dated). Everything
else is the agent's: `moveday.steps` (`id`, `label`, `offset` in days from the keys, optional `time` HH:MM, `note`),
such as the inventory check-in, the keys, meter readings, telling the council for council tax.
Settings (`moveday`): `title`, `intro`, `steps`. Nothing is sent or stored.
