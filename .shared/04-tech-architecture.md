```
TASK: MV3 架構設計與實作規劃
EXPECTED OUTCOME: .shared/04-tech-architecture.md
REQUIRED AGENT: Extension Architect
CONTEXT: .shared/01-requirements.md, background.js, popup.js, history.js, review.js, content.js, options.js
```

# 技術架構設計 (Contextual Focus Track)

## 1. 架構總覽

### 核心元件

- `FocusTrackService` (新增): 焦點生成、進度計算、週結算
- `background.js` (修改): 週切換偵測、焦點重算
- `popup.js` (修改): 焦點摘要讀取與 CTA
- `history.js` (修改): 焦點摘要顯示
- `review.js` (修改): 作答事件回寫 Focus 進度
- `content.js` (修改): tooltip Focus 標籤渲染
- `options.js` (修改): 開關與回滾控制

### MV3 與 Message 流

- UI -> Background: `chrome.runtime.sendMessage`
- Background -> storage: `chrome.storage.local/sync`
- Content -> Background: 收藏事件沿用既有 storage save 路徑觸發 Focus 更新

## 2. 資料模型

`chrome.storage.local` 新增 key:

```json
{
  "focusTrack": {
    "weekId": "2026-W14",
    "generatedAt": 1775232000000,
    "topics": [
      {
        "id": "tech-writing",
        "label": "Tech Writing",
        "target": 10,
        "progress": 4,
        "status": "in_progress",
        "reason": "最近閱讀多為技術文章"
      }
    ],
    "summary": {
      "score": 40,
      "lastVisitAt": 1775318400000
    }
  }
}
```

`chrome.storage.sync` 新增 key:

```json
{
  "enableFocusTrack": true,
  "focusInTooltip": true,
  "focusInReview": true,
  "focusInPopup": true,
  "focusExperimentFlag": false
}
```

## 3. 焦點生成策略

### 輸入訊號

- 近期閱讀頁面關鍵詞統計（本地摘要）
- 低熟練詞分佈（learningRate < threshold）
- 近期收藏詞語言方向
- 上週 Focus 完成率

### 輸出規則

- 產生 1-2 個 Focus Topic
- `target` 由基準值 * 個人化係數計算
- 個人化係數範圍: 0.8 - 1.2
- 新手保護: 詞彙量 < 20 時僅生成 1 個小目標

## 4. 事件回寫與一致性

- 收藏成功時: `STORAGE_SAVE` 完成後觸發 `FOCUS_APPLY_EVENT`
- review 作答時: 既有 `updateSRSStatus` 後觸發 `FOCUS_APPLY_EVENT`
- 背景每次喚醒時檢查 `weekId`，切週即重新生成

## 5. 回滾與開關策略

- `options` 中的總開關 `enableFocusTrack` 可關閉整體
- 逐模組開關 `focusInTooltip` / `focusInReview` / `focusInPopup`
- `focusExperimentFlag` 可強制停用（給內部回滾）

## 6. 與既有功能相容性

- 不修改翻譯 API 呼叫路徑
- 不新增 host permissions
- tooltip 僅增加 `Focus` 標記，不改核心渲染流程

## 7. MV3 合規檢查

| 項目 | 狀態 | 說明 |
|---|---|---|
| Service Worker | 合規 | 焦點計算在 background 中執行 |
| 遠端程式碼 | 合規 | 無新增遠端腳本 |
| 權限最小化 | 合規 | 無新增權限 |
| Host permissions | 合規 | 不新增 host 權限 |

## 8. 風險與緩解

| 風險 | 影響 | 緩解 |
|---|---|---|
| 焦點不準確 | 使用者困惑 | 顯示推薦原因 + 可關閉模組 |
| 背景喚醒不穩定 | 更新延遲 | UI 進入時補一次重算 |
| 資料欄位不一致 | 顯示錯誤 | FocusTrackService 統一 schema validator |
