# 01. 需求規格書 (Requirements Specification)

## 專案資訊

- **專案名稱**: Highlighting Translate
- **功能迭代**: 多語種智慧朗讀 (Smart Multi-language TTS)
- **訪談模式**: Hell Interviewer (Simplified)

## 1. 核心目標 (Core Objectives)

解決目前 TTS (文字轉語音) 功能僅能朗讀英文的問題，實現對多種語言的正確識別與朗讀，提升使用者學習外語原音的體驗。

## 2. 用戶痛點 (Pain Points)

- **語言支援不足**: 目前語音功能「只能講英文」，當使用者翻譯日文、法文等其他語言時，TTS 無法正確發音或仍使用英文語音引擎，導致體驗斷裂。
- **缺乏原音學習**: 使用者希望聽到「原文」的正確發音以輔助學習，而非翻譯後的結果。

## 3. 功能需求 (Functional Requirements)

### 3.1 朗讀對象 (Target Text)

- **MUST**: 朗讀「原文內容」(Source Text)。
- **NOTE**: 不需要朗讀翻譯後的結果。

### 3.2 語音引擎 (Speech Engine)

- **MUST**: 使用 Chrome 內建 `chrome.tts` API。
- **SHOULD**: 確保能正確調用對應語言的語音包 (Voice Profile)。如果系統未安裝該語言語音包，應有適當的降級 (Fallback) 或提示。
- **FUTURE**: 未來可考慮整合 Web Speech API 或第三方 AI 語音 (如 OpenAI TTS) 以獲得更自然的發音。

### 3.3 自動化行為 (Automation)

- **MUST**: 維持現有的「自動播放」設定選項。
- **MUST**: 當使用者啟用自動播放時，翻譯視窗彈出後應立即播放原文語音。
- **MUST**: 修正語言偵測邏輯，確保傳遞給 TTS 的 `lang` 參數正確無誤 (例如：偵測到日文則傳 `ja-JP`)。

## 4. 非功能需求 (Non-functional Requirements)

- **效能**: TTS 請求不應顯著延遲翻譯視窗的顯示。
- **準確度**: 語言偵測演算法需足夠準確，避免用英文腔調讀中文的情況。

## 5. 限制條件 (Constraints)

- 必須在 Manifest V3 架構下運作。
- 依賴使用者作業系統安裝的語音包 (OS dependent)。
