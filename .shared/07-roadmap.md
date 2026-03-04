```
TASK: 開發藍圖與時程規劃
EXPECTED OUTCOME: .shared/07-roadmap.md
REQUIRED AGENT: Planner
CONTEXT: .shared/04-tech-architecture.md
```

# 開發藍圖 (Roadmap)

## 專案階段 (Project Phases)

### 階段一：核心引擎升級 (Core Engine Update)

- 修改 `HighlightService.js` 中的 regex 產生邏輯。
- 新增單元測試涵蓋包含空格的片語。
- 確認效能依然合乎標準 (無 Catastrophic Backtracking)。

### 階段二：資料整合 (Data Integration)

- 準備或導入 `assets/phrasal_verbs_db.json`。
- 在 `manifest.json` 中允許存取。
- 在 `background.js` 或相關服務中載入資料，並與現有單字本合併傳遞給 `HighlightService`。

### 階段三：測試與發布 (Testing & Release)

- 執行 `npm run test` 確保變更未破壞既有功能。
- 在真實網頁上進行人工驗證。
- 發布 Chrome Web Store 新版本。
