# 05-flow-diagrams.md - Message & Data Flow

## 1. 詞頻查詢與翻譯流程 (Lookup Flow)

當使用者在網頁上選取單字並觸發翻譯時的訊息流：

```mermaid
sequenceDiagram
    participant User
    participant CS as Content Script
    participant BG as Background (SW)
    participant API as Google Translate API

    User->>CS: 選取單字 "meticulous"
    CS->>BG: CMD_GET_TRANSLATION + WORD_INFO
    
    rect rgb(240, 240, 240)
        Note over BG: 核心處理 (Parallel)
        BG->>API: 請求翻譯文字
        BG->>BG: 查詢內建 Frequency Map (#4215)
    end

    API-->>BG: 回傳 "一絲不苟"
    BG-->>CS: { translation: "...", rank: 4215, level: "B2" }
    
    Note over CS: 根據 rank 選擇 CSS Class
    CS->>User: 顯示 Tooltip (標記 B2 等級)
    Note over CS: 應用 hl-freq-mid 高亮樣式
```

## 2. 儀表板數據彙整流程 (Dashboard Refresh)

當使用者打開歷史紀錄頁面時，如何計算覆蓋率：

```mermaid
graph TD
    A[打開 history.html] --> B{是否有儀表板快取?}
    B -- Yes --> C[立即渲染快取數據]
    B -- No --> D[請求 Background 重新計算]
    
    subgraph Background Calculation
        D1[讀取 chrome.storage 所有紀錄] --> D2[過濾 rank <= 2000]
        D2 --> D3[計算 Unique Mastered 數量]
        D3 --> D4[計算與 Top 2000 總數比例]
    end
    
    D4 --> E[更新 chrome.storage 快取]
    E --> F[傳送 CMD_STATS_UPDATED 到 UI]
    F --> G[更新儀表板進度條動畫]
```

## 3. 數據遷移流程 (Migration Flow)

擴充功能更新後的背景任務：

```mermaid
graph LR
    Start(Update to v2.0) --> Check[檢查 db_version]
    Check -- < 2.0 --> LoadJSON[載入 frequency_db.json]
    LoadJSON --> GetAll[獲取 500+ 條舊紀錄]
    GetAll --> Loop[遍歷並補齊 Rank 欄位]
    Loop --> UpdateDB[批量更新 Storage]
    UpdateDB --> Final(設置 db_version = 2.0)
```