# EP-0001: Repository Deep Cleanup - Quick Reference

## Purpose
Remove unnecessary documentation and code that doesn't align with the MoveAccess project while preserving all existing functionality.

## Quick Links
- [Overview](./00-overview.md) - Objectives and success metrics
- [Tasks](./01-tasks.md) - 5 sequential tasks (T1-T5)
- [Acceptance Criteria](./02-acceptance.md) - 150+ validation criteria
- [Scope Guards](./03-scope-guards.md) - What's prohibited/permitted
- [Context](./04-context.md) - Repository structure and architecture
- [Changelog](./05-changelog.md) - Execution log

## Reading Order
For executors implementing this plan:
1. `00-overview.md` - Understand objectives
2. `03-scope-guards.md` - Know the boundaries
3. `04-context.md` - Understand the codebase
4. `01-tasks.md` - Execute tasks sequentially
5. `02-acceptance.md` - Validate results

## Task Summary
1. **T1: Analysis** ✅ Complete
2. **T2: Documentation Cleanup** - Pending
3. **T3: Code Cleanup** - Pending
4. **T4: Internal Cleanup** - Pending
5. **T5: Validation** - Pending

## Key Issues to Fix
1. ❌ Build fails (Google Fonts)
2. ❌ Wrong project docs (WaaS, Web Flow)
3. ⚠️ Generic template content
4. ⚠️ Generic README

## Commands
```bash
npm install            # Install dependencies
npm run build          # Should succeed after cleanup
npm run lint           # Should pass after cleanup
npm run dev            # Development server
```

## Success Criteria (Quick Check)
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] No incorrect documentation
- [ ] No template content
- [ ] All functionality preserved

## Contact
See `05-changelog.md` for execution log and decisions.

---

**Status**: In Progress
**Created**: 2026-01-06
