```
TASK: MV3 架構設計
EXPECTED OUTCOME: .shared/04-tech-architecture.md
REQUIRED AGENT: Extension Architect
CONTEXT: .shared/01-requirements.md, manifest.json, 現有服務架構
```

# 04-tech-architecture.md — Reading Progress Dashboard MV3 架構

## 1. 架構總覽

```
┌─────────────────────────────────────────────────────────────┐
│                        Content Script                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ content.js   │  │HighlightSvc  │  │TooltipSvc    │     │
│  │ (翻譯觸發)   │  │ (高亮)       │  │ (提示)       │     │
│  └──────┬───────┘  └──────────────┘  └──────────────┘     │
│         │ sendMessage                                        │
│         ▼                                                    │
├─────────────────────────────────────────────────────────────┤
│                     Service Worker                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ background.js│  │TranslationSvc│  │ StorageSvc   │     │
│  │ (訊息路由)   │  │ (翻譯 API)   │  │ (資料儲存)   │     │
│  └──────┬───────┘  └──────────────┘  └──────┬───────┘     │
│         │                                     │              │
│         ▼                                     ▼              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ StatsService │  │StreakService │  │ MilestoneSvc │     │
│  │ (統計計算)   │  │ (Streak)     │  │ (里程碑)     │     │
│  └──────┬───────┘  └──────────────┘  └──────────────┘     │
│         │                                                    │
│         │ chrome.storage.local                               │
│         ▼                                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Storage Layer                      │   │
│  │  readingProgress (每日統計)                          │   │
│  │  learningStats (聚合統計)                            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ chrome.runtime.sendMessage
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Popup / Dashboard                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ popup.js     │  │ dashboard.js │  │ShareCardSvc  │     │
│  │ (設定 + 簡易)│  │ (完整儀表板) │  │ (分享卡片)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 新增服務

### 2.1 StatsService.js

**職責**: 聚合統計資料計算

**方法**:
- `getOverview()` - 取得總覽統計 (totalWords, monthlyNew, streak, bestStreak)
- `getGrowthChart(days)` - 取得成長圖表資料
- `recordTranslation(text, isSaved)` - 記錄翻譯行為
- `getDailyProgress()` - 取得每日進度
- `getAggregatedStats()` - 取得聚合統計

### 2.2 StreakService.js

**職責**: Streak 計算與管理

**方法**:
- `calculateStreak()` - 計算當前 streak
- `hasLearnedToday()` - 檢查今日是否已學習
- `updateBestStreak(currentStreak)` - 更新最佳 streak

### 2.3 MilestoneService.js

**職責**: 里程碑系統

**方法**:
- `getCurrentMilestone(totalWords)` - 取得當前等級
- `getNextMilestone(totalWords)` - 取得下一等級
- `getProgressToNext(totalWords)` - 取得到下一等級的進度百分比

### 2.4 ShareCardService.js

**職責**: 分享卡片生成

**方法**:
- `generateCard(stats)` - 生成分享卡片 (Canvas)
- `downloadCard(canvas)` - 下載 PNG
- `copyToClipboard(canvas)` - 複製到剪貼簿

---

## 3. Storage 結構

### 3.1 readingProgress (每日統計)

```json
{
  "readingProgress": {
    "2026-08-21": {
      "translations": 12,
      "saved": 3,
      "words": ["hello", "world", "test"]
    }
  }
}
```

### 3.2 learningStats (聚合統計)

```json
{
  "learningStats": {
    "totalWords": 347,
    "bestStreak": 28,
    "firstUsed": "2026-01-15",
    "lastActivity": "2026-08-21"
  }
}
```

---

## 4. 訊息流程

### 4.1 翻譯行為記錄

```
Content Script                Service Worker              Storage
     │                              │                        │
     │  TRANSLATION_RECORDED        │                        │
     │─────────────────────────────>│                        │
     │                              │  recordTranslation()   │
     │                              │───────────────────────>│
     │                              │                        │
     │                              │  getOverview()         │
     │                              │<───────────────────────│
     │                              │                        │
     │  STATS_UPDATED               │                        │
     │<─────────────────────────────│                        │
```

### 4.2 Popup 載入統計

```
Popup                         Service Worker              Storage
  │                              │                        │
  │  GET_STATS                   │                        │
  │─────────────────────────────>│                        │
  │                              │  getOverview()         │
  │                              │───────────────────────>│
  │                              │                        │
  │                              │  STATS_DATA            │
  │<─────────────────────────────│                        │
```

### 4.3 Dashboard 載入完整統計

```
Dashboard                     Service Worker              Storage
  │                              │                        │
  │  GET_DASHBOARD_DATA          │                        │
  │─────────────────────────────>│                        │
  │                              │  getOverview()         │
  │                              │  getGrowthChart()      │
  │                              │───────────────────────>│
  │                              │                        │
  │                              │  DASHBOARD_DATA        │
  │<─────────────────────────────│                        │
```

---

## 5. 與現有服務整合

### 5.1 content.js 修改

在翻譯行為後發送訊息:

```javascript
// 新增: 翻譯記錄
chrome.runtime.sendMessage({
    action: 'TRANSLATION_RECORDED',
    text: text,
    isSaved: false
});
```

### 5.2 background.js 修改

新增訊息處理:

```javascript
case 'TRANSLATION_RECORDED':
    await statsService.recordTranslation(request.text, request.isSaved);
    sendResponse({ success: true });
    break;

case 'GET_STATS':
    const stats = await statsService.getOverview();
    sendResponse({ success: true, data: stats });
    break;

case 'GET_DASHBOARD_DATA':
    const overview = await statsService.getOverview();
    const chart = await statsService.getGrowthChart(30);
    sendResponse({ success: true, data: { overview, chart } });
    break;
```

### 5.3 popup.js 修改

在 popup 載入時取得統計:

```javascript
async function loadStats() {
    const response = await chrome.runtime.sendMessage({ action: 'GET_STATS' });
    if (response.success) {
        updateStatsUI(response.data);
    }
}
```

---

## 6. 效能考量

### 6.1 資料聚合

- 每日統計保留 90 天, 超過自動聚合
- 聚合統計 (totalWords, bestStreak) 持續保留
- 避免每次查詢遍歷所有每日資料

### 6.2 快取策略

- Popup 開啟時載入統計, 快取 5 分鐘
- Dashboard 開啟時重新計算
- 翻譯行為即時更新

### 6.3 Storage 限制

- chrome.storage.local 限制 ~10MB
- 每日資料約 1KB, 90 天約 90KB
- 安全範圍內, 無需額外處理

---

## 7. 權限需求

**無需新增權限**:

- 現有 `storage` 權限足夠
- 分享卡片使用 Canvas API, 不需額外權限
- 所有計算本地執行

---

## 8. MV3 合規檢查

| 項目 | 狀態 | 說明 |
|---|---|---|
| Service Worker | 合規 | 統計計算在 background 中執行 |
| 遠端程式碼 | 合規 | 無新增遠端腳本 |
| 權限最小化 | 合規 | 無新增權限 |
| Host permissions | 合規 | 不新增 host 權限 |

---

## 9. 風險與緩解

| 風險 | 影響 | 緩解 |
|---|---|---|
| 統計不準確 | 使用者困惑 | 多重驗證 + 本地測試 |
| Storage 超限 | 資料遺失 | 自動聚合舊資料 |
| 分享卡片失敗 | 體驗中斷 | 降級為文字摘要 |
