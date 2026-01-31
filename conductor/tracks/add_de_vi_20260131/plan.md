# 實作計畫：新增德語與越南語支援

## Phase 1: 核心邏輯擴充 (Core Logic Extension)
本階段專注於後端邏輯的更新，確保服務層能夠正確處理新語言。

- [x] Task: 建立基礎設施 - 更新 I18nService 以支援新語言 9c65c23
    - [ ] 產生德語 (de) 的 UI 翻譯文本
    - [ ] 產生越南語 (vi) 的 UI 翻譯文本
    - [ ] 更新 `I18nService.js` 載入或包含新的語系定義
- [ ] Task: 強化語言偵測 - 更新 TranslationService
    - [ ] 為 `TranslationService.js` 編寫測試案例，加入德語與越南語的樣本文字，驗證偵測失敗（TDD Red Phase）
    - [ ] 實作 `detectLanguage` 中的德語正則表達式偵測
    - [ ] 實作 `detectLanguage` 中的越南語正則表達式偵測
    - [ ] 驗證測試通過 (Green Phase)
- [ ] Task: Conductor - User Manual Verification 'Core Logic Extension' (Protocol in workflow.md)

## Phase 2: UI 與整合 (UI & Integration)
本階段將更新使用者介面並整合所有功能。

- [ ] Task: 更新 Popup UI 選單
    - [ ] 修改 `popup.html`，在 Source 和 Target 下拉選單中新增 `de` 和 `vi` 選項
    - [ ] 驗證 `popup.js` 是否需要修改以支援新選項（預計無，但需確認儲存/讀取邏輯）
- [ ] Task: 整合驗收測試
    - [ ] 手動測試：確認設定頁面選單更新
    - [ ] 手動測試：選取德語文字，確認自動偵測與翻譯成功
    - [ ] 手動測試：選取越南語文字，確認自動偵測與翻譯成功
    - [ ] 手動測試：測試 TTS 朗讀功能
- [ ] Task: Conductor - User Manual Verification 'UI & Integration' (Protocol in workflow.md)