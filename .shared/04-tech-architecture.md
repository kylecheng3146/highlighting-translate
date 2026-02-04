# 04. Technical Architecture (技術架構)

## 1. 系統組件 (System Components)

### 1.1 Review Page (`review.html` + `review.js`)

- **類型**: Extension Page (打包在擴充功能內的 HTML)。
- **職責**:
  - 渲染測驗 UI (Vue/React or Vanilla JS? -> 依專案現狀，似乎是 Vanilla JS + Tailwind)。
  - 與 `chrome.storage` 直接互動以讀取單字與寫入進度。
  - 運算測驗邏輯 (隨機出題、計分)。

### 1.2 Storage Service (`storage.js` / `HighlightService.js`)

- **職責更新**:
  - **Migration**: 需實作 `migrateHistorySchema()`，將舊的純陣列或舊物件結構轉為包含 `learningRate` 的新結構。
  - **Query**: 新增 `getReviewCandidates()` 方法，篩選出 `!isArchived` 的單字。
  - **Update**: 新增 `updateWordProgress(word, isCorrect)` 方法。

### 1.3 Background Service Worker (`background.js`)

- **職責**:
  - 監聽 `onInstalled` 事件，執行資料遷移 (Migration)。
  - (Optional) 監聽來自 Review Page 的 "Quiz Completed" 訊息，如果有需要更新 Badge 或其他全域狀態。

## 2. 資料流 (Data Flow)

1. **User** 點擊 Popup "Start Review"。
2. **Popup** 呼叫 `chrome.tabs.create({ url: 'review.html' })`。
3. **Review Page** 載入 `review.js`。
4. **Review Page** 呼叫 `HighlightService.getReviewCandidates()` 從 `storage.local` 獲取單字。
   - 若數量不足 (<4)，Service 自動補入 `fallback_words.json`。
5. **Review Page** 生成 10 題測驗並渲染。
6. **User** 作答。
7. **Review Page** 根據結果呼叫 `HighlightService.updateWordProgress()` 寫回 `storage.local`。
8. **User** 完成測驗，查看結果。

## 3. 資料結構 (Data Schema)

### Storage Key: `vocabulary_history`

```typescript
interface VocabularyItem {
  id: string; // (New) 若無則使用 word 當 key
  word: string;
  meaning: string;
  context?: string; // 例句
  url?: string; // 來源網址
  timestamp: number;

  // New Fields for Quiz
  learningRate: number; // 0 - 100
  isArchived: boolean;
  lastReviewedAt?: number;
}
```

## 4. 目錄結構變更 (Directory Structure)

```text
/
├── review.html        (New)
├── review.js          (New)
├── review.css         (New - Tailwind input)
├── assets/
│   └── fallback_words.json (New)
├── services/
│   └── HighlightService.js (Modify)
└── background.js      (Modify)
```
