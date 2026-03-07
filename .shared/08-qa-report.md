# 08-qa-report.md — Phrasal Verbs Level 1 QA Plan

> **版本**: v2 — 片語資料庫 Level 1 整合 (2026-03-07)
> **狀態**: 測試計畫 (待實作完成後執行)

---

## 單元測試計畫 (Unit Tests)

### HighlightService — 片語匹配測試

```bash
npm test -- --testPathPattern=content.test.js
```

| # | 測試案例 | 預期結果 |
|---|---------|---------|
| 1 | 輸入 `[{text: 'give up', ...}]`，頁面有 "give up" | `<mark>give up</mark>` 整體高亮 |
| 2 | 輸入 `[{text: 'give', ...}, {text: 'give up', ...}]`，頁面有 "give up" | 片語優先，`give up` 整體高亮，不拆分 |
| 3 | 輸入 `[{text: 'gave up', ...}]`，頁面有 "gave up" | `<mark>gave up</mark>` 正確匹配 |
| 4 | 輸入 `[{text: 'give up', ...}]`，頁面有 `give  up`（多空格） | `\s+` 匹配，整體高亮 |
| 5 | 輸入 `[{text: 'give up', ...}]`，頁面有 `give<b>up</b>` | 不高亮（跨節點忽略，Level 1）|
| 6 | 片語 `data-translation` 正確設定 | `mark.dataset.translation === '放棄'` |
| 7 | 片語正確套用 `hl-freq-mid` class（rank 850） | `mark.classList.contains('hl-freq-mid')` |
| 8 | 現有單字高亮不受影響 | 已有的單字 vocabList 測試全部通過 |

---

## 整合測試計畫 (Integration Tests)

```bash
npm test -- --testPathPattern=integration.test.js
```

| # | 測試案例 | 預期結果 |
|---|---------|---------|
| 1 | background.js 載入時，phrasalVerbsExpanded 正確寫入 storage | storage 非空，包含展開後的變形 |
| 2 | scanPageForVocabulary 正確合併片語 + 單字 | combined 陣列包含兩種來源 |
| 3 | 片語 DB 缺少 forms 欄位 | 只有原形被匹配，不報錯 |

---

## 手動驗證清單 (Manual Verification)

### 功能驗證

- [ ] 在 BBC News 英文頁面，確認 "give up"、"look forward to" 等片語整體被高亮
- [ ] Hover 片語，Tooltip 顯示 DB 內建翻譯（快速，無 loading 狀態）
- [ ] Tooltip 顯示正確的 CEFR 等級與 Rank
- [ ] 點擊片語高亮後加星收藏，在單字本中以原形出現（如 "give up"）
- [ ] 片語出現在單字本後，刷新頁面確認依然高亮（來自 vocabList）

### 邊界案例驗證

- [ ] 在有 `give up` 的頁面，確認 `give` 單字**不會**被額外高亮
- [ ] 禁用「智能高亮」後，片語高亮消失
- [ ] 在黑名單網站，片語高亮被禁用
- [ ] 頁面動態加載內容（SPA），片語高亮在新增節點後仍然觸發

### 效能驗證

- [ ] 在內容豐富的頁面（如 Wikipedia 長文），高亮渲染不造成可見的 UI 卡頓
- [ ] DevTools Performance 錄製：高亮任務在 idle 時間執行，不佔主執行緒

---

## 回歸測試 (Regression Tests)

確保 Level 1 不破壞現有功能：

```bash
npm test
```

- [ ] 所有現有測試通過（`npm test` 零失敗）
- [ ] 翻譯 Popup 功能正常
- [ ] 單字本儲存/刪除功能正常
- [ ] TTS 功能正常
- [ ] 主題切換功能正常

---

## 已知限制 (Known Limitations — Level 1)

| 限制 | 說明 | 計畫解決版本 |
|------|------|------------|
| 跨標籤片語不匹配 | `give <b>up</b>` 不高亮 | Level 2 |
| 未手工指定的不規則變形 | 如 `went on` 若未在 forms 中則不高亮 | Level 2 |
| 片語 TTS | 無法點擊片語直接朗讀 | Level 2 |
