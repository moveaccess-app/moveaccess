# EP-0001: Repository Deep Cleanup - Quick Reference

**Created:** 2026-01-06  
**Status:** Ready for Execution  
**Executor:** Implementation Agent

---

## 📋 What Is This?

This is an **Execution Plan (EP)** for performing a deep cleanup of the MoveAccess repository. This EP was created by a Planning Agent (PM) and is ready to be executed by an implementation agent.

---

## 📂 Files in This EP

| File | Purpose | Lines |
|------|---------|-------|
| `00-overview.md` | High-level objectives, scope, and definition of "Done" | 140 |
| `01-tasks.md` | 5 macro tasks with deliverables, acceptance criteria, and execution notes | 243 |
| `02-acceptance.md` | Complete checklist for validating the feature is complete | 273 |
| `03-scope-guards.md` | **THE LAW** - What is prohibited, permitted, and requires approval | 263 |
| `04-context.md` | All internal references, paths, and architectural decisions | 511 |
| `05-changelog.md` | Initially empty - will be filled during execution | 202 |
| `README.md` | This file - quick reference guide | - |

**Total:** 1,632 lines of comprehensive planning documentation

---

## 🎯 Mission Summary

**Goal:** Clean up the MoveAccess repository by removing:
- Unnecessary `.md` files
- Unused code (files, functions, imports)
- Pointless conditional logic
- Obsolete comments

**Critical Constraint:** Do NOT break existing functionality (landing page, API routes).

---

## 📖 How to Use This EP

### For Implementation Agents

1. **START HERE:** Read `00-overview.md` to understand objectives
2. **READ SCOPE GUARDS:** `03-scope-guards.md` is THE LAW - defines what you can/cannot do
3. **READ CONTEXT:** `04-context.md` provides all repository references
4. **EXECUTE TASKS:** Follow `01-tasks.md` in sequential order (T1 → T2 → T3 → T4 → T5)
5. **VALIDATE:** Use `02-acceptance.md` checklist to verify completion
6. **DOCUMENT:** Update `05-changelog.md` with all changes made

### For Reviewers

1. Check `02-acceptance.md` - all checkboxes should be marked
2. Review `05-changelog.md` - should list all changes with justifications
3. Verify `03-scope-guards.md` was respected - no prohibitions violated
4. Validate builds pass and functionality preserved

---

## ⚠️ Critical Rules

### The Golden Rule
**"When in doubt, don't remove."**

Better to leave unnecessary code than to remove necessary code.

### Mandatory Validations
After EVERY change:
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] Manual test of affected functionality

### Prohibited Actions
- ❌ NEVER break existing functionality
- ❌ NEVER modify Clean Architecture structure
- ❌ NEVER remove essential documentation
- ❌ NEVER remove code without verifying it's unused
- ❌ NEVER commit broken builds

### Required Actions
- ✅ ALWAYS verify with `grep -r` before removing files
- ✅ ALWAYS validate build after removals
- ✅ ALWAYS commit incrementally (small, frequent commits)
- ✅ ALWAYS document changes in `05-changelog.md`
- ✅ ALWAYS preserve landing page and API routes functionality

---

## 🗺️ Execution Roadmap

### T1 - Analysis & Mapping (15-25 min)
- Create complete inventory of all files
- Map code dependencies (who imports whom)
- Identify dead code with 100% certainty
- Generate "safe to remove" vs "keep" list
- **Output:** Analysis document, candidate list

### T2 - Documentation Cleanup (15-25 min)
- Remove unnecessary `.md` files
- Update `README.md` if needed
- Preserve essential docs (DEVELOPMENT_GUIDELINES.md, CLEAN_ARCHITECTURE_GUIDE.md, etc.)
- **Output:** Cleaner documentation, updated README

### T3 - Code Cleanup - Files (15-25 min)
- Remove unreferenced `.ts`/`.tsx` files
- Remove empty directories
- Clean up orphaned imports
- **Output:** Fewer files, cleaner structure

### T4 - Code Cleanup - Internal (15-25 min)
- Remove unused imports (ESLint detected)
- Remove obsolete comments
- Simplify pointless conditionals
- Remove dead code within files
- **Output:** Cleaner code files

### T5 - Final Validation (15-25 min)
- Run full build and lint
- Manual testing of all functionality
- Update `05-changelog.md`
- Create PR description
- **Output:** Validated, documented cleanup

**Total estimated time:** 75-125 minutes (1.5 to 2 hours)

---

## 📊 Success Metrics

### Quantitative
- **Files removed:** 2-4 `.md` files (expected)
- **Code files removed:** TBD (depends on analysis)
- **Lines removed:** TBD (will be measured)
- **Repo size reduction:** TBD KB/MB

### Qualitative
- ✅ Build passes without errors
- ✅ Lint passes without errors
- ✅ All existing functionality works
- ✅ Codebase more maintainable
- ✅ Navigation easier

---

## 🔗 Essential Preservation

### Must Keep - Functionality
```
Landing page:         src/app/page.tsx
Layout:               src/app/layout.tsx
Auth API:             src/app/api/auth/login/route.ts
User API:             src/app/api/user/[id]/route.ts
All imported files    (verified via grep)
```

### Must Keep - Documentation
```
README.md
Doc/Projeto/DEVELOPMENT_GUIDELINES.md
Doc/Projeto/CLEAN_ARCHITECTURE_GUIDE.md
.github/copilot-instructions.md
.github/agents/*.md
```

### Must Keep - Configuration
```
package.json
tsconfig.json
next.config.ts
eslint.config.mjs
.gitignore
```

---

## 🚨 Emergency Procedures

### If Build Breaks
1. **STOP** immediately
2. Check `git diff` to see what changed
3. Revert last change: `git checkout -- <file>`
4. Document issue in `05-changelog.md`
5. Mark item as "in use - cannot remove"

### If Unsure About Removal
1. **DO NOT REMOVE**
2. Mark as `[PENDING - NEEDS CONFIRMATION]`
3. Ask user for clarification
4. Document in `05-changelog.md`

### If Found Bug in Existing Code
1. **DO NOT FIX** (out of scope)
2. Document in `05-changelog.md` as "found but not fixed"
3. Continue with cleanup tasks

---

## 📞 Getting Help

### When to Stop and Ask
- Build broke and you don't know why
- Removed something and now have unresolvable errors
- Found code that seems unused but has complex imports
- Found logic that doesn't make sense but unsure if safe to remove
- Any doubt about whether something is used

### How to Ask
- Provide context (what you were doing)
- Show the specific file/code
- Explain your doubt
- Await clarification before proceeding

---

## ✅ Definition of Done

Feature is complete when:

1. ✅ All tasks (T1-T5) executed
2. ✅ All acceptance criteria met (see `02-acceptance.md`)
3. ✅ `npm run build` passes
4. ✅ `npm run lint` passes
5. ✅ Landing page works
6. ✅ API routes work
7. ✅ `05-changelog.md` complete
8. ✅ PR description complete
9. ✅ Code review approved

---

## 📁 Repository Context

**Current state:**
- 6 `.md` files
- 20 `.ts`/`.tsx` files
- ~860 KB total size
- Next.js 15 + TypeScript + Clean Architecture
- Landing page + 2 API routes functional

**Goal state:**
- Fewer unnecessary `.md` files
- Only used code files
- Cleaner, more maintainable codebase
- All functionality preserved
- Build and lint passing

---

## 🎓 Learning Resources

All information needed is in this EP:
- Architecture: `04-context.md` + `CLEAN_ARCHITECTURE_GUIDE.md`
- Development patterns: `04-context.md` + `DEVELOPMENT_GUIDELINES.md`
- Scope rules: `03-scope-guards.md`
- Validation criteria: `02-acceptance.md`

**No external references needed.**

---

## 🏁 Ready to Execute?

1. Read all EP files in order
2. Understand the scope and rules
3. Execute tasks sequentially
4. Validate continuously
5. Document everything
6. Ask when in doubt

**Good luck! 🚀**

---

**Execution Plan created by:** PM Agent  
**Ready for execution by:** Implementation Agent  
**Path:** `Doc/ExecutionPlans/EP-0001-repository-deep-cleanup/`
