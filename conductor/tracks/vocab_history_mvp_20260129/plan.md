# Implementation Plan - Vocabulary History MVP

## Phase 1: Formalize & Test Existing TranslationService [checkpoint: 10efc64]
- [x] Task: Create test environment for `TranslationService` 5bc2cd3
    - [x] Create `services/TranslationService.test.js` using Jest 5bc2cd3
    - [x] Configure Jest to handle ES6 modules if not already set up 5bc2cd3
- [x] Task: Write tests for `TranslationService` (TDD - Red) 5bc2cd3
    - [x] Test `detectLanguage` with various inputs (ZH, EN, JA, Mixed) 5bc2cd3
    - [x] Test `shouldTranslate` logic (especially the auto-detect vs same lang case) 5bc2cd3
    - [x] Test `translate` error handling (network error, invalid response) 5bc2cd3
- [x] Task: Refactor `TranslationService` (Green/Refactor) 5bc2cd3
    - [x] Ensure all tests pass with current implementation 5bc2cd3
    - [x] Refactor to improve error messages or type checking if needed 5bc2cd3
- [ ] Task: Conductor - User Manual Verification 'Formalize & Test Existing TranslationService' (Protocol in workflow.md)

## Phase 2: Data Storage Migration (Sync to Local)
- [x] Task: Create `StorageService` abstraction fcf35fc
    - [x] Create `services/StorageService.js` to wrap `chrome.storage.local` fcf35fc
    - [x] Implement `saveTranslation(item)` fcf35fc
    - [x] Implement `getTranslations(limit, offset)` fcf35fc
    - [x] Implement `removeTranslation(text, translation)` fcf35fc
    - [x] Implement `clearAll()` fcf35fc
    - [x] Implement `isStarred(text, translation)` fcf35fc
- [ ] Task: Migrate `content.js` to use `StorageService`
    - [ ] Replace direct `chrome.storage.sync` calls with `StorageService` methods
    - [ ] Update `toggleStar` and `checkIsStarred` functions
- [ ] Task: Migrate `history.js` to use `StorageService`
    - [ ] Replace direct `chrome.storage.sync` calls with `StorageService` methods
    - [ ] Update `loadHistory` and `deleteItem` functions
- [ ] Task: Data Migration Script (Optional/One-time)
    - [ ] Create a logic to check `sync` storage on startup and move items to `local`, then clear `sync`
- [ ] Task: Conductor - User Manual Verification 'Data Storage Migration (Sync to Local)' (Protocol in workflow.md)

## Phase 3: UI/UX Refinement & Robustness
- [ ] Task: Optimize Popup Star Interaction
    - [ ] Add simple visual feedback (e.g., small animation or color pulse) when starring
    - [ ] Handle storage errors gracefully (show error toast in popup)
- [ ] Task: Enhance History Page
    - [ ] Add "Confirm Delete" modal for single item deletion (optional, or just keep simple)
    - [ ] Implement "Empty State" with a helpful illustration or guide text
    - [ ] Add pagination or "Load More" if list > 50 items (prevent performance issues)
- [ ] Task: Conductor - User Manual Verification 'UI/UX Refinement & Robustness' (Protocol in workflow.md)

## Phase 4: Final Polish & Release Prep
- [ ] Task: Full Regression Test
    - [ ] Verify Highlight -> Translate -> Star flow
    - [ ] Verify History Page rendering and deletion
    - [ ] Verify settings persistence
- [ ] Task: Update Documentation
    - [ ] Update `README.md` with new features description
- [ ] Task: Conductor - User Manual Verification 'Final Polish & Release Prep' (Protocol in workflow.md)
