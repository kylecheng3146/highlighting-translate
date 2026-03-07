```
TASK: 開發藍圖與時程規劃
EXPECTED OUTCOME: .shared/07-roadmap.md
REQUIRED AGENT: Planner
CONTEXT: .shared/04-tech-architecture.md
```

# 開發藍圖 (Roadmap)

> **版本**: v2 — 片語資料庫 Level 1 整合 (2026-03-07)
> **目標版本**: v1.14.0

---

## 專案階段 (Project Phases)

### 階段一：資料準備 (Data Preparation)

**目標**：建立 `assets/phrasal_verbs_db.json`，格式正確且可載入。

**工作項目**：
1. 手工建置 500-1000 個最常用英文片語清單，包含：
   - `text`（原形）
   - `forms`（4-5 種變形，不規則動詞手工指定）
   - `translation`（繁體中文）
   - `cefr_level`（A2/B1/B2/C1）
   - `frequency_rank`（1-50000 範圍）
2. 儲存為 `assets/phrasal_verbs_db.json`
3. 更新 `manifest.json`：在 `web_accessible_resources` 加入新檔案

**驗收標準**：
- `JSON.parse(fs.readFileSync('assets/phrasal_verbs_db.json'))` 無錯誤
- 每個項目有 `text`、`translation`、`frequency_rank` 三個必填欄位
- `forms` 陣列中不包含原形本身（避免重複）

---

### 階段二：Background Service Worker 升級

**目標**：在 `background.js` 中加入片語載入、展開、儲存邏輯。

**工作項目**：
1. 新增 `loadPhrasalVerbsDB()` 函數：
   ```
   fetch(getURL) → parse → expand forms → chrome.storage.local.set
   ```
2. 在 `onInstalled` 和新增的 `onStartup` 監聽器中呼叫此函數
3. 新增 message handler `GET_PHRASAL_VERBS`（可選，供除錯用）

**驗收標準**：
- background.js 載入後，`chrome.storage.local.get('phrasalVerbsExpanded')` 返回非空陣列
- 每個片語的所有變形都有對應的 entry（含相同 translation）

---

### 階段三：Content Script 整合

**目標**：更新 `content.js` 的 `scanPageForVocabulary` 合併片語資料。

**工作項目**：
1. 在 `scanPageForVocabulary` 中加入 `chrome.storage.local.get('phrasalVerbsExpanded')`
2. 合併邏輯：`const combined = [...phrasalVerbsExpanded, ...vocabList]`
3. 傳入合併後的 combined 給 `HighlightService.scanAndHighlight`

**驗收標準**：
- 在英文頁面出現 "give up" 時，整體被高亮而非僅 "give"
- Hover 顯示 "放棄" 翻譯
- 現有已儲存單字高亮不受影響

---

### 階段四：單元測試

**目標**：確保 HighlightService 的片語匹配行為正確。

**測試案例**（新增至現有測試檔）：
```javascript
// content.test.js 或新建 highlight.test.js

test('片語整體匹配，不被單字打散', () => {
    const vocabList = [
        { text: 'give up', translation: '放棄', frequency_rank: 850, cefr_level: 'B1' },
        { text: 'give', translation: '給', frequency_rank: 100 }
    ];
    // 預期：'give up' 整體高亮，不是 'give' 單獨高亮
});

test('片語變形匹配', () => {
    const vocabList = [
        { text: 'gave up', translation: '放棄', frequency_rank: 850, cefr_level: 'B1' }
    ];
    // 預期：'gave up' 被匹配
});

test('跨 TextNode 的片語不匹配', () => {
    // 'give <b>up</b>' → 不高亮（Level 1 忽略）
});
```

**執行指令**：
```bash
npm test
```

---

### 階段五：整合測試與手動驗證

**目標**：在真實瀏覽器中驗證功能正確。

**手動測試清單**：
- [ ] 打開英文 BBC/CNN 頁面，確認片語高亮出現
- [ ] Hover 片語確認 Tooltip 顯示 DB 翻譯（非 API 翻譯）
- [ ] 點星收藏片語，確認以原形存入單字本
- [ ] 關閉「智能高亮」，確認片語高亮也一同消失
- [ ] 打開網站黑名單頁面，確認片語高亮也被禁用
- [ ] 確認現有單字高亮功能不退化

---

### 階段六：發布

**目標**：更新版本號並發布到 Chrome Web Store。

**工作項目**：
1. 更新 `manifest.json` version 為 `1.14.0`
2. 執行 `npm run test` 確保所有測試通過
3. 執行 `./deploy.sh` 打包
4. 上傳至 Chrome Web Store

---

## 技術風險與緩解措施

| 風險 | 可能性 | 緩解措施 |
|------|--------|---------|
| Regex 過長導致效能問題 | 中 | 限制 DB 500-1000 個，展開後約 3000-5000 引數，requestIdleCallback 緩解 |
| 不規則動詞遺漏 | 高 | Level 1 僅承諾手工指定的變形，文件說明此限制 |
| chrome.storage.local 容量 | 低 | 每筆 ~100 bytes，1000 片語 × 5 變形 = 500KB，遠低於 10MB 上限 |
| onStartup 與 Manifest 快取不一致 | 低 | onInstalled 覆蓋 onStartup，確保更新後重新載入 |

---

## 不在 Level 1 範圍 (Out of Scope)

- 片語發音 TTS
- 片語統計儀表板
- 跨標籤片語匹配
- 自動詞形還原（lemmatization）
- 片語管理 UI（新增/刪除）
