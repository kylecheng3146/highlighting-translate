```
TASK: 需求規格撰寫（Reading Progress Dashboard）
EXPECTED OUTCOME: .shared/01-requirements.md
REQUIRED AGENT: Interviewer
CONTEXT: 使用者需求、現有 extension 架構、Marketing 分析
```

# 需求規格書 (Requirements Specification)

## 專案概述

**Highlighting Translate** 新功能提案：**Reading Progress Dashboard（閱讀進度儀表板）**

> 版本: v1 (2026-08-21)
> 狀態: 需求定義完成，可進入規格化階段

本功能聚焦「可見度」與「成就感」，將分散的學習數據轉化為視覺化、可分享的進度儀表板，讓使用者「看得見」自己的成長，形成正向循環，提升留存率與口碑傳播。

---

## 背景與動機

### Marketing 角度分析

| 指標 | 效果 |
|---|---|
| **病毒式傳播** | 用戶截圖分享「這個月學了 500 單字」 |
| **社交貨幣** | 類似 Wordle/Duolingo 的 streak 機制 |
| **留存率** | 看到進度 → 繼續使用 |
| **差異化** | 翻譯工具很少追蹤學習進度 |

### 競品分析

- **Google Translate**: 無學習進度追蹤
- **DeepL**: 無學習進度追蹤
- **Duolingo**: 有 streak, 但無詞彙級別統計
- **Anki**: 有複習統計, 但無閱讀時長追蹤

**差異化優勢**: 結合「即時翻譯」+「詞彙學習」+「閱讀統計」三合一

---

## 核心目標 (Core Objectives)

1. **視覺化進度**: 將學習數據轉化為直覺的圖表與數字
2. **分享誘因**: 提供可匯出的分享卡片, 促進口碑傳播
3. **成就感知**: 透過 streak、里程碑等機制強化成就感
4. **數據洞察**: 幫助使用者了解自己的學習模式

---

## 功能需求 (Functional Requirements)

### 1) 總覽儀表板 (Overview Dashboard)

**位置**: Popup 頂部 (新增區塊)

**顯示內容**:
- 總詞彙量 (Total Words)
- 本月新增 (Monthly New)
- 連續學習天數 (Streak)
- 今日學習 (Today's Progress)

**視覺設計**:
- 4 個數字卡片, 排列為 2x2 網格
- 每個卡片含: 圖標 + 數字 + 標籤
- 使用品牌色 (teal) 強調重點數字

### 2) 詞彙成長圖表 (Vocabulary Growth Chart)

**位置**: Popup 中段 (新增區塊)

**顯示內容**:
- 折線圖: 顯示過去 30 天的詞彙累積趨勢
- X 軸: 日期 (最近 30 天)
- Y 軸: 累積詞彙量

**互動**:
- Hover 顯示該日新增數量
- 點擊切換: 7天 / 30天 / 90天

### 3) 閱讀時間追蹤 (Reading Time Tracker)

**數據收集**:
- 追蹤使用者在「已翻譯內容」上的時間
- 本地計算, 不上傳

**顯示內容**:
- 本週閱讀時間 (分鐘)
- 平均每日閱讀時間
- 最常閱讀的時段

**限制**:
- 僅追蹤有翻譯行為的頁面
- 不追蹤純瀏覽行為 (保護隱私)

### 4) 連續學習天數 (Streak)

**規則**:
- 每日至少翻譯/收藏 1 個詞彙 = 計入 streak
- 中斷 = streak 歸零

**顯示**:
- 火焰圖標 🔥 + 天數
- 最高 streak 記錄

**提醒**:
- 若今日尚未學習, 在 popup 底部顯示「今日 streak 尚未達成」提示

### 5) 里程碑系統 (Milestones)

**定義**:
- 100 詞彙: 🌱 初學者
- 500 詞彙: 🌿 進階者
- 1000 詞彙: 🌳 精通者
- 5000 詞彙: 🏆 大師

**顯示**:
- 儀表板顶部顯示當前等級
- 達成時顯示祝贺動畫

### 6) 分享卡片匯出 (Share Card Export)

**功能**:
- 生成精美分享卡片 (PNG)
- 內容: 當前統計 + 品牌 logo + 日期

**分享目標**:
- 一鍵下載 PNG
- 複製到剪貼簿 (可貼到社群)

**設計風格**:
- 深色背景 + 品牌色漸層
- 簡潔排版, 適合社群分享

### 7) 學習模式洞察 (Learning Insights)

**顯示條件**: 使用 2 週以上

**內容**:
- 「你最常在週 X 學習」
- 「你最常閱讀 X 類內容」
- 「你的平均每日學習量為 X 個詞」

---

## 非功能需求 (Non-Functional Requirements)

### 效能
- 儀表板載入時間 < 500ms
- 圴表渲染不影響翻譯主流程
- 資料計算採本地輕量統計

### 隱私
- 所有資料僅存 `chrome.storage.local`
- 閱讀時間僅追蹤有翻譯行為的頁面
- 不收集、不上傳任何使用者數據

### 相容性
- 不影響翻譯、收藏、高亮、複習主流程
- 與現有 FocusTrack、Mission 系統共存

### 可及性
- 所有數字需有文字標籤 (不只靠顏色)
- 圖表需有 alt text
- 支援鍵盤操作

---

## 成功指標 (Success Metrics)

| 指標 | 目標值 | 測量方式 |
|---|---|---|
| 分享卡片匯出率 | > 5% 月活用戶 | 追蹤匯出次數 |
| 儀表板點擊率 | > 30% 日活用戶 | 追蹤 popup 點擊 |
| Streak 達成率 | > 40% 用戶有 7+ 天 streak | 本地統計 |
| 用戶滿意度 | > 4.0/5.0 | 應用商店評分 |

---

## 範圍界定 (Scope)

### In Scope
- Popup 儀表板 UI (總覽 + 圖表)
- 詞彙成長追蹤
- Streak 系統
- 里程碑系統
- 分享卡片匯出
- 學習模式洞察

### Out of Scope
- 雲端同步與伺服器
- 社群功能 (好友、排行榜)
- 閱讀時長精確追蹤 (MVP 僅做簡易版)
- 跨裝置同步

---

## 影響檔案 (初版預估)

### 新增
1. `services/StatsService.js` - 統計資料計算
2. `services/StreakService.js` - Streak 邏輯
3. `services/MilestoneService.js` - 里程碑系統
4. `services/ShareCardService.js` - 分享卡片生成
5. `dashboard.html` - 儀表板頁面 (獨立)
6. `dashboard.js` - 儀表板邏輯
7. `assets/styles/dashboard.css` - 儀表板樣式

### 修改
1. `popup.html` - 新增儀表板區塊
2. `popup.js` - 載入統計資料
3. `background.js` - Streak 計算、資料聚合
4. `content.js` - 追蹤翻譯行為
5. `manifest.json` - 新增 dashboard.html 為 web_accessible_resources

---

## 技術限制

1. **Storage 限制**: chrome.storage.local 限制 ~10MB
   - 解策: 聚合舊資料, 僅保留統計數字, 不保留每日明細
2. **图表庫**: 不引入大型依賴
   - 解策: 使用 Canvas 手繪簡單折線圖
3. **分享卡片**: 需要在 extension 環境生成圖片
   - 解策: 使用 Canvas API + toDataURL

---

## 開發優先順序

| 階段 | 功能 | 預估工時 |
|---|---|---|
| P0 | StatsService + 基礎統計 | 2 天 |
| P0 | Popup 儀表板 UI | 2 天 |
| P1 | Streak 系統 | 1 天 |
| P1 | 詞彙成長圖表 | 2 天 |
| P2 | 里程碑系統 | 1 天 |
| P2 | 分享卡片匯出 | 2 天 |
| P3 | 學習模式洞察 | 1 天 |

**總預估**: ~11 天
