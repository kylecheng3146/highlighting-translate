```
TASK: MV3 架構設計與實作規劃
EXPECTED OUTCOME: .shared/04-tech-architecture.md
REQUIRED AGENT: Extension Architect
CONTEXT: .shared/01-requirements.md, background.js, popup.js, history.js, review.js
```

# 技術架構設計 (Personalized Weekly Mission)

## 1. 架構總覽

### 核心元件

- `MissionService` (新增): 任務生成、進度計算、週結算
- `background.js` (修改): 週切換偵測、任務重算、提醒排程
- `popup.js` (修改): 任務摘要讀取與 CTA
- `history.js` (修改): 任務儀表摘要顯示
- `review.js` (修改): 作答事件回寫任務進度

### MV3 與 Message 流

- UI -> Background: `chrome.runtime.sendMessage`
- Background -> storage: `chrome.storage.local/sync`
- Content -> Background: 收藏事件可用既有 storage save 路徑觸發任務更新

## 2. 資料模型

`chrome.storage.local` 新增 key:

```json
{
  "weeklyMission": {
    "weekId": "2026-W13",
    "generatedAt": 1774636800000,
    "completed": false,
    "tasks": [
      {
        "id": "review_due_words",
        "target": 12,
        "progress": 6,
        "status": "in_progress",
        "reason": "上週到期未複習數偏高"
      }
    ],
    "stretchTasks": [],
    "summary": {
      "score": 45,
      "weeklyStreak": 2
    }
  }
}
```

`chrome.storage.sync` 新增 key:

```json
{
  "enableMissionReminder": false,
  "missionReminderHour": 20
}
```

## 3. 任務生成策略

### 輸入訊號

- 到期卡數量 (`nextReview <= now`)
- 低熟練詞數 (`learningRate < threshold`)
- 上週新詞新增數
- 上週任務完成率

### 輸出規則

- 產生 3 個主任務（複習/弱項/新詞）
- `target` 由基準值 * 個人化係數計算
- 個人化係數範圍: 0.8 - 1.2

## 4. 事件回寫與一致性

- 收藏成功時: `STORAGE_SAVE` 完成後觸發 `MISSION_RECALC_PROGRESS`
- review 作答時: 既有 `updateSRSStatus` 後觸發 `MISSION_APPLY_EVENT`
- 背景每次喚醒時檢查 `weekId`，切週即重新生成

## 5. 可選提醒權限策略

- `manifest.json`:
  - `optional_permissions`: `notifications`
- 使用者開啟提醒時:
  1. `chrome.permissions.request({ permissions: ['notifications'] })`
  2. 成功後由 background 建立每日提醒

## 6. 與既有功能相容性

- 不修改翻譯 API 呼叫路徑
- 不增加 content script 權限
- 高亮引擎僅增補 `mission` 標記資料，不改 regex 核心

## 7. MV3 合規檢查

| 項目 | 狀態 | 說明 |
|---|---|---|
| Service Worker | 合規 | 任務計算在 background 中執行 |
| 遠端程式碼 | 合規 | 無新增遠端腳本 |
| 權限最小化 | 合規 | 通知採 optional_permissions |
| Host permissions | 合規 | 不新增 host 權限 |

## 8. 風險與緩解

| 風險 | 影響 | 緩解 |
|---|---|---|
| 任務目標過高導致放棄 | 留存下降 | 設上限 + 新手保護 |
| 背景喚醒不穩定 | 任務延遲更新 | 每次 UI 進入時補一次重算 |
| 資料欄位不一致 | 任務錯誤 | MissionService 統一 schema validator |
