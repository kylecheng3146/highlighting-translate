# 02. UI Wireframes (UI 草圖)

> **版本**: v2 — 片語資料庫 Level 1 整合 (2026-03-07)

## 1. Popup 設定頁 (現有，無需修改)

片語功能屬於後台靜默功能，**不需要新增 Popup UI 開關**。現有的「智能高亮」開關 (`enableHighlightCheck`) 同時控制單字高亮與片語高亮，無需另設切換。

```text
+-----------------------+
|  翻譯設定              |
+-----------------------+
|  主題配色  [swatches] |
|  自動顯示翻譯   [ON]  |
|  自動播放語音   [OFF] |
|  自動複製       [OFF] |
|  源語言  [auto ▼]    |
|  目標語言 [zh-TW ▼]  |
|  顯示延遲 [500ms]    |
|  智能高亮       [ON]  |  <-- 片語高亮同此開關
|  (在此網站禁用)       |
+-----------------------+
|  [單字本]   [開始複習] |
+-----------------------+
```

## 2. Tooltip — 片語高亮 Hover (核心新 UI)

當使用者 hover 到片語高亮 `<mark>` 時，顯示片語 Tooltip。
與現有單字 Tooltip 相同元件，由 `data-translation` 顯示，不呼叫 API。

```text
               +--------------------------------+
               | [B1]  Rank #850               |  <-- CEFR + Rank badge
               +--------------------------------+
               |  放棄                          |  <-- 片語翻譯 (DB 內建)
               +--------------------------------+
                   ↑ hover 觸發
[...she decided to give up the project...]
                   ~~~~~~~~~~~
                   mark.ht-highlight.hl-freq-mid
```

**Tooltip 顯示規則**:
- `data-translation` = "放棄" (來自 phrasal_verbs_db.json)
- `data-rank` = "850"
- `data-level` = "B1"
- 與單字 Tooltip 完全相同的 `.ht-tooltip` 元件，零額外開發

## 3. 高亮視覺狀態 (Visual States)

片語使用與單字相同的頻率顏色，**無視覺差異**：

```text
單字高亮範例：
  [give]           → hl-freq-high (rank ≤ 3000, 紅底)
  [subtle]         → hl-freq-mid  (rank ≤ 10000, 主題色底)
  [ephemeral]      → hl-freq-low  (rank > 10000, 虛線底)

片語高亮範例：
  [give up]        → hl-freq-mid  (rank 850, B1)
  [look forward to]→ hl-freq-mid  (rank 920, B1)
  [turn off]       → hl-freq-high (rank 450, A2)
```

## 4. 前後對比 (Before / After)

### Before — 網頁原始文字
```text
She decided to give up the project after a long discussion.
She was looking forward to the meeting.
```

### After — 片語高亮後
```text
She decided to [give up] the project after a long discussion.
                ~~~~~~~~~  ← mark.ht-highlight.hl-freq-mid (hover → "放棄")

She was [looking forward to] the meeting.
         ~~~~~~~~~~~~~~~~~  ← mark.ht-highlight.hl-freq-mid (hover → "期待")
```

## 5. 不需要新增的 UI 元素

以下是評估後**不在 Level 1 範圍內**的 UI 變更：

| 評估項目 | 決策 | 原因 |
|--------|------|------|
| 片語開關 | 不加 | 沿用現有智能高亮開關 |
| 片語 vs 單字視覺差異 | 不加 | 保持一致性 |
| 片語管理頁面 | 不加 | Level 2 範疇 |
| 片語統計儀表板 | 不加 | Level 2 範疇 |
