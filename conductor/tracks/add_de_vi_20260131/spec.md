# 功能規格書：新增德語與越南語支援 (Add German and Vietnamese Support)

## 1. 概述 (Overview)
隨著使用者群體的擴大，本 Track 旨在為 Highlighting Translate 擴充功能新增德語 (de) 與越南語 (vi) 的全面支援。這不僅包含翻譯功能本身的語言選項，還涵蓋了本地語言偵測能力的強化、UI 介面的多語系翻譯以及語音朗讀 (TTS) 的整合。

## 2. 功能需求 (Functional Requirements)

### 2.1 Popup UI 更新
- 在「來源語言 (Source Language)」選單中新增「德語 (Deutsch)」與「越南語 (Tiếng Việt)」。
- 在「目標語言 (Target Language)」選單中新增「德語 (Deutsch)」與「越南語 (Tiếng Việt)」。

### 2.2 翻譯服務 (Translation Service) 優化
- **強化偵測邏輯**：更新 `TranslationService.js` 中的 `detectLanguage` 方法。
    - 加入德語特有字符（如 ä, ö, ü, ß）的正則表達式識別。
    - 加入越南語特有變音符號（如 ả, ẽ, ị, ố, ứ 等）的正則表達式識別。
- **API 參數調整**：確保在呼叫 Google Translate API 時能正確傳遞 `de` 與 `vi` 語言代碼。

### 2.3 介面多語系 (Localization)
- 實作擴充功能 UI 的德語與越南語版本。
- 使用 AI 生成對應的 `i18n` 翻譯文本（包含設定標題、標籤、按鈕與提示訊息）。

### 2.4 語音朗讀 (TTS)
- 驗證並確保德語與越南語的朗讀功能正常運作，調用 Chrome TTS 或相關服務提供對應語系的發音。

## 3. 非功能需求 (Non-Functional Requirements)
- **偵測準確度**：強化後的偵測邏輯應能區分德語、越南語與純英語。
- **一致性**：新語言的 UI 樣式應與現有設計（Material Design 風格）保持一致。

## 4. 驗收標準 (Acceptance Criteria)
- [ ] 設定頁面的下拉選單中出現「德語」與「越南語」選項。
- [ ] 選取德語或越南語文字後，系統能正確辨識語系並進行翻譯。
- [ ] 翻譯後的結果能以德語或越南語進行語音朗讀。
- [ ] 當瀏覽器語系設定為德語或越南語時（或手動切換時），擴充功能介面能顯示對應的翻譯文本。

## 5. 範圍外 (Out of Scope)
- 針對德語或越南語的特殊分詞邏輯優化（如德語複合詞）。
- 新增除了 Google Translate 以外的第三方翻譯引擎。