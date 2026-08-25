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
