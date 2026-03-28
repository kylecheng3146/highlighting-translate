```
TASK: 地獄訪談需求提取與產品定義
EXPECTED OUTCOME: .shared/01-requirements.md
REQUIRED AGENT: Hell Interviewer
CONTEXT: 使用者訪談答案、.shared/ 既有輸出、現有 extension 架構
```

# 需求規格書 (Requirements Specification)

## 專案概述

**Highlighting Translate** 新功能提案：**Personalized Weekly Mission (個人化每週任務引擎)**

> 版本: v1 (2026-03-28)
> 狀態: Hell Interview 已完成，可進入規格化階段

本功能聚焦「留存率」與「個人化」，在不依賴伺服器的前提下，利用本地學習資料（收藏詞彙、複習紀錄、高亮互動）自動產生每週任務，讓使用者有明確且可追蹤的學習目標。

---

## 訪談結論摘要

- 核心指標: 週留存提升
- 使用場景: 新聞、字幕、社群、工作文件皆需覆蓋
- 價值取向: 個人化
- 隱私邊界: 純本地優先（不做雲端同步）
- 權限策略: 額外能力採可選權限
- 交付節奏: 4-6 週完整版本
- 主要成功門檻: 週留存提升

---

## 核心目標 (Core Objectives)

1. 讓使用者每週都知道「下一步該學什麼」，降低打開 extension 後的決策成本。
2. 讓任務內容依個人狀態自適應，而不是固定題庫。
3. 在不打斷閱讀體驗的前提下，提供輕量學習引導。
4. 完整遵守 MV3 與最小權限策略。

---

## 功能需求 (Functional Requirements)

### 1) Weekly Mission 生成

- 系統每週（以本地時間週一 00:00）生成一組任務包。
- 任務來源資料（純本地）:
  - `savedTranslations`（詞彙庫）
  - `learningRate` / `lastReviewedAt` / `interval` / `repetitions` / `easeFactor`
  - 當前週完成行為
- 任務類型（MVP）:
  1. `review_due_words`: 完成 X 個到期複習
  2. `master_weak_words`: 讓 Y 個低熟練詞彙達到 learningRate 門檻
  3. `discover_new_words`: 新增 Z 個新收藏詞彙

### 2) 個人化難度調節

- 根據上週完成率與錯誤率，自動調整本週任務目標量（+/-20% 範圍）。
- 新手保護: 詞彙量 < 30 時，優先輕任務，避免挫折。
- 高活躍使用者: 提供 stretch goal（加分任務，不影響主任務完成判定）。

### 3) 任務可視化入口

- Popup 新增「本週任務卡」區塊（不改動主流程，僅增強）。
- History 頁新增「Mission Progress」卡片（總進度、剩餘目標、完成預估）。
- Review 頁在答題後顯示「任務進度 +1」即時回饋。

### 4) 閱讀中輕提示 (Gentle Nudge)

- 命中任務關鍵詞時，僅在高亮 tooltip 中增加「Mission」標記。
- 不新增全頁彈窗，不遮蔽內容。
- 同一頁面每個詞最多提示 1 次，避免干擾。

### 5) 週目標完成與連續週紀錄

- 完成全部主任務後標記 `weeklyMission.completed = true`。
- 記錄 `weeklyStreak`（連續達成週數）。
- 提供「本週結算摘要」: 完成項目、最有進步詞彙、下週建議難度。

### 6) 可選提醒（Optional Permission）

- 預設不要求 `notifications`。
- 使用者開啟「任務提醒」時才請求 `notifications`（optional_permissions）。
- 每日最多 1 次提醒，可在 options 中關閉。

---

## 非功能需求 (Non-Functional Requirements)

- 效能: 不增加頁面掃描主成本；任務計算優先在 background idle 時執行。
- 隱私: 資料全部留在 `chrome.storage.local/sync`，不上傳外部服務。
- 相容性: 不影響現有翻譯、收藏、高亮、複習流程。
- 可解釋性: 任務卡需顯示「為何推薦這個任務」。

---

## 成功指標 (Success Metrics)

1. 週留存提升（主要）: 使用者啟用後 4 週內，活躍週數中位數提升。
2. 任務完成率: 每週任務完成率 >= 35%。
3. 複習參與率: 啟用任務後 7 日內，Review 頁啟動次數提升。
4. 體驗品質: 不增加顯著性能退化（高亮首輪渲染時間增幅 < 10%）。

---

## 範圍界定 (Scope)

### In Scope

- 本地任務生成
- Popup/History/Review 任務進度 UI
- 任務事件追蹤（本地）
- 可選通知提醒

### Out of Scope

- 帳號登入與跨裝置同步
- 雲端推薦模型
- A/B Test 伺服器分流

---

## 影響檔案 (初版預估)

1. 新增: `services/MissionService.js`
2. 修改: `background.js`（週任務生成 + 可選提醒排程）
3. 修改: `popup.html`, `popup.js`（任務卡 UI）
4. 修改: `history.html`, `history.js`（任務進度模組）
5. 修改: `review.js`（答題後任務進度回寫）
6. 修改: `manifest.json`（optional_permissions: notifications）
