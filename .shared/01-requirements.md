# 01-requirements.md - Refactoring Requirements

Based on the "Hell Interview" and code analysis, here are the critical refactoring requirements for Project Highlighting Translate.

## 1. Core Architecture (State & Messaging)

- **Current State**: Decentralized. `content.js`, `popup.js`, and `review.js` all instantiate `StorageService` independently. Sync logic relies on disparate `onChanged` listeners.
- **Problem**: Race conditions, inconsistent state, and heavy logic running in Content Scripts (which slows down the user's page).
- **Requirement**:
  - **Move Logic to Background**: The Service Worker should be the "Brain". Content Scripts and Popup should be "Dumb Views" that send messages (`CMD_SAVE`, `CMD_GET_STATUS`) to the Background.
  - **Unified Message Handler**: Implement a typed message routing system in `background.js`.

## 2. Injection Strategy (Reliability)

- **Current State**: Static Declaration in `manifest.json`.
- **Problem**: Users must refresh all tabs after installation/update for the extension to work. "It feels broken" immediately after install.
- **Requirement**:
  - **Dynamic Injection**: Implement `chrome.scripting.executeScript` in the Service Worker `onInstalled` event to inject content scripts into _existing_ open tabs immediately.

## 3. Data Scalability (Storage)

- **Current State**: `StorageService.getTranslations(1000)` loads _all_ data into memory on every page load to perform highlighting.
- **Problem**: O(N) memory usage per tab. 1,000 flashcards = performance degradation on complex pages.
- **Requirement**:
  - **Pagination / Virtualization**: Only load what's needed (though for highlighting, we might need a Bloom Filter or distinct optimization).
  - **Asynchronous Highlighting**: Ensure highlighting logic does not block the main thread. (Consider `Offscreen Document` or Web Worker if heavy text processing is needed, currently `HighlightService` runs in main thread).

## 4. Service Worker Lifecycle (Resilience)

- **Current State**: Implicit reliance on persistence.
- **Problem**: MV3 SW kills itself after ~30s of inactivity.
- **Requirement**:
  - **Alarm-based Keep-alive (Optional)**: If we need long-running timers for SRS (though currently SRS seems like a passive calculation).
  - **State Hydration**: Ensure `background.js` can rebuild its internal state from `chrome.storage` immediately upon waking up.

## Summary of Tasks

1.  **Refactor Storage**: Centralize in Background.
2.  **Refactor Injection**: Add Dynamic Injection logic.
3.  **Refactor Messaging**: strict `Action/Payload` pattern.
4.  **Optimize Highlighting**: Prevent full vocabulary load if possible, or optimize matching.
