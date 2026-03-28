```
TASK: 4-6 週開發藍圖規劃
EXPECTED OUTCOME: .shared/07-roadmap.md
REQUIRED AGENT: Planner
CONTEXT: .shared/04-tech-architecture.md, .shared/05-flow-diagrams.md
```

# 07-roadmap.md — Personalized Weekly Mission

## 目標版本

- 建議版本: `v1.15.0`
- 交付節奏: 5 週（符合 4-6 週需求）

## Week 1: Foundation

- 新增 `MissionService` 與資料 schema
- 背景層加入 `GET_WEEKLY_MISSION` / `MISSION_APPLY_EVENT`
- 建立 weekId 計算與切週重算機制

驗收:
- 可在 local storage 看到任務物件
- 切換到新週可自動生成新任務

## Week 2: Popup + History UI

- popup 顯示本週任務卡與進度
- history 顯示 mission summary 卡片
- 增加錯誤降級（資料讀取失敗時不影響主功能）

驗收:
- 任務進度在兩頁一致
- 不影響原有設定操作

## Week 3: Review 整合

- review 作答事件寫入任務進度
- 加入 `Mission +1` 回饋
- 任務完成判定與完成狀態渲染

驗收:
- 作答可即時推動任務
- 完成時可正確顯示完成狀態

## Week 4: 個人化調節 + 可選提醒

- 實作個人化目標量調整
- options 新增任務提醒開關
- 串接 `optional_permissions.notifications`

驗收:
- 權限請求只在使用者開啟時觸發
- 未授權不會報錯

## Week 5: QA + Release

- 單元/整合/手動測試
- 效能比較（高亮與 review 流程）
- 文件更新與發布打包

驗收:
- 核心測試通過
- 無明顯效能退化
- 可提交 Web Store 更新

## 風險排程備註

- 若通知權限流程審核風險偏高，可將提醒功能延到 `v1.15.1`。
