// 載入設定
async function loadSettings() {
    try {
        const settings = await chrome.storage.sync.get({
            autoTranslate: true,
            autoPlaySpeech: false,
            sourceLang: 'auto',
            targetLang: 'zh-TW',
            delay: 500,
            enableHighlighting: true,
            domainBlacklist: []
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

        const enableHighlightCheck = document.getElementById('enableHighlightCheck');
        if (enableHighlightCheck) enableHighlightCheck.checked = settings.enableHighlighting;

        // Blacklist button logic
        updateBlacklistButton(settings.domainBlacklist);
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
}

async function updateBlacklistButton(blacklist) {
    const btn = document.getElementById('blacklistBtn');
    if (!btn) return;

    try {
        const tabs = await chrome.tabs.query({active: true, currentWindow: true});
        if (tabs && tabs[0] && tabs[0].url) {
            const url = new URL(tabs[0].url);
            const domain = url.hostname;
            
            if (['chrome:', 'chrome-extension:', 'edge:', 'about:', 'moz-extension:'].includes(url.protocol)) {
                btn.style.display = 'none';
                return;
            }

            btn.style.display = 'block';
            const isBlacklisted = blacklist.includes(domain);
            btn.textContent = i18nService.getText(isBlacklisted ? 'whitelistBtn' : 'blacklistBtn');
            btn.dataset.domain = domain;
            btn.dataset.isBlacklisted = isBlacklisted;
        } else {
            btn.style.display = 'none';
        }
    } catch (e) {
        btn.style.display = 'none';
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
        delay: parseInt(document.getElementById('delay').value) || 500,
        enableHighlighting: document.getElementById('enableHighlightCheck').checked
    };

    try {
        // Merge with existing blacklist which isn't in UI but in storage
        const data = await chrome.storage.sync.get({ domainBlacklist: [] });
        settings.domainBlacklist = data.domainBlacklist;

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

async function toggleBlacklist() {
    const btn = document.getElementById('blacklistBtn');
    const domain = btn.dataset.domain;
    const isBlacklisted = btn.dataset.isBlacklisted === 'true';

    try {
        const data = await chrome.storage.sync.get({ domainBlacklist: [] });
        let blacklist = data.domainBlacklist;

        if (isBlacklisted) {
            blacklist = blacklist.filter(d => d !== domain);
        } else {
            blacklist.push(domain);
        }

        await chrome.storage.sync.set({ domainBlacklist: blacklist });
        showSnackbar();
        
        // Refresh UI
        updateBlacklistButton(blacklist);

        // Update content script
        const settings = await chrome.storage.sync.get();
        await sendMessageToContentScript({
            action: 'updateSettings',
            settings: settings
        });
    } catch (error) {
        console.error('Failed to toggle blacklist:', error);
    }
}

// I18nService instance
const i18nService = new I18nService();

// 事件監聽
document.addEventListener('DOMContentLoaded', () => {
    i18nService.localizePage();
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

    const enableHighlightCheck = document.getElementById('enableHighlightCheck');
    if (enableHighlightCheck) enableHighlightCheck.addEventListener('change', saveSettings);

    const blacklistBtn = document.getElementById('blacklistBtn');
    if (blacklistBtn) blacklistBtn.addEventListener('click', toggleBlacklist);

    // List available TTS voices for debugging
    chrome.tts.getVoices((voices) => {
        console.log('Available TTS Voices:', voices);
        const voiceNames = voices.map(v => `${v.voiceName} (${v.lang})`);
        console.log(voiceNames.join('\n'));
    });

    const historyBtn = document.getElementById('historyBtn');
    if (historyBtn) {
        historyBtn.addEventListener('click', () => {
             chrome.tabs.create({ url: 'history.html' });
        });
    }
});