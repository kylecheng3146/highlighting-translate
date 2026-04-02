```
TASK: Popup/History/Review/Tooltip 焦點介面線框定義
EXPECTED OUTCOME: .shared/02-wireframes.md
REQUIRED AGENT: UI Sketcher
CONTEXT: .shared/01-requirements.md, popup.html, history.html, review.html, content tooltip UI
```

# 02. UI Wireframes (Contextual Focus Track)

> 版本: v1 (2026-04-02)

## 1) Popup: 本週焦點摘要卡 (新增)

```text
+--------------------------------------+
| 翻譯設定                             |
+--------------------------------------+
| [本週焦點] Focus 2                   |
| 主題: Tech Writing / 日常會話         |
| 進度: 40%  [████-----]               |
| 原因: 最近閱讀多為技術文              |
| [前往複習]   [查看詳情]               |
+--------------------------------------+
| (既有設定項目...)                     |
| 主題 / 自動翻譯 / 高亮 / ...          |
+--------------------------------------+
```

設計原則:
- 焦點卡固定在設定區上方，提升可見度。
- 以 1 行「原因」做可解釋性，不擠壓既有控制項。

## 2) History: Focus Summary 模組 (新增)

```text
+------------------------------------------------+
| Dashboard                                      |
| 本週焦點完成率 40%  (剩 4 天)                    |
| [████-----]                                     |
| 主要焦點: Tech Writing                          |
| 推薦原因: 你最近在閱讀技術文章                  |
+------------------------------------------------+
| 詞彙列表...                                     |
```

設計原則:
- 摘要放在統計卡區域，不進入每條詞卡。

## 3) Review: Focus 即時回饋 (新增)

```text
Question Card

Correct!
[Focus +1] Tech Writing 4/10
```

設計原則:
- 單行 toast/badge，不干擾答題節奏。

## 4) Tooltip: Focus 標記 (輕提示)

```text
+------------------------------+
| [B1] Rank #850   Focus       |
+------------------------------+
| 放棄                          |
+------------------------------+
```

設計原則:
- 沿用既有 tooltip 樣式，只增加小標籤。

## 5) Options: Focus 開關與回滾

```text
[x] 啟用語境焦點追蹤
    [x] Popup 顯示焦點卡
    [x] Review 顯示 Focus 提示
    [x] Tooltip 顯示 Focus 標籤
    [ ] 啟用實驗版 Focus 旗標
```

設計原則:
- 逐模組開關與總開關同區，便於回滾與控管。
