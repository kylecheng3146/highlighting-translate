# 02-wireframes.md - Smart Frequency Radar & Mastery Dashboard UI

## 1. Enhanced Translation Tooltip (浮窗增強)
在現有的翻譯浮窗中，我們在頂部或底部新增一個「頻率標籤」。

```text
+------------------------------------------+
| [EN] meticulous             [Audio Icon] |
|------------------------------------------|
| [Frequency Rank: #4,215] [Level: B2] <--- NEW!
|------------------------------------------|
| adj. 謹慎的、一絲不苟的                     |
|                                          |
| "He was meticulous about his hygiene."   |
|------------------------------------------|
| [Save to Flashcards]      [Close]        |
+------------------------------------------+
```
**UI 說明：**
- **標籤樣式**：使用小膠囊狀 (Pill) 背景。
- **顏色編碼**：
    - Top 3000: 橘色背景 (重要)
    - Top 3001-10000: 藍色背景 (一般)
    - Top 10001+: 灰色背景 (罕見)

## 2. Dynamic Highlighting Styles (動態高亮樣式)
根據 `frequency_rank` 應用不同的 CSS 變體。

```css
/* Top 3000 (高頻詞) - 亮橘色高亮，吸引注意力 */
.hl-freq-high {
  background-color: #ff8200; /* Popeyes Orange */
  color: white;
  border-radius: 2px;
  cursor: help;
}

/* Top 3001-10000 (中頻詞) - 標準淡黃色 */
.hl-freq-mid {
  background-color: #fff3cd;
  border-bottom: 2px solid #ffda6a;
  cursor: help;
}

/* Top 10001+ (低頻詞) - 灰色虛線，不干擾閱讀 */
.hl-freq-low {
  border-bottom: 1px dashed #adb5bd;
  cursor: help;
}
```

## 3. Mastery Dashboard (歷史頁面儀表板)
位於 `history.html` 的頂部，作為全局進度看板。

```text
+-------------------------------------------------------------+
| [Dashboard] Your English Mastery Progress                   |
+---------------------------+---------------------------------+
| Total Vocabulary: 156     | Mastery Index: 12.4%            |
+---------------------------+---------------------------------+
|                                                             |
| Top 2000 Coverage (Common Words)                            |
| [====================>--------------------] 52% (104 / 200) |
|                                                             |
| Top 5000 Coverage (Fluent Level)                            |
| [========>--------------------------------] 22% (110 / 500) |
|                                                             |
| SRS Status Distribution:                                    |
| [Learning: 40] [Reviewing: 80] [Mastered: 36]               |
+-------------------------------------------------------------+
| [Filter by Rank] [Search List...] [Export Data]             |
+-------------------------------------------------------------+
| (History List Items Below...)                               |
+-------------------------------------------------------------+
```

**UI 說明：**
- **進度條 (Progress Bars)**：使用 Tailwind 的 `bg-blue-500` 與 `bg-gray-200` 組合。
- **統計數字**：展示使用者在特定詞頻區間內的「查詞覆蓋率」。
- **SRS 分佈**：用不同的標籤顏色區分單字的記憶狀態。

## 4. Interaction Flow (互動流程)
1. 使用者在網頁選取單字。
2. Tooltip 出現，顯示翻譯 + 詞頻等級（顏色同步）。
3. 單字自動存儲，並在 `history.html` 中更新覆蓋率數字。
4. 使用者打開歷史頁面，看到進度條增長。
