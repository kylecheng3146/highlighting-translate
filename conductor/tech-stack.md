# Highlighting Translate 技術棧

## 核心架構
- **平台**: Chrome 擴充功能 (Chrome Extension)
- **規範**: Manifest V3

## 前端技術
- **語言**: Vanilla JavaScript (ES6+)
- **介面**: HTML5, CSS3
- **設計風格**: Material Design (CSS 實作)

## 擴充功能元件
- **Content Scripts**: `content.js` (負責網頁文字偵測、DOM 操作與彈出視窗顯示)
- **Background Service Worker**: `background.js` (處理背景任務與擴充功能生命週期)
- **Popup**: `popup.html`, `popup.js` (提供擴充功能設定介面)

## 資料與 API
- **翻譯來源**: Google Translate API (經由 `https://translate.googleapis.com/*`)
- **通訊方式**: Fetch API
- **狀態管理**: `chrome.storage.local` (儲存使用者偏好設定，如語言、延遲等)

## 其它資源
- **國際化**: `_locales/` (支援多國語系介面)
- **圖標**: SVG 格式資源
