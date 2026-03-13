# Action Plan: Improved Agentic Coding Loop

**Based on**: Research synthesis from FelixCraft, Azure patterns, TDD, worktree isolation, error recovery
**Owner**: rOreBurn_Intern
**Date**: 2025‑03‑12
**Status**: Draft – awaiting user approval

## Problem Statement

Our current coding agent workflow has gaps:
- Agents run in the main workspace (no isolation)
- No validation that produced code actually works (build may fail)
- Poor error recovery (subagent finished with exit 0 but made no changes)
- Limited observability (no structured logs)
- PRDs lack concrete test plans
- No checkpointing or resumability

These gaps cause wasted time, silent failures, and reduced trust in automation.

## Proposed Changes (Phased)

### Phase 1: Immediate Improvements (1‑2 days)

**Goal**: Make the current P0‑1/P0‑2/P0‑3 execution reliable and observable.

1. **Mandate Git Worktree Isolation**
   - Before any coding agent spawn, create a dedicated worktree:
     ```bash
     git worktree add -b task/<task-id> .trees/<task-id> main
     ```
   - Spawn agent inside that worktree (set cwd).
   - On success (after merge to main), remove worktree.
   - On failure, keep worktree for inspection, then remove after review.

   **Implementation**: Update `ralphy` script (if we own it) or document manual steps. For now, do it manually before `ralphy`.

2. **Enhance PRD Template with Test Plan**
   - Add required section: **Test Plan**
   - Must include concrete commands the agent will run to verify success:
     - Build: `npm run build`
     - Lint: `npm run lint`
     - Tests: `npm test -- --testNamePattern=...`
     - API validation: `curl -f https://.../api/stats | jq ...`
   - Agent must execute these and report results. If any fail, task is incomplete.

3. **Start Structured Logging**
   - Create directory `AGENT_LOGS/` in project root.
   - Each agent run (via ralphy) must append a JSON line with:
     ```json
     {
       "run_id": "<uuid>",
       "task": "P0‑1: Wire page.tsx to DB",
       "prd": "PRD-P0-fixes.md",
       "model": "openai/gpt-5.4",
       "worktree": ".trees/p0-1-xyz",
       "started_at": "2025‑03‑12T12:00:00Z",
       "finished_at": "...",
       "exit_code": 0,
       "git_diff_stat": "2 files changed, 150 insertions(+)",
       "build_success": true,
       "tests_run": 0,
       "tests_passed": 0,
       "error": null
     }
     ```
   - This enables later analysis.

4. **Auto‑validation After Agent Finish**
   - ralphy wrapper (or manual post‑check) must:
     - Run `git diff --stat` and record
     - Run `npm run build` (or project build command)
     - If build fails → auto‑retry **once** with error details fed back to agent (append to PRD as "previous error")
     - If second attempt fails → mark as failed, alert user, keep worktree intact for manual debug

5. **Manual Approval Before Push**
   - Do not auto‑push any branch.
   - After agent success and build pass, present diff to user via `message`.
   - Require explicit "yes" before performing `git push` and worktree cleanup.

### Phase 2: Enhanced Orchestration (1‑2 weeks)

6. **Checkpointing & Resumability**
   - Each run gets a `run_id` (UUID).
   - Agent writes checkpoint files after each major step: `AGENT_LOGS/<run_id>_checkpoint_01.json`
   - Includes: current step, inputs, outputs, timestamp.
   - On restart, we can resume from last checkpoint if needed.

7. **Fallback Agent Cascade**
   - Primary: Codex with GPT‑5.4 (as now)
   - Recovery: On failure, spawn a second agent with a simpler prompt and cheaper model (StepFun Flash) to either fix or produce minimal viable result.
   - Emergency: Escalate to human with full logs and diagnostics.

8. **Build an Evaluation Suite**
   - Create a set of "golden" test cases for the stats dashboard:
     - Expected API responses (fixtures)
     - Chart data shape validation scripts
     - Browser console error detection (Puppeteer/Playwright)
   - Run these on every agent success before considering done.

### Phase 3: Observability & Continuous Improvement (ongoing)

9. **Metrics Dashboard**
   - Aggregate `AGENT_LOGS/*.jsonl` to show:
     - Success rate over time
     - Average task duration
     - Cost per task
     - Retry rate
     - Human escalation count
   - Use this to set targets and detect regressions.

10. **Weekly Failure Retrospective**
    - Review failed runs from past week.
    - Identify common failure modes.
    - Update PRD templates, agent instructions, or validation scripts accordingly.

---

## Immediate Action Items (for P0 tasks)

Given we are currently stuck because the last ralph run produced nothing, we should:

1. Manually create a worktree for P0‑1:
   ```bash
   git worktree add -b task/p0-1-db-stats .trees/p0-1-db-stats main
   cd .trees/p0-1-db-stats
   ```

2. Create a minimal PRD‑p0‑1.md that includes:
   - Purpose
   - Acceptance criteria (lib/db-stats.ts exists, exports 5 functions, build passes)
   - **Test Plan**: `npm run build` must succeed; `node -e "require('./lib/db-stats')"` must not throw

3. Spawn Codex with focused prompt:
   ```bash
   ralphy --codex --prd PRD-p0-1.md --model openai/gpt-5.4
   ```
   (or if ralphy doesn't support model override, use `sessions_spawn` with a direct Codex CLI command)

4. After completion:
   - Check `git diff --stat`
   - Run `npm run build`
   - If build passes, present diff to user for approval.
   - If user approves, push branch, merge to main, cleanup worktree.

5. Log the run to `AGENT_LOGS/` with all required fields.

---

## Expected Benefits

- **Isolation** prevents workspace corruption.
- **Validation** ensures we don't merge broken code.
- **Logging** gives visibility into agent performance.
- **Approval gates** maintain human oversight for merges.
- **Test plans** give agents clear success criteria.
- **Checkpoints** enable resumability after crashes.

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Worktree overhead (disk space) | Clean up promptly after merge; prune regularly |
| Build command varies per project | Detect from `package.json` or allow config |
| Agent ignores worktree boundary | Explicit instructions + monitor `git status` for external file changes |
| Logging adds noise | Keep logs in separate directory; rotate daily |
| Manual approval slows iteration | Only for pushes/merges; agent can work autonomously within worktree |

---

## References

- See `life/resources/ai-agent-coding-loops/BEST_PRACTICES.md` for full research.
- See `life/resources/ai-agent-coding-loops/RESEARCH_FINDINGS.md` for source summaries.

---

**Next**: Present to user for approval. If approved, implement Phase 1 step 1 (worktree) and retry P0‑1 with new process.
