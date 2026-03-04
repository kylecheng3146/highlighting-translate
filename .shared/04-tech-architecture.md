```
TASK: MV3 架構設計與實作規劃
EXPECTED OUTCOME: .shared/04-tech-architecture.md
REQUIRED AGENT: Extension Architect
CONTEXT: .shared/01-requirements.md
```

# 技術架構設計 (Technical Architecture)

## 專案概述

**功能**：片語資料庫整合 (Phrasal Verbs DB Integration - Level 1)

## 影響範圍 (Impacted Components)

1. **HighlightService (`services/HighlightService.js`)**
   - 負責核心的高亮多詞彙正則表達式構建與執行。
2. **單字庫載入機制 (`services/TranslationService.js` / `background.js`)**
   - 負責載入與整合新的片語外部資料來源。
3. **資料來源 (`assets/phrasal_verbs_db.json`)**
   - 新增：負責提供初始片語資料、詞頻與 CEFR 等級。

## 核心技術方案設計

### 1. 正則表達式升級 (RegExp Enhancement)

在 `HighlightService.js` 中，原有的 regex 建立邏輯為：
`const regex = new RegExp(\`\\b(${escapedKeys.join('|')})\\b\`, 'gi');`

需要修改以支援片語中的空格：

- 對象：`vocabMap` 內的鍵（包含空格的片語）。
- 問題：轉義後空格會變成 `\ `，但網頁上的實體空格可能是換行、多個空白符號。
- 解法：在轉義後，將實體空格 `\ ` 替換為 `\s+`，增加網頁匹配的強健性：
  `const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\ /g, '\\s+');`
- 邊界確認 (Level 1 限制)：**忽略跨 HTML 標籤的片語**，維持原本利用 `TreeWalker` 在單一 `TextNode` 內進行正則表達式匹配的架構，以確保最佳效能。

### 2. 匹配優先級 (Match Priority)

利用 JavaScript 正規表達式的特性：在 `(A|B)` 結構中，排在前面的選項優先匹配。
因此，陣列排序非常關鍵：
`escapedKeys.sort((a, b) => b.length - a.length);`
這行程式碼**目前已存在**，能完美確保長度較長的「片語」會排在「單字」前，確保 "look forward to" 不會被 "look" 搶走匹配權。

### 3. 片語對齊原形 (Morphology)

依需求確認，第一版將**採用完全一致精準匹配**（Exact Match），也就是如果資料庫提供 "look forward to"，網頁上出現的 "looked forward to" 不會被高亮。這樣能將迴避引擎回溯效能問題，最快完成測試驗證。

### 4. 資料來源的載入與註冊

需要在 `manifest.json` 中的 `web_accessible_resources` 加入新檔案 `assets/phrasal_verbs_db.json`，並在相關需要載入字典的地方（例如 `services/DictionaryService` 或直接在 `background.js` 設定載入）一併載入這份檔案補充進全局單字表中。
