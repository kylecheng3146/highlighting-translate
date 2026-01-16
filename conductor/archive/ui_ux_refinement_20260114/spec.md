# 技術規格書：UI/UX 優化 (UI/UX Refinement)

## 1. 概述
本軌道旨在提升「Highlighting Translate」擴充功能的整體視覺與互動品質。我們將從現有的基本實作轉向符合 Material Design 規範、具備動態回饋且高度一致的使用者介面。

## 2. 變更範圍
### 2.1 Popup (設定面板)
- 重新設計 `popup.html` 的佈局，使用 Material Design 元件（如：切換開關、下拉選單、滑桿）。
- 優化 CSS，加入適當的間距 (Spacing) 與字體層次 (Typography)。
- 確保設定更改後有視覺確認（如：微小的顏色變化或圖標提示）。

### 2.2 Content Script Popup (網頁翻譯框)
- 更新 `content.js` 中動態生成的 DOM 結構與樣式。
- 實作平滑的顯示 (Fade-in/Slide-up) 與消失動畫。
- 確保翻譯框的位置精確固定在選取文字下方，且具備 z-index 管理以避免被網頁元素遮擋。

## 3. 技術考量
- **Vanilla CSS**: 不使用外部 UI 庫，以保持擴充功能的輕量化。
- **Web Animations API 或 CSS Transitions**: 實作高效能動畫。
- **Shadow DOM (選配)**: 考慮將內容腳本的翻譯框封裝在 Shadow DOM 中，以防止網頁原始 CSS 的干擾。

## 4. 驗收標準
- 彈出視窗風格與 Chrome 系統風格協調。
- 選取文字後，翻譯框顯示位置正確且動畫流暢。
- 點擊空白處或重新選取文字時，舊翻譯框立即消失。
