# Pattern 1 — Feedback: the "what broke" story

Working notes for the AI Patterns talk (AI Tinkerers Doha, Round 3, Mon 21 Sep 2026).
Every quote below is verbatim from a changelog or commit in this workspace, with the
source cited. Nothing here is reconstructed from memory — check the citation before
saying any of it on stage.

---

## The thesis, in one line

**The feedback system never failed loudly. It failed by going quiet.**

Not a single incident below was a backend outage. Every one was a report that was
never collected, never delivered, or delivered wrong — and looked fine from the
inside the whole time.

---

## The spine of the segment

### Act 1 — The obvious version of the idea

A button in the corner. It files a GitHub issue. When you close the issue, the
reporter gets an email telling them the fix is out. The loop closes. Ship it.

### Act 2 — The scar

> **"Every 'your feedback was fixed' email told the reporter to wait for an App
> Store release. 43 of the 45 we have ever sent said it. Most of them were wrong."**

*Source: `cold-club`, commit `45641ed`, `git show 45641ed:todo/2026-09-11.md` — the
changelog is titled "The fix emails have been lying to testers, and we can stop
guessing." Verified 2026-09-18.*

The email picked its "here's how to go get it" line from a `channel:` label on the
issue. The label was a manual step.

> "The label was a manual step. Nobody did it. So `resolveChannel()` fell through to
> its App Store default on essentially every ticket we have ever closed."

### Act 3 — The discovery moment

One wrong default misled two testers **in opposite directions on the same day**:

| Reporter | What the email told them | What was actually true |
|---|---|---|
| John Paul | Wait for an App Store release | The fix was **already on his phone** over the air. He just had to reopen the app. |
| Matt | Wait for an App Store release | He needed **TestFlight build 43**, which had been sitting there for a week. |

> "Neither would ever have received what the email promised. Both were left waiting
> on nothing, with no way for us to take it back — the webhook fires on `closed` and
> never again."

This is the beat to slow down on. Two people, opposite errors, one default, no undo.

### Act 4 — The turn

> **"The label was never something to remember. It was always derivable."**

Every ticket already carried the reporter's own runtime fingerprint. An over-the-air
update reaches a build *if and only if* that fingerprint matches the one the
published update targets. That is a lookup, not a judgement call.

The close script now reads the runtime off the ticket, asks the build service what
production actually published, and labels from the comparison. And critically:

> "It **refuses to close** when it cannot tell, instead of guessing politely."

Run against the three tickets that caused the incident, it reproduced the right
answer with no help.

### Act 5 — The twist that earns the audience's trust

The first version of the fix script batched two label edits into one command. The
CLI rejects the *whole* command when any single label is unknown — so a missing
label silently took the other one down with it, and the script printed success.

> **"That is the same silent-failure shape as the bug it was written to kill."**

### Act 6 — The limit you do not paper over

> "Relabelling a closed issue fixes nothing, and the script says so. The email has
> already gone."

The only real remedy was a hand-written apology. Say that out loud. It is the part
that makes the rest credible.

### Act 7 — The live closer

Point at the feedback button on the very deck you are presenting.

Right now it files nothing. `POST /api/feedback` returns **500**. The GitHub App
behind it has selected-repository access that covers one repo, and this is not that
repo. The repo it is pointed at has received **zero issues in its entire life.**

*Source: `openstage/todo/2026-09-17.md`; tracked as `alibad/humanquest#5`; re-verified
live against production 2026-09-18 — HTTP 500, empty body.*

Same shape as everything else in the story. No error anyone would see. Just silence.

> **If it is fixed by showtime, tell it in past tense and file a live issue on stage.
> If it is not, demo the 500. The failure is the more honest demo.**

---

## Why it became a pattern, not a fix

The argument for extracting this into a reusable skill is that the fixes flow *back*
into it, so the next app never relearns the lesson:

- The Flutter annotator-overlay bug (below) is now a section in the skill's own
  reference, at `~/.claude/skills/add-feedback-widget/references/flutter.md`
  lines 53–90, headed "⚠️ The FAB still lands on top of the screenshot."
- The close-email disaster produced `close-feedback.py` in the same commit that
  documented it, and the skill now names the script as the *only* supported way to
  close a feedback issue.

> "Closing by hand is now the wrong way to close. The skill documents the script as
> the only route, because the close *is* the email — there is no draft step, no undo,
> and no second chance to tell a tester where their fix went."

---

## Spare beats (pick one or two if you have time)

**"Called once in its entire life."**
> "The in-app feedback endpoint has been called **once in its entire life**, on
> 2026-08-25, and it returned 200. The backend was never the problem."

Three simultaneous faults: the button was compiled out of every native build (the
flag existed *specifically* so TestFlight builds could carry it, and no native build
ever set it); a hand-run deploy dropped the same flag from the live web app an hour
earlier; and the admin console 500'd on an ESM import that threw before the route
could read the auth header. *Source: `scribe_quest/todo/2026-08-27.md` line 443,
commit `b34ef8a`.* The tell was "the wrong status code for the simplest possible
request."

**The widget will happily file an empty report.**
`alibad/humanquest#3` — title `[General] test — Home`, body: "No description
provided." With a screenshot and a full browser fingerprint attached. Verified
2026-09-18. All three feedback-labelled issues ever filed in that repo are tests.

**The report button existed only where it could never be used.**
Reporting lived in the panel that appears *after* you answer — the one moment it is
not needed. A learner stuck on a broken exercise could not answer, so they could not
say so. *Source: `stack_quest`, commit `37c831c`.*

**The icon filtered the feedback.**
A bug glyph tells people the button is for reporting breakage, so ideas and praise
go unsent. *Source: `scribe_quest`, commit `60639a8`.*

**Designed to look broken.**
The trigger rested 18pt *off* the screen edge, on the theory it should read as a
grab-tab. On screen that is a circle sliced by the viewport — "indistinguishable
from a rendering bug, which is exactly how it was reported."
*Source: `scribe_quest/todo/2026-08-26.md`, commit `d3647b2`.*

**Home-crowd beat — it happened at this meetup.**
At the Doha inaugural, the floating feedback bubble sat on top of the venue check-in
QR code. Reported live, during the event. The fix hides the bubble on lobby routes:
"The bubble is for builders reading the deck, not for the venue projector."
*Source: `tinkerer-presenter/todo/2026-05-18.md`, commit `c3d652c`.*

**Two channels that never meet.**
Four real TestFlight reports sat unread for a day because the in-app reporter and
TestFlight do not meet, and only one was wired to the console. Later generalised:
64 reports across five apps were invisible, "one of them a crash nobody had opened."
*Sources: `stack_quest/todo/2026-09-09-feedback.md`; `done_os/todo/2026-09-17.md`,
commit `742b801`.*

---

## Do not use

- The public `alibad/feedback-widget` repo has no scar history — 5 documentation
  commits, 0 issues. It is a squashed publish of an already-mature skill. Do not
  imply the story lives there.
- The `done_os` website form-reset mislabel is one line with no detail. Too thin to
  build on.
