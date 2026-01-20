// 載入設定
async function loadSettings() {
    try {
        const settings = await chrome.storage.sync.get({
            autoTranslate: true,
            autoPlaySpeech: false,
            sourceLang: 'auto',
            targetLang: 'zh-TW',
            delay: 500
        });

        // 更新 UI
        const autoTranslateCheck = document.getElementById('autoTranslateCheck');
        if (autoTranslateCheck) autoTranslateCheck.checked = settings.autoTranslate;

        const autoPlaySpeechCheck = document.getElementById('autoPlaySpeechCheck');
        if (autoPlaySpeechCheck) autoPlaySpeechCheck.checked = settings.autoPlaySpeech;
        
        const sourceLang = document.getElementById('sourceLang');
        if (sourceLang) sourceLang.value = settings.sourceLang;
        
        const targetLang = document.getElementById('targetLang');
        if (targetLang) targetLang.value = settings.targetLang;
        
        const delay = document.getElementById('delay');
        if (delay) delay.value = settings.delay;
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
}

// 安全地發送消息到 content script
async function sendMessageToContentScript(message) {
    try {
        const tabs = await chrome.tabs.query({active: true, currentWindow: true});
        if (tabs && tabs[0]) {
            const tab = tabs[0];

            if (!tab.url || tab.url.startsWith('chrome://') ||
                tab.url.startsWith('chrome-extension://') ||
                tab.url.startsWith('edge://') ||
                tab.url.startsWith('about:') ||
                tab.url.startsWith('moz-extension://')) {
                return;
            }

            await chrome.tabs.sendMessage(tab.id, message);
        }
    } catch (error) {
        console.log('Cannot send message to content script:', error.message);
    }
}

// 顯示 Snackbar
function showSnackbar() {
    const snackbar = document.getElementById("snackbar");
    if (snackbar) {
        snackbar.className = "show";
        setTimeout(() => {
            snackbar.className = snackbar.className.replace("show", "");
        }, 2000);
    }
}

// 儲存設定
async function saveSettings() {
    const settings = {
        autoTranslate: document.getElementById('autoTranslateCheck').checked,
        autoPlaySpeech: document.getElementById('autoPlaySpeechCheck').checked,
        sourceLang: document.getElementById('sourceLang').value,
        targetLang: document.getElementById('targetLang').value,
        delay: parseInt(document.getElementById('delay').value) || 500
    };

    try {
        await chrome.storage.sync.set(settings);
        showSnackbar();

        await sendMessageToContentScript({
            action: 'updateSettings',
            settings: settings
        });
    } catch (error) {
        console.error('Failed to save settings:', error);
    }
}

// 事件監聽
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();

    const autoTranslateCheck = document.getElementById('autoTranslateCheck');
    if (autoTranslateCheck) autoTranslateCheck.addEventListener('change', saveSettings);

    const autoPlaySpeechCheck = document.getElementById('autoPlaySpeechCheck');
    if (autoPlaySpeechCheck) autoPlaySpeechCheck.addEventListener('change', saveSettings);

    const sourceLang = document.getElementById('sourceLang');
    if (sourceLang) sourceLang.addEventListener('change', saveSettings);

    const targetLang = document.getElementById('targetLang');
    if (targetLang) targetLang.addEventListener('change', saveSettings);

    const delay = document.getElementById('delay');
    if (delay) delay.addEventListener('change', saveSettings);

    // List available TTS voices for debugging
    chrome.tts.getVoices((voices) => {
        console.log('Available TTS Voices:', voices);
        const voiceNames = voices.map(v => `${v.voiceName} (${v.lang})`);
        console.log(voiceNames.join('\n'));
    });
});