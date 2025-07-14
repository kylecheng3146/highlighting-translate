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
    // 目前不需要特別處理，但保留以備將來使用
    console.log('Background received message:', request);

    // 確保回應
    sendResponse({received: true});
});

// 處理擴展錯誤
chrome.runtime.onStartup.addListener(() => {
    console.log('Extension started');
});
