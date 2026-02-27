# Egyptian Arabic Support Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add full Egyptian Arabic (ar-EG) localization, including UI strings, dropdown options, and RTL-aware layouts across popup, history, review, and content overlays.

**Architecture:** Centralize locale metadata in `I18nService` so each language defines label, direction, and strings. Consumers query this metadata to render dropdowns and set directional styles. Content and popup UIs toggle RTL attributes/classes dynamically, and tests verify locale resolution plus RTL propagation.

**Tech Stack:** Plain JS, Chrome extension APIs, Jest for unit tests, vanilla CSS.

### Task 1: Introduce locale metadata structure in I18nService

**Files:**
- Modify: `services/I18nService.js`
- Test: `services/I18nService.test.js`

**Step 1: Write the failing test**

Add Jest cases verifying that `I18nService.getActiveLocale()` (new helper) returns metadata objects and that `isRTL()` responds true for locales with `direction: 'rtl'`.

```javascript
it('returns locale metadata for ar-EG and reports RTL', () => {
  const i18n = new I18nService();
  jest.spyOn(i18n, 'getLanguage').mockReturnValue('ar-EG');
  const locale = i18n.getActiveLocale();
  expect(locale.code).toBe('ar-EG');
  expect(locale.direction).toBe('rtl');
  expect(i18n.isRTL()).toBe(true);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- I18nService.test.js`

Expected: FAIL because helpers do not exist.

**Step 3: Write minimal implementation**

- Wrap existing translation tables into a `const LOCALES = { en: { label, direction, strings }, ... }`.
- Implement `getActiveLocale()` to choose locale by navigator/Chrome UI language with fallbacks.
- Implement `isRTL()` returning `getActiveLocale().direction === 'rtl'`.
- Update `getText`/`localizePage` to reuse `getActiveLocale()`.

**Step 4: Run test to verify it passes**

Run: `npm test -- I18nService.test.js`

Expected: PASS.

**Step 5: Commit**

```bash
git add services/I18nService.js services/I18nService.test.js
git commit -m "refactor: add locale metadata helpers"
```

### Task 2: Add Egyptian Arabic translation strings and locale entry

**Files:**
- Modify: `services/I18nService.js`
- Test: `services/I18nService.test.js`

**Step 1: Write the failing test**

Extend tests to confirm Egyptian Arabic key lookups.

```javascript
it('serves ar-EG strings', () => {
  const i18n = new I18nService();
  jest.spyOn(i18n, 'getLanguage').mockReturnValue('ar-EG');
  expect(i18n.getText('settingsTitle')).toBe('إعدادات الترجمة');
});
```

**Step 2: Run test to verify it fails**

`npm test -- I18nService.test.js` → FAIL (missing strings).

**Step 3: Write minimal implementation**

- Create `ar-EG` locale entry with translated strings matching every existing key.
- Ensure label is `"العربية المصرية"` and direction `rtl`.

**Step 4: Run test to verify it passes**

`npm test -- I18nService.test.js`

**Step 5: Commit**

```bash
git add services/I18nService.js services/I18nService.test.js
git commit -m "feat: add Egyptian Arabic locale"
```

### Task 3: Expose locale metadata for UI dropdowns

**Files:**
- Modify: `popup.html`
- Modify: `popup.js`
- Modify: `review.html`
- Modify: `review.js`
- Modify: `history.html`
- Modify: `history.js`

**Step 1: Write the failing test**

Add Jest/dom test if feasible (e.g., `popup.test.js`) to ensure `sourceLang`/`targetLang` selects include `ar-EG` option label.

```javascript
it('renders Egyptian Arabic option', async () => {
  document.body.innerHTML = '<select id="targetLang"></select>';
  await renderLanguageOptions();
  expect([...document.querySelectorAll('#targetLang option')]
    .some(opt => opt.value === 'ar-EG')).toBe(true);
});
```

**Step 2: Run test to verify it fails**

`npm test -- popup.test.js` → FAIL.

**Step 3: Write minimal implementation**

- Export `LOCALES` metadata (or helper) from `I18nService` for reuse.
- Update dropdown rendering functions to build options from metadata rather than hardcoded HTML.
- Ensure `ar-EG` is included with label `العربية المصرية`.

**Step 4: Run test to verify it passes**

`npm test -- popup.test.js`

**Step 5: Commit**

```bash
git add popup.html popup.js review.html review.js history.html history.js services/I18nService.js popup.test.js
git commit -m "feat: populate locale dropdowns from metadata"
```

### Task 4: Apply RTL direction handling in popup/history/review UIs

**Files:**
- Modify: `popup.html`
- Modify: `popup.css` (or equivalent stylesheet)
- Modify: `popup.js`
- Modify: `history.html`
- Modify: `history.css`
- Modify: `history.js`
- Modify: `review.html`
- Modify: `review.css`
- Modify: `review.js`

**Step 1: Write the failing test**

Create Jest/dom tests asserting `document.documentElement.dir` is set to `rtl` when locale is `ar-EG`.

```javascript
it('sets dir to rtl for RTL locale', async () => {
  jest.spyOn(i18nService, 'isRTL').mockReturnValue(true);
  await initializePopup();
  expect(document.documentElement.dir).toBe('rtl');
});
```

**Step 2: Run test to verify it fails**

`npm test -- popup.test.js history.test.js review.test.js`

**Step 3: Write minimal implementation**

- On `DOMContentLoaded`, call a new helper `applyDirection(i18nService.isRTL())` that sets `dir` attribute and toggles `.rtl` class on body/root container.
- Add CSS rules for `.rtl` to reverse flex/grid alignment, padding, and icon order while keeping LTR unaffected.

**Step 4: Run test to verify it passes**

`npm test -- popup.test.js history.test.js review.test.js`

**Step 5: Commit**

```bash
git add popup.* history.* review.*
git commit -m "feat: enable RTL layouts for Egyptian Arabic"
```

### Task 5: Propagate locale + RTL info to content script overlay

**Files:**
- Modify: `content.js`
- Modify: `content.css` (if exists)
- Modify: `services/StorageService.js`
- Modify: `background.js`
- Modify: `content.test.js`
- Modify: `integration.test.js`

**Step 1: Write the failing test**

Add content script test ensuring translation popup container gets `dir="rtl"` when target language is `ar-EG`.

```javascript
it('renders translation bubble in RTL when target is ar-EG', async () => {
  const bubble = await renderTranslationBubble({ targetLang: 'ar-EG' });
  expect(bubble.getAttribute('dir')).toBe('rtl');
});
```

**Step 2: Run test to verify it fails**

`npm test -- content.test.js integration.test.js`

**Step 3: Write minimal implementation**

- Ensure stored settings include selected locale and direction.
- When building popup DOM, set `dir` and `.rtl` class if metadata says RTL; adjust icon order if necessary.
- Confirm messaging pipeline passes locale code to content script when settings change.

**Step 4: Run test to verify it passes**

`npm test -- content.test.js integration.test.js`

**Step 5: Commit**

```bash
git add content.js content.css services/StorageService.js background.js content.test.js integration.test.js
git commit -m "feat: render content popup with RTL support"
```

### Task 6: Update docs and supported-language listings

**Files:**
- Modify: `README.md`
- Modify: `docs/plans/2026-02-26-egyptian-arabic-support.md` (append completion notes later if needed)

**Step 1: No test (documentation)**

Add Egyptian Arabic to Supported Languages list and mention RTL support.

**Step 2: Manual verification**

Proofread docs, ensure instructions accurate.

**Step 3: Commit**

```bash
git add README.md
git commit -m "docs: mention Egyptian Arabic support"
```

### Task 7: End-to-end verification and cleanup

**Files:**
- N/A (commands)

**Step 1: Run full test suite**

`npm test`

Expected: PASS.

**Step 2: Manual sanity checks**

- Load extension, switch Chrome UI to Arabic or manually set target to `العربية المصرية` via popup.
- Confirm popup/history/review/content overlays render RTL and show translated strings.

**Step 3: Commit aggregate changes if any fixes**

```bash
git add .
git commit -m "chore: finalize Egyptian Arabic rollout"
```
