// HTML 轉義輔助函式，防止 XSS 攻擊
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// 預設設定
let settings = {
    autoTranslate: true,
    autoCopy: false,
    sourceLang: 'auto',
    targetLang: 'zh-TW',
    delay: 500,
    enablePhrasalVerbs: true,
    enableFocusTrack: true,
    focusInTooltip: true,
    focusExperimentFlag: false
};

let lastSelectedText = '';
let lastSelectedRect = null;
let lastTranslationResult; let lastDetectedSourceLang = ''; // Store valid translation result for saving
let isStarred = false; // Track star state

// Instantiate TranslationService, StorageService, and HighlightService
const translationService = new TranslationService();
const storageService = new StorageService();
const highlightService = new HighlightService();
const tooltipService = new TooltipService();
let missionFocusWords = new Set();

// 載入設定的函數
async function loadSettings() {
    try {
        const items = await chrome.storage.sync.get({
            autoTranslate: true,
            autoCopy: false,
            autoPlaySpeech: false,
            sourceLang: 'auto',
            targetLang: 'zh-TW',
            delay: 500,
            enableHighlighting: true,
            enablePhrasalVerbs: true,
            domainBlacklist: [],
            themeColor: '#26A69A', // Default Teal
            enableFocusTrack: true,
            focusInTooltip: true,
            focusInReview: true,
            focusInPopup: true,
            focusExperimentFlag: false
        });
        settings = items;
        
        // Apply initial theme
        if (items.themeColor) {
             document.documentElement.style.setProperty('--ht-primary', items.themeColor);
             const host = document.getElementById('translate-popup-host');
             if (host) host.style.setProperty('--ht-primary', items.themeColor);
        }

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
    
    // Always remove old highlights before reapplying
    removeHighlights();

    if (settings.enableHighlighting && !isBlacklisted) {
        scanPageForVocabulary();
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

        // Load pre-expanded phrasal verbs from local storage (populated by background.js)
        // only if the user has enabled the phrasal verbs feature
        let phrasalVerbs = [];
        if (settings.enablePhrasalVerbs) {
            const localData = await chrome.storage.local.get('phrasalVerbsExpanded');
            phrasalVerbs = localData.phrasalVerbsExpanded || [];
        }

        const focusData = await chrome.storage.local.get('focusTrackWords');
        missionFocusWords = new Set((focusData.focusTrackWords || []).map((word) => String(word).toLowerCase().trim()));

        // Merge: phrasal verbs first so they are sorted by length ahead of single words
        // HighlightService already sorts by length descending, so order here doesn't matter,
        // but putting phrasal verbs first avoids duplicates when a form overlaps a saved word.
        const combined = [...phrasalVerbs, ...(vocabList || [])].map((item) => ({
            ...item,
            isMissionWord: missionFocusWords.has(String(item.text || '').toLowerCase().trim())
        }));

        if (combined.length > 0) {
            highlightService.scanAndHighlight(document.body, combined);
        }
    } catch (e) {
        console.error('Error scanning page for vocabulary:', e);
    }
}

let scanTimeout = null;
function requestDebouncedScan() {
    if (scanTimeout) clearTimeout(scanTimeout);
    scanTimeout = setTimeout(() => {
        const domain = window.location.hostname;
        const isBlacklisted = settings.domainBlacklist && settings.domainBlacklist.includes(domain);
        if (settings.enableHighlighting && !isBlacklisted) {
            scanPageForVocabulary();
        }
    }, 1500);
}

// 監聽 DOM 變更，支援 SPA (單頁應用程式)
const domObserver = new MutationObserver((mutations) => {
    let shouldScan = false;
    for (const m of mutations) {
        if (m.addedNodes.length > 0) {
            for (const node of m.addedNodes) {
                // 忽略翻譯視窗和已標記節點的變更
                if (node.id === 'translate-popup-host' || node.nodeName === 'MARK') continue;
                if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0) {
                    shouldScan = true; break;
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    shouldScan = true; break;
                }
            }
        }
        if (shouldScan) break;
    }
    if (shouldScan) {
        requestDebouncedScan();
    }
});

function startDomObserver() {
    if (document.body) {
        domObserver.observe(document.body, { childList: true, subtree: true });
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            domObserver.observe(document.body, { childList: true, subtree: true });
        });
    }
}
startDomObserver();


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
    if (chrome.runtime.lastError) {
        console.warn('onMessage error:', chrome.runtime.lastError.message);
        return;
    }
    if (request.action === 'updateSettings') {
        settings = request.settings;
        checkAndRetranslate();
        applyHighlightSettings();
        sendResponse({success: true});
    } else if (request.action === 'updateTheme') {
        const color = request.themeColor;
        // Update document root
        document.documentElement.style.setProperty('--ht-primary', color);
        
        // Host (Shadow DOM wrapper style)
        const hostStyle = document.getElementById('highlighting-translate-styles');
        if (hostStyle) {
            // We can't easily edit inner text of style, but we can append a new rule or just set property on host
            // Since we used :root, setting on documentElement is enough for global
            // But for Shadow DOM isolated styles if they don't inherit...
            // Our style uses :root, :host.
            // Setting property on the shadow host element is best
            const host = document.getElementById('translate-popup-host');
            if (host) {
                host.style.setProperty('--ht-primary', color);
                // Calculate hover
                // Simple darkening logic implementation inline or reuse?
                // For simplicity, let's just use the color. Hover effect might be less visible if we don't calculate defaults.
                // Or we can rely on opacity.
            }
        }
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
        :root, :host {
            --ht-primary: #26A69A;
            --ht-primary-hover: #00897B;
            --ht-bg: rgba(255, 255, 255, 0.98);
            --ht-text: #37474F;
            --ht-text-secondary: #78909C;
            --ht-shadow: 0 4px 20px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);
            --ht-radius: 16px;
            --ht-font: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            --ht-anim-duration: 0.2s;
            --ht-anim-ease: cubic-bezier(0.4, 0.0, 0.2, 1);
            /* all: initial; - Removed because it resets too much in global scope */
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
        /* ... existing styles ... */
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
            position: fixed;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%) translateY(10px);
            background: rgba(30, 30, 30, 0.9);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 14px;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s, transform 0.3s;
            z-index: 2147483647;
            white-space: nowrap;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .ht-toast.show {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        mark.ht-highlight {
            background: color-mix(in srgb, var(--ht-primary) 30%, transparent);
            border-bottom: 2px solid color-mix(in srgb, var(--ht-primary) 50%, transparent);
            color: inherit;
            cursor: pointer;
            border-radius: 4px;
            padding: 0 1px;
            transition: background 0.2s, border-color 0.2s;
        }
        mark.ht-highlight:hover {
            background: color-mix(in srgb, var(--ht-primary) 50%, transparent);
            border-bottom-color: var(--ht-primary);
        }
        /* Frequency Based Highlighting */
        mark.ht-highlight.hl-freq-high {
            background: rgba(239, 83, 80, 0.3); /* Increased opacity */
            border-bottom: 2px solid rgba(239, 83, 80, 0.6);
        }
        mark.ht-highlight.hl-freq-high:hover {
            background: rgba(239, 83, 80, 0.45);
        }
        mark.ht-highlight.hl-freq-mid {
            background: color-mix(in srgb, var(--ht-primary) 20%, transparent);
        }
        mark.ht-highlight.hl-freq-low {
            background: transparent;
            border-bottom: 1px dashed #B0BEC5; 
        }
        mark.ht-highlight.hl-freq-low:hover {
            background: rgba(176, 190, 197, 0.3);
        }

        .ht-tooltip {
            position: absolute;
            background: rgba(40, 44, 52, 0.95);
            backdrop-filter: blur(4px);
            color: white;
            padding: 10px 14px;
            border-radius: 8px;
            font-size: 13px;
            font-family: var(--ht-font);
            z-index: 2147483647;
            pointer-events: none;
            display: none;
            max-width: 260px;
            word-wrap: break-word;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            opacity: 0;
            transform: translateY(5px);
            transition: opacity 0.2s, transform 0.2s;
        }
        .ht-tooltip-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            padding-bottom: 4px;
            gap: 12px;
        }
        .ht-rank-badge {
            background: var(--ht-primary);
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .ht-rank-badge.level-mid { background: #42A5F5; }
        .ht-rank-badge.level-low { background: #B0BEC5; }
        .ht-focus-badge {
            background: #ff7043;
            color: #fff;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.3px;
            text-transform: uppercase;
            display: inline-block;
            animation: ht-focus-pop 0.18s ease-out;
        }
        @keyframes ht-focus-pop {
            0% { transform: scale(0.85); opacity: 0.5; }
            100% { transform: scale(1); opacity: 1; }
        }
        
        .ht-tooltip-translation {
            font-size: 14px;
            font-weight: 500;
        }
        .ht-tooltip.ht-show {
            opacity: 1;
            transform: translateY(0);
        }
        
        /* Popup Rank Style */
        .ht-popup-freq-info {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
            font-size: 12px;
            color: var(--ht-text-secondary);
        }
    `;
    if (root.nodeType === Node.DOCUMENT_NODE) { // Handle document head specifically or check if it's head
         root.head.appendChild(style);
    } else {
         root.appendChild(style);
    }
}

// Inject global styles immediately to ensure highlights work
if (document.head) {
    injectStyles(document);
} else {
    document.addEventListener('DOMContentLoaded', () => injectStyles(document));
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
        
        // Refresh highlights on the current page immediately
        applyHighlightSettings();
        
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
    shadowRoot.appendChild(toast);
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

// 播放語音 (使用 Web Speech API)
let activeUtterance = null; // Prevent GC

function playTTS(text, lang) {
    if (!text) return;
    
    // Cancel any current speaking
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    activeUtterance = utterance; // Keep reference

    // Try to select a voice
    let voices = window.speechSynthesis.getVoices();
    
    // Helper to pick voice
    const selectVoice = () => {
        voices = window.speechSynthesis.getVoices();
        // 1. Prefer Local Service (System Voice) - Reliable & Mechanical
        let v = voices.find(v => v.lang.includes(lang) && v.localService);
        // 2. Prefer Google - Better Quality but network dependent
        if (!v) v = voices.find(v => v.lang.includes(lang) && v.name.includes('Google'));
        // 3. Any match
        if (!v) v = voices.find(v => v.lang.includes(lang));
        return v;
    };

    const runSpeak = () => {
        const targetVoice = selectVoice();
        if (targetVoice) {
            utterance.voice = targetVoice;
        }
        
        // Settings
        utterance.lang = lang;
        utterance.rate = 1.0;
        utterance.volume = 1.0;

        utterance.onend = () => {
            activeUtterance = null;
        };

        window.speechSynthesis.speak(utterance);
    };

    // Retry if voices not ready
    if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.onvoiceschanged = null;
            runSpeak();
        };
    } else {
        setTimeout(runSpeak, 50);
    }
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
            lang = lastDetectedSourceLang || translationService.detectLanguage(text);
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
        const { translation, detectedSourceLang } = response.data;
        lastTranslationResult = translation;
        lastDetectedSourceLang = detectedSourceLang;
        
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
        
        // Fetch frequency info
        const wordInfo = await storageService.getWordInfo(text);

        // Check if already starred
        isStarred = await checkIsStarred(text, translation);
        const starClass = isStarred ? 'starred' : '';

        const freqHtml = wordInfo ? `
            <div class="ht-popup-freq-info">
                <span class="ht-rank-badge ${wordInfo.rank <= 3000 ? 'level-high' : (wordInfo.rank <= 10000 ? 'level-mid' : 'level-low')}">#${wordInfo.rank}</span>
                <span>CEFR: ${wordInfo.level}</span>
            </div>
        ` : '';

        contentContainer.innerHTML = `
          <div class="ht-header">
              <div class="ht-star-btn ${starClass}" title="收藏 (Star)">
                  <svg viewBox="0 0 24 24">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
              </div>
              <div class="ht-close-btn">×</div>
          </div>
          <div class="ht-content" style="flex-direction: column;">
            ${freqHtml}
            <div class="ht-translation-text">${escapeHtml(translation)}</div>
            ${context ? `<div class="ht-context-preview" style="display:none;">${escapeHtml(context)}</div>` : ''} 
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
                lang = detectedSourceLang || translationService.detectLanguage(text);
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
            <div class="ht-translation-text" style="color:red;">翻譯失敗: ${escapeHtml(error.message)}</div>
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

// 檢查文字是否為有效的單字或句子（排除純符號、純數字、JSON、程式碼等）
function isValidTextToTranslate(text) {
    if (!text || text.trim() === '') return false;
    
    const trimmed = text.trim();

    // 至少包含一個字母（涵蓋各國語言的字母，包含中日韓等）
    const hasLetter = /[\p{L}]/u.test(trimmed);
    if (!hasLetter) return false;
    
    // 排除全是重複單一字元的無意義文字 (例如 "-------", "aaaaa")
    if (/^(.)\1{4,}$/.test(trimmed)) return false;

    // 清理前後的引號、逗號或分號，以便更精準地進行變數名、路徑與常量的檢測
    const cleanText = trimmed.replace(/^["']|["']$/g, '').replace(/[,;]$/g, '').trim();

    // 1. 數字與常見技術標記 (如進制、單位、版本號、IP、顏色碼)
    // 16進制 (例如 0xff)
    if (/^0x[0-9a-fA-F]+$/i.test(trimmed)) return false;
    // 數字帶有常見單位 (例如 10px, 50ms, 100gb, 3.5ghz)
    if (/^\d+(\.\d+)?\s*(px|em|rem|vh|vw|ms|s|h|m|ns|us|kb|mb|gb|tb|pb|hz|khz|mhz|ghz|dpi|dpcm|dppx|pt|pc|in|cm|mm|deg|rad|turn|%|v|w|a|ma)$/i.test(trimmed)) return false;
    // 科學記號 (例如 1.2e-3)
    if (/^\d+(\.\d+)?[eE][+-]?\d+$/.test(trimmed)) return false;
    // 版本號 (例如 v1.2.3, 16.0)
    if (/^v?\d+\.\d+(\.\d+)*$/i.test(trimmed)) return false;
    // IP 位址 (例如 192.168.1.1)
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(trimmed)) return false;
    // 網頁顏色碼 (例如 #fff, #ffffff)
    if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) return false;

    // 2. JSON-like 格式物件或陣列
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
            JSON.parse(trimmed);
            return false;
        } catch (e) {
            // 對於非標準/有語法錯誤的 JSON，如果看起來像 JSON 物件/陣列也不翻譯
            if (/^[{\[][\s\S]*[}\]]$/.test(trimmed)) {
                const hasKeys = /(?:\b\w+|["']\w+["'])\s*:/u.test(trimmed);
                const hasArrayElements = trimmed.startsWith('[') && (trimmed.includes(',') || /\d/.test(trimmed));
                if (hasKeys || hasArrayElements) return false;
            }
        }
    }

    // 3. JSON 屬性/鍵值對 (例如 "current_state": "CREATED",)
    if (/^["']?[a-zA-Z_]\w*["']?\s*:\s*(?:["'][^"']*["']|\d+(?:\.\d+)?|true|false|null|\[|\{)\s*[,;]?$/i.test(trimmed)) return false;

    // 4. HTML/XML 標籤 (例如 <div>, <span class="badge">)
    if (/<[a-zA-Z/][^>]*>/u.test(trimmed)) return false;

    // 5. CSS 語法 (例如 .button { display: flex; }, margin-top: 10px;)
    if (/^\s*[.#]?\w+[\w-]*\s*\{[^}]*\}/u.test(trimmed) || /\w+-\w+\s*:\s*[^;]+;/u.test(trimmed)) return false;

    // 6. 箭頭函數與常見程式運算子 (例如 =>, &&, ||, ===, !==, ++, +=)
    if (/\s*=>\s*/u.test(trimmed) || /\s*->\s*/u.test(trimmed)) return false;
    if (/===|!==|==\s*=|!=\s*=|&&|\|\||\+\+|--|\+=|-=|\*=|\/=/u.test(trimmed)) return false;

    // 7. 程式關鍵字
    // 涵蓋大多數程式語言的宣告與指令關鍵字
    if (/\b(const|var|function|import|export|async|await|yield|def|func|fn|impl|struct|enum|pub|package|interface)\b/u.test(trimmed)) return false;
    // class 關鍵字需要搭配程式符號（大括號、括號等），避免誤判英文句子如 "a class of students"
    if (/\bclass\b/u.test(trimmed) && /[{}.()=;]/u.test(trimmed)) return false;

    // 8. 函式呼叫 (例如 console.log("hello"), foo())
    if (/\b[a-zA-Z_]\w*\s*\(.*\)/u.test(trimmed) || /\b[a-zA-Z_]\w*\.[a-zA-Z_]\w*\s*\(/.test(trimmed)) {
        if (/\b[a-zA-Z_]\w*\.[a-zA-Z_]\w*\s*\(/.test(trimmed)) return false; // 物件方法呼叫
        if (/^[a-zA-Z_]\w*\s*\([^)]*\);?$/u.test(trimmed)) return false; // 單純的函式呼叫
    }

    // 9. 結尾為分號且含有運算或屬性符號的單行程式 (例如 "x = 1;")
    if (/;\s*$/u.test(trimmed) && /[{}.()=+\-*\/%&|^!~<>]/u.test(trimmed)) return false;

    // 10. 單一變數名稱 (snake_case 或 camelCase) 或大寫常量/狀態值
    if (!/\s/u.test(cleanText)) {
        // snake_case (例如 user_profile_id)
        if (/^[a-zA-Z_]\w*_[a-zA-Z0-9_]+/.test(cleanText)) return false;
        // camelCase (例如 myAwesomeVariable)
        if (/^[a-z]+[A-Z][a-z]+[A-Z][a-zA-Z0-9]*/.test(cleanText)) return false;
        // 大寫常量 / enum (例如 CREATED, STATUS_OK)
        if (/^[A-Z_][A-Z0-9_]{2,}$/.test(cleanText)) return false;
    }

    // 11. 檔案路徑與 URL 路徑/API Endpoint (例如 /usr/bin/local, src/components/Button.js, /api/v1/users)
    if (/^(?:\.\.?\/|\/[a-zA-Z0-9_]+|\w+\/)[a-zA-Z0-9_\-\.\/]+\.[a-zA-Z0-9]+$/u.test(cleanText) ||
        /^\/[a-zA-Z0-9_]+(?:\/[a-zA-Z0-9_\-]+)+$/u.test(cleanText)) {
        return false;
    }

    return true;
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
            if (!isValidTextToTranslate(selectedText)) {
                return;
            }

            if (settings.autoCopy) {
                try {
                    navigator.clipboard.writeText(selectedText).then(() => {
                        showToast('📋 已複製到剪貼簿');
                    }).catch(() => {});
                } catch (e) {}
            }

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
        const rank = e.target.dataset.rank;
        const level = e.target.dataset.level;
        const isMission = e.target.dataset.mission === 'true';
        const focusEnabled = settings.enableFocusTrack !== false
            && settings.focusInTooltip !== false
            && !settings.focusExperimentFlag;
        
        if (text) {
            const rect = e.target.getBoundingClientRect();
            let host = document.getElementById('translate-popup-host');
            if (!host) {
                host = createTranslatePopup();
            }
            tooltipService.show(text, rect, rank, level, isMission && focusEnabled);
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
        isValidTextToTranslate,
        updateLocalSettings: (newSettings) => { settings = { ...settings, ...newSettings }; }
    };
}
