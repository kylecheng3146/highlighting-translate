# Chrome Extension (MV3) Review Checklist

## 1. Manifest Configuration (`manifest.json`)

- [ ] **Version**: `manifest_version` must be 3.
- [ ] **Permissions**: Minimal scope. No `activeTab` unless necessary. No overly broad host permissions (e.g., `<all_urls>`) if a specific domain suffices.
- [ ] **Resources**: `web_accessible_resources` should be specific, not `*` unless absolutely required.
- [ ] **CSP**: `content_security_policy` should not allow `'unsafe-eval'` or remote object sources.

## 2. Background Service Worker

- [ ] **Ephemeral State**: No top-level variables for state storage (will be lost on SW termination). Use `chrome.storage`.
- [ ] **Event Listeners**: Listeners should be synchronous at the top level. Async logic inside.
- [ ] **Keep-Alive**: Do not use `setInterval` to keep SW alive. Use `chrome.alarms` if periodic work is needed.
- [ ] **Initialization**: One-time setup (migrations, defaults) should happen in `chrome.runtime.onInstalled`.

## 3. Content Scripts & DOM

- [ ] **Isolation**: Respect that content scripts share the DOM but not the JS context with the page.
- [ ] **Injection**: Avoid heavy injection on `document_start` if not needed to prevent slowing down page load.
- [ ] **Cleanup**: If the extension can be disabled/reloaded, consider listening for `chrome.runtime.onSuspend` (though less relevant for content scripts, more for general cleanup).

## 4. Message Passing

- [ ] **Error Handling**: Always check `chrome.runtime.lastError` in callbacks to suppress "The message port closed before a response was received" errors.
- [ ] **Validation**: Validate usages of `request.action` or `request.type` to prevent handling unexpected messages.
- [ ] **Async Response**: If `sendResponse` is used asynchronously, the message handler must `return true`.

## 5. Security & Privacy

- [ ] **No Eval**: `eval()`, `setTimeout(string)`, `new Function()` are prohibited/discouraged.
- [ ] **InnerHTML**: Avoid `innerHTML` with unsanitized user input. Use `textContent` or DOM creation methods.
- [ ] **Remote Code**: No loading scripts from external CDNs (MV3 requirement). All code must be bundled.

## 6. Performance

- [ ] **Storage**: Use `chrome.storage.local` for large data sets, `sync` only for small user settings (quota limits).
- [ ] **Images**: Use specific sizes in manifest to avoid scaling artifacts.
