# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## 5. Test Before Every Commit

**Before every commit, create all missing tests, then run them all. Commit only if everything passes.**

Three kinds of test, all required:
- **Unit:** every function or module you added or changed. Keep logic out of `.astro` files; put it in `src/lib/` so it can be unit-tested.
- **End to end:** every user-facing behaviour you added or changed, driven through a real browser (globe loads, popups, navigation, mobile layout).
- **Regression:** every bug you fix gets a test that fails without the fix and passes with it. Keep these forever.

Process, in order:
1. Look at the diff and list every behaviour it adds, changes or fixes.
2. Write each missing test of all three kinds. If a kind has no harness yet, set it up as part of this commit.
3. Run the full suite: `npm test`, the end-to-end tests, `npx astro check` and `npm run build`. See AGENTS.md → Testing for the commands.
4. If anything fails, fix the code and re-run. Never commit with a failing test.
5. Only then commit, and say in the commit message or summary which tests were added.

Rules:
- Never delete, skip, loosen or weaken a test just to get it passing. If a test is wrong, say so and explain the fix.
- Confirm each new test can fail: break the code, watch it fail, restore it.
- Docs-only changes need no new tests, but still run the existing suite before committing.
- If the user tells you to commit without tests, say what is untested, then follow their instruction.

## 6. Follow the Design Principles

**All UI work follows DESIGN.md.**

- Read DESIGN.md before changing any page, layout or style.
- Use tokens from `src/styles/tokens.css`; never hard-code colors, sizes or spacing.
- Unchecked rules use `<Unverified />`; every rule shows its source and date.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
