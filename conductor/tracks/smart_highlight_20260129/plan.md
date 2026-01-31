# Implementation Plan - Smart Context Highlight

## Phase 1: Core Highlighting Logic [checkpoint: d22121e]

- [x] Task: Create `HighlightService` abstraction cc0aa50
  - [x] Create `services/HighlightService.js` cc0aa50
  - [x] Implement `highlightWord(node, word)` using `Range` and `mark` tag or custom span cc0aa50
  - [x] Implement `scanAndHighlight(rootElement, vocabularyList)` using `TreeWalker` cc0aa50
- [x] Task: Integrate with `content.js` 7c45c35
  - [x] Update `content.js` to initialize `HighlightService` 7c45c35
  - [x] Load vocabulary from `StorageService` on page load 7c45c35
  - [x] Trigger highlighting on DOMContentLoaded 7c45c35
- [x] Task: Test Core Highlighting (TDD) 3a5f930
  - [x] Create `services/HighlightService.test.js` 3a5f930
  - [x] Test highlighting on simple text nodes 3a5f930
  - [x] Test ignoring short words logic 3a5f930
  - [x] Test performance with large text blocks (mock environment) 3a5f930
- [x] Task: Conductor - User Manual Verification 'Core Highlighting Logic' (Protocol in workflow.md)

## Phase 2: Tooltip Interaction [checkpoint: 33d48eb]

- [x] Task: Implement Tooltip UI ede0c31
  - [x] Add Tooltip styles to `content.js` (injected styles) ede0c31
  - [x] Create `TooltipService` or methods in `HighlightService` to manage tooltip creation/positioning ede0c31
- [x] Task: Bind Hover Events ede0c31
  - [x] Add `mouseenter` / `mouseleave` listeners to highlighted elements ede0c31
  - [x] Display tooltip with translation on hover ede0c31
- [x] Task: Conductor - User Manual Verification 'Tooltip Interaction' (Protocol in workflow.md)

## Phase 3: Settings & Controls

- [ ] Task: Update `SettingsService` (or Storage schema)
  - [ ] Add `enableHighlighting` (boolean)
  - [ ] Add `domainBlacklist` (array of strings)
- [ ] Task: Update Popup UI
  - [ ] Add toggle switch for "Smart Highlight" in `popup.html`
  - [ ] Add "Disable for this site" button in `popup.html` (only visible when on a page)
- [ ] Task: Integrate Settings with Highlight Logic
  - [ ] Check `enableHighlighting` before scanning
  - [ ] Check `domainBlacklist` against `window.location.hostname`
  - [ ] Listen for setting changes in `content.js` to enable/disable dynamically
- [ ] Task: Conductor - User Manual Verification 'Settings & Controls' (Protocol in workflow.md)

## Phase 4: Final Polish & Optimization

- [ ] Task: Optimization
  - [ ] Implement `requestIdleCallback` or chunking for highlighting to avoid blocking main thread
  - [ ] Limit max highlights per page (e.g., 100)
- [ ] Task: Final Regression Test
  - [ ] Verify core translation function still works
  - [ ] Verify History page still works
  - [ ] Verify highlighting behaves correctly on complex sites
- [ ] Task: Conductor - User Manual Verification 'Final Polish & Optimization' (Protocol in workflow.md)
