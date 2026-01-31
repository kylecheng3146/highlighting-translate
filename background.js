importScripts(
    'services/TranslationService.js',
    'services/SRSService.js',
    'services/StorageService.js'
);

// Initialize Services
const translationService = new TranslationService();
const srsService = new SRSService();
const storageService = new StorageService();

// 擴展安裝時的初始化
chrome.runtime.onInstalled.addListener(async () => {
    // 創建右鍵菜單
    chrome.contextMenus.create({
        id: "translate",
        title: "Translate: %s",
        contexts: ["selection"]
    });

    // Dynamic Injection: Inject content scripts into existing tabs
    await injectContentScripts();
});

/**
 * Injects content scripts into all tabs that match the manifest patterns.
 * This ensures the extension works immediately after install/update without reload.
 */
async function injectContentScripts() {
    try {
        const manifest = chrome.runtime.getManifest();
        const contentScripts = manifest.content_scripts;

        if (!contentScripts || !contentScripts.length) return;

        for (const cs of contentScripts) {
            // Convert simple match patterns to what tabs.query accepts
            // Note: complex patterns might need more filtering, but for <all_urls> or simple hosts this works.
            const tabs = await chrome.tabs.query({url: cs.matches});
            
            for (const tab of tabs) {
                // Skip restricted pages (chrome:// etc.)
                if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) continue;

                try {
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id, allFrames: cs.all_frames },
                        files: cs.js,
                    });
                } catch (err) {
                    // Ignore errors for tabs where we can't inject (e.g. restricted domains)
                    console.debug(`Failed to inject into tab ${tab.id}:`, err);
                }
            }
        }
    } catch (error) {
        console.error('Dynamic injection failed:', error);
    }
}

// 處理右鍵菜單點擊
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "translate") {
        const selectedText = info.selectionText;
        const googleTranslateUrl = `https://translate.google.com/?sl=auto&tl=auto&text=${encodeURIComponent(selectedText)}`;
        chrome.tabs.create({url: googleTranslateUrl});
    }
});

// 處理來自 popup 和 content script 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    handleMessage(request, sender, sendResponse);
    return true; // Keep channel open for async response
});

async function handleMessage(request, sender, sendResponse) {
    try {
        switch (request.action) {
            case 'playTTS':
                handleTTS(request, sendResponse);
                break;
            case 'TRANSLATE':
                const result = await translationService.translate(request.text, request.sourceLang, request.targetLang);
                sendResponse({success: true, data: result});
                break;
            case 'DETECT_LANGUAGE':
                const lang = translationService.detectLanguage(request.text);
                sendResponse({success: true, data: lang});
                break;
            // Storage Handlers
            case 'STORAGE_SAVE':
                await storageService.saveTranslation(request.item);
                sendResponse({success: true});
                break;
            case 'STORAGE_GET':
                const items = await storageService.getTranslations(request.limit, request.offset);
                sendResponse({success: true, data: items});
                break;
            case 'STORAGE_REMOVE':
                await storageService.removeTranslation(request.text, request.translation);
                sendResponse({success: true});
                break;
            case 'STORAGE_CLEAR':
                await storageService.clearAll();
                sendResponse({success: true});
                break;
            case 'STORAGE_IS_STARRED':
                const isStarred = await storageService.isStarred(request.text, request.translation);
                sendResponse({success: true, data: isStarred});
                break;
            case 'STORAGE_UPDATE_SRS':
                await storageService.updateSRSStatus(request.text, request.translation, request.updates);
                sendResponse({success: true});
                break;
            default:
                console.warn('Unknown action:', request.action);
                sendResponse({success: false, error: 'Unknown action'});
        }
    } catch (error) {
        console.error('Message handler error:', error);
        sendResponse({success: false, error: error.message});
    }
}

function handleTTS(request, sendResponse) {
    // 尋找最佳語音
    chrome.tts.getVoices((voices) => {
        let selectedVoice = null;
        
        // 優先找包含 'Google' 且語言符合的語音 (通常品質較好)
        selectedVoice = voices.find(v => 
            v.lang.toLowerCase().startsWith(request.lang.toLowerCase()) && 
            v.voiceName.includes('Google')
        );
        
        // 如果沒找到，找任何語言符合的語音
        if (!selectedVoice) {
            selectedVoice = voices.find(v => 
                v.lang.toLowerCase().startsWith(request.lang.toLowerCase())
            );
        }
        
        const options = {
            lang: request.lang,
            voiceName: selectedVoice ? selectedVoice.voiceName : undefined,
            rate: 1.0
        };
        
        chrome.tts.speak(request.text, options);
        sendResponse({success: true});
    });
}
