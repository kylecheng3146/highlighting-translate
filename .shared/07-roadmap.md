```
TASK: 4-6 週開發藍圖規劃
EXPECTED OUTCOME: .shared/07-roadmap.md
REQUIRED AGENT: Planner
CONTEXT: .shared/04-tech-architecture.md, .shared/05-flow-diagrams.md
```

# 07-roadmap.md — Contextual Focus Track

## 目標版本

- 建議版本: `v1.15.0`
- 交付節奏: 5 週（符合 4-6 週需求）

## Week 1: Foundation

- 新增 `FocusTrackService` 與資料 schema
- 背景層加入 `GET_FOCUS_TRACK` / `FOCUS_APPLY_EVENT`
- 建立 weekId 計算與切週重算機制

驗收:
- 可在 local storage 看到 focusTrack 物件
- 切換到新週可自動生成新 Focus

## Week 2: Popup + History UI

- popup 顯示本週焦點卡與進度
- history 顯示 focus summary 卡片
- 增加錯誤降級（資料讀取失敗時不影響主功能）

驗收:
- 焦點進度在兩頁一致
- 不影響原有設定操作

## Week 3: Review + Tooltip

- review 作答事件寫入 Focus 進度
- 加入 `Focus +1` 回饋
- tooltip 增加 Focus 標籤

驗收:
- 作答可即時推動 Focus
- tooltip 顯示可用且不干擾

## Week 4: 個人化調節 + 回滾

- 實作個人化目標量調整
- options 新增 Focus 總開關與模組開關
- 加入 `focusExperimentFlag` 回滾機制

驗收:
- 關閉總開關可完全隱藏 Focus UI
- 模組開關各自生效

## Week 5: QA + Release

- 單元/整合/手動測試
- 效能比較（高亮與 review 流程）
- 文件更新與發布打包

驗收:
- 核心測試通過
- 無明顯效能退化
- 可提交 Web Store 更新

## 風險排程備註

- 若 focus 生成準確度不足，可延後進階個人化到 `v1.15.1`。
