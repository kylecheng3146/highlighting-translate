# 實作計畫：語音朗讀 (Text-to-Speech) 支援

## 階段 1：基礎設施與設定
1. [x] **任務：在 `popup.html` 中新增自動播放設定** (89483e8)
   - [x] 子任務：編寫 `popup.test.js` 測試，驗證 UI 元素的呈現與 `chrome.storage` 的互動 (89483e8)
   - [x] 子任務：在 `popup.html` 新增「自動朗讀」切換開關 (Toggle) (89483e8)
   - [x] 子任務：在 `popup.js` 實作設定的讀取與儲存邏輯 (89483e8)
2. [x] **任務：在 `content.js` 中新增語音播放工具函式** (7118cc0)
   - [x] 子任務：編寫 `content.test.js` 測試，模擬 Google TTS API 呼叫 (7118cc0)
   - [x] 子任務：實作 `playTTS(text, lang)` 函式，使用 `Audio` 物件播放音訊 (7118cc0)
3. [ ] **任務：Conductor - User Manual Verification '階段 1：基礎設施與設定' (Protocol in workflow.md)**

## 階段 2：UI 整合與自動化邏輯
1. [ ] **任務：在翻譯彈出視窗中整合播放按鈕**
   - [ ] 子任務：更新 `content.js` 的 `injectStyles`，新增播放按鈕的樣式
   - [ ] 子任務：更新 `showTranslatePopup` 函式，在譯文旁邊動態加入播放按鈕並綁定事件
2. [ ] **任務：實作自動播放邏輯**
   - [ ] 子任務：編寫測試驗證當 `autoPlaySpeech` 為 true 時會觸發播放
   - [ ] 子任務：在 `showTranslatePopup` 中根據 `settings.autoPlaySpeech` 決定是否自動播放
3. [ ] **任務：Conductor - User Manual Verification '階段 2：UI 整合與自動化邏輯' (Protocol in workflow.md)**
