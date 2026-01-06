# EP-0001: Scope Guards

## Prohibited Actions

### ❌ Architecture Changes
**Absolutely NO changes to:**
- Clean Architecture layer structure (domain/application/interface/infra)
- Dependency injection setup (tsyringe configuration)
- Inversion of control patterns
- Separation of concerns between layers
- Directory structure of src/server/core/

**Rationale**: The Clean Architecture is a core design decision and working correctly.

---

### ❌ Breaking Changes to Functionality
**Must NOT break:**
- Existing API routes (`/api/auth/login`, `/api/user/[id]`)
- Request/response contracts of APIs
- TypeScript interfaces used by external consumers
- Environment variable requirements
- Build/deployment process

**Rationale**: Preserve all working functionality - this is cleanup only, not refactoring.

---

### ❌ Dependency Changes
**Do NOT:**
- Add new dependencies (unless critical for build fix)
- Remove dependencies currently in use
- Update major versions
- Change package manager (stay with npm, not pnpm/yarn)
- Modify tsconfig.json compiler options (except for build fixes)

**Rationale**: Minimize risk - cleanup should not require dependency changes.

---

### ❌ Infrastructure Code
**Do NOT modify:**
- src/server/core/infra/ implementations (unless unused)
- DI container registration logic
- Port implementations
- HTTP client adapters
- Cache implementations
- Logger implementations

**Rationale**: Infrastructure is working; changing it risks breaking integrations.

---

### ❌ Business Logic
**Do NOT change:**
- Use case implementations
- Domain entities
- Value objects
- Business rules in any layer

**Rationale**: Business logic is functional - changing it is not cleanup.

---

### ❌ Configuration Files
**Minimize changes to:**
- tsconfig.json (only if required for build)
- next.config.ts
- eslint.config.mjs  
- postcss.config.mjs
- tailwind CSS configuration

**Rationale**: Working configurations should be left alone unless causing build issues.

---

## Permitted Actions

### ✅ Documentation Cleanup
**Explicitly ALLOWED:**
- Delete documentation files that reference wrong projects
- Delete CLEAN_ARCHITECTURE_GUIDE.md (references WaaS, not MoveAccess)
- Delete DEVELOPMENT_GUIDELINES.md (references Web Flow, not MoveAccess)
- Update README.md to accurately describe MoveAccess
- Create new, accurate documentation if needed

**Rationale**: Incorrect documentation is misleading and should be removed.

---

### ✅ Template Code Removal
**Explicitly ALLOWED:**
- Remove generic Next.js template content from page.tsx
- Update page.tsx with MoveAccess-specific landing page
- Remove or replace Geist fonts in layout.tsx
- Update metadata in layout.tsx (title, description)
- Clean up placeholder text and links

**Rationale**: Generic templates should be customized for the actual project.

---

### ✅ Unused Code Removal
**Explicitly ALLOWED:**
- Remove unused imports
- Delete unreferenced variables
- Remove commented-out code blocks
- Delete orphaned files (not imported anywhere)
- Remove console.log statements used for debugging

**Rationale**: Dead code clutters the codebase and should be cleaned up.

---

### ✅ Import Cleanup
**Explicitly ALLOWED:**
- Remove unused imports from all files
- Organize imports in consistent order
- Remove duplicate imports
- Fix import paths to use @ aliases
- Remove imports of deleted files

**Rationale**: Clean imports improve code readability and reduce bundle size.

---

### ✅ Build Fixes
**Explicitly ALLOWED:**
- Fix Google Fonts loading issue (network restriction)
- Replace remote fonts with local/system fonts
- Remove font imports if not used
- Add missing dependencies for build
- Fix any build errors blocking compilation

**Rationale**: Build must work - fixing build issues is critical.

---

### ✅ Comments and Formatting
**Explicitly ALLOWED:**
- Remove obsolete comments
- Update misleading comments
- Fix typos in comments
- Remove commented-out code
- Standardize comment format (if inconsistent)

**Rationale**: Comments should be accurate and helpful, not misleading.

---

### ✅ Metadata Updates
**Explicitly ALLOWED:**
- Update package.json name/description
- Update HTML metadata in layout.tsx
- Update README title and description
- Update git repository information
- Update project URLs and links

**Rationale**: Metadata should reflect the actual project, not templates.

---

## Decision Framework

When uncertain about a change, ask:

1. **Does it break existing functionality?**
   - YES → ❌ Don't do it
   - NO → Continue to next question

2. **Does it change architecture or design patterns?**
   - YES → ❌ Don't do it
   - NO → Continue to next question

3. **Is it removing unused/dead code?**
   - YES → ✅ Allowed
   - NO → Continue to next question

4. **Is it fixing incorrect documentation?**
   - YES → ✅ Allowed
   - NO → Continue to next question

5. **Is it necessary for build to work?**
   - YES → ✅ Allowed
   - NO → Continue to next question

6. **Is it removing template/generic content?**
   - YES → ✅ Allowed
   - NO → Continue to next question

7. **When in doubt:**
   - Document the question in 05-changelog.md
   - Choose the safer, more conservative option
   - Prefer deletion over modification for unclear cases

---

## Validation Gates

Before committing any change, verify:

1. ✅ Build still works (`npm run build`)
2. ✅ Lint still passes (`npm run lint`)
3. ✅ No prohibited actions were taken
4. ✅ Change aligns with permitted actions
5. ✅ Functionality is preserved

If any gate fails, revert the change.

---

## Examples

### ❌ PROHIBITED Example
```typescript
// DON'T: Changing use case logic
export class GetUserUseCase {
  async execute(id: string) {
    // Adding new business logic is prohibited
    if (id.startsWith('admin')) {
      return { role: 'admin' };
    }
    // ...
  }
}
```

### ✅ ALLOWED Example
```typescript
// DO: Removing unused import
- import { SomethingUnused } from './somewhere';
  import { SomethingUsed } from './somewhere';

export class GetUserUseCase {
  async execute(id: string) {
-   console.log('Debug:', id); // Remove debug log
    // ...
  }
}
```

---

**Last Updated**: 2026-01-06
