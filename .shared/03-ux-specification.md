```
TASK: Reading Progress Dashboard 體驗規格撰寫
EXPECTED OUTCOME: .shared/03-ux-specification.md
REQUIRED AGENT: UX Spec Writer
CONTEXT: .shared/01-requirements.md, .shared/02-wireframes.md
```

# 03-ux-specification.md — Reading Progress Dashboard UX

## 1. 使用者旅程 (User Journeys)

### A. 新用戶首次開啟

1. 使用者安裝 extension 後首次開啟 popup。
2. 看到「Learning Progress」區塊, 但數字為 0。
3. 看到提示:「Start learning to see your progress!」
4. 翻譯或收藏第一個詞彙後, 數字開始變化。
5. 產生「啊, 這 extension 會追蹤我的進度」的認知。

### B. 活躍用戶日常使用

1. 使用者開啟 popup。
2. 看到統計卡片: streak 天數、總詞彙量、本月新增。
3. 看到 streak 提示:「🔥 Complete today's streak!」
4. 翻譯或收藏詞彙, 完成今日 streak。
5. 數字即時更新, 產生成就感。

### C. 用戶分享進度

1. 使用者進入 Dashboard 頁面。
2. 看到完整統計 + 成長圖表。
3. 點擊「Share」按鈕。
4. 生成分享卡片, 下載 PNG。
5. 貼到社群媒體 (Twitter, Facebook, Instagram)。

### D. 用戶查看成長趨勢

1. 使用者進入 Dashboard 頁面。
2. 切換圖表時間範圍: 7D → 30D → 90D。
3. 看到詞彙成長折線圖。
4. Hover 查看每日新增數量。
5. 產生「我在持續進步」的認知。

---

## 2. 關鍵互動規範

### 數據更新時機

| 事件 | 更新內容 | 延遲 |
|---|---|---|
| 翻譯文字 | 總詞彙量、本月新增 | 即時 |
| 收藏詞彙 | 總詞彙量、本月新增 | 即時 |
| 每日首次使用 | Streak 計算 | 即時 |
| 開啟 Dashboard | 所有統計 | < 500ms |

### Streak 規則

- **計算起點**: 每日 00:00 (本地時區)
- **達成條件**: 當日至少翻譯或收藏 1 個詞彙
- **中斷條件**: 當日無任何翻譯/收藏行為
- **顯示時機**: 每次開啟 popup 時重新計算

### 分享卡片生成

- **生成方式**: Canvas API + toDataURL
- **圖片尺寸**: 384x384px
- **下載格式**: PNG
- **命名規則**: `highlighting-translate-progress-YYYY-MM-DD.png`

---

## 3. 個人化策略 UX

### 學習洞察顯示

- **顯示條件**: 使用 2 週以上
- **內容範例**:
  - 「你最常在週三學習」
  - 「你最常閱讀技術文章」
  - 「你的平均每日學習量為 4.2 個詞」
- **更新頻率**: 每週重新計算

### Streak 提示

- **觸發條件**: 今日尚未學習
- **顯示位置**: Popup 底部
- **關閉方式**: 點擊 X 或完成今日 streak
- **不顯示條件**: 已完成今日 streak

---

## 4. 邊界案例

| 案例 | UX 處理 |
|---|---|
| 新用戶 (0 詞彙) | 顯示「Start learning to see your progress!」 |
| Streak 中斷 | 顯示「Streak reset. Start a new one today!」 |
| 詞彙量超過 5000 | 顯示「🏆 Master」, 不再顯示里程碑 |
| 圖表無數據 | 顯示「No data yet. Start learning!」 |
| 分享卡片生成失敗 | 顯示「Failed to generate card. Please try again.」 |
| Storage 超過限制 | 自動聚合舊資料, 保留統計數字 |
| 跨時區 | 以本地裝置時區計算 streak |

---

## 5. 可用性與可及性

### 數字顯示
- 所有統計數字需有文字標籤 (不只靠顏色)
- 圖表需有 alt text (例如: 「Vocabulary growth chart showing 347 words over 30 days」)
- Streak 需有文字說明 (例如: 「12 day streak」)

### 鍵盤操作
- 所有按鈕可 tab 導航
- 圖表時間切換可左右鍵操作
- 分享按鈕可 Enter 觸發

### 螢幕閱讀器
- 統計卡片使用 `aria-label` 描述
- 圖表使用 `role="img"` + `aria-label`
- 動態更新使用 `aria-live="polite"`

---

## 6. 成功體驗定義

### 立即感知
- 使用者 3 秒內理解「這是我的學習進度」
- 使用者在一次 session 內至少查看統計數字 1 次

### 持續使用
- 使用者 7 天內回訪查看進度
- 使用者 30 天內使用分享功能 1 次

### 口碑傳播
- 使用者主動分享學習卡片到社群
- 使用者推薦給朋友

---

## 7. 情感設計

### 正向強化
- Streak 達成時顯示🔥動畫
- 里程碑達成時顯示祝贺動畫
- 數字增加時輕微跳動效果

### 溫和提醒
- Streak 提示語氣溫和 (不強制)
- 「Complete today's streak!」而非「You must learn today!」

### 成就感
- 等級系統 (初學者 → 進階者 → 精通者 → 大師)
- 進度條視覺化
- 分享卡片設計精美

---

## 8. 與現有功能整合

### 與 FocusTrack 整合
- 儀表板可顯示「本週焦點完成率」
- 不重複計算統計

### 與 Mission 整合
- 儀表板可顯示「本週任務進度」
- 任務完成影響 streak 計算

### 與 Review 整合
- Review 正確作答影響「本月新增」統計
- Review 行為計入 streak

---

## 9. 測試案例

### 功能測試
1. 翻譯詞彙後, 總詞彙量即時 +1
2. 收藏詞彙後, 總詞彙量即時 +1
3. 每日首次使用, streak 正確計算
4. 分享卡片生成正確顯示統計
5. 圖表切換時間範圍正確顯示

### 邊界測試
1. 新用戶顯示「Start learning」提示
2. Streak 中斷後重新開始
3. 詞彙量超過 5000 顯示「Master」
4. Storage 超過限制時自動聚合

### 可及性測試
1. 鍵盤可導航所有按鈕
2. 螢幕閱讀器正確讀出統計
3. 數字有文字標籤
