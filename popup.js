// 載入設定
async function loadSettings() {
    const settings = await chrome.storage.sync.get({
        autoTranslate: true,
        sourceLang: 'auto',
        targetLang: 'zh-TW',
        delay: 500
    });

    // 更新 UI
    document.getElementById('autoTranslate').classList.toggle('active', settings.autoTranslate);
    document.getElementById('sourceLang').value = settings.sourceLang;
    document.getElementById('targetLang').value = settings.targetLang;
    document.getElementById('delay').value = settings.delay;
}

// 安全地發送消息到 content script
async function sendMessageToContentScript(message) {
    try {
        const tabs = await chrome.tabs.query({active: true, currentWindow: true});
        if (tabs[0]) {
            const tab = tabs[0];

            // 檢查是否是可以注入 content script 的頁面
            if (tab.url.startsWith('chrome://') ||
                tab.url.startsWith('chrome-extension://') ||
                tab.url.startsWith('edge://') ||
                tab.url.startsWith('about:') ||
                tab.url.startsWith('moz-extension://')) {
                // 這些是系統頁面，不能發送消息
                return;
            }

            // 嘗試發送消息，如果失敗則忽略
            await chrome.tabs.sendMessage(tab.id, message);
        }
    } catch (error) {
        // 忽略連接錯誤，這通常表示頁面沒有 content script
        console.log('Cannot send message to content script:', error.message);
    }
}

// 儲存設定
async function saveSettings() {
    const settings = {
        autoTranslate: document.getElementById('autoTranslate').classList.contains('active'),
        sourceLang: document.getElementById('sourceLang').value,
        targetLang: document.getElementById('targetLang').value,
        delay: parseInt(document.getElementById('delay').value)
    };

    await chrome.storage.sync.set(settings);

    // 顯示儲存成功訊息
    const status = document.getElementById('status');
    status.textContent = '設定已儲存';
    status.className = 'success';
    setTimeout(() => {
        status.textContent = '';
        status.className = '';
    }, 2000);

    // 安全地通知 content scripts 更新設定
    await sendMessageToContentScript({
        action: 'updateSettings',
        settings: settings
    });
}

// 切換開關
document.getElementById('autoTranslate').addEventListener('click', function () {
    this.classList.toggle('active');
    saveSettings();
});

// 監聽設定變更
document.getElementById('sourceLang').addEventListener('change', saveSettings);
document.getElementById('targetLang').addEventListener('change', saveSettings);
document.getElementById('delay').addEventListener('change', saveSettings);

// 初始化
loadSettings();
