# 07-roadmap.md - Smart Frequency Radar Development Roadmap

## Phase 1: Core Foundation (The Brain)
**目標**：建立數據底層，確保詞頻數據可被檢索。

- [ ] **Task 1.1: Dataset Integration**
    - 尋找並壓縮 Top 20,000 詞頻表（JSON 格式）。
    - 放入 `assets/` 目錄並優化加載效能。
- [ ] **Task 1.2: Storage Service Expansion**
    - 更新 `StorageService.js` 以支持 `frequency_rank` 欄位。
    - 實現 `db_version` 管理邏輯。
- [ ] **Task 1.3: Data Migration Script**
    - 編寫一鍵遷移函式，補齊現有翻譯紀錄的排名數據。
    - 驗證大數據量（>1000 條）下的遷移穩定性。

## Phase 2: Live Interaction (The Experience)
**目標**：讓使用者在瀏覽網頁時能即時感知詞頻。

- [ ] **Task 2.1: Background Lookup Logic**
    - 在 `background.js` 實現 `CMD_GET_WORD_INFO` 訊息處理器。
    - 整合 Lemmatization（詞法還原）邏輯，處理變體詞。
- [ ] **Task 2.2: Enhanced Tooltip UI**
    - 修改 `popup.html/js` 或 `TooltipService.js` 新增排名標籤。
    - 應用顏色編碼系統（橘/藍/灰）。
- [ ] **Task 2.3: CSS Class System**
    - 在 `content.css` 中定義 `hl-freq-high`, `hl-freq-mid`, `hl-freq-low`。
    - 更新 `HighlightService.js` 以動態應用這些類別。

## Phase 3: Mastery Analytics (The Satisfaction)
**目標**：透過量化數據提供反饋，提升留存。

- [ ] **Task 3.1: Dashboard UI Layout**
    - 在 `history.html` 頂部插入儀表板容器。
    - 使用 Tailwind 實現響應式進度條。
- [ ] **Task 3.2: Stats Engine**
    - 實作「覆蓋率計算」算法，統計不同區間（Top 2k, 5k）的掌握度。
    - 實作數據快取機制，避免重複計算。
- [ ] **Task 3.3: Animation Implementation**
    - 整合 `06-animations.md` 中設計的數字滾動與進度條填充效果。

## Phase 4: Polish & QA
**目標**：確保高品質交付。

- [ ] **Task 4.1: Performance Audit**
    - 檢查 Service Worker 的內存佔用。
    - 確保 `content.js` 在複雜網頁上的標記速度。
- [ ] **Task 4.2: Bug Squashing**
    - 處理特殊字元、非英語單字的詞頻例外。
- [ ] **Task 4.3: User Feedback Loop**
    - 加入「重置掌握度」或「匯出統計報表」功能（選配）。