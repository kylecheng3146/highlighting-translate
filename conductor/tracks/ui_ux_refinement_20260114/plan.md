# 實作計畫：UI/UX 優化 (UI/UX Refinement)

## Phase 1: 基礎架構與樣式重構 [checkpoint: 12ede7c]
- [x] **Task**: 重構內容腳本中的翻譯框 DOM 生成邏輯，引入更乾淨的類別名稱與樣式隔離。 <!-- 4936ff4 -->
- [x] **Task**: 實作翻譯框的平滑淡入與滑動動畫。 <!-- 8223b1e -->
- [x] **Task: Conductor - User Manual Verification 'Phase 1'** (Protocol in workflow.md) <!-- 12ede7c -->

## Phase 2: Popup 設定面板美化 [checkpoint: 97fb04d]
- [x] **Task**: 重新設計 `popup.html` 與 `popup.js`，導入 Material Design 風格的控制項。 <!-- 21d6415 -->
- [x] **Task**: 確保所有設定項在變更時能即時保存至 `chrome.storage` 並提供視覺回饋。 <!-- 21d6415 -->
- [x] **Task: Conductor - User Manual Verification 'Phase 2'** (Protocol in workflow.md) <!-- 97fb04d -->

## Phase 3: 細節拋光與相容性測試
- [ ] **Task**: 最佳化翻譯框的 z-index 與位置計算邏輯，確保在各種網頁佈局下都能正確顯示。
- [ ] **Task**: 進行跨網頁測試，驗證翻譯框不會受到目標網站 CSS 的負面影響。
- [ ] **Task: Conductor - User Manual Verification 'Phase 3'**
