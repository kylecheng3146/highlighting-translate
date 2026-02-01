# 04-tech-architecture.md - Smart Frequency Radar Tech Stack

## 1. Data Schema Evolution (數據結構演進)

現有的 `Translation` 物件將進行擴展：

```typescript
interface Translation {
  original: string;
  translated: string;
  context: string;
  timestamp: number;
  srs_stage: number;
  // --- NEW FIELDS ---
  frequency_rank?: number; // 1 to 20000
  cefr_level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  last_lookup_url: string; // 用於熱點分析
}
```

## 2. Storage Migration Strategy (數據遷移策略)

在 `background.js` 的 `onInstalled` 事件中觸發：

1. **版本檢查**：讀取 `chrome.storage.local.get('db_version')`。
2. **條件觸發**：若 `db_version < 2.0`。
3. **異步批次處理**：
    - 加載 `assets/frequency_db.json`。
    - 獲取所有現有翻譯紀錄。
    - 遍歷紀錄，使用原型提取算法 (Lemmatization) 匹配 `frequency_rank`。
    - 更新存儲並將 `db_version` 設為 `2.0`。

## 3. Component Responsibilities (各組件職責)

### Background Service Worker (The Brain)
- **詞頻引擎**：持有 20,000 詞頻的 `Map` 對象（緩存在記憶體中）。
- **訊息處理**：監聽 `CMD_GET_FREQUENCY` 請求並回傳結果。
- **儀表板計算**：定期彙總 `chrome.storage` 數據，計算 Top 2000/5000 覆蓋率，並存入快取。

### Content Script (The View)
- **詞法還原**：在發送請求前，嘗試將複數/時態還原（簡單正則或外部庫）。
- **動態樣式**：根據回傳的 `rank` 動態掛載 CSS 類別（`hl-freq-high`, etc.）。

### Dashboard (history.js)
- **渲染邏輯**：從快取讀取覆蓋率數據，或直接即時計算（若數據量 < 1000）。

## 4. Messaging Protocol (通訊協定)

```json
// Request Frequency Rank
{
  "action": "CMD_GET_WORD_INFO",
  "payload": { "word": "subtle" }
}

// Response
{
  "rank": 920,
  "level": "B2",
  "is_high_frequency": true
}
```

## 5. Optimization (性能優化)
- **詞頻庫格式**：將 JSON 轉換為 `Uint16Array` 或壓縮的字串以減少內存佔用。
- **Lazy Loading**：僅在使用者打開翻譯功能時才將詞頻 Map 加載進 Service Worker 內存。