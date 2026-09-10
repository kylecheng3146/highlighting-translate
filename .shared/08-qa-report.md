```
TASK: 測試計畫與驗收報告框架
EXPECTED OUTCOME: .shared/08-qa-report.md
REQUIRED AGENT: Browser QA
CONTEXT: .shared/03-ux-specification.md, .shared/04-tech-architecture.md
```

# 08-qa-report.md — Reading Progress Dashboard QA Plan

## 1. 單元測試

### StatsService
- [ ] `recordTranslation()` 正確記錄翻譯行為
- [ ] `getOverview()` 正確計算 totalWords
- [ ] `getOverview()` 正確計算 monthlyNew
- [ ] `getGrowthChart()` 正確回傳圖表資料
- [ ] 每日統計超過 90 天自動聚合

### StreakService
- [ ] `calculateStreak()` 正確計算連續天數
- [ ] `hasLearnedToday()` 正確判斷今日是否已學習
- [ ] `updateBestStreak()` 正確更新最佳 streak
- [ ] 跨日時 streak 正確重算

### MilestoneService
- [ ] `getCurrentMilestone()` 正確判定等級
- [ ] `getNextMilestone()` 正確回傳下一等級
- [ ] `getProgressToNext()` 正確計算進度百分比
- [ ] 邊界值 (100, 500, 1000, 5000) 正確處理

### ShareCardService
- [ ] `generateCard()` 正確生成 Canvas
- [ ] `downloadCard()` 正確下載 PNG
- [ ] `copyToClipboard()` 正確複製到剪貼簿

---

## 2. 整合測試

### 翻譯行為記錄
- [ ] 翻譯文字後 `readingProgress` 正確更新
- [ ] 收藏詞彙後 `learningStats.totalWords` 正確 +1
- [ ] 多次翻譯後統計正確累加

### Popup 載入
- [ ] Popup 開啟時正確載入統計
- [ ] 統計數字正確顯示
- [ ] Streak 正確顯示
- [ ] 里程碑進度正確顯示

### Dashboard 載入
- [ ] Dashboard 正確載入完整統計
- [ ] 成長圖表正確渲染
- [ ] 時間範圍切換正確
- [ ] 學習洞察正確顯示

### 分享功能
- [ ] 點擊 Share 正確生成卡片
- [ ] 下載 PNG 功能正常
- [ ] 複製到剪貼簿功能正常

---

## 3. 權限與合規測試

- [ ] 預設安裝不新增權限
- [ ] 無任何 permission request 行為
- [ ] 所有資料僅存 chrome.storage.local
- [ ] 不收集、不上傳任何使用者數據

---

## 4. 手動驗證清單

- [ ] 新安裝後 Popup 顯示統計卡片 (數字為 0)
- [ ] 翻譯文字後統計數字即時更新
- [ ] 收藏詞彙後 totalWords +1
- [ ] Streak 達成時火焰圖標動畫
- [ ] 里程碑進度條正確填充
- [ ] Dashboard 成長圖表正確顯示
- [ ] 分享卡片正確生成
- [ ] 下載 PNG 功能正常
- [ ] 複製到剪貼簿功能正常
- [ ] Streak 提示今日未學習時顯示
- [ ] Streak 提示今日已學習時隱藏

---

## 5. 效能驗證

- [ ] Popup 首次渲染延遲 < 500ms
- [ ] Dashboard 載入延遲 < 1s
- [ ] 成長圖表渲染時間 < 500ms
- [ ] 分享卡片生成時間 < 1s
- [ ] 不影響翻譯主流程效能

---

## 6. 回歸驗證

- [ ] 翻譯 popup 正常
- [ ] 收藏/刪除單字正常
- [ ] 片語高亮正常
- [ ] Review 既有流程正常
- [ ] Focus Track 功能正常
- [ ] Mission 功能正常

---

## 7. 邊界案例測試

- [ ] 新用戶 (0 詞彙) 顯示正確提示
- [ ] 詞彙量超過 5000 顯示「Master」
- [ ] Storage 超過限制時自動聚合
- [ ] 分享卡片生成失敗時降級顯示
- [ ] 跨時區 streak 正確計算
- [ ] `prefers-reduced-motion` 動畫停用

---

## 8. 發布阻擋條件

- 若統計數字不正確 -> 阻擋發布
- 若 Streak 計算錯誤 -> 阻擋發布
- 若分享卡片無法生成 -> 阻擋發布
- 若翻譯核心功能退化 -> 阻擋發布
- 若 Popup/Dashboard 載入失敗 -> 阻擋發布

---

## 9. 測試環境

- Chrome 最新穩定版
- Chrome Canary (最新版)
- Edge 最新穩定版
- macOS / Windows / Linux
- 不同螢幕尺寸 (Popup 響應式)

---

## 10. 測試報告模板

```markdown
## 測試報告 - Reading Progress Dashboard

**測試日期**: YYYY-MM-DD
**測試人員**: [姓名]
**Chrome 版本**: [版本]

### 測試結果

| 類別 | 通過 | 失敗 | 阻塞 |
|---|---|---|---|
| 單元測試 | | | |
| 整合測試 | | | |
| 手動測試 | | | |
| 效能測試 | | | |

### 發現問題

| # | 嚴重度 | 描述 | 狀態 |
|---|---|---|---|
| 1 | P0 | | |

### 結論

- [ ] 可以發布
- [ ] 需要修復後重新測試
```

---

# QA 增補：Cloud Backup & Cross-Device Sync

## 11. 資料模型單元測試

- [ ] 舊 `savedTranslations` migration 產生穩定 ID，重跑不改 ID。
- [ ] 新單字會產生 `id`、`updatedAt`、`updatedBy`。
- [ ] 同一單字兩個版本依 `updatedAt` 選出較新資料。
- [ ] 相同 timestamp 依 `updatedBy` 得到穩定結果。
- [ ] 活動事件以 `eventId` 去重；相同事件不重複計數。
- [ ] 兩台裝置同日新增活動會完整累加。
- [ ] 設定 key 可以獨立 LWW，不因另一個設定變更而遺失。
- [ ] tombstone 可阻止較舊單字復活，90 天期限正確裁剪。
- [ ] `CLEAR` 只在輸入完全等於 `CLEAR` 時執行。
- [ ] current + snapshots 最多保留 7 個完整版本。
- [ ] schema 版本不相容時拒絕覆蓋 local/remote。

## 12. Drive API Mock 整合測試

- [ ] 啟用同步可建立資料夾與單一 `highlighting-translate-backup.json`。
- [ ] Drive 空、本機有資料時上傳成功。
- [ ] Drive 有資料、本機為空時下載成功。
- [ ] 兩邊都有資料時完成單字、活動、設定合併。
- [ ] 雙裝置同時更新時，重新讀取 remote 後不遺失任一變更。
- [ ] 401 只觸發一次 token refresh/re-auth，不進入無限迴圈。
- [ ] 403 顯示 permission error，不重試無效請求。
- [ ] 網路、429、5xx 按 1/5/15/30 分鐘順序重試，24 小時後停止。
- [ ] JSON 損壞或 schema 不支援時保留本機與原 remote。
- [ ] 帳號切換不會使用前一帳號的 folderId/fileId。
- [ ] 登出後 local state 與 remote file 都仍存在。

## 13. UI / E2E 測試

- [ ] 未登入時所有既有翻譯、收藏、Review 與 Dashboard 流程正常。
- [ ] 啟用前能看到資料範圍、Google Drive 位置與明文風險。
- [ ] OAuth 取消後回到本機模式，不顯示錯誤阻斷畫面。
- [ ] 已同步、同步中、待同步、離線、授權失效、失敗等狀態正確顯示。
- [ ] 立即同步可取消重複 pending job。
- [ ] 歷史版本可列表、預覽差異、還原並產生新 current。
- [ ] 清除資料需輸入 `CLEAR`，並顯示其他裝置同步刪除警告。
- [ ] 帳號切換需要確認，且完成後顯示新帳號狀態。
- [ ] 所有新增文字在 en、zh-TW、zh-CN、ja、ko、es、fr、de、vi、ar-EG 通過。
- [ ] RTL、鍵盤 Tab/Enter、aria-live 與 focus restore 正常。
- [ ] `prefers-reduced-motion` 下無持續旋轉/閃爍。

## 14. 手動雙裝置驗證

| 情境 | 裝置 A | 裝置 B | 預期 |
|---|---|---|---|
| 初次加入 | 有本機單字 | 空本機 | B 下載 current |
| 雙向新增 | 新增 A1 | 新增 B1 | 兩邊最後都有 A1/B1 |
| 同日活動 | 翻譯 3 次 | 翻譯 4 次 | 統計為 7 次，不重複 |
| 單筆衝突 | 修改同一單字 | 修改同一單字 | 較新 `updatedAt` 生效 |
| 刪除 | `CLEAR` | 離線 | B 恢復後套用 tombstone |
| 還原 | 還原舊 snapshot | 正常同步 | 還原成新 current，兩邊一致 |
| 帳號隔離 | 登出 A | 登入 B | 不混合 A/B 資料 |

## 15. 權限、隱私與發布阻擋

- [ ] 未啟用同步前不請求 Google/alarms 額外權限。
- [ ] 不儲存 OAuth access token。
- [ ] 只使用最小 Drive scope，未要求整個 Drive 讀寫權限。
- [ ] 隱私政策說明單字、來源網址、上下文、統計與設定的傳輸目的。
- [ ] 啟用同意文案與 Chrome Web Store disclosure 一致。
- [ ] 未登入、無 Google 帳號、取消授權仍可使用本機功能。
- [ ] 發現資料遺失、跨裝置覆蓋、帳號混合或清除無法復原時阻擋發布。
