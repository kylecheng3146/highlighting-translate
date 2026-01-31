# 實作計畫：Flashcard MVP

## Phase 1: 基礎架構與 SRS 邏輯

建立資料結構與核心運算邏輯。

- [x] Task: 設計並實作 `SRSService` (SM-2 演算法實作)
- [x] Task: 擴充 `StorageService` 支援 SRS 欄位 (`nextReview`, `interval`, etc.)
- [x] Task: 撰寫單元測試驗證 SRS 排程邏輯
- [ ] Task: Conductor - User Manual Verification '基礎架構與 SRS 邏輯' (Protocol in workflow.md)

## Phase 2: 閃卡 UI 實作

開發使用者互動介面。

- [ ] Task: 建立 Review Mode 頁面框架 (HTML/CSS)
- [ ] Task: 實作 Card Component (Front/Back 翻轉動畫)
- [ ] Task: 整合 `SRSService` 與介面互動 (評分按鈕串接)
- [ ] Task: 加入鍵盤快捷鍵支援 (Space, 1-4)
- [ ] Task: Conductor - User Manual Verification '閃卡 UI 實作' (Protocol in workflow.md)

## Phase 3: 整合與優化

整合入口並優化體驗。

- [ ] Task: 在 Popup / Options 增加「開始複習」入口
- [ ] Task: 實作「今日複習完成」結束畫面 (Summary View)
- [ ] Task: Conductor - User Manual Verification '整合與優化' (Protocol in workflow.md)
