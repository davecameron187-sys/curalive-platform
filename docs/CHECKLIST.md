# CuraLive — Project Owner Checklist

---

## Starting a Replit Session
- [ ] Say: **"Check GitHub for new Manus specs"**
- [ ] Review what I report — note any `spec-ready` features
- [ ] If Manus has a new spec → open the file on GitHub, copy the REPLIT SUMMARY block, paste it into Replit chat

---

## Starting a Manus Session
- [ ] Tell Manus which features to spec next
- [ ] Remind Manus: **spec files only in `docs/specs/`** — no code files
- [ ] Remind Manus: every spec needs a **REPLIT SUMMARY block** at the top
- [ ] Ask Manus to update `docs/specs/STATUS.md` when done (mark as `spec-ready`)

---

## Ending a Replit Session
- [ ] Say: **"Push to GitHub"**
- [ ] Confirm the push succeeded (I will confirm with a commit ID)
- [ ] Note any features that are now `implemented` and tell Manus so they don't re-spec them

---

## Ending a Manus Session
- [ ] Check that Manus committed to `docs/specs/` only (not `client/` or `server/`)
- [ ] Check that `docs/specs/STATUS.md` is updated to `spec-ready`
- [ ] You're ready to start a Replit session

---

## The One-Line Rule
> **Manus writes → you copy the summary → Replit builds → you say push.**

---

## Warning Signs
| What you see | What to do |
|---|---|
| Manus says "I already built that" | Remind them: specs only, no code |
| Sync check shows unexpected GitHub files | Tell Replit Agent — it will fix it |
| Push fails | Tell Replit Agent — it will diagnose |
| You're unsure what's built | Ask Replit Agent: "What's currently implemented?" |
| You're unsure what Manus is working on | Ask Manus directly |

---

## Useful Phrases (copy-paste ready)

**To Replit at session start:**
> Check GitHub for any new Manus specs or unimplemented work

**To Replit at session end:**
> Push to GitHub

**To Manus when requesting a spec:**
> Please write a spec for [feature name] and save it to docs/specs/ with a REPLIT SUMMARY block at the top. Mark it spec-ready in STATUS.md when done.

**To Manus as a reminder:**
> Please do not push any code files — specs only in docs/specs/. Replit Agent handles all implementation.
