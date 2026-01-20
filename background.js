// 擴展安裝時的初始化
chrome.runtime.onInstalled.addListener(() => {
    // 創建右鍵菜單
    chrome.contextMenus.create({
        id: "translate",
        title: "Translate: %s",
        contexts: ["selection"]
    });
});

// 處理右鍵菜單點擊
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "translate") {
        const selectedText = info.selectionText;
        const googleTranslateUrl = `https://translate.google.com/?sl=auto&tl=auto&text=${encodeURIComponent(selectedText)}`;
        chrome.tabs.create({url: googleTranslateUrl});
    }
});

// 處理來自 popup 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'playTTS') {
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
        });
        
        sendResponse({success: true});
        return true;
    }

    // 目前不需要特別處理，但保留以備將來使用
    console.log('Background received message:', request);

    // 確保回應
    sendResponse({received: true});
});

// 處理擴展錯誤
chrome.runtime.onStartup.addListener(() => {
    console.log('Extension started');
});
