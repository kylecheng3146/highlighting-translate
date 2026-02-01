# Implementation Plan: Smart Frequency Radar & Mastery Dashboard

## Phase 1: Data Preparation & Migration (Backend)
- [ ] 準備 Top 20,000 詞頻 JSON 文件。
- [ ] 在 `StorageService` 增加 `frequency_rank` 處理邏輯。
- [ ] 實作數據遷移腳本，為舊紀錄補齊詞頻。

## Phase 2: UI Enhancement (Tooltip & Highlighting)
- [ ] 修改 `TranslationService` 以獲取詞頻。
- [ ] 更新 `TooltipService` 顯示排名。
- [ ] 修改 `HighlightService` 根據頻率應用不同樣式。

## Phase 3: Analytics & Dashboard (Frontend)
- [ ] 在 `history.js` 實作掌握度計算邏輯。
- [ ] 使用簡單的 CSS 或 Chart.js (如果允許) 繪製掌握度進度條。
- [ ] 增加常用詞覆蓋率統計（Top 2000 掌握數）。

## Phase 4: Verification & Polish
- [ ] 進行性能測試，確保高亮標記不影響渲染。
- [ ] 確認數據遷移在各版本間的穩定性。
