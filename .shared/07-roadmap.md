```
TASK: 4-6 週開發藍圖規劃
EXPECTED OUTCOME: .shared/07-roadmap.md
REQUIRED AGENT: Planner
CONTEXT: .shared/04-tech-architecture.md, .shared/05-flow-diagrams.md
```

# 07-roadmap.md — Reading Progress Dashboard

## 目標版本

- 建議版本: `v1.18.0`
- 交付節奏: 5 週（符合 4-6 週需求）

## Week 1: 基礎建設 (Foundation)

**目標**: 建立統計資料收集與儲存架構

**工作項目**:
- 新增 `services/StatsService.js`
  - `recordTranslation(text, isSaved)` 方法
  - `getOverview()` 方法
  - `getDailyProgress()` 方法
- 新增 `readingProgress` storage 結構
- 新增 `learningStats` storage 結構
- 修改 `background.js` 新增訊息處理
  - `TRANSLATION_RECORDED`
  - `GET_STATS`

**驗收標準**:
- [ ] 翻譯行為正確記錄到 `readingProgress`
- [ ] `getOverview()` 正確回傳統計資料
- [ ] 不影響現有翻譯流程

**預估工時**: 2 天

---

## Week 2: Popup 儀表板 UI

**目標**: 在 Popup 顯示基礎統計

**工作項目**:
- 修改 `popup.html` 新增統計區塊
  - 4 個數字卡片 (Streak, Words, Monthly New, This Week)
  - 進度條 (里程碑)
  - Streak 提示
- 修改 `popup.js` 載入統計資料
- 實作數字跳動動畫
- 實作 Streak 火焰動畫

**驗收標準**:
- [ ] Popup 正確顯示統計數字
- [ ] 數字更新時有動畫效果
- [ ] Streak 提示正確顯示/隱藏
- [ ] 不影響現有設定 UI

**預估工時**: 2 天

---

## Week 3: Streak 系統 + 里程碑

**目標**: 完整的 Streak 與里程碑功能

**工作項目**:
- 新增 `services/StreakService.js`
  - `calculateStreak()` 方法
  - `hasLearnedToday()` 方法
  - `updateBestStreak()` 方法
- 新增 `services/MilestoneService.js`
  - `getCurrentMilestone()` 方法
  - `getNextMilestone()` 方法
  - `getProgressToNext()` 方法
- 修改 `content.js` 在翻譯後發送 `TRANSLATION_RECORDED`
- 實作進度條填充動畫
- 實作里程碑達成動畫

**驗收標準**:
- [ ] Streak 正確計算 (包含跨日)
- [ ] 里程碑等級正確判定
- [ ] 進度條正確顯示
- [ ] 達成里程碑時有動畫

**預估工時**: 2 天

---

## Week 4: Dashboard 獨立頁面 + 圖表

**目標**: 完整的 Dashboard 體驗

**工作項目**:
- 新增 `dashboard.html`
- 新增 `dashboard.js`
- 新增 `assets/styles/dashboard.css`
- 修改 `manifest.json` 新增 `dashboard.html` 為 web_accessible_resources
- 實作成長圖表 (Canvas 手繪)
- 實作學習洞察
- 實作卡片淡入動畫
- 實作圖表繪製動畫

**驗收標準**:
- [ ] Dashboard 正確載入
- [ ] 成長圖表正確顯示
- [ ] 時間範圍切換正常
- [ ] 學習洞察正確顯示
- [ ] 動畫效果流暢

**預估工時**: 3 天

---

## Week 5: 分享卡片 + QA + Release

**目標**: 分享功能與品質保證

**工作項目**:
- 新增 `services/ShareCardService.js`
  - `generateCard()` 方法
  - `downloadCard()` 方法
  - `copyToClipboard()` 方法
- 實作分享卡片生成動畫
- 單元測試
- 整合測試
- 手動測試
- 效能測試
- 文件更新
- 發布打包

**驗收標準**:
- [ ] 分享卡片正確生成
- [ ] 下載 PNG 功能正常
- [ ] 複製到剪貼簿功能正常
- [ ] 所有測試通過
- [ ] 無明顯效能退化
- [ ] 可提交 Web Store 更新

**預估工時**: 3 天

---

## 總預估工時

| 週次 | 工作內容 | 預估工時 |
|---|---|---|
| Week 1 | 基礎建設 | 2 天 |
| Week 2 | Popup 儀表板 UI | 2 天 |
| Week 3 | Streak + 里程碑 | 2 天 |
| Week 4 | Dashboard + 圖表 | 3 天 |
| Week 5 | 分享 + QA + Release | 3 天 |
| **總計** | | **12 天** |

---

## 風險與緩解

| 風險 | 影響 | 緩解 |
|---|---|---|
| Canvas 圖表效能 | Dashboard 載入慢 | 使用簡單折線圖, 避免複雜渲染 |
| 分享卡片相容性 | 某些裝置生成失敗 | 降級為文字摘要 |
| Storage 超限 | 資料遺失 | 自動聚合舊資料 (90天) |
| Streak 計算錯誤 | 使用者困惑 | 多重驗證 + 單元測試 |

---

## 版本規劃

- `v1.18.0-alpha`: Week 1-2 完成 (基礎統計 + Popup)
- `v1.18.0-beta`: Week 3-4 完成 (Streak + Dashboard)
- `v1.18.0`: Week 5 完成 (分享 + QA)

---

## 後續迭代 (v1.19.0)

- 學習模式洞察進階版
- 跨裝置同步 (雲端)
- 社群功能 (排行榜)
- 更多圖表類型 (圓餅圖、長條圖)

---

# Roadmap 增補：Cloud Backup & Cross-Device Sync（v1.19.0）

## Phase 0：產品與發布前置

- [ ] 建立 Google Cloud project、OAuth client 與 Drive API 設定。
- [ ] 確認 `drive.file`、`identity`、`alarms` 的最小權限方案。
- [ ] 更新隱私政策、Chrome Web Store data disclosure 與啟用同意文案。
- [ ] 定義 backup schema v1、state hash、device ID、event ID 與 migration。

**阻擋條件**：未完成 OAuth/隱私政策，不進入公開發布。

## Phase 1：資料模型與合併核心

- [ ] 為既有單字資料補上穩定 `id`、`updatedAt`、`updatedBy`。
- [ ] 建立 activity event ledger 與事件去重。
- [ ] 實作單字 LWW、設定 LWW、tombstone 90 天保留。
- [ ] 合併後重建 readingProgress、Stats、Mission、Focus Track 與報表。
- [ ] 補足舊 storage migration 與資料損壞的安全 fallback。

**驗收**：雙裝置同日活動不遺失；同筆單字衝突結果可預測；刪除不會被舊裝置立即復活。

## Phase 2：Google Drive 與 Service Worker

- [ ] `GoogleDriveService`：OAuth、建立/尋找可見資料夾、單一 JSON 建立與更新。
- [ ] `BackupSyncService`：storage change debounce、startup/open/alarm pull、狀態機。
- [ ] 建立 current + 7 snapshots 的 payload 與裁剪策略。
- [ ] 加入 1/5/15/30 分鐘 retry、24 小時上限、401 re-auth 與 schema 錯誤處理。
- [ ] 處理雙裝置競態：重新讀取、合併、再寫入，不能以舊 payload 盲目覆蓋。

**驗收**：假設 Drive API mock 可完整跑通 enable、upload、pull、merge、retry、sign-out。

## Phase 3：Popup UI 與還原

- [ ] 增加 Cloud Backup & Sync 狀態卡片。
- [ ] 加入啟用同意、Google 登入、立即同步、登出與帳號切換確認。
- [ ] 加入 7 個歷史版本列表、預覽差異與還原流程。
- [ ] 加入 `CLEAR` 輸入確認與跨裝置刪除警告。
- [ ] 補全 I18n、RTL、鍵盤、aria-live 與 reduced motion。

**驗收**：未登入不影響本機功能；所有同步狀態可理解且可操作。

## Phase 4：QA、政策與發布

- [ ] 單元測試：migration、ID、event dedupe、LWW、tombstone、snapshot。
- [ ] 整合測試：mock Drive、雙裝置、離線、401、429、損壞 JSON、帳號切換。
- [ ] Chrome 最新穩定版與 Edge 手動驗證。
- [ ] 檢查 manifest、OAuth consent、privacy policy 與 Web Store permission disclosure。
- [ ] 完成封裝、升版與 rollback 手冊。

## 建議版本切分

- `v1.19.0-alpha`：local schema migration + merge engine。
- `v1.19.0-beta`：Google Drive mock/live integration + Popup UI。
- `v1.19.0`：歷史還原、失敗重試、政策文件與完整 QA。

## 主要依賴與風險

| 依賴/風險 | 影響 | 對策 |
|---|---|---|
| OAuth client/verification | 無法公開啟用同步 | Phase 0 先完成並保留 local-only fallback |
| Drive API quota/競態 | 同步延遲或覆蓋 | debounce、pull-before-push、retry、state hash |
| JSON 快照過大 | 上傳失敗 | 監控大小、提示使用者、保留 local state |
| user data policy | 商店審查阻擋 | 明確 disclosure、最小權限、只為同步目的傳輸 |
