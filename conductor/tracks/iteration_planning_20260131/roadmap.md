# Iteration Roadmap: Advanced Learning Mode

此文件由 `iteration_planning_20260131` 產出，定義了「進階學習模式」的開發迭代藍圖與優先順序。

## 1. 優先順序評估 (ICE Scoring)

我們使用 ICE 模型 (Impact, Confidence, Ease) 來評估各功能的優先順序 (1-10 分)。

| Feature Item                                                                             | Impact (影響力) | Confidence (信心度) | Ease (容易度) | ICE Score | Priority |
| :--------------------------------------------------------------------------------------- | :-------------: | :-----------------: | :-----------: | :-------: | :------: |
| **閃卡核心互動 (Flashcard UI)** <br> 卡片翻轉、按鈕回饋、鍵盤快捷鍵                      |        9        |          9          |       7       |  **567**  |    P0    |
| **間隔重複演算法 (SRS Logic)** <br> 本地端簡易排程模型 (Based on SuperMemo-2 simplified) |        9        |          8          |       6       |  **432**  |    P0    |
| **每日學習統計 (Daily Stats)** <br> 當日複習數、累積單字數視覺化                         |        6        |          9          |       8       |  **432**  |    P1    |
| **生字本 UX 優化 (Vocab List UX)** <br> 搜尋、篩選、批次管理                             |        5        |          8          |       7       |  **280**  |    P2    |

---

## 2. 迭代規劃 (Iteration Phases)

### Phase 1: 核心學習迴圈 (MVP)

**目標**: 建立最基礎的「複習」功能，讓使用者能開始消耗累積的單字量。

- **[Feature] Flashcard UI**: 實作單字卡片介面，包含正面 (單字/翻譯) 與背面 (例句/詳細資訊)。
- **[Feature] Basic SRS**: 實作基礎演算法，根據使用者回饋 (忘記/記得/簡單) 決定下次複習時間。
- **[Data] Progress Tracking**: 記錄每個單字的熟練度狀態 (New, Learning, Review, Mastered)。

### Phase 2: 數據回饋與習慣養成

**目標**: 透過視覺化數據提升使用者的成就感，增加留存率。

- **[Feature] Today's Review Dashboard**: 顯示今日待複習數量與進度條。
- **[Feature] Streak System**: 連續學習天數計算。
- **[Refactor] Storage Optimization**: 針對大量單字數據進行 Chrome Storage 的讀寫效能優化。

### Phase 3: 進階管理與體驗優化

**目標**: 提升大量單字管理的效率。

- **[Feature] Vocab Manager**: 增強單字本的篩選與批次操作功能。
- **[UX] Smart Context**: 在瀏覽網頁時，若遇到「待複習」單字，給予特殊標示提示 (Smart Highlight)。

## 3. 下一步行動 (Next Steps)

1. 建立新的 Track: `feature/flashcard_mvp` 開始 Phase 1 開發。
2. 移植 `spec.md` 中的 SRS 演算法邏輯至技術設計文件。
