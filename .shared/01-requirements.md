# 01. 需求規格書 (Requirements Specification)

## 專案資訊

- **專案名稱**: Highlighting Translate
- **功能迭代**: 單字複習功能 (Review / Quiz Mode)
- **訪談模式**: Hell Interviewer (Completed)

## 1. 核心目標 (Core Objectives)

建立一個「單字複習」系統，透過遊戲化 (Gamification) 的測驗方式，幫助使用者記憶已查詢過的單字。

## 2. 核心機制 (Core Mechanics)

### 2.1 測驗流程 (Quiz Flow)

- **入口**: Popup 視窗控制列新增 "Start Review" 按鈕。
- **介面載體**: 點擊後開啟 **新分頁 (New Tab)** 進行測驗。
- **模式**: 連續出題模式，一次測驗回合包含 **10 題**。
- **題目形式**:
  - **題目**: 顯示「中文翻譯」。
  - **選項**: 顯示 4 個卡片，分別為不同的「英文單字」。
    - 1 個正確答案 (Correct Answer)。
    - 3 個干擾項 (Distractors)。

### 2.2 干擾項生成 (Distractor Generation)

- **策略 A (優先)**: 從使用者現有的「歷史紀錄 (History)」中隨機抽取其他單字。
- **策略 B (備案)**: 若使用者歷史紀錄不足 (少於 4 個字)，則使用內建的 `fallback_words.json` (常見單字庫) 進行填充。

### 2.3 學習進度 (Progress Tracking)

- **計分公式**:
  - 初始值: 0%
  - 答對: +20%
  - 答錯: -10% (最低 0%)
- **顯示**: 在歷史卡片上顯示學習百分比 (Progress Bar 或 數字)。

### 2.4 互動與回饋 (Interaction & Feedback)

- **答對**:
  - 顯示「綠色勾勾」動畫。
  - 停留 **1 秒** 後自動跳轉下一題。
- **答錯**:
  - 顯示「紅色叉叉」。
  - **提示正確選項** (例如高亮正確卡片)。
  - 需手動點擊或停留較長時間後跳轉 (待實作細節確認，暫定停留 2 秒讓用戶看清楚)。

### 2.5 歸檔機制 (Archiving)

- **定義**: 標記單字為「已學會 (Mastered)」。
- **行為**:
  - 提供 Archive 按鈕 (可於達到 100% 時強調顯示)。
  - 歸檔後，單字移至「已精通列表」。
  - **不再出現**在未來的測驗中。

## 3. 技術需求 (Technical Requirements)

### 3.1 資料結構與遷移 (Data Structure & Migration)

- **現狀**: 假設為簡單陣列 `[{ word, meaning, ... }]`。
- **新結構 (Schema Update)**:
  ```javascript
  {
    word: "apple",
    meaning: "蘋果",
    // 新增欄位
    learningRate: 0, // 0-100
    isArchived: false,
    lastReviewedAt: Date.now()
  }
  ```
- **遷移策略 (Migration)**:
  - 必須實作 **舊用戶資料相容**。
  - 在 Extension 啟動或讀取 History 時檢查資料版本，若無新欄位則自動補上預設值。

### 3.2 內建資源

- `fallback_words.json`: 包含約 100 個常見英文單字與對應中文，用於填充選項。

## 4. UI/UX 規劃 (初步)

- **Popup**: 新增 "Start Review" 入口。
- **Quiz Page (New Tab)**:
  - Header: 顯示目前題數 (e.g., 3/10)、離開按鈕。
  - Main: 大字顯示「中文」，下方 2x2 排列四張卡片。
  - Footer: 顯示目前分數或進度條。
- **History UI**: 列表項目需顯示進度條、Archive 按鈕。
