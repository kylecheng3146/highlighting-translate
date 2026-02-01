# 實作計畫：Smart Context Cards

## Phase 1: 核心邏輯與資料層 [checkpoint: fc85fb5]

實作情境擷取算法與資料儲存更新。

- [x] Task: 在 `content.js` 實作 `getSentenceContext` 演算法
- [x] Task: 更新 `showTranslatePopup` 與 `toggleStar` 支援 context 傳遞
- [x] Task: 驗證 `StorageService` 是否正確寫入 context 資料 (2522f5e)
- [ ] Task: Conductor - User Manual Verification '核心邏輯與資料層'

## Phase 2: 介面呈現 (History UI)

更新歷史頁面以卡片形式顯示情境。

- [ ] Task: 修改 `history.js` 的 `loadHistory` 函式，支援讀取 context
- [ ] Task: 實作「情境高亮」邏輯 (在句子中標記單字)
- [ ] Task: 更新 `history.html` 與 CSS，將列表改為卡片樣式
- [ ] Task: 處理舊資料相容性 (無 context 的單字顯示)
- [ ] Task: Conductor - User Manual Verification '介面呈現'

## Phase 3: 驗收與發布

- [ ] Task: 進行全流程測試 (網頁擷取 -> 收藏 -> 歷史檢視)
- [ ] Task: 更新 `manifest.json` 版本號
