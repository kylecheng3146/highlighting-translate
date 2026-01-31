# 功能規格書：Flashcard MVP & Basic SRS

## 1. 概述 (Overview)

開發「進階學習模式」的核心基礎：閃卡複習系統。本階段專注於 MVP，包含基本的卡片互動介面與簡單的間隔重複 (SRS) 演算法。

## 2. 功能需求 (Functional Requirements)

### 2.1 閃卡介面 (Flashcard UI)

- **進入點**：從 Popup 或 Options 頁面進入「複習模式」。
- **卡片顯示**：
  - **正面**：顯示原文 (Source Text)。
  - **背面**：顯示翻譯 (Target Text)、例句 (Context)、相關資訊。
- **互動**：
  - 點擊卡片或按 Space 鍵翻轉。
  - 翻轉後顯示評分按鈕：
    - **Forget (1min)**: 完全忘記，立即重來。
    - **Hard (2d)**: 困難，縮短間隔。
    - **Good (4d)**: 記得，正常間隔。
    - **Easy (7d)**: 簡單，延長間隔。
- **進度回饋**：顯示今日剩餘/已完成卡片數。

### 2.2 間隔重複演算法 (Basic SRS)

- **演算法模型**：基於 SuperMemo-2 的簡化變體 (SM-2)。
- **資料儲存**：在每個單字物件中記錄：
  - `nextReviewDate`: 下次複習時間 (Timestamp)。
  - `interval`: 目前間隔天數。
  - `repetitions`: 連續成功次數。
  - `easeFactor`: 難易度係數 (預設 2.5)。

### 2.3 資料管理 (Data Management)

- **初始化**：若單字無 SRS 資料，視為 New Card。
- **佇列邏輯**：
  - 優先顯示 `nextReviewDate <= Now` 的單字。
  - 若無待複習單字，可選擇複習新單字 (New Cards)。

## 3. 非功能需求

- **效能**：載入單字本時需分頁或延遲載入 (Lazy Load)，避免卡頓。
- **體驗**：按鈕回饋需有明確視覺變化 (各評級對應不同顏色)。

## 4. 驗收標準

- [ ] 能順暢完成一輪複習流程 (正面 -> 背面 -> 評分 -> 下一張)。
- [ ] 評分後，單字的 `nextReviewDate` 正確更新。
- [ ] 重新開啟擴充功能後，已複習的單字不會再次出現 (除非時間到)。
