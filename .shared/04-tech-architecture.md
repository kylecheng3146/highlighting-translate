# 04-tech-architecture.md - MV3 Refactoring Architecture

## 1. Architectural Overview

The refactored architecture shifts from a **Decentralized Model** (each component manages its own state) to a **Service Worker Centric Model** (Hub & Spoke).

### Core Components

1.  **Service Worker (`background.js`)**
    - **Role**: The "Brain" and Single Source of Truth.
    - **Responsibilities**:
      - Manage `StorageService` (Exclusive Write Access recommended).
      - Handle `SRSService` calculations.
      - Listen for `chrome.runtime.onMessage`.
      - Manage Context Menus.
      - Handle Dynamic Script Injection (`chrome.scripting`).
    - **State Strategy**: In-memory cache backed by `chrome.storage.local`. Rehydrates on startup.

2.  **Content Script (`content.js`)**
    - **Role**: "Dumb View" & Event Capturer.
    - **Responsibilities**:
      - Capture text selection (`mouseup`).
      - Render Tooltip/Popup UI (Shadow DOM).
      - **NO** direct storage writes. Sends `CMD_TRANSLATE` or `CMD_SAVE_CARD` to Background.
      - Listen for `CMD_UPDATE_HIGHLIGHTS` from Background.

3.  **Popup (`popup.js`) / Review (`review.js`)**
    - **Role**: UI for Settings & Review.
    - **Responsibilities**:
      - Fetch state from Background via messaging.
      - Send user actions (`CMD_UPDATE_SETTINGS`) to Background.

## 2. Dynamic Injection Strategy

To fix the "must reload" issue, `background.js` will implement an `onInstalled` listener:

```javascript
chrome.runtime.onInstalled.addListener(async () => {
  for (const cs of chrome.runtime.getManifest().content_scripts) {
    for (const tab of await chrome.tabs.query({ url: cs.matches })) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: cs.js,
      });
    }
  }
});
```

## 3. Communication Protocol (Typed Messages)

All messages must follow this shape:

```typescript
interface ExtensionMessage {
  action: string; // e.g., 'TRANSLATE', 'SAVE_CARD', 'GET_SETTINGS'
  payload?: any;
}

interface ExtensionResponse {
  success: boolean;
  data?: any;
  error?: string;
}
```

### Defined Actions

- `TRANSLATE`: Content -> Background (Calls Translation API)
- `SAVE_CARD`: Content/Popup -> Background (Update Storage & SRS)
- `GET_SETTINGS`: Content/Popup -> Background
- `TTS_PLAY`: Content -> Background (Speech)

## 4. File Structure Changes

```text
/src
  /background
    background.js      # Entry point
    messageHandler.js  # Router for messages
    injectionManager.js # Handles dynamic injection
  /services
    StorageService.js  # Singleton in Background
    SRSService.js      # Singleton in Background
    TranslationService.js # Singleton in Background
  /content
    content.js         # UI logic only
  /popup
    popup.js           # UI logic only
```
