# Track Specification: Smart Frequency Radar & Mastery Dashboard

## 1. Goal
整合常用詞頻數據（Frequency Data），讓使用者了解單字的重要性，並透過儀表板量化學習成效。

## 2. Scope

### UI/UX
- **Tooltip**: 新增 `Rank` 或 `CEFR` 等級顯示。
- **Highlighting**: 根據頻率等級（Top 3k, 5k, 10k, 20k）應用不同的高亮顏色/透明度。
- **Dashboard**: 在 `history.html` 新增「詞彙掌握百分比」統計圖表。

### Data & Logic
- **Offline Dataset**: 整合一個輕量級的詞頻排名數據（JSON）。
- **Storage Service**: 擴展存儲模型，支持 `frequency_rank`。
- **Migration**: 實現版本更新後的數據遷移邏輯。

### Performance
- 確保高亮邏輯不會導致網頁滾動卡頓。

## 3. Tech Constraints
- Chrome Extension MV3.
- `chrome.storage.local` 用於存儲。
- 使用 Vanilla JS + Tailwind CSS。
