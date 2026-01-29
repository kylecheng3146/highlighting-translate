# Track 規格說明書：完善單字收藏功能與資料層升級 (Vocabulary History MVP)

## 1. 概觀 (Overview)
本 Track 旨在將目前的「單字收藏」原型功能轉化為穩定且具備良好擴展性的 MVP (最小可行產品)。重點在於將資料儲存從裝置限制較多的 `chrome.storage.sync` 遷移至 `chrome.storage.local`，並確保功能在各種 Edge Case 下都能穩定運作，同時提供良好的使用者回饋。

## 2. 功能需求 (Functional Requirements)
- **資料儲存遷移**：將收藏的翻譯紀錄存儲位置由 `chrome.storage.sync` 改為 `chrome.storage.local`，以支援更大的單字儲存量 (5MB+)。
- **收藏按鈕 (Star/Unstar)**：
    - 在劃詞翻譯視窗中提供星號按鈕。
    - 點擊後應即時切換收藏狀態，並持久化至本地儲存。
    - 彈窗開啟時需正確顯示目前的收藏狀態。
- **單字本管理頁面 (History Page)**：
    - 提供清單檢視，顯示：原文、譯文、來源 URL、語言方向及時間。
    - 支援單筆刪除功能。
    - 支援「清空全部」功能。
- **使用者操作回饋**：
    - 收藏/取消收藏時，星號按鈕應有視覺狀態切換。
    - 收藏成功時，應在 UI 上有簡短提示（如 Toast 或文字顏色變化）。

## 3. 非功能需求 (Non-Functional Requirements)
- **健壯性 (Robustness)**：當儲存空間異常或資料損毀時，不應導致擴充功能崩潰。
- **測試覆蓋 (Testing)**：針對 `TranslationService` 與資料儲存邏輯編寫單元測試。
- **效能 (Performance)**：單字本頁面在讀取數百筆紀錄時應保持流暢。

## 4. 驗收標準 (Acceptance Criteria)
- [ ] 翻譯視窗內的星號按鈕點擊後，資料能正確存入 `chrome.storage.local`。
- [ ] 關閉翻譯視窗再重新選取同一單字，星號按鈕應正確顯示為「已收藏」狀態。
- [ ] `history.html` 頁面能正確渲染出所有已儲存的紀錄。
- [ ] 在 `history.html` 點擊刪除後，該紀錄應消失，且翻譯視窗的星號狀態應同步更新。
- [ ] 執行單元測試，確保存儲邏輯與 `TranslationService` 運作正常。

## 5. 範圍外 (Out of Scope)
- 跨裝置資料同步（本次選擇 Local 儲存）。
- 單字分類標籤 (Tags) 或 筆記 (Notes) 功能。
- 匯出至 Anki 或 CSV 檔案。
