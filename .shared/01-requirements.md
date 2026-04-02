```
TASK: 地獄訪談需求提取與產品定義（新功能迭代）
EXPECTED OUTCOME: .shared/01-requirements.md
REQUIRED AGENT: Hell Interviewer
CONTEXT: 使用者訪談答案、.shared/ 既有輸出、現有 extension 架構
```

# 需求規格書 (Requirements Specification)

## 專案概述

**Highlighting Translate** 新功能提案：**Contextual Focus Track（語境焦點追蹤）**

> 版本: v1 (2026-04-02)
> 狀態: Hell Interview 已完成，可進入規格化階段

本功能聚焦「可見度」與「個人化」，在純本地運算前提下，從最近的閱讀語境、收藏詞彙、複習紀錄中產生「本週焦點主題」，並在高亮與 review 中以低介入方式提醒，讓使用者更有感地回來繼續學。

---

## 訪談結論摘要

- 核心目標: 增加功能可見度 + 強化個人化
- 主要場景: 內容頁高亮、Review
- 成功指標: 使用者滿意度
- 受眾: 新手、中階、高活躍、跨語言、特定領域
- 關鍵行為: 提升回訪頻率
- 隱私邊界: 純本地運算
- 權限策略: 最小權限、避免新增權限
- 回滾策略: 功能總開關 + 逐模組開關 + 實驗標記
- 介入強度: 低（不打擾）

---

## 核心目標 (Core Objectives)

1. 讓使用者在閱讀與複習中「看得見」自己的焦點主題。
2. 讓焦點主題基於個人近期語境與學習紀錄自動調整。
3. 不增加打擾感與權限負擔，維持低介入體驗。
4. 功能可快速回滾或關閉。

---

## 功能需求 (Functional Requirements)

### 1) 本週焦點主題生成

- 每週產生 1-2 個 Focus Topic（以本地時間週一 00:00 切換）。
- 來源資料（純本地）:
  - `savedTranslations`（收藏詞彙與語言方向）
  - SRS 複習紀錄（正確率、到期密度）
  - 頁面內容特徵（本地摘要，不出站）
- 產生邏輯（MVP）:
  - 近期閱讀頁面主題偏好（URL 網域 + 關鍵詞統計）
  - 近期弱項詞彙所在語境
  - 新手保護: 詞彙量 < 20 時僅給 1 個小主題

### 2) Focus 可見度（低介入）

- 內容頁 tooltip 增加小標籤 `Focus`（若該詞屬於焦點主題）。
- Review 正確作答後顯示 `Focus +1` 微回饋。
- Popup/History 顯示「本週焦點摘要卡」: 主題名稱、完成度、推薦原因。

### 3) 焦點進度與回訪誘因

- 為每個 Focus Topic 記錄 `progress/target`。
- 連續回訪加成: 同週多次啟動時顯示「距離完成還差 X」。
- 完成後顯示本週小結（不彈窗）。

### 4) 回滾與開關

- Options 新增總開關 `enableFocusTrack`。
- 提供逐模組開關: `focusInTooltip` / `focusInReview` / `focusInPopup`。
- 內部 `experimentFlag` 可全域禁用。

---

## 非功能需求 (Non-Functional Requirements)

- 效能: 不增加高亮主流程負擔；內容分析採本地輕量統計。
- 隱私: 所有資料僅存 `chrome.storage.local/sync`，不出站。
- 相容性: 不影響翻譯、收藏、高亮、複習主流程。
- 可解釋性: 焦點卡需顯示「為何推薦」。
- 低介入: 同一頁同詞最多提示 1 次。

---

## 成功指標 (Success Metrics)

1. 使用者滿意度提升（主要）: 啟用後 2-4 週內回饋正向提升。
2. 回訪頻率: 每週平均啟動次數提升。
3. Review 互動: Focus 提示後 Review 啟動率提升。

---

## 範圍界定 (Scope)

### In Scope

- Focus Topic 本地生成
- Popup/History/Review/Tooltip 低介入呈現
- 進度追蹤與週結算
- 回滾與模組化開關

### Out of Scope

- 雲端同步與伺服器推薦
- 需要新增 host permissions
- 高介入提醒/通知

---

## 影響檔案 (初版預估)

1. 新增: `services/FocusTrackService.js`
2. 修改: `background.js`（週切換與焦點生成）
3. 修改: `popup.html`, `popup.js`（焦點卡 UI）
4. 修改: `history.html`, `history.js`（焦點摘要模組）
5. 修改: `review.js`（Focus +1 回饋）
6. 修改: `content.js` / tooltip 渲染（Focus 標籤）
7. 修改: `options.html`, `options.js`（開關與回滾）
