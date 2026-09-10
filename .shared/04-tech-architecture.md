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

---

# 架構增補：Cloud Backup & Cross-Device Sync

## 1. 元件分工

維持現有 MV3 Service Worker 架構，新增最少兩個責任單元：

| 元件 | 職責 |
|---|---|
| `BackupSyncService` | 本機變更收集、debounce、合併、快照、重試與同步狀態 |
| `GoogleDriveService` | OAuth token、資料夾/檔案建立、讀取、更新與 Drive 錯誤轉換 |
| `SyncMergeService` | 單字 LWW、活動事件去重、設定合併、tombstone 與差異摘要 |

Popup 只透過 `chrome.runtime.sendMessage` 呼叫 Service Worker，不直接操作 Drive API。

## 2. Manifest 與權限策略

同步功能啟用前才請求可選權限：

```json
{
  "optional_permissions": ["identity", "alarms"],
  "oauth2": {
    "client_id": "<Google OAuth client id>",
    "scopes": ["https://www.googleapis.com/auth/drive.file"]
  },
  "host_permissions": ["https://www.googleapis.com/*"]
}
```

- 保留既有 `storage`；不新增 `downloads`、廣泛 `drive`、`drive.readonly` 或其他 host permission。
- `drive.file` 只存取本功能建立/使用的備份資料夾與檔案。
- OAuth access token 不寫入 `chrome.storage`；只使用 `chrome.identity` 的 token cache。
- `401` 時移除快取 token 並要求重新授權一次；不可無限重試。
- Google OAuth client、Drive scope 與隱私政策需在發布前完成設定與審查。

## 3. Local storage schema

### 3.1 同步 metadata（只存本機）

```json
{
  "backupSyncMeta": {
    "enabled": true,
    "accountId": "chrome-identity-account-id",
    "deviceId": "stable-local-device-id",
    "folderId": "drive-folder-id",
    "fileId": "drive-file-id",
    "state": "synced",
    "lastSuccessAt": 0,
    "nextRetryAt": 0,
    "pendingCount": 0,
    "lastErrorCode": null,
    "lastRemoteRevision": null
  }
}
```

`accountId`、Drive IDs 與錯誤狀態不可進入遠端 backup payload；access token 永不持久化。

### 3.2 單字記錄

在既有 `savedTranslations` item 增加：

```json
{
  "id": "stable-vocabulary-id",
  "updatedAt": 0,
  "updatedBy": "device-id",
  "text": "hello",
  "translation": "你好"
}
```

新資料使用 UUID；既有資料以 canonical `text + NUL + translation` 產生穩定 digest ID，保留目前的去重語意。

### 3.3 活動事件

```json
{
  "eventId": "device-id:sequence",
  "type": "translation",
  "wordKey": "hello",
  "occurredAt": 0,
  "deviceId": "device-id"
}
```

翻譯、收藏與 Review 產生唯一事件；同步時以 `eventId` union，兩台裝置同日事件完整保留，再由本機重建 `readingProgress`、Streak 與 Dashboard 統計。過期活動依現有 90 天聚合策略壓縮，聚合桶也要帶裝置來源與 schema 版本。

### 3.4 Remote backup payload

```json
{
  "format": "highlighting-translate-backup",
  "schemaVersion": 1,
  "current": {
    "createdAt": 0,
    "updatedAt": 0,
    "stateHash": "sha-256",
    "savedTranslations": [],
    "activityEvents": [],
    "settings": {},
    "derived": {
      "learningStats": {},
      "weeklyMission": {},
      "focusTrack": {},
      "reports": {}
    },
    "tombstones": []
  },
  "snapshots": []
}
```

`snapshots` 最多 7 筆，保存完整 state、建立時間、來源 deviceId、reason、stateHash 與摘要。快照不是另外 7 個 Drive 檔案，符合「單一 JSON 內含 7 版本」決策。

## 4. 同步演算法

1. 本機資料先寫入，再由 `chrome.storage.onChanged` 標記 pending。
2. 以 60 秒 debounce 合併多次變更；多次變更只產生一個上傳工作。
3. Service Worker 啟動、Popup/Dashboard 開啟與 5 分鐘 alarm 觸發 remote pull。
4. 讀取 Drive current 與 remote revision/stateHash。
5. `SyncMergeService` 執行：
   - 單字：依 `id` 選擇較新 `updatedAt`。
   - 活動：依 `eventId` union 去重。
   - 設定：依設定 key 的 `updatedAt` 做 LWW。
   - tombstone：與同一 entity 的更新時間比較，較新者生效。
   - derived：以合併後的單字、活動與設定重建。
6. 建立新的 current 與歷史 snapshot，裁剪到 7 筆。
7. 寫回 Drive；成功後才更新本機 `lastSuccessAt` 與 remote revision。
8. 競態或遠端 revision 改變時重新讀取、合併並重試；不可用本機舊 payload 直接覆蓋遠端。

## 5. Service Worker 事件

- `chrome.storage.onChanged`：標記 pending、啟動 debounce。
- `chrome.alarms`：每 5 分鐘檢查 remote；Service Worker 每次啟動都重建 alarm。
- `chrome.runtime.onMessage`：提供 `SYNC_NOW`、`GET_SYNC_STATUS`、`LIST_SNAPSHOTS`、`PREVIEW_RESTORE`、`RESTORE_SNAPSHOT`、`ENABLE_SYNC`、`DISABLE_SYNC`、`SIGN_OUT`。
- popup/dashboard 不保留長連線；每次操作以一次性 message 取得結果。

## 6. 帳號隔離

- 每個同步 metadata 綁定 `accountId` 與 `folderId/fileId`。
- 登出只停用同步，保留 local state 與 Drive file。
- 切換帳號前停止目前排程、清除本機 Drive IDs，再為新帳號重新初始化。
- 新帳號不得自動沿用舊帳號的 fileId；第一次合併須走初始化流程。

## 7. 失敗分類

| 類型 | 行為 |
|---|---|
| 網路、429、5xx | 保留 pending，1/5/15/30 分鐘退避，最多 24 小時 |
| 401/403 | 停止重試，狀態改 `auth_required` 或 `permission_error` |
| 找不到資料夾/檔案 | 重新搜尋或建立，不能默默建立第二份資料 |
| JSON/schema 錯誤 | 不覆蓋本機，保留 remote 原檔並顯示人工處理錯誤 |
| payload 過大 | 不上傳，顯示大小警告，保留本機與現有 remote |

## 8. MV3 與政策依據

- [Chrome Identity API](https://developer.chrome.com/docs/extensions/reference/api/identity) 支援 OAuth token 取得。
- [Chrome Alarms API](https://developer.chrome.com/docs/extensions/reference/api/alarms) 適合 Service Worker 的週期檢查；啟動時應重新確認 alarm 存在。
- [Manifest OAuth2](https://developer.chrome.com/docs/extensions/reference/manifest/oauth2) 定義 extension OAuth client 與 scope。
- [Google `drive.file` scope](https://developers.google.com/identity/protocols/oauth2/scopes) 是比完整 Drive scope 更窄的資料存取範圍。
- [Google Drive file API](https://developers.google.com/drive/api/guides/create-file) 支援建立資料夾與 JSON 檔案。
- 由於備份包含瀏覽活動/網址等使用者資料，需更新 [Chrome Web Store User Data Policy](https://developer.chrome.com/docs/webstore/user_data) 相關隱私揭露與 Limited Use 說明。
