```
TASK: 任務系統測試計畫與驗收報告框架
EXPECTED OUTCOME: .shared/08-qa-report.md
REQUIRED AGENT: Browser QA
CONTEXT: .shared/03-ux-specification.md, .shared/04-tech-architecture.md
```

# 08-qa-report.md — Weekly Mission QA Plan

## 1. 單元測試

### MissionService

- `shouldRegenerateWeek()` 在跨週時回傳 true
- `buildTasksFromStats()` 產生 3 個主任務
- 個人化係數 clamp 在 0.8~1.2
- `applyEvent()` 對應事件能更新 progress

### Storage / Messaging

- `GET_WEEKLY_MISSION` 回傳結構完整
- 任務不存在時可自動初始化

## 2. 整合測試

- popup 載入後顯示任務卡
- review 作答後 popup 進度更新
- history 任務摘要與 popup 一致
- 切週後自動生成新任務且舊任務歸檔

## 3. 權限與合規測試

- 預設安裝不包含通知權限授權流程
- 開啟提醒時才彈出權限請求
- 拒絕授權不影響核心功能

## 4. 手動驗證清單

- [ ] 新安裝後 popup 顯示本週任務
- [ ] 收藏新詞後 `discover_new_words` 進度 +1
- [ ] Review 答題後 `review_due_words` 進度更新
- [ ] Tooltip 任務詞可見 Mission 標記
- [ ] 完成全部任務後顯示完成狀態
- [ ] 關閉高亮功能時，任務邏輯仍可透過 review 推進

## 5. 效能驗證

- [ ] popup 首次渲染延遲無顯著增加
- [ ] content script 高亮時間增幅 < 10%
- [ ] background 任務重算不造成明顯卡頓

## 6. 回歸驗證

- [ ] 翻譯 popup 正常
- [ ] 收藏/刪除單字正常
- [ ] 片語高亮正常
- [ ] review 既有流程正常

## 7. 發布阻擋條件

- 若發現任務進度與實際行為不同步 -> 阻擋發布
- 若通知權限在未啟用情況下被請求 -> 阻擋發布
- 若高亮或翻譯核心功能退化 -> 阻擋發布
