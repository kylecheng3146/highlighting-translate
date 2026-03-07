# 03-ux-specification.md — Phrasal Verbs DB Integration UX Specification

> **版本**: v2 — 片語資料庫 Level 1 整合 (2026-03-07)

---

## 1. 使用者路徑 (User Journeys)

### A. 首次發現片語高亮

1. 使用者在閱讀 BBC 新聞，看到句子：*"She decided to give up the project."*
2. **視覺反饋**：`give up` 整體被高亮（主題色底線），使用者注意到這是一個多詞彙組合。
3. **Hover 互動**：移到 `give up` 上，Tooltip 顯示 `[B1] Rank #850 / 放棄`。
4. **心理感受**：使用者理解「這是一個常見片語，需要學習」，點擊加星收藏。
5. **儲存行為**：以原形 `give up` 存入單字本。

### B. 網頁自動高亮整體覆蓋

1. 使用者打開英文新聞頁面。
2. **背景流程**：background.js 已載入 phrasal_verbs_db，合併後傳遞給 HighlightService。
3. **視覺效果**：頁面上所有已儲存的單字（含片語）自動高亮，片語以完整形式標示。
4. **匹配優先**：`give up` 整體高亮，不會被拆成 `give` + `up` 分別標示。

### C. 詞形變化場景

1. 使用者看到 `gave up`（過去式）。
2. **自動識別**：因為 DB 已預先展開所有變形，`gave up` 同樣被高亮。
3. **Tooltip**：顯示原形翻譯「放棄」，使用者知道這是 `give up` 的變化形。

---

## 2. 邊界案例與處理規範 (Edge Cases)

| 案例 | 處理規範 |
|------|---------|
| **片語跨 HTML 標籤** | Level 1 忽略，如 `give <b>up</b>` 不會被匹配。使用者不會看到錯誤，僅是漏匹配。 |
| **片語與單字重疊** | 片語優先（longest match first）：`give up` 會整體高亮，`give` 單獨不會被高亮。 |
| **不規則動詞** | 只有 DB 中手工指定的變形才能匹配。未指定的不規則形（如 `went on`）不會高亮。 |
| **DB 查無此詞** | 不高亮，靜默跳過。不顯示錯誤訊息。 |
| **片語超出高亮上限 (100)** | 沿用現有 `maxHighlights: 100` 限制，片語和單字合計不超過 100 個。 |
| **離線狀態** | 片語 DB 為內建資產，離線時高亮功能依然正常運作。 |
| **SPA 頁面動態載入** | 沿用現有 MutationObserver + debounce 機制，不需要額外處理。 |
| **多空格/特殊空白** | `\s+` 正則可匹配任意空白字符，包括 `&nbsp;` 渲染後的空格。 |

---

## 3. 使用者設定 (User Customization)

**Level 1 不新增任何設定項目**。現有的「智能高亮」開關一併控制片語高亮，保持 UX 簡潔：

- `enableHighlighting: true` → 單字高亮 + 片語高亮 皆啟用
- `enableHighlighting: false` → 全部停用

---

## 4. 效能與技術 UX 指標

| 指標 | 目標 | 實現方式 |
|------|------|---------|
| Tooltip 顯示延遲 | < 5ms | 直接讀取 `data-translation`，無 API 呼叫 |
| 片語高亮渲染 | 不阻塞 UI | 沿用 `requestIdleCallback` + chunk(50) 機制 |
| DB 載入時間 | 一次性，首次安裝 | background.js 啟動時載入，儲存至 chrome.storage.local |
| Regex 構建 | 一次性，每次頁面載入 | 合併 DB 後構建單一 regex，不重複構建 |

---

## 5. 新舊行為對比 (Behavioral Delta)

| 行為 | v1.13.0 (現在) | v1.14.0 (片語 Level 1) |
|------|---------------|----------------------|
| `give up` 在頁面出現 | `give` 可能被高亮（若已收藏）| `give up` 整體高亮（來自 phrasal_verbs_db）|
| Tooltip 內容 | 單字翻譯 | 片語翻譯（DB 內建），格式相同 |
| 收藏行為 | 儲存單字 | 儲存片語原形（格式相同，含空格） |
| 詞形變化 | 不處理 | 預展開 5 種變形自動匹配 |

---

## 6. 成功指標 (Success Metrics)

1. **片語識別率**：頁面上出現 DB 內片語時，被正確整體高亮（而非被單字打散）的比例 > 95%。
2. **誤高亮率**：原本應被單字匹配的詞，因片語優先而被錯誤歸類的案例 = 0（由 longest match first 保證）。
3. **效能不退化**：加入片語後，首次頁面高亮渲染時間相比 v1.13.0 增長 < 200ms（在合理範圍內）。
