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

## Redundant Files (content already in graphify - do NOT maintain separately)

- `agent/agents.md` — replaced by graphify + this AGENTS.md
- `agent/context.md` — replaced by graphify communities
- `agent/constraints.md` — replaced by graphify edges
- `agent/glossary.md` — replaced by graphify nodes
- `agent/patterns.md` — replaced by graphify relationships
- `agent/README.md` — outdated
- `agent/prompt.md` — superseded
- `agent/prompts.md` — superseded by debugging.md and quick-prompt.md
- `agent/transfer-prompt.md` — one-time use

---

## CRITICAL RULES (NEVER violate)

### Tailwind v4 CSS — NEVER change to v3 directives
`src/index.css` MUST use `@import "tailwindcss";` (v4 syntax). NEVER change it to `@tailwind base; @tailwind components; @tailwind utilities;` (v3 syntax). The v3 directives silently break v4 — CSS builds successfully but most utility classes are missing. See `agent/debugging.md` "Tailwind v4 CSS Silent Failure" for full details.

### Package versions — NEVER run `npm install tailwindcss@latest`
This project uses `tailwindcss: "4.2.1"` and `@tailwindcss/vite: "4.2.1"` (pinned exact). Running `npm install tailwindcss@latest` may downgrade to v3 and break everything. Do NOT add `autoprefixer` or `postcss` — they are v3 dependencies.