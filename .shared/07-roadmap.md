# 07-roadmap.md - Refactoring Execution Plan

## Phase 1: Infrastructure Centralization (大腦移植)

目標：建立 Service Worker 為核心，將 Service 邏輯移入 Background。

- [ ] **Step 1.1**: 建立 `background.js` (如果尚未存在) 並在 Manifest 註冊。
- [ ] **Step 1.2**: 實作 `MessageHandler` 路由機制。
- [ ] **Step 1.3**: 將 `TranslationService`、`SRSService` 移動/整併至 Background 執行環境。
- [ ] **Step 1.4**: 修改 `content.js` 的 `translate` 呼叫，改為 `runtime.sendMessage('TRANSLATE')`。

## Phase 2: Dynamic Injection & Resilience (強固性)

目標：解決安裝後需重整的問題，並確保 SW 生命週期正確。

- [ ] **Step 2.1**: 在 `background.js` 實作 `onInstalled` 監聽器。
- [ ] **Step 2.2**: 實作 `injectContentScripts` 函式，查詢並注入既有分頁。
- [ ] **Step 2.3**: 驗證：安裝擴充功能後，不重整即可在既有頁面使用翻譯。

## Phase 3: Storage Refactor (數據流)

目標：將 Storage 寫入權限收歸 Background。

- [ ] **Step 3.1**: 修改 `StorageService`，區分 `Client` (發送訊息) 與 `Host` (實際寫入) 模式，或拆分為兩個類別。
- [ ] **Step 3.2**: 更新 `popup.js` 與 `review.js` 透過訊息存取設定。
- [ ] **Step 3.3**: 實作 `StorageService` 的快取層 (Memory Cache)，減少 `chrome.storage.local.get` 呼叫。

## Phase 4: Integration & Cleanup

目標：移除舊有冗餘代碼。

- [ ] **Step 4.1**: 移除 Content Script 中直接存取 Storage 的代碼。
- [ ] **Step 4.2**: 全面測試 (Regression Testing)。
