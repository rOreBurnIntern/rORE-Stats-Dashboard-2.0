# PRD — P1-3 Remove Burncoin text

## Goal
Remove all remaining "Burncoin" text from the rORE dashboard UI and related tests, replacing it with "rORE" or protocol-appropriate wording, in line with the current PRD.

## Constraints
- Work in a separate branch/worktree, not main.
- Keep changes minimal and focused on text cleanup.
- Update tests as needed.
- Do not change unrelated behavior or layout.

## Tasks
- [x] Find all remaining occurrences of "Burncoin" in the project.
- [x] Replace UI text with "rORE" or more accurate protocol wording.
- [x] Update tests/assertions for renamed text.
- [x] Verify `grep -r "Burncoin"` only returns allowed non-UI references, if any.
- [x] Run `npm test` and `npm run build`.
- [x] Commit changes on the fix branch with a clear message.
- [x] Report exact files changed and any remaining intentional references.
