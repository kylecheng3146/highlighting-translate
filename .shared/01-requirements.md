# 需求規格書 (Requirements Specification)

## 專案概述 (Project Overview)

**Highlighting Translate (劃詞翻譯與高亮)** - 迭代升級項目：片語資料庫整合 (Phrasal Verbs DB Integration - Level 1)

> **版本**: v2 — 地獄訪談完整決策版 (2026-03-07)
> **狀態**: 所有 Open Questions 已解答，可進入實作階段

---

## 核心目標 (Core Objectives)

升級現有基於單字的難度分析與高亮機制，加入對常見片語（Phrasal Verbs）和慣用語的支援，讓擴充功能在網頁上能正確識別多詞彙組合（如 "look forward to", "give up"），並作為一個整體進行高亮標示和難度分級，而不是被拆解為獨立的單字。

---

## 功能需求 (Functional Requirements)

### 1. 片語資料庫 (Phrasal Verbs Database)

- **檔案位置**: `assets/phrasal_verbs_db.json`
- **資料來源**: 手工建置，收錄最常用 500-1000 個片語
- **資料結構**: 與現有 `frequency_db.json` 格式相容

  ```json
  [
    {
      "text": "give up",
      "cefr_level": "B1",
      "frequency_rank": 850,
      "translation": "放棄"
    },
    {
      "text": "look forward to",
      "cefr_level": "B1",
      "frequency_rank": 920,
      "translation": "期待"
    }
  ]
  ```

- **web_accessible_resources**: 需在 `manifest.json` 中加入允許存取

### 2. 詞形變化策略 (Morphology - 已確認)

- **策略**: 預先展開變形表 (小範圍，4 種變形)
- **展開規則**: 每個片語展開為以下 4 種標準變形：
  1. 原形 (base): `give up`
  2. 第三人稱單數 (-s): `gives up`
  3. 過去式 (-ed / 不規則): `gave up`
  4. 現在分詞 (-ing): `giving up`
  5. 過去分詞 (-en/-ed): `given up`

  > 注意：實際為 5 個變形（含過去分詞），但以「小範圍」為原則，不規則動詞需手工指定。

- **vocabMap 展開策略**: 所有 forms 直接映射到相同的 `{translation, rank, level}` 資料，在 `background.js` 載入時展開

  ```js
  // 展開後的 vocabMap 鍵：
  // "give up" → {translation: "放棄", rank: 850, level: "B1"}
  // "gave up" → {translation: "放棄", rank: 850, level: "B1"}
  // "gives up" → {translation: "放棄", rank: 850, level: "B1"}
  // "giving up" → {translation: "放棄", rank: 850, level: "B1"}
  // "given up" → {translation: "放棄", rank: 850, level: "B1"}
  ```

### 3. 高亮邏輯升級 (`services/HighlightService.js`)

- **多詞彙匹配**: 現有 `\s+` 替換空格機制已就緒，可直接支援片語
- **匹配優先級**: 現有 `.sort((a, b) => b.length - a.length)` 確保片語優先於單字匹配
- **跨標籤片語**: **忽略跨標籤情況**，僅匹配同一 TextNode 內的連續字串 (Level 1 範圍)
- **視覺樣式**: 片語高亮使用相同的 `hl-freq-high / hl-freq-mid / hl-freq-low` 類別，不另設差異

### 4. 載入與整合流程

- **載入時機**: 在 `background.js` service worker 初始化時載入 `phrasal_verbs_db.json`
- **儲存**: 載入後儲存到 `chrome.storage.local`，與 `frequency_db` 合併後傳遞給 content script
- **傳遞路徑**: `background.js` → `chrome.storage.local` → `content.js` → `HighlightService`
- **合併方式**: 片語資料展開所有變形後，與單字資料合併為同一個詞彙列表

### 5. Tooltip 顯示

- **hover 行為**: 片語高亮元素 hover 時，直接從 `data-translation` 顯示資料庫內建翻譯
- **不呼叫 API**: 片語高亮的翻譯來自 DB，不觸發即時 API 翻譯

### 6. 單字本整合

- **儲存格式**: 使用者手動儲存片語時，以**原形** (如 "give up") 存入單字本
- **行為一致**: 與現有單字儲存機制相同

---

## 非功能需求 (Non-Functional Requirements)

- **效能**: 信任現有 `requestIdleCallback` + chunk 機制（不增加額外 regex 數量限制）
- **擴充功能大小**: 片語 DB 以 500-1000 個片語為限，避免過度膨脹體積
- **向下相容**: 片語功能不影響現有單字高亮邏輯

---

## 技術邊界 (Technical Boundaries)

| 項目 | Level 1 決策 |
|------|--------------|
| 詞形變化 | 預先展開 5 種變形（含不規則手工指定） |
| 跨標籤匹配 | 忽略，僅處理同一 TextNode |
| vocabMap 策略 | 所有 forms 直接映射 |
| 視覺差異 | 無，與單字相同頻率顏色 |
| Tooltip 翻譯 | DB 內建，不呼叫 API |
| 單字本儲存 | 以原形存入 |
| DB 建置方式 | 手工建置，格式與 frequency_db.json 相容 |
| 載入時機 | background.js → chrome.storage → content.js |

---

## 實作影響範圍 (Affected Files)

1. **新增**: `assets/phrasal_verbs_db.json`
2. **修改**: `manifest.json` - 加入 web_accessible_resources
3. **修改**: `background.js` - 載入片語 DB，展開變形，合併後儲存
4. **維持**: `services/HighlightService.js` - 現有邏輯已能支援，無需大改
5. **可能修改**: `content.js` - 確認接收合併後詞彙列表的邏輯
