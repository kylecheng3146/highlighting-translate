# 元件架構 (Component Architecture)

## 核心元件 (Core Components)

- **Background**: Service Worker (事件驅動，短暫存在)。處理事件與狀態。
- **Content Scripts**: 在網頁情境中執行的 JavaScript。於隔離世界 (Isolated world) 執行。
- **Popup**: 快速操作 UI。失去焦點時立即關閉。
- **Options**: 全頁設定管理。
- **Side Panel**: 持久性 UI (Chrome 114+)。

## 訊息傳遞 (Message Passing)

### 方法 (Methods)

1. **chrome.runtime.sendMessage**
   - 一次性請求 (例如：Popup 到 Background)。
2. **chrome.runtime.connect**
   - 長期連線 (例如：用於連續資料流)。
3. **chrome.tabs.sendMessage**
   - 從 Background/Popup 發送訊息到特定 Content Script。

### 流程 (Flow)

- **Popup -> Service Worker**: 使用 `runtime.sendMessage`。
- **Content Script -> Service Worker**: 使用 `runtime.sendMessage`。
- **Service Worker -> Content Script**: 使用 `tabs.sendMessage` (需要 Tab ID)。
