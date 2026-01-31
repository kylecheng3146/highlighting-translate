// 預設設定
let settings = {
    autoTranslate: true,
    sourceLang: 'auto',
    targetLang: 'zh-TW',
    delay: 500
};

let lastSelectedText = '';
let lastSelectedRect = null;
let lastTranslationResult = ''; // Store valid translation result for saving
let isStarred = false; // Track star state

// Instantiate TranslationService, StorageService, and HighlightService
const translationService = new TranslationService();
const storageService = new StorageService();
const highlightService = new HighlightService();
const tooltipService = new TooltipService();

// 載入設定的函數
async function loadSettings() {
    try {
        const items = await chrome.storage.sync.get({
            autoTranslate: true,
            autoPlaySpeech: false,
            sourceLang: 'auto',
            targetLang: 'zh-TW',
            delay: 500,
            enableHighlighting: true,
            domainBlacklist: []
        });
        settings = items;
        
        applyHighlightSettings();
        
        return settings;
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
}

// Apply highlight settings (enable/disable/blacklist)
function applyHighlightSettings() {
    const domain = window.location.hostname;
    const isBlacklisted = settings.domainBlacklist && settings.domainBlacklist.includes(domain);
    
    if (settings.enableHighlighting && !isBlacklisted) {
        scanPageForVocabulary();
    } else {
        removeHighlights();
    }
}

// Remove all highlights from the page
function removeHighlights() {
    const highlights = document.querySelectorAll('mark.ht-highlight');
    highlights.forEach(mark => {
        const parent = mark.parentNode;
        if (parent) {
            parent.replaceChild(document.createTextNode(mark.textContent), mark);
            parent.normalize(); // Merge adjacent text nodes
        }
    });
}

// Scan page for vocabulary
async function scanPageForVocabulary() {
    try {
        const vocabList = await storageService.getTranslations(1000); // Get up to 1000 items
        if (vocabList && vocabList.length > 0) {
            highlightService.scanAndHighlight(document.body, vocabList);
        }
    } catch (e) {
        console.error('Error scanning page for vocabulary:', e);
    }
}

// 檢查並重新翻譯
function checkAndRetranslate() {
    const host = document.getElementById('translate-popup-host');
    if (host && host.shadowRoot) {
        const popup = host.shadowRoot.getElementById('translate-popup');
        // Check if popup is visible (using both class and display check)
        if (popup && popup.classList.contains('ht-show') && popup.style.display !== 'none' && lastSelectedText && lastSelectedRect) {
            // Force re-translation
            showTranslatePopup(lastSelectedText, lastSelectedRect);
        }
    }
}

// 初始載入設定
loadSettings();

// Data migration from sync to local (one-time)
async function migrateSyncToLocal() {
    try {
        const syncData = await chrome.storage.sync.get('savedTranslations');
        if (syncData.savedTranslations && syncData.savedTranslations.length > 0) {
            console.log('Migrating saved translations from sync to local...');
            for (const item of syncData.savedTranslations.reverse()) {
                await storageService.saveTranslation(item);
            }
            // Clear sync storage after successful migration
            await chrome.storage.sync.remove('savedTranslations');
            console.log('Migration complete.');
        }
    } catch (e) {
        console.error('Error migrating data:', e);
    }
}

migrateSyncToLocal();

// 監聽設定更新
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateSettings') {
        settings = request.settings;
        checkAndRetranslate();
        applyHighlightSettings();
        sendResponse({success: true});
    }
});

// 監聽 storage 變更（當設定在其他地方更新時）
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
        // 重新載入設定
        loadSettings().then(() => {
            checkAndRetranslate();
        });
    }
});

// 注入樣式
function injectStyles(root) {
    if (root.getElementById('highlighting-translate-styles')) return;

    const style = document.createElement('style');
    style.id = 'highlighting-translate-styles';
    style.textContent = `
        :host {
            --ht-primary: #f5b041;
            --ht-primary-hover: #d68910;
            --ht-bg: rgba(255, 255, 255, 0.95);
            --ht-text: #333;
            --ht-text-secondary: #666;
            --ht-shadow: 0 8px 25px rgba(0,0,0,0.15);
            --ht-radius: 12px;
            --ht-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            --ht-anim-duration: 0.25s;
            --ht-anim-ease: cubic-bezier(0.4, 0.0, 0.2, 1);
            all: initial; /* Reset all inherited styles */
        }
        .ht-popup {
            position: absolute;
            background: var(--ht-bg);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(0,0,0,0.05);
            border-radius: var(--ht-radius);
            padding: 16px;
            box-shadow: var(--ht-shadow);
            z-index: 2147483647;
            display: none;
            opacity: 0;
            transform: translateY(10px);
            transition: opacity var(--ht-anim-duration) var(--ht-anim-ease), transform var(--ht-anim-duration) var(--ht-anim-ease);
            max-width: 380px;
            min-width: 240px;
            font-family: var(--ht-font);
            font-size: 14px;
            line-height: 1.6;
            box-sizing: border-box;
            color: var(--ht-text);
        }
        .ht-popup.ht-show {
            opacity: 1;
            transform: translateY(0);
        }
        .ht-header {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 8px;
            align-items: center;
            gap: 10px;
        }
        .ht-close-btn, .ht-star-btn {
            cursor: pointer;
            color: #999;
            font-size: 18px;
            text-align: center;
            line-height: 24px;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background-color 0.2s, color 0.2s;
        }
        .ht-close-btn:hover, .ht-star-btn:hover {
            color: var(--ht-text);
            background-color: rgba(0,0,0,0.05);
        }
        .ht-star-btn svg {
            width: 18px;
            height: 18px;
            fill: none;
            stroke: currentColor;
            stroke-width: 2;
            transition: fill 0.2s, stroke 0.2s;
        }
        .ht-star-btn.starred svg {
            fill: var(--ht-primary);
            stroke: var(--ht-primary);
            animation: ht-pulse 0.4s var(--ht-anim-ease);
        }
        @keyframes ht-pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.3); }
            100% { transform: scale(1); }
        }
        .ht-content {
            padding: 0 4px 4px 4px;
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
        }
        .ht-loading {
            display: flex; 
            align-items: center; 
            justify-content: center; 
            padding: 20px;
            width: 100%;
        }
        .ht-loading-text {
            color: var(--ht-text-secondary);
            font-size: 13px;
        }
        .ht-translation-text {
            color: var(--ht-text); 
            font-weight: 500; 
            word-wrap: break-word; 
            font-size: 16px;
            flex: 1;
            line-height: 1.5;
        }
        .ht-floating-play-btn {
            position: absolute;
            width: 36px;
            height: 36px;
            background: white;
            border: 1px solid rgba(0,0,0,0.1);
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            z-index: 2147483647;
            display: none;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s var(--ht-anim-ease), background-color 0.2s;
        }
        .ht-floating-play-btn:hover {
            transform: scale(1.1) translateY(-1px);
            background-color: #fafafa;
            box-shadow: 0 6px 16px rgba(0,0,0,0.12);
        }
        .ht-floating-play-btn svg {
            width: 22px;
            height: 22px;
            fill: var(--ht-text-secondary);
            margin-left: 2px; /* Visual optical alignment */
        }
        .ht-toast {
            position: absolute;
            bottom: 16px;
            left: 50%;
            transform: translateX(-50%) translateY(10px);
            background: rgba(30, 30, 30, 0.9);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 13px;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s, transform 0.3s;
            z-index: 100;
            white-space: nowrap;
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }
        .ht-toast.show {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        mark.ht-highlight {
            background: linear-gradient(120deg, rgba(245, 176, 65, 0.3) 0%, rgba(245, 176, 65, 0.5) 100%);
            border-bottom: 2px solid rgba(245, 176, 65, 0.6);
            color: inherit;
            cursor: help;
            border-radius: 3px;
            padding: 0 2px;
            transition: background 0.2s;
        }
        mark.ht-highlight:hover {
            background: rgba(245, 176, 65, 0.6);
        }
        .ht-tooltip {
            position: absolute;
            background: rgba(40, 44, 52, 0.95);
            backdrop-filter: blur(4px);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 13px;
            font-family: var(--ht-font);
            z-index: 2147483647;
            pointer-events: none;
            display: none;
            max-width: 240px;
            word-wrap: break-word;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            opacity: 0;
            transform: translateY(5px);
            transition: opacity 0.2s, transform 0.2s;
        }
        .ht-tooltip.ht-show {
            opacity: 1;
            transform: translateY(0);
        }
    `;
    root.appendChild(style);
}

// Check if current translation is saved
async function checkIsStarred(text, translation) {
    try {
        return await storageService.isStarred(text, translation);
    } catch (e) {
        console.error('Error checking star status', e);
        return false;
    }
}

// Toggle Star/Save
async function toggleStar(text, translation, sourceLang, targetLang, context = null) {
    try {
        const currentlyStarred = await storageService.isStarred(text, translation);
        
        if (currentlyStarred) {
            await storageService.removeTranslation(text, translation);
            isStarred = false;
        } else {
            await storageService.saveTranslation({
                text,
                translation,
                sourceLang,
                targetLang,
                sourceUrl: window.location.href,
                context, 
                timestamp: Date.now()
            });
            isStarred = true;
        }
        
        return isStarred;
    } catch (e) {
        console.error('Error saving translation', e);
        throw e; // Propagate error to be handled by caller
    }
}

// 建立翻譯視窗元素
function createTranslatePopup() {
    const host = document.createElement('div');
    host.id = 'translate-popup-host';
    const shadowRoot = host.attachShadow({mode: 'open'});
    
    injectStyles(shadowRoot);

    const popup = document.createElement('div');
    popup.id = 'translate-popup';
    popup.className = 'ht-popup';

    // Content container to be updated dynamically
    const contentContainer = document.createElement('div');
    contentContainer.id = 'ht-content-container';
    popup.appendChild(contentContainer);

    const toast = document.createElement('div');
    toast.id = 'ht-toast';
    toast.className = 'ht-toast';
    popup.appendChild(toast);

    // Initialize TooltipService
    tooltipService.init(shadowRoot);

    const floatingPlayBtn = document.createElement('div');
    floatingPlayBtn.id = 'floating-play-btn';
    floatingPlayBtn.className = 'ht-floating-play-btn';
    floatingPlayBtn.title = '播放原文';
    floatingPlayBtn.innerHTML = `
        <svg viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
    `;

    shadowRoot.appendChild(popup);
    shadowRoot.appendChild(floatingPlayBtn);
    document.body.appendChild(host);
    return host;
}

// Helper for safe message passing
async function sendMessageSafe(message) {
    try {
        return await chrome.runtime.sendMessage(message);
    } catch (error) {
        if (error.message && error.message.includes('Extension context invalidated')) {
            throw new Error('擴充功能已更新，請重新整理頁面 (Extension updated, please reload page)');
        }
        throw error;
    }
}

// 播放語音
function playTTS(text, lang) {
    if (!text) return;
    sendMessageSafe({
        action: 'playTTS',
        text: text,
        lang: lang
    }).catch(error => console.error('Error sending TTS message:', error));
}

// 顯示簡短提示
function showToast(message) {
    const host = document.getElementById('translate-popup-host');
    if (!host) return;
    const toast = host.shadowRoot.getElementById('ht-toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

// 顯示 Tooltip


// Helper to get sentence context
function getSentenceContext(range) {
    if (!range) return null;
    
    // Simple implementation: Expand to block boundaries or punctuation
    // This is a heuristic and might need refinement
    try {
        let container = range.commonAncestorContainer;
        if (container.nodeType === 3) { // Text node
            container = container.parentNode;
        }
        
        // Get the full text content of the block
        // We limit to the nearest block element to avoid grabbing the whole page
        let block = container;
        while (block && window.getComputedStyle(block).display === 'inline') {
             block = block.parentElement;
        }
        if (!block) block = container;

        let fullText = block.innerText || block.textContent;
        // Clean up whitespace
        fullText = fullText.replace(/\s+/g, ' ').trim();
        
        // Find the selected text within the full text
        const selectedText = range.toString().trim();
        if (!selectedText) return null;

        // Escape regex special characters in selectedText
        const escapedSelection = selectedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Find match position (simple approach)
        // Note: This relies on the text being unique enough or just taking the first match in the block.
        // For a more robust solution, we'd strictly follow DOM nodes, but that's complex.
        // Let's try to match surrounding sentence.
        
        const sentenceRegex = new RegExp(`([^.?!]*${escapedSelection}[^.?!]*[.?!]?)`, 'i');
        const match = fullText.match(sentenceRegex);
        
        if (match) {
            let sentence = match[0].trim();
            // Cap length
            if (sentence.length > 300) {
                 return sentence.substring(0, 300) + '...';
            }
            return sentence;
        }
        return null;
    } catch (e) {
        console.error('Error getting context', e);
        return null; // Fail gracefully
    }
}

// 顯示翻譯視窗
async function showTranslatePopup(text, rect) {
    // 儲存最後一次選取的資訊，供重新翻譯使用
    lastSelectedText = text;
    lastSelectedRect = rect;
    lastTranslationResult = '';
    isStarred = false;

    // 檢查是否需要翻譯
    if (!translationService.shouldTranslate(text, settings.sourceLang, settings.targetLang)) {
        return;
    }

    let host = document.getElementById('translate-popup-host');
    if (!host) {
        host = createTranslatePopup();
    }
    const shadowRoot = host.shadowRoot;
    const popup = shadowRoot.getElementById('translate-popup');
    const contentContainer = shadowRoot.getElementById('ht-content-container');
    const floatingPlayBtn = shadowRoot.getElementById('floating-play-btn');

    const closeHandler = () => {
        popup.classList.remove('ht-show');
        floatingPlayBtn.style.display = 'none';
        setTimeout(() => {
            if (!popup.classList.contains('ht-show')) {
                popup.style.display = 'none';
            }
        }, 300);
    };

    // 顯示載入中
    contentContainer.innerHTML = `
    <div class="ht-header">
         <div class="ht-close-btn">×</div>
    </div>
    <div class="ht-content">
      <div class="ht-loading">
        <div class="ht-loading-text">翻譯中...</div>
      </div>
    </div>
  `;
    contentContainer.querySelector('.ht-close-btn').onclick = closeHandler;

    // 顯示翻譯視窗
    popup.style.display = 'block';
    void popup.offsetHeight;
    popup.classList.add('ht-show');

    // 設定懸浮播放按鈕
    floatingPlayBtn.style.display = 'flex';
    floatingPlayBtn.style.left = (rect.right + window.scrollX + 5) + 'px';
    floatingPlayBtn.style.top = (rect.top + window.scrollY - 15) + 'px';
    
    floatingPlayBtn.onclick = (e) => {
        e.stopPropagation();
        let lang = settings.sourceLang;
        if (lang === 'auto') {
            lang = translationService.detectLanguage(text);
            if (lang === 'auto') lang = 'en';
        }
        playTTS(text, lang);
    };

    // 調整位置
    const popupWidth = 350;
    const popupHeight = 150; 
    const margin = 10;

    let left = rect.left + window.scrollX;
    let top = rect.bottom + window.scrollY + 5;

    if (left + popupWidth > window.innerWidth + window.scrollX - margin) {
        left = window.innerWidth + window.scrollX - popupWidth - margin;
    }
    if (left < window.scrollX + margin) {
        left = window.scrollX + margin;
    }
    if (rect.bottom + popupHeight + margin > window.innerHeight) {
        top = rect.top + window.scrollY - popupHeight - 5;
    }
    if (top < window.scrollY + margin) {
        top = window.scrollY + margin;
    }

    popup.style.left = left + 'px';
    popup.style.top = top + 'px';

    // 獲取翻譯
    try {
        const response = await sendMessageSafe({
            action: 'TRANSLATE',
            text: text,
            sourceLang: settings.sourceLang,
            targetLang: settings.targetLang
        });
        
        if (!response || !response.success) {
            throw new Error(response ? response.error : 'Translation failed');
        }
        const translation = response.data;
        lastTranslationResult = translation;
        
        // Context Capture
        let context = null;
        // Try to get context from the current selection if it matches the text
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            if (selection.toString().trim() === text) {
                 context = getSentenceContext(range);
            }
        }
        
        // Check if already starred
        isStarred = await checkIsStarred(text, translation);
        const starClass = isStarred ? 'starred' : '';

        contentContainer.innerHTML = `
          <div class="ht-header">
              <div class="ht-star-btn ${starClass}" title="收藏 (Star)">
                  <svg viewBox="0 0 24 24">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
              </div>
              <div class="ht-close-btn">×</div>
          </div>
          <div class="ht-content">
            <div class="ht-translation-text">${translation}</div>
            ${context ? `<div class="ht-context-preview" style="display:none;">${context}</div>` : ''} 
          </div>
        `;
        
        const closeBtn = contentContainer.querySelector('.ht-close-btn');
        closeBtn.onclick = closeHandler;

        const starBtn = contentContainer.querySelector('.ht-star-btn');
        starBtn.onclick = async () => {
             try {
                 // Pass context to toggleStar
                 const newState = await toggleStar(text, translation, settings.sourceLang, settings.targetLang, context);
                 if (newState) {
                     starBtn.classList.add('starred');
                     showToast('已收藏');
                 } else {
                     starBtn.classList.remove('starred');
                     showToast('已取消收藏');
                 }
             } catch (error) {
                 console.error('Star error:', error);
                 showToast('儲存失敗');
             }
        };

        // 自動播放
        if (settings.autoPlaySpeech) {
            let lang = settings.sourceLang;
            if (lang === 'auto') {
                lang = translationService.detectLanguage(text);
                if (lang === 'auto') lang = 'en';
            }
            playTTS(text, lang);
        }
    } catch (error) {
        contentContainer.innerHTML = `
          <div class="ht-header">
               <div class="ht-close-btn">×</div>
          </div>
          <div class="ht-content">
            <div class="ht-translation-text" style="color:red;">翻譯失敗: ${error.message}</div>
          </div>
        `;
        contentContainer.querySelector('.ht-close-btn').onclick = closeHandler;
    }
}

// 隱藏翻譯視窗
function hideTranslatePopup() {
    const host = document.getElementById('translate-popup-host');
    if (!host) return;
    
    const shadowRoot = host.shadowRoot;
    const popup = shadowRoot.getElementById('translate-popup');
    const floatingPlayBtn = shadowRoot.getElementById('floating-play-btn');

    if (popup) {
        popup.classList.remove('ht-show');
        setTimeout(() => {
            if (!popup.classList.contains('ht-show')) {
                popup.style.display = 'none';
            }
        }, 300);
    }
    
    if (floatingPlayBtn) {
        floatingPlayBtn.style.display = 'none';
    }
}

// 監聽文字選取事件
let selectionTimeout;

document.addEventListener('mouseup', (e) => {
    // 如果未啟用自動翻譯，直接返回
    if (!settings.autoTranslate) {
        return;
    }

    // 清除之前的計時器
    clearTimeout(selectionTimeout);

    // 如果點擊的是翻譯視窗本身，不要隱藏
    if (e.target.closest('#translate-popup-host')) {
        return;
    }

    // 延遲檢查選取的文字
    selectionTimeout = setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (selectedText && selectedText.length > 0 && selectedText.length < 1000) {
            // 獲取選取範圍的位置
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            // 顯示翻譯
            showTranslatePopup(selectedText, rect);
        } else {
            hideTranslatePopup();
        }
    }, settings.delay);
});

// 點擊其他地方時隱藏翻譯視窗
document.addEventListener('mousedown', (e) => {
    if (!e.target.closest('#translate-popup-host')) {
        hideTranslatePopup();
    }
});

// 滾動時隱藏翻譯視窗
document.addEventListener('scroll', () => {
    hideTranslatePopup();
});

// ESC 鍵隱藏翻譯視窗
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        hideTranslatePopup();
    }
});

// Bind hover events for tooltips
document.addEventListener('mouseover', (e) => {
    if (e.target.classList.contains('ht-highlight')) {
        const text = e.target.dataset.translation;
        if (text) {
            const rect = e.target.getBoundingClientRect();
            // Ensure tooltip service is initialized if not already (it should be init by loadSettings -> createTranslatePopup if popup shown, 
            // but we might need to init it earlier if popup was never shown.
            // Actually createTranslatePopup is called only when showing popup.
            // We need to ensure we have a host for tooltip.
            
            let host = document.getElementById('translate-popup-host');
            if (!host) {
                host = createTranslatePopup();
            }
            // TooltipService init is called in createTranslatePopup
            
            tooltipService.show(text, rect);
        }
    }
});

document.addEventListener('mouseout', (e) => {
    if (e.target.classList.contains('ht-highlight')) {
        tooltipService.hide();
    }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        createTranslatePopup,
        showTranslatePopup,
        hideTranslatePopup,
        playTTS,
        getSentenceContext,
        updateLocalSettings: (newSettings) => { settings = { ...settings, ...newSettings }; }
    };
}
