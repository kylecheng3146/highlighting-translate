# Track: Refactor MV3 Architecture

## Goal

Transform the extension into a robust, scalable, Manifest V3 compliant application with a centralized Service Worker architecture.

## Phases

### Phase 1: Infrastructure Centralization (大腦移植)

目標：建立 Service Worker 為核心，將 Service 邏輯移入 Background。

- [x] Task: 建立 `background.js` 並在 Manifest 註冊
- [x] Task: 實作 `MessageHandler` 路由機制
- [x] Task: 將 `TranslationService`, `SRSService` 移動/整併至 Background
- [x] Task: 修改 `content.js` 改為使用 `runtime.sendMessage`

### Phase 2: Dynamic Injection & Resilience (強固性)

目標：解決安裝後需重整的問題，並確保 SW 生命週期正確。

- [x] Task: 在 `background.js` 實作 `onInstalled` 監聽器
- [x] Task: 實作 `injectContentScripts` 函式
- [x] Task: 驗證無重整可用性

### Phase 3: Storage Refactor (數據流)

目標：將 Storage 寫入權限收歸 Background。

- [x] Task: 修改 `StorageService` 區分 Client/Host 模式
- [x] Task: 更新 `popup.js` 與 `review.js` 透過訊息存取
- [x] Task: 實作 Storage 快取層

### Phase 4: Integration & Cleanup

- [ ] Task: 移除 Content Script 直接存取代碼
- [ ] Task: 全面測試 (Regression Testing)
