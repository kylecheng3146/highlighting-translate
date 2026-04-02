```
TASK: 語境焦點追蹤體驗規格撰寫
EXPECTED OUTCOME: .shared/03-ux-specification.md
REQUIRED AGENT: UX Spec Writer
CONTEXT: .shared/01-requirements.md, .shared/02-wireframes.md
```

# 03-ux-specification.md — Contextual Focus Track UX

## 1. 使用者旅程 (User Journeys)

### A. 週一打開擴充功能

1. 使用者開啟 popup。
2. 看到「本週焦點卡」與當前進度（例如 0/2 焦點）。
3. 點擊「前往複習」進入 review。
4. 正確作答後收到 `Focus +1` 回饋。
5. 回到 popup，進度條同步更新。

### B. 閱讀中被動學習

1. 使用者在網頁閱讀內容。
2. 命中本週 Focus 詞彙時，tooltip 顯示 `Focus` 標記。
3. 使用者 hover 看到翻譯與難度，形成「焦點關聯」認知。
4. 若收藏新詞，相關 Focus 進度立即增加。

### C. 焦點完成與回訪

1. 完成當週 Focus 目標後，popup 顯示完成狀態。
2. history 顯示本週焦點摘要與小結。
3. 使用者下次回訪看到「距離完成還差 X」提示。

## 2. 關鍵互動規範

- Focus 進度更新時機:
  - 收藏成功: 即時
  - Review 作答完成: 即時
  - 啟動 extension 或切週: background 重算
- 單次提示頻率:
  - 同詞、同頁、同 session 最多顯示一次 `Focus` 標記
- 失敗回復:
  - Focus 資料讀取失敗時，UI 靜默降級（不阻斷核心翻譯/高亮功能）

## 3. 個人化策略 UX

- 向使用者顯示「為何推薦」:
  - 例:「你最近在閱讀技術文章，焦點建議先鞏固 Tech Writing」
- 低介入原則:
  - 不做彈窗、不阻斷閱讀與複習節奏
- 新手保護:
  - 初期僅顯示 1 個小主題，降低壓力

## 4. 邊界案例

| 案例 | UX 處理 |
|---|---|
| 詞彙不足 (<10) | 顯示「先收藏幾個單字來啟用焦點」 |
| 焦點已完成 | 顯示完成狀態 + 本週小結 |
| 使用者關閉高亮 | Focus 仍可透過 review/history 進行 |
| 使用者關閉 Focus | 立即隱藏所有 Focus UI |
| 跨時區 | 以本地裝置時區計算週期 |

## 5. 可用性與可及性

- 進度條需有文字百分比，避免只靠顏色。
- 所有 Focus 按鈕可鍵盤操作，支援 `aria-label`。
- 小尺寸 popup 優先顯示「主要焦點」，次要焦點可折疊。

## 6. 成功體驗定義

- 使用者 3 秒內理解「本週焦點是什麼」。
- 使用者在一次 session 內至少觸發 1 次 Focus 行為。
- 使用者不覺得 Focus 提示干擾主要閱讀流程。
