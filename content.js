// 預設設定
let settings = {
    autoTranslate: true,
    sourceLang: 'auto',
    targetLang: 'zh-TW',
    delay: 500
};

// 載入設定的函數
async function loadSettings() {
    try {
        const items = await chrome.storage.sync.get({
            autoTranslate: true,
            sourceLang: 'auto',
            targetLang: 'zh-TW',
            delay: 500
        });
        settings = items;
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
}

// 初始載入設定
loadSettings();

// 監聽設定更新
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateSettings') {
        settings = request.settings;
        sendResponse({success: true});
    }
});

// 監聽 storage 變更（當設定在其他地方更新時）
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
        // 重新載入設定
        loadSettings();
    }
});

// 注入樣式
function injectStyles(root) {
    if (root.getElementById('highlighting-translate-styles')) return;

    const style = document.createElement('style');
    style.id = 'highlighting-translate-styles';
    style.textContent = `
        :host {
            all: initial; /* Reset all inherited styles */
        }
        .ht-popup {
            position: absolute;
            background: white;
            border: 1px solid #ccc;
            border-radius: 8px;
            padding: 12px;
            box-shadow: 0 2px 15px rgba(0,0,0,0.2);
            z-index: 2147483647;
            display: none;
            opacity: 0;
            transform: translateY(10px);
            transition: opacity 0.3s cubic-bezier(0.4, 0.0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
            max-width: 350px;
            min-width: 200px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            font-size: 14px;
            line-height: 1.5;
            box-sizing: border-box;
        }
        .ht-popup.ht-show {
            opacity: 1;
            transform: translateY(0);
        }
        .ht-close-btn {
            position: absolute;
            top: 5px;
            right: 5px;
            width: 20px;
            height: 20px;
            cursor: pointer;
            color: #999;
            font-size: 16px;
            text-align: center;
            line-height: 20px;
        }
        .ht-close-btn:hover {
            color: #333;
        }
        .ht-content {
            padding: 10px 5px;
        }
        .ht-loading {
            display: flex; 
            align-items: center; 
            justify-content: center; 
            padding: 20px;
        }
        .ht-loading-text {
            color: #666;
        }
        .ht-translation-text {
            color: #000; 
            font-weight: 500; 
            word-wrap: break-word; 
            font-size: 15px;
            margin-right: 24px; /* Space for play button */
        }
        .ht-play-btn {
            position: absolute;
            bottom: 10px;
            right: 10px;
            width: 24px;
            height: 24px;
            cursor: pointer;
            opacity: 0.6;
            transition: opacity 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .ht-play-btn:hover {
            opacity: 1;
        }
        .ht-play-btn svg {
            width: 20px;
            height: 20px;
            fill: #666;
        }
    `;
    root.appendChild(style);
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

    shadowRoot.appendChild(popup);
    document.body.appendChild(host);
    return host;
}

// 檢測文字語言
function detectLanguage(text) {
    // 簡化的語言檢測邏輯
    const chineseTraditionalChars = /[\u4e00-\u9fff]/g;
    const chineseSimplifiedChars = /[一-龯]/g;

    // 繁體中文特有字符
    const traditionalOnlyChars = /[豐併佈閒與會過於陣險離復讓貓]/g;

    // 簡體中文特有字符
    const simplifiedOnlyChars = /[丰并布闲与会过于阵险离复让猫]/g;

    // 英文字符
    const englishChars = /[a-zA-Z]/g;

    // 日文平假名和片假名
    const japaneseChars = /[\u3040-\u309f\u30a0-\u30ff]/g;

    // 韓文字符
    const koreanChars = /[\uac00-\ud7af]/g;

    // 統計各種字符數量
    const chineseCount = (text.match(chineseTraditionalChars) || []).length;
    const traditionalCount = (text.match(traditionalOnlyChars) || []).length;
    const simplifiedCount = (text.match(simplifiedOnlyChars) || []).length;
    const englishCount = (text.match(englishChars) || []).length;
    const japaneseCount = (text.match(japaneseChars) || []).length;
    const koreanCount = (text.match(koreanChars) || []).length;

    // 判斷主要語言
    if (chineseCount > 0) {
        // 如果有繁體中文特有字符，判斷為繁體中文
        if (traditionalCount > 0) {
            return 'zh-TW';
        }
        // 如果有簡體中文特有字符，判斷為簡體中文
        if (simplifiedCount > 0) {
            return 'zh-CN';
        }
        // 如果都沒有特有字符，預設為繁體中文（因為這是專案的預設設定）
        return 'zh-TW';
    }

    // 其他語言判斷
    if (japaneseCount > 0) {
        return 'ja';
    }
    if (koreanCount > 0) {
        return 'ko';
    }
    if (englishCount > 0) {
        return 'en';
    }

    // 預設返回自動檢測
    return 'auto';
}

// 檢查是否需要翻譯
function shouldTranslate(text, sourceLang, targetLang) {
    // 如果源語言設定為自動檢測，則使用檢測功能
    if (sourceLang === 'auto') {
        const detectedLang = detectLanguage(text);
        sourceLang = detectedLang;
    }

    // 如果源語言和目標語言相同，則不需要翻譯
    if (sourceLang === targetLang) {
        return false;
    }

    // 特殊情況：如果檢測到的語言是 auto 且目標語言是繁體中文，
    // 並且文字主要由中文字符組成，則可能不需要翻譯
    if (sourceLang === 'auto' && targetLang === 'zh-TW') {
        const chineseChars = /[\u4e00-\u9fff]/g;
        const chineseCount = (text.match(chineseChars) || []).length;
        const totalChars = text.length;

        // 如果中文字符超過 70%，可能是繁體中文，不需要翻譯
        if (chineseCount / totalChars > 0.7) {
            return false;
        }
    }

    return true;
}

// 獲取翻譯結果
async function getTranslation(text, sourceLang = null, targetLang = null) {
    try {
        sourceLang = sourceLang || settings.sourceLang;
        targetLang = targetLang || settings.targetLang;

        // 檢查是否需要翻譯
        if (!shouldTranslate(text, sourceLang, targetLang)) {
            return text; // 返回原文，不進行翻譯
        }

        // 如果源語言設定為自動檢測，則使用檢測功能
        if (sourceLang === 'auto') {
            const detectedLang = detectLanguage(text);
            // 如果檢測不出來，使用 'auto' 讓 Google 自動檢測
            sourceLang = detectedLang === 'auto' ? 'auto' : detectedLang;
        }

        // 使用 Google Translate API (免費版本)
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

        const response = await fetch(url);
        const data = await response.json();

        // 解析翻譯結果
        if (data && data[0] && data[0][0] && data[0][0][0]) {
            return data[0][0][0];
        }
        return '翻譯失敗';
    } catch (error) {
        console.error('Translation error:', error);
        return '翻譯錯誤';
    }
}

// 播放語音
function playTTS(text, lang) {
    if (!text) return;
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;
    const audio = new Audio(url);
    audio.play().catch(e => console.error('TTS playback error:', e));
}

// 顯示翻譯視窗
function showTranslatePopup(text, rect) {
    // 檢查是否需要翻譯，如果不需要翻譯則直接返回，不顯示任何彈窗
    if (!shouldTranslate(text, settings.sourceLang, settings.targetLang)) {
        return;
    }

    let host = document.getElementById('translate-popup-host');
    if (!host) {
        host = createTranslatePopup();
    }
    const popup = host.shadowRoot.getElementById('translate-popup');

    const closeHandler = () => {
        popup.classList.remove('ht-show');
        setTimeout(() => {
            if (!popup.classList.contains('ht-show')) {
                popup.style.display = 'none';
            }
        }, 300);
    };

    // 顯示載入中
    popup.innerHTML = `
    <div class="ht-close-btn">×</div>
    <div class="ht-loading">
      <div class="ht-loading-text">翻譯中...</div>
    </div>
  `;
    popup.querySelector('.ht-close-btn').onclick = closeHandler;

    popup.style.display = 'block';
    // Force reflow to trigger transition
    void popup.offsetHeight;
    popup.classList.add('ht-show');

    // 調整位置
    const popupWidth = 350;
    const popupHeight = 150; // 預估高度
    const margin = 10;

    let left = rect.left + window.scrollX;
    let top = rect.bottom + window.scrollY + 5;

    // 檢查右邊界
    if (left + popupWidth > window.innerWidth + window.scrollX - margin) {
        left = window.innerWidth + window.scrollX - popupWidth - margin;
    }
    // 檢查左邊界
    if (left < window.scrollX + margin) {
        left = window.scrollX + margin;
    }

    // 檢查下邊界，如果會被遮擋則顯示在選取文字上方
    if (rect.bottom + popupHeight + margin > window.innerHeight) {
        top = rect.top + window.scrollY - popupHeight - 5;
    }

    // 檢查上邊界
    if (top < window.scrollY + margin) {
        top = window.scrollY + margin;
    }

    popup.style.left = left + 'px';
    popup.style.top = top + 'px';

    // 獲取翻譯
    getTranslation(text).then(translation => {
        popup.innerHTML = `
      <div class="ht-close-btn">×</div>
      <div class="ht-content">
        <div class="ht-translation-text">${translation}</div>
        <div class="ht-play-btn" title="朗讀">
            <svg viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
        </div>
      </div>
    `;
        popup.querySelector('.ht-close-btn').onclick = closeHandler;
        
        const playBtn = popup.querySelector('.ht-play-btn');
        playBtn.onclick = (e) => {
            e.stopPropagation();
            playTTS(translation, settings.targetLang);
        };
    });
}

// 隱藏翻譯視窗
function hideTranslatePopup() {
    const host = document.getElementById('translate-popup-host');
    const popup = host ? host.shadowRoot.getElementById('translate-popup') : null;
    if (popup) {
        popup.classList.remove('ht-show');
        setTimeout(() => {
            if (!popup.classList.contains('ht-show')) {
                popup.style.display = 'none';
            }
        }, 300);
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

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        createTranslatePopup,
        showTranslatePopup,
        hideTranslatePopup,
        detectLanguage,
        shouldTranslate,
        getTranslation,
        playTTS
    };
}
