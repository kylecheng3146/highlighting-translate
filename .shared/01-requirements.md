# 需求規格書 (Requirements Specification)

## 專案概述 (Project Overview)

**Highlighting Translate (劃詞翻譯與高亮)** - 迭代升級項目：片語資料庫整合 (Phrasal Verbs DB Integration - Level 1)

## 核心目標 (Core Objectives)

升級現有基於單字的難度分析與高亮機制，加入對常見片語（Phrasal Verbs）和慣用語的支援，讓擴充功能在網頁上能正確識別多詞彙組合（如 "look forward to", "give up"），並作為一個整體進行高亮標示和難度分級，而不是被拆解為獨立的單字。

## 功能需求 (Functional Requirements)

### 1. 片語資料庫 (Phrasal Verbs Database)

- **資料來源**：建立或引入包含常見片語及其頻率排名或 CEFR 等級的資料（例如 `assets/phrasal_verbs_db.json`）。
- **資料結構**：類似現有的 `frequency_db.json`，需包含 `text` (片語文字，含空格)、`cefr_level` 或 `frequency_rank`。

### 2. 高亮邏輯升級 (`services/HighlightService.js`)

- **多詞彙匹配 (Multi-word Matching)**：目前的 `HighlightService` 是用 `\b(word1|word2)\b` 進行正則表達式比對。片語包含空格，需確保能正確匹配。
- **匹配優先級 (Priority)**：比對時，**片語必須優先於單字**（Longest match first）。例如若網頁出現 "give up"，必須高亮整個 "give up" (符合片語 DB)，而不是只高亮 "give" (符合單字 DB)。
  - _實作利多_：目前 `.sort((a, b) => b.length - a.length)` 已經有長度優先排序機制，這對片語匹配非常有利。

### 3. 單字庫整合與儲存 (Vocabulary Storage)

- **片語儲存**：當使用者將片語加入「已儲存單字庫」時，系統應能將包含空格的字串當作一個完整的 Vocabulary Item 儲存。
- **後端判斷**：自動匹配高亮或手動儲存高亮功能，皆需支援片語格式。

## 非功能需求 (Non-Functional Requirements)

- **效能 (Performance)**：擴容片語庫會增加 RegExp 的複雜度。目前已有 `requestIdleCallback` 分塊處理機制，需確保新增後不會造成正規表達式引擎回溯 (Catastrophic Backtracking) 過慢。
- **擴充功能大小 (Size)**：新片語 DB 應以輕量為主（建議先收錄最常用的 500-1000 個片語），避免增加過多載入時間與體積。

## 待確認事項 (Open Questions) - 待回覆

為了確保 Level 1 的輕量化實踐，請您確認以下兩個邊界條件：

1. **詞形變化問題 (Morphology)**：由於英文有時態變化（如 "give up" -> "gave up"），Level 1 是否**先只精準匹配「原形」**？或者希望加入基礎支援（例如透過預先產生變化型的清單或簡單的正則）？
2. **高亮斷行/跨標籤問題**：如果片語剛好跨越了 HTML 標籤（例如網頁原始碼為 `give <b>up</b>`），目前的 `TextNode` 邏輯無法跨節點匹配。Level 1 是否**同意先忽略跨標籤的片語**，僅處理在「同一個 TextNode 內的連續字串」？
