```
TASK: 焦點系統測試計畫與驗收報告框架
EXPECTED OUTCOME: .shared/08-qa-report.md
REQUIRED AGENT: Browser QA
CONTEXT: .shared/03-ux-specification.md, .shared/04-tech-architecture.md
```

# 08-qa-report.md — Contextual Focus QA Plan

## 1. 單元測試

### FocusTrackService

- `shouldRegenerateWeek()` 在跨週時回傳 true
- `buildTopicsFromStats()` 產生 1-2 個 Focus
- 個人化係數 clamp 在 0.8~1.2
- `applyEvent()` 對應事件能更新 progress

### Storage / Messaging

- `GET_FOCUS_TRACK` 回傳結構完整
- focusTrack 不存在時可自動初始化

## 2. 整合測試

- popup 載入後顯示焦點卡
- review 作答後 popup 進度更新
- history 焦點摘要與 popup 一致
- 切週後自動生成新 Focus

## 3. 權限與合規測試

- 預設安裝不新增權限
- 無任何 permission request 行為

## 4. 手動驗證清單

- [ ] 新安裝後 popup 顯示本週焦點
- [ ] 收藏新詞後相關 Focus 進度 +1
- [ ] Review 答題後 Focus 進度更新
- [ ] Tooltip 焦點詞可見 Focus 標記
- [ ] 關閉 Focus 總開關後全部 UI 隱藏
- [ ] 關閉高亮功能時，Focus 仍可透過 review 推進

## 5. 效能驗證

- [ ] popup 首次渲染延遲無顯著增加
- [ ] content script 高亮時間增幅 < 10%
- [ ] background 焦點重算不造成明顯卡頓

## 6. 回歸驗證

- [ ] 翻譯 popup 正常
- [ ] 收藏/刪除單字正常
- [ ] 片語高亮正常
- [ ] review 既有流程正常

## 7. 發布阻擋條件

- 若 Focus 進度與實際行為不同步 -> 阻擋發布
- 若 Focus UI 無法關閉 -> 阻擋發布
- 若高亮或翻譯核心功能退化 -> 阻擋發布
