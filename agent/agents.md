# 🤖 AI Agent Instructions

**Purpose:** General instructions for all AI agents working on the DeskFlow project.

---

## 🚀 Mandatory Workflow

### Before Starting ANY Work:

1. **Read this file** (`agent/agents.md`) - Always start here
2. **Read `qwen.md`** - If you are Qwen Code
3. **Check `state.md`** - Understand current status
4. **Review `PROBLEMS.md`** - Check ALL known issues first
5. **Review `context.md`** - Know the architecture
6. **Check `skills.md`** - Available capabilities
7. **Review `constraints.md`** - Hard rules

### During Work:

1. **Follow `patterns.md`** - Use existing code patterns
2. **Respect `constraints.md`** - Never violate rules
3. **Use `debugging.md`** - When troubleshooting
4. **Reference `glossary.md`** - For terminology

### After Completing Work:

1. **Update `state.md`** - Document ALL changes made (what changed, why, which files)
2. **Update `prompts.md`** - If you created new useful prompts
3. **Update `context.md`** - If architecture or tech stack changed significantly
4. **Update `patterns.md`** - If you introduced a new reusable pattern
5. **Verify build** - Run `npm run build` and ensure nothing is broken
6. **Clean up** - Remove debug code, comments, temporary files
7. **Notify user** - Run `python complete.py --speak "[task description]" --project "[project name]"` to notify user task is complete (if complete.py exists)

---

## 📝 Documentation Update Rules

### After EVERY Change — Update `state.md`:
- Add a new entry under **📝 Recent Changes** with date and description
- Update the **Version History** table at the bottom
- If new IPC endpoints, DB tables, or APIs were added — update the **📚 Reference** section
- If new known issues discovered — add to **⚠️ Known Issues & Limitations**
- If TODO items completed or added — update **🎯 Next Steps / TODO**

### When to Update Other Files:
| File | Update When... |
|------|---------------|
| `state.md` | **ALWAYS** — after every single change |
| `context.md` | Architecture, tech stack, or project structure changed |
| `patterns.md` | New reusable code pattern introduced |

---

## 🔴 Problem Tracking Workflow

### When User Reports Issues:

1. **Read `PROBLEMS.md` first** - Check if issue already exists
2. **If new issue**: Add to PROBLEMS.md with full detail
3. **If existing issue**: Reference by issue number
4. **Verify before fixing**: Confirm the issue still exists

### Issue Number Format:
Use format: `Category.Number` e.g., `1.1`, `2.3`, `3.2`

```
## Category
### 1.1 Issue Title (NEW)
The problem is...

## Category
### 1.2 Issue Title (IN PROGRESS)
Working on fixing this now...
```

### Adding New Issues:
When user mentions a NEW problem:
```markdown
### X.Y: [Descriptive Title]

**Status:** Not Started
**Priority:** [P1/P2/P3/P4/P5]
**Category:** [Galaxy/Settings/Timeline/Dashboard/Browser/Tracking]

**Problem:** Clear description of the issue

**Expected:** What should happen

**Actual:** What's actually happening

**User's Quote:** "Exact quote from user"
```

### Marking Issues Fixed:
When issue is resolved:
```markdown
### X.Y: [Title] (FIXED)

**Status:** Fixed
**Fixed in:** [file/date]
**Solution:** [Brief explanation]
```
| `constraints.md` | New limitations or rules discovered |
| `prompts.md` | New prompt templates created |
| `debugging.md` | New debugging technique or common error documented |
| `glossary.md` | New terms or acronyms introduced |

### State.md Entry Format:
```markdown
### YYYY-MM-DD — Short Description

**What Changed:**
1. ✅ Change one
2. ✅ Change two

**Files Modified:**
- `path/to/file` - Brief description
- `path/to/file2` - Brief description

**Why:** (if not obvious) Brief explanation of the problem

**Result:** What the user sees now
```

---

## 📝 General Best Practices

### Code Quality
- **Match existing style** - Follow surrounding code conventions
- **TypeScript first** - Use proper types
- **Error handling** - Always handle errors gracefully
- **Comments sparingly** - Only for complex logic
- **Small commits** - Focused, reversible changes

### File Operations
- **Read before write** - Always read files before editing
- **Exact matches** - For edits, ensure exact string matching
- **Preserve formatting** - Don't reformat unrelated code
- **Check imports** - Verify all imports exist

### Communication
- **Be concise** - Brief, direct responses
- **Show code** - Always show actual changes
- **Explain briefly** - Short explanations
- **Ask when unsure** - Don't assume

---

## 🔔 Notification System (complete.py)

When the AI completes a task or needs user attention, run the notification script:

```bash
python complete.py --speak "[message]" --project "[project name]"
```

### When to Notify:

| Situation | Message Example |
|-----------|----------------|
| Task completed | "Task complete. Ready for next." |
| Fix attempted | "Attempted fix complete. Please test." |
| Needs user input | "Need your input. Please respond." |
| Build failed | "Build failed. Check errors." |
| Ready to continue | "Ready to continue. Please confirm." |

### Note:
- If `complete.py` doesn't exist, skip the notification
- The script plays a beep sound and speaks the message
- Works cross-platform (Windows, macOS, Linux)

---

## ⚠️ Common Mistakes to Avoid

### ❌ Never:
- Skip reading agent files
- Assume current state
- Make large changes without planning
- Break existing functionality
- **Forget to update state.md after changes**
- **Skip updating other relevant markdown files**
- Leave debug code
- Change unrelated code
- Use outdated patterns

### ✅ Always:
- Start with agent files
- Check state first
- Plan before coding
- Test incrementally
- **Update state.md with every change**
- **Update context.md, patterns.md, etc. when applicable**
- Remove debug code
- Focus on the task
- Follow patterns

---

## 🔧 Task-Specific Guidelines

### Fixing Bugs
1. Read `debugging.md` first
2. Reproduce the issue
3. Identify root cause
4. Fix root cause
5. Test the fix
6. Check for regressions

### Adding Features
1. Check `state.md` for existing work
2. Review `patterns.md`
3. Plan implementation
4. Implement incrementally
5. Test each step
6. Update documentation

### Refactoring
1. Tests pass before starting
2. Small, reversible changes
3. Test after each change
4. Keep functionality identical
5. Update patterns.md if improving

---

## 📚 File Reference Guide

| When You Need... | Read This File |
|-----------------|----------------|
| General instructions | `agents.md` |
| Qwen-specific rules | `qwen.md` |
| Current status | `state.md` |
| Architecture info | `context.md` |
| Available skills | `skills.md` |
| Prompt templates | `prompts.md` |
| Hard rules | `constraints.md` |
| Code patterns | `patterns.md` |
| Debugging help | `debugging.md` |
| Term definitions | `glossary.md` |

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-04 | Initial creation |
| 1.1 | 2026-04-05 | Added mandatory documentation update rules, state.md entry format, file update matrix |
| 1.2 | 2026-04-12 | Added critical rule: Only USER can mark issues as Fixed; AI only reports attempted fixes |
| 1.3 | 2026-04-12 | Added complete.py notification system for task completion and user attention |

---

## 📝 Issue Status Definitions (CRITICAL)

**CRITICAL RULE:** Only the USER can mark an issue as "Fixed". The AI should NEVER claim an issue is fixed because the AI cannot verify if the fix actually works - the user must test and confirm.

| Status | Meaning | Who Can Set |
|--------|---------|------------|
| Not Started | Has not been addressed yet | - |
| In Progress | AI actively working on a fix | AI |
| AI Attempted Fix | AI made changes, waiting for user to test | AI |
| Fixed | User confirmed the issue is resolved | **USER ONLY** |
| Lower Priority | Acknowledged but not urgent | AI |
| Need Info | More information needed from user | - |

---

**Last Updated:** 2026-04-12
**Maintained By:** AI Development Team
