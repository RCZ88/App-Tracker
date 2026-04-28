## graphify

This project has a graphify knowledge graph. The canonical copy lives in the Obsidian vault:

```
C:\Users\cleme\Documents\CZVault\00_Projects\AppTracker\Graph\
```

A local copy also exists at: `graphify-out/`

### Always (every chat instance):
- BEFORE answering ANY question about this project's architecture, codebase, or structure:
  1. Read `C:\Users\cleme\Documents\CZVault\00_Projects\AppTracker\Graph\GRAPH_REPORT.md` for god nodes and community structure
  2. If you need details, open the relevant note from the Graph folder
- This applies to NEW CHATS - assume I already know about this graph unless told otherwise

### After completing ANY task that modified files:
Run the `maintain-context` skill (`agent/skills/maintain-context/SKILL.md`). The skill is **dynamic** — it assesses the scale of changes and only runs what's needed:

| Scale | What the AI does |
|-------|------------------|
| **1 — Trivial** (typo, color, one-liner) | One-liner in state.md only. No graphify, no vault sync, no build. |
| **2 — Minor** (small bug fix, single function) | Standard state.md entry. Rebuild graphify IF code files changed. |
| **3 — Moderate** (new feature, multi-file fix) | Full state.md. Rebuild graphify. Update PROBLEMS.md + debugging.md if applicable. |
| **4 — Significant** (new module, file add/remove) | Full state.md + arch notes. Rebuild graphify (consider --update). |
| **5 — Major** (restructure, framework change) | Full state.md + version bump. Full graphify pipeline. |

Key commands (do NOT use `_rebuild_code()` directly — Windows UTF-8 bug):
- `python agent/skills/maintain-context/graphify_maintain.py rebuild` — AST-only, fast, no LLM
- `python agent/skills/maintain-context/graphify_maintain.py validate` — Check/fix GRAPH_REPORT.md
- `python agent/skills/maintain-context/graphify_maintain.py sync` — Copy to Obsidian vault
- `python agent/skills/maintain-context/graphify_maintain.py full` — All three at once

**Do not over-update.** A typo fix does not need a graphify rebuild. A color change does not need PROBLEMS.md. Match the response to the severity.

Graphify covers architecture/context; the .md files below cover state/issues/patterns.

---

## Still-Relevant Agent Markdown Files

These files contain information NOT captured in graphify and must still be maintained:

| File | What It Tracks | When to Update |
|------|---------------|----------------|
| `agent/state.md` | Version, recent changes, IPC endpoints, known issues | After EVERY code change |
| `agent/PROBLEMS.md` | Issue tracker with status, priority, root causes | When bugs are found or fixes attempted |
| `agent/debugging.md` | Error patterns and solutions | When a new debugging pattern is discovered |
| `agent/data.md` | DB schemas, IPC endpoint reference | When IPC endpoints or DB schema change |
| `agent/docs/quick-prompt.md` | Diagnostic prompt templates | When a reusable diagnostic pattern is found |
| `agent/docs/RESTORE_PROMPT.md` | Emergency restoration procedure | When project structure changes significantly |
| `agent/docs/SETTINGS_PAGE_FEATURES.md` | Complete Settings page feature reference | When modifying Settings page |
| `agent/COMMITS.md` | Git commit history and conventions | After git commits |
| `agent/REQUESTS.md` | User request history | When user asks for something |
| `agent/constraints.md` | Hard rules and limitations | When new constraints discovered |
| `agent/context.md` | Architecture, tech stack, data flow | When architecture changes |
| `agent/patterns.md` | Reusable code patterns | When new patterns introduced |
| `agent/glossary.md` | Term definitions | When new terms introduced |
| `agent/qwen.md` | Qwen-specific rules | When Qwen instructions change |

### Redundant Files (content already in graphify - do NOT maintain separately)

- `agent/agents.md` — replaced by graphify + this AGENTS.md
- `agent/README.md` — outdated
- `agent/prompt.md` — superseded
- `agent/prompts.md` — superseded by debugging.md and quick-prompt.md

---

## Human Testing Checklist (MANDATORY)

When changes require user testing, add an entry to `agent/PROBLEMS.md` AND link it here. Each item must include:
1. What was changed
2. What to test
3. Expected behavior
4. How it relates to existing PROBLEMS.md entry

| Change | Test Steps | Expected | PROBLEMS.md Ref |
|--------|-----------|----------|-----------------|
| App switching reverts to website | 1. Open browser with YouTube 2. Switch to another app (VS Code) 3. Wait 5+ seconds | Timer shows the new app, not website | Issue #51 (App switching) |
| Timer/activity colors by tier | 1. Open app with productive app 2. Open distracting app 3. Start external activity | Border/timer changes: Green (productive), Red (distracting), Purple (external), Gray (idle) | Issue #52 (Timer colors) |
| Elapsed time wrong (4:59:10) | 1. View Recent Sessions 2. Look at duration | Duration shows correct time difference, not inverted | Issue #53 (Elapsed time bug) |
| Fullscreen height | 1. Click fullscreen on Solar 2. Check height | Full height, no cut off | Issue #54 (Fullscreen height) |
| Duplicate activity buttons | 1. Go to External page 2. Check buttons | No duplicate buttons | Issue #50 (External page layout) |

### Example Entry:
```
| External page charts moved | 1. Go to /external 2. Click any activity 3. Verify charts appear below buttons | Charts visible, no duplicates | Issue #50 (External page layout) |
```

---

## CRITICAL RULES (NEVER violate)

### NEVER use git to revert/reset/restore files
**NEVER run ANY of these commands:**
- `git checkout -- <file>`
- `git checkout HEAD -- <file>`
- `git restore <file>`
- `git reset --hard`
- `git stash`

**Why:** Using git to "fix" errors destroys ALL the user's work and reverts to old broken code. This is the #1 cause of Settings page features being lost repeatedly.

**What to do instead:**
1. Read the error message carefully
2. Fix the code manually (edit the broken part)
3. Run `npm run build` to test
4. If build passes, user tests functionality

**ONLY the USER can decide to use git commands. NEVER use them yourself.**

### Tailwind v4 CSS — NEVER change to v3 directives
`src/index.css` MUST use `@import "tailwindcss";` (v4 syntax). NEVER change it to `@tailwind base; @tailwind components; @tailwind utilities;` (v3 syntax). The v3 directives silently break v4 — CSS builds successfully but most utility classes are missing. See `agent/debugging.md` "Tailwind v4 CSS Silent Failure" for full details.

### Package versions — NEVER run `npm install tailwindcss@latest`
This project uses `tailwindcss: "4.2.1"` and `@tailwindcss/vite: "4.2.1"` (pinned exact). Running `npm install tailwindcss@latest` may downgrade to v3 and break everything. Do NOT add `autoprefixer` or `postcss` — they are v3 dependencies.

---

## Behavioral Guidelines

Behavioral guidelines to reduce common LLM coding mistakes. Tradeoff: bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding
Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First
Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.
- Ask: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes
Touch only what you must. Clean up only your own mess.

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

**The test:** Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution
Define success criteria. Loop until verified.

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

## Current Active Issues (Check PROBLEMS.md First)

| Issue # | Title | Priority | Status |
|---------|-------|----------|--------|
| 50 | External page duplicate buttons | P1 | In Progress |
| ... | (see PROBLEMS.md for full list) | | |

---

@agent/agents.md

**Last Updated:** 2026-04-26