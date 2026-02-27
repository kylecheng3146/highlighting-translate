# Task 1 Locale Metadata Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ensure locale metadata helpers exclude premature `ar-EG` entry and rely on test-injected metadata for RTL checks.

**Architecture:** Keep `I18nService` locale metadata lookup unchanged except for removing `ar-EG` from the static table; tests will inject temporary locales directly on the service instance to verify `getActiveLocale`/`isRTL` behavior without relying on production locale entries.

**Tech Stack:** Plain JavaScript services with Jest unit tests.

---

### Task 1: Update I18nService Tests to Inject Temporary Locales

**Files:**
- Modify: `services/I18nService.test.js`

**Step 1: Write the failing test**

Add a new `describe('locale metadata helpers')` block that:

```javascript
describe('locale metadata helpers', () => {
    test('reads metadata and RTL flag from injected locale', () => {
        i18nService.locales['mock-rtl'] = {
            label: 'Mock RTL',
            direction: 'rtl',
            strings: { settingsTitle: 'Mock' }
        };
        jest.spyOn(i18nService, 'getLanguage').mockReturnValue('mock-rtl');

        const locale = i18nService.getActiveLocale();
        expect(locale.code).toBe('mock-rtl');
        expect(locale.direction).toBe('rtl');
        expect(i18nService.isRTL()).toBe(true);
    });
});
```

Also remove the existing `ar-EG`-specific test so production metadata no longer references that locale.

**Step 2: Run test to verify it fails**

Run: `npm test -- services/I18nService.test.js`

Expected: New test fails because `getActiveLocale` currently cannot find the injected locale due to the stale `ar-EG` entry or other logic relying on static metadata.

### Task 2: Remove `ar-EG` Locale from I18nService

**Files:**
- Modify: `services/I18nService.js`

**Step 1: Write minimal implementation**

Delete the `"ar-EG"` entry from `LOCALES` so production metadata no longer includes it. No other logic changes required because tests will inject temporary locales by mutating `i18nService.locales`.

**Step 2: Run tests to verify they pass**

Run targeted suite first: `npm test -- services/I18nService.test.js`

Expected: All tests in this suite pass.

Given unrelated suites currently fail in this repo, capture and report their failures separately after this verification without attempting to fix them here.

### Task 3: Regression Safety Net

**Files:**
- Test: `services/I18nService.test.js`

**Step 1: Run focused regression suite**

Since only `I18nService` is touched, re-run its tests to ensure stability: `npm test -- services/I18nService.test.js`

**Step 2: Document unrelated failures**

Note existing failing suites from the baseline run (TooltipService, TranslationService, StorageService, popup, content) so the user understands they predated this work.

### Task 4: Prepare Corrective Commit

**Files:**
- `services/I18nService.js`
- `services/I18nService.test.js`
- `docs/plans/2026-02-26-task1-locale-metadata.md`

**Step 1: Stage changes**

`git add services/I18nService.js services/I18nService.test.js docs/plans/2026-02-26-task1-locale-metadata.md`

**Step 2: Create corrective commit**

`git commit -m "refactor: finalize locale metadata helpers"`

If replacing an earlier Task 1 commit, coordinate with the user whether to amend or reset history per their guidance. Do not push unless requested.
