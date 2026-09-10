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

---

# 需求增補：Cloud Backup & Cross-Device Sync

> 提案版本：v1.19.0（建立於 v1.18.0 Reading Progress Dashboard 之後）
> 狀態：Hell Interview 完成，需求定義完成，可進入架構與實作規劃

## 1. 產品決策摘要

| 項目 | 已確認決策 |
|---|---|
| 目的地 | 使用者可見的 Google Drive `Highlighting Translate Backups` 資料夾 |
| 同步模式 | 雙向同步，不是只有單向匯出 |
| 本機功能 | 不登入仍可使用翻譯、單字本與其他本機功能 |
| 登入時機 | 只有啟用 Google Drive 同步時才要求 Google 登入 |
| 變更上傳 | 每次本機變更後延遲 30–60 秒合併上傳；實作預設 60 秒 |
| 遠端檢查 | Service Worker 啟動、Popup/Dashboard 開啟，以及每 5 分鐘檢查 |
| 合併規則 | 單字逐筆、設定逐 key 以 `updatedAt` 做 Last-Write-Wins；活動事件以唯一 ID 去重後合併 |
| 快照 | 單一 JSON 檔內保存目前狀態與最近 7 個完整版本 |
| 還原 | 選擇版本、預覽差異、取代本機資料，再作為新版本同步 |
| 刪除 | 使用者需輸入 `CLEAR` 確認；刪除以 tombstone 同步，保留 90 天 |
| 加密 | 不做應用層加密；使用者確認接受 Google Drive 帳號與資料夾權限風險 |
| 失敗處理 | 保留本機資料；1/5/15/30 分鐘退避重試，最長 24 小時 |
| 非 Google 使用者 | 可繼續使用本機功能，不提供雲端同步 |

## 2. 核心目標

1. 使用者換電腦或換瀏覽器設定檔後，可以取回完整學習資料。
2. Chrome profile/storage 被清除時，仍可從 Google Drive 歷史版本復原。
3. 多台裝置的新增、修改與刪除能安全合併，不因整份 JSON 覆蓋而遺失資料。
4. 離線或 Google Drive 暫時不可用時，翻譯與本機學習流程不受阻礙。

## 3. 功能需求

### 3.1 啟用與帳號

- Popup 顯示「Cloud Backup & Sync」區塊。
- 使用者主動點擊「啟用 Google Drive 同步」後才啟動 OAuth 與額外權限請求。
- 登入失敗、取消授權或沒有 Google 帳號時，本機功能仍可使用。
- 登出只停止同步並保留本機與雲端資料，不刪除任何一方資料。
- 切換 Google 帳號前必須確認，並清除本機同步 metadata，避免兩個帳號混用。

### 3.2 備份資料範圍

同步「使用者擁有的資料」：

- `savedTranslations`：單字、翻譯、來源語言、目標語言、來源網址、上下文、時間、SRS 與封存狀態。
- `readingProgress` 的活動事件：翻譯/收藏事件，以事件 ID 去重後合併。
- 語言、黑名單、主題等使用者設定。
- `learningStats`、Mission、Focus Track 與報表作為快照資料保存；即時同步合併後由本機重新計算衍生結果。

排除可由套件資產重建的 `db_version`、詞頻資料與 `phrasalVerbsExpanded` 等快取。

### 3.3 版本與還原

- Google Drive 資料夾內建立一個 `highlighting-translate-backup.json`。
- JSON 保存 `current` 與最近 7 個完整 `snapshots`，每個版本含建立時間、裝置 ID、資料摘要與 schema 版本。
- 新裝置登入後：本機為空則下載雲端；雲端為空則上傳本機；兩邊都有資料則自動合併。
- 還原流程必須先顯示新增、修改、刪除數量，再讓使用者確認取代本機資料。
- 還原結果要建立新 current 版本，不直接修改歷史快照。

### 3.4 合併與刪除

- 每筆單字新增永久 `id`、`updatedAt`、`updatedBy`。
- 舊資料以「原文 + 翻譯」產生穩定 ID，避免升級時兩台裝置各自產生不同 ID。
- 單字記錄以 `updatedAt` 決定新舊；時間相同時用 `updatedBy` 作穩定 tie-breaker。
- 活動事件必須有不可重複 `eventId`；兩台裝置同一天的活動完整累加。
- 刪除不立即丟棄同步資訊，加入 `tombstone`，至少保留 90 天。
- `CLEAR` 會把目前資料標記為刪除並同步到其他裝置；歷史 7 版本仍可用於復原。

### 3.5 同步狀態與失敗

- 顯示：未啟用、需要登入、同步中、已同步、待同步、離線重試、授權失效、同步失敗。
- 顯示上次成功同步時間、待處理變更數量與最後錯誤原因。
- 本機寫入永遠先成功；雲端失敗不得回滾本機資料。
- 失敗依 1、5、15、30 分鐘退避重試，最多持續 24 小時；之後等待手動重試或下一次本機變更。

## 4. 驗收標準

- [ ] 未登入 Google 時翻譯、收藏、Review、Dashboard 與本機設定正常。
- [ ] 啟用同步後可建立可見的 Google Drive 備份資料夾與單一 JSON 檔。
- [ ] 兩台裝置新增不同單字後同步，兩邊都保留。
- [ ] 兩台裝置同日活動統計以事件 ID 合併，不重複、不遺失。
- [ ] 同一單字在兩台裝置修改時，較新的 `updatedAt` 生效。
- [ ] 刪除與 `CLEAR` 需要明確確認，刪除可由 7 個歷史版本復原。
- [ ] 離線時本機資料可正常使用，恢復網路後自動重試。
- [ ] 登出、切換帳號不會把不同 Google 帳號的資料混合。
- [ ] 同步 UI 的所有文字遵循目前頁面語系並支援鍵盤與螢幕閱讀器。

## 5. 非目標與風險

### 非目標

- 不建立 Highlighting Translate 自有帳號或後端。
- 不支援 Dropbox、OneDrive 等其他供應商。
- 不要求使用者登入才能使用擴充功能。
- 不做應用層端到端加密；若日後改變，需另開安全設計。

### 主要風險

| 風險 | 緩解 |
|---|---|
| Google OAuth/Drive scope 審查 | 使用最小可行 scope，更新商店隱私揭露與政策文件 |
| 雙裝置同時上傳 | 上傳前重新讀取 remote、合併後再寫入，遇到競態重試 |
| 裝置長期離線造成 tombstone 過期 | 還原前以最新 current 與歷史快照做衝突檢查並提示 |
| 完整快照過大 | 監控 JSON 大小，接近限制時顯示警告並保留本機資料 |
| 來源網址/上下文暴露 | 啟用前明確告知資料會傳到使用者的 Google Drive |

## 6. 依據

- [Chrome Identity API](https://developer.chrome.com/docs/extensions/reference/api/identity)
- [Chrome Alarms API](https://developer.chrome.com/docs/extensions/reference/api/alarms)
- [Chrome Manifest OAuth2](https://developer.chrome.com/docs/extensions/reference/manifest/oauth2)
- [Google Drive `drive.file` scope](https://developers.google.com/identity/protocols/oauth2/scopes)
- [Google Drive create/manage files](https://developers.google.com/drive/api/guides/create-file)
- [Chrome Web Store User Data Policy](https://developer.chrome.com/docs/webstore/user_data)
