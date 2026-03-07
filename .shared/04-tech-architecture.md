```
TASK: MV3 架構設計與實作規劃
EXPECTED OUTCOME: .shared/04-tech-architecture.md
REQUIRED AGENT: Extension Architect
CONTEXT: .shared/01-requirements.md, background.js, services/HighlightService.js
```

# 技術架構設計 (Technical Architecture)

> **版本**: v2 — 片語資料庫 Level 1 整合 (2026-03-07)

## 專案概述

**功能**：片語資料庫整合 (Phrasal Verbs DB Integration - Level 1)
**擴充功能版本目標**：v1.14.0

---

## 影響範圍 (Impacted Components)

| 檔案 | 變更類型 | 說明 |
|------|---------|------|
| `assets/phrasal_verbs_db.json` | **新增** | 片語資料庫（500-1000 個片語） |
| `manifest.json` | **修改** | 加入 phrasal_verbs_db.json 到 web_accessible_resources |
| `background.js` | **修改** | 新增片語 DB 載入、變形展開、合併邏輯 |
| `services/HighlightService.js` | **維持** | 現有 `\s+` 替換機制已就緒，無需修改 |
| `content.js` | **維持** | `scanPageForVocabulary` 接收合併後詞彙列表，邏輯不變 |

---

## 核心技術方案設計

### 1. 資料庫結構 (Data Schema)

`assets/phrasal_verbs_db.json` 採用與 `frequency_db.json` 相容的格式：

```json
[
  {
    "text": "give up",
    "cefr_level": "B1",
    "frequency_rank": 850,
    "translation": "放棄",
    "forms": ["gives up", "gave up", "giving up", "given up"]
  },
  {
    "text": "look forward to",
    "cefr_level": "B1",
    "frequency_rank": 920,
    "translation": "期待",
    "forms": ["looks forward to", "looked forward to", "looking forward to"]
  }
]
```

- `text`：片語原形（作為儲存鍵與顯示文字）
- `forms`：預先手工指定的變形列表（不規則動詞需手工填入）
- `translation`：中文翻譯（Tooltip 顯示用，不呼叫 API）
- `cefr_level` / `frequency_rank`：與 frequency_db.json 相同用途

### 2. 載入與展開流程 (Load & Expand Pipeline)

在 `background.js` 的 `chrome.runtime.onInstalled` 事件（及 `onStartup`）中：

```javascript
async function loadPhrasalVerbsDB() {
    // 1. Fetch DB from extension assets
    const url = chrome.runtime.getURL('assets/phrasal_verbs_db.json');
    const res = await fetch(url);
    const phrasalVerbs = await res.json();

    // 2. 展開所有變形，全部映射到相同的翻譯資料
    const expandedEntries = [];
    for (const pv of phrasalVerbs) {
        const base = {
            text: pv.text,
            translation: pv.translation,
            cefr_level: pv.cefr_level,
            frequency_rank: pv.frequency_rank
        };
        // 原形本身
        expandedEntries.push(base);
        // 所有變形
        if (pv.forms) {
            for (const form of pv.forms) {
                expandedEntries.push({ ...base, text: form });
            }
        }
    }

    // 3. 儲存到 chrome.storage.local（content.js 從這裡讀取）
    await chrome.storage.local.set({ phrasalVerbsExpanded: expandedEntries });
}
```

### 3. Content Script 整合 (`content.js`)

`scanPageForVocabulary` 函數需更新，合併單字與片語後傳給 `HighlightService`：

```javascript
async function scanPageForVocabulary() {
    try {
        // 取得已儲存單字
        const vocabList = await storageService.getTranslations(1000);

        // 取得展開後的片語列表
        const { phrasalVerbsExpanded = [] } = await chrome.storage.local.get('phrasalVerbsExpanded');

        // 合併：片語放前面（確保長優先匹配）
        const combined = [...phrasalVerbsExpanded, ...(vocabList || [])];

        if (combined.length > 0) {
            highlightService.scanAndHighlight(document.body, combined);
        }
    } catch (e) {
        console.error('Error scanning page for vocabulary:', e);
    }
}
```

### 4. 正則表達式升級確認 (RegExp)

`HighlightService.js` 第 36 行現有邏輯：
```javascript
.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\ /g, '\\s+')
```
此邏輯**已完整支援片語**，無需修改。`\s+` 確保空格可匹配任意空白字符。

### 5. 匹配優先級確認

`HighlightService.js` 第 37 行：
```javascript
.sort((a, b) => b.length - a.length)
```
片語（如 `give up`）長度 > 單字（如 `give`），自然排在前面，確保片語整體優先匹配。

---

## MV3 合規性檢查

| 項目 | 狀態 | 說明 |
|------|------|------|
| Service Worker (background.js) | 合規 | 使用 fetch() 載入資產，符合 MV3 |
| web_accessible_resources | 需更新 | 加入 `assets/phrasal_verbs_db.json` |
| 權限需求 | **不需新增** | 使用現有 `storage` 權限即可 |
| host_permissions | 不需修改 | 片語 DB 為本地資產 |
| Content Script | 不需修改 | 透過 chrome.storage 讀取 |

---

## 安全性考量

- 片語 DB 為靜態 JSON，無動態執行風險
- 片語翻譯顯示使用現有 `escapeHtml()` 函數防 XSS
- `chrome.storage.local` 無跨域洩露風險
