# Implementation Plan - Smart Context Highlight

## Phase 1: Core Highlighting Logic
- [x] Task: Create `HighlightService` abstraction cc0aa50
    - [x] Create `services/HighlightService.js` cc0aa50
    - [x] Implement `highlightWord(node, word)` using `Range` and `mark` tag or custom span cc0aa50
    - [x] Implement `scanAndHighlight(rootElement, vocabularyList)` using `TreeWalker` cc0aa50
- [x] Task: Integrate with `content.js` 7c45c35
    - [x] Update `content.js` to initialize `HighlightService` 7c45c35
    - [x] Load vocabulary from `StorageService` on page load 7c45c35
    - [x] Trigger highlighting on DOMContentLoaded 7c45c35
- [ ] Task: Test Core Highlighting (TDD)
    - [ ] Create `services/HighlightService.test.js`
    - [ ] Test highlighting on simple text nodes
    - [ ] Test ignoring short words logic
    - [ ] Test performance with large text blocks (mock environment)
- [ ] Task: Conductor - User Manual Verification 'Core Highlighting Logic' (Protocol in workflow.md)

## Phase 2: Tooltip Interaction
- [ ] Task: Implement Tooltip UI
    - [ ] Add Tooltip styles to `content.js` (injected styles)
    - [ ] Create `TooltipService` or methods in `HighlightService` to manage tooltip creation/positioning
- [ ] Task: Bind Hover Events
    - [ ] Add `mouseenter` / `mouseleave` listeners to highlighted elements
    - [ ] Display tooltip with translation on hover
- [ ] Task: Conductor - User Manual Verification 'Tooltip Interaction' (Protocol in workflow.md)

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
