# Manifest V3 需求規範

## 核心需求 (Core Requirements)

- **Service Worker**: 必須使用 Service Workers，而非持久性的 Background Pages。
- **Declarative Net Request**: 使用 `declarativeNetRequest` API 進行網路請求的封鎖或修改，而非 `webRequest` blocking。
- **Promise-based APIs**: 大多數 Chrome API 現在都支援 Promise。
- **禁止遠端程式碼 (No Remote Code)**: 禁止執行遠端託管的程式碼 (無外部腳本)。

## 權限策略 (Permission Strategy)

- **最小權限原則 (Minimal Permissions)**: 僅請求絕對需要的權限。
- **可選權限 (Optional Permissions)**: 對於進階功能，使用 `permissions` vs `optional_permissions`。
- **Host Permissions**: 將範圍縮小到特定網域。
- **使用者同意 (User Consent)**: 清楚說明為何需要這些權限。
