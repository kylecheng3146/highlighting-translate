```
TASK: 焦點體驗動效規格設計
EXPECTED OUTCOME: .shared/06-animations.md
REQUIRED AGENT: Interactive Designer
CONTEXT: .shared/02-wireframes.md, .shared/03-ux-specification.md
```

# 06-animations.md — Contextual Focus Animations

## 1) 焦點卡進度條更新

- 觸發: Focus progress 變更
- 動效: 由舊百分比滑動到新百分比（450ms, ease-out）
- 目的: 讓成長感可見但不誇張

## 2) Focus +1 微回饋

- 觸發: Review 正確作答或收藏新詞
- 動效: badge 由下往上淡入（300ms），1.2 秒後淡出
- 目的: 即時正回饋，增加回訪動機

## 3) 完成焦點狀態轉換

- 觸發: Focus Topic 全部完成
- 動效: 焦點卡外框輕微發光一次（非循環）
- 目的: 強化達成感，避免持續閃爍干擾

## 4) Tooltip Focus 標籤

- 觸發: hover 焦點關聯詞
- 動效: 標籤縮放 pop-in（180ms）
- 目的: 區隔一般 tooltip 與焦點詞

## 5) 降噪原則

- 不使用全頁遮罩、不使用持續脈衝動畫。
- 同一事件不重複播放同一動效。
- 若 `prefers-reduced-motion` 開啟，全部降級為無動畫。
