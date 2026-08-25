global.chrome = {
    storage: {
        sync: {
            get: jest.fn().mockImplementation((defaults) => Promise.resolve(defaults)),
        },
        local: {
            get: jest.fn().mockImplementation((defaults) => Promise.resolve(defaults)),
            set: jest.fn().mockImplementation(() => Promise.resolve()),
        },
        onChanged: {
            addListener: jest.fn(),
        }
    },
    runtime: {
        onMessage: {
            addListener: jest.fn(),
        },
        sendMessage: jest.fn().mockResolvedValue({success: true, data: 'default mock'})
    }
};

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));
const DEFAULT_RECT = { left: 0, top: 0, bottom: 0, width: 0, height: 0 };

global.window = global.window || window;
global.window.speechSynthesis = {
    cancel: jest.fn(),
    speak: jest.fn(),
    getVoices: jest.fn().mockReturnValue([]),
    onvoiceschanged: null,
};
global.SpeechSynthesisUtterance = function SpeechSynthesisUtterance(text) {
    this.text = text;
};

const TranslationService = require('./services/TranslationService');
global.TranslationService = TranslationService;
const StorageService = require('./services/StorageService');
global.StorageService = StorageService;
const HighlightServiceClass = require('./services/HighlightService');
global.HighlightService = HighlightServiceClass;
const TooltipService = require('./services/TooltipService');
global.TooltipService = TooltipService;

const content = require('./content.js');
const { createTranslatePopup, showTranslatePopup } = content;
const HighlightService = require('./services/HighlightService');

let onMessageListener;

describe('content.js Shadow DOM', () => {
    let originalClipboard;

    beforeEach(() => {
        originalClipboard = navigator.clipboard;
        // Reset listener capture
        global.chrome.runtime.onMessage.addListener.mockImplementation((listener) => {
            onMessageListener = listener;
        });
        
        // Re-require content.js to trigger addListener again if needed, 
        // but since it's cached, we might rely on the initial require.
        // If content.js runs top-level code on require, we need to reset modules.
        jest.resetModules();
        
        // Mock deps again for re-require
        global.chrome = {
            storage: {
                sync: {
                    get: jest.fn().mockImplementation((defaults) => Promise.resolve(defaults)),
                },
                local: {
                    get: jest.fn().mockImplementation((defaults) => Promise.resolve(defaults)),
                    set: jest.fn().mockImplementation(() => Promise.resolve()),
                },
                onChanged: {
                    addListener: jest.fn(),
                }
            },
            runtime: {
                onMessage: {
                    addListener: jest.fn((listener) => { onMessageListener = listener; }),
                },
                sendMessage: jest.fn().mockResolvedValue({success: true, data: 'default mock'})
            }
        };

        global.window.speechSynthesis = {
            cancel: jest.fn(),
            speak: jest.fn(),
            getVoices: jest.fn().mockReturnValue([{ name: 'English Voice', lang: 'en-US', localService: true }]),
            onvoiceschanged: null,
        };
        global.SpeechSynthesisUtterance = function SpeechSynthesisUtterance(text) {
            this.text = text;
        };
        
        // Need to define other globals like Audio if they are used at top level (they are not)
        // But detectLanguage regexes are top level.

        const contentRe = require('./content.js');
        // Update our destructured functions
        Object.assign(content, contentRe);

        document.body.innerHTML = '';
        global.innerWidth = 1024;
        global.innerHeight = 768;
        global.scrollX = 0;
        global.scrollY = 0;
        // Mock fetch for getTranslation
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve([[['translated']]])
        });
    });

    afterEach(() => {
        if (originalClipboard === undefined) {
            delete navigator.clipboard;
        } else {
            Object.defineProperty(navigator, 'clipboard', {
                configurable: true,
                value: originalClipboard
            });
        }
    });

    test('should create host and shadow root', () => {
        const host = createTranslatePopup();
        expect(host.id).toBe('translate-popup-host');
        expect(host.shadowRoot).not.toBeNull();
        expect(host.shadowRoot.getElementById('translate-popup')).not.toBeNull();
    });

    test('should add visible class when showing popup', () => {
        const host = createTranslatePopup();
        const popup = host.shadowRoot.getElementById('translate-popup');
        const contentContainer = host.shadowRoot.getElementById('ht-content-container');
        
        const rect = { left: 100, top: 150, bottom: 200, width: 50, height: 50 };
        showTranslatePopup('test', rect);

        expect(popup.classList.contains('ht-show')).toBe(true); 
        expect(popup.style.display).toBe('block');
        expect(contentContainer.innerHTML).toContain('ht-loading');
    });

    test('should adjust position when close to right edge', () => {
        const host = createTranslatePopup();
        const popup = host.shadowRoot.getElementById('translate-popup');
        
        global.innerWidth = 1000;
        const rect = { left: 900, top: 150, bottom: 200, width: 50, height: 50 };
        
        showTranslatePopup('test', rect);
        
        const left = parseInt(popup.style.left);
        expect(left + 350).toBeLessThanOrEqual(1000);
    });

    test('should show above selection if bottom edge is reached', () => {
        const host = createTranslatePopup();
        const popup = host.shadowRoot.getElementById('translate-popup');
        
        global.innerHeight = 300;
        const rect = { left: 100, top: 200, bottom: 250, width: 50, height: 50 };
        
        showTranslatePopup('test', rect);
        
        const top = parseInt(popup.style.top);
        // rect.top (200) - popupHeight (150) - 5 = 45
        expect(top).toBe(45);
    });

    test('playTTS should call Web Speech API', () => {
        jest.useFakeTimers();
        content.playTTS('hello', 'en');

        expect(global.window.speechSynthesis.cancel).toHaveBeenCalled();
        
        // speak() is deferred via setTimeout(runSpeak, 50)
        jest.advanceTimersByTime(100);
        expect(global.window.speechSynthesis.speak).toHaveBeenCalled();
        jest.useRealTimers();
    });

    test('should call TRANSLATE message and show result', async () => {
        const host = content.createTranslatePopup();
        const popup = host.shadowRoot.getElementById('translate-popup');
        const contentContainer = host.shadowRoot.getElementById('ht-content-container');
        
        // Mock sendMessage for TRANSLATE
        const sendMessageMock = jest.fn().mockImplementation((message) => {
            switch (message.action) {
                case 'TRANSLATE':
                    return Promise.resolve({success: true, data: { translation: 'Translated Text', detectedSourceLang: 'en' }});
                case 'STORAGE_IS_STARRED':
                    return Promise.resolve({success: true, data: false});
                case 'STORAGE_GET_WORD_INFO':
                    return Promise.resolve({success: true, data: null});
                case 'STORAGE_GET':
                    return Promise.resolve({success: true, data: []});
                default:
                    return Promise.resolve({success: true});
            }
        });
        global.chrome.runtime.sendMessage = sendMessageMock;

        // Show popup
        await content.showTranslatePopup('test', DEFAULT_RECT);

        // Wait for async operations
        await flushPromises();

        expect(sendMessageMock).toHaveBeenCalledWith(expect.objectContaining({
            action: 'TRANSLATE',
            text: 'test'
        }));
        expect(contentContainer.innerHTML).toContain('Translated Text');
    });

    test('should copy translated text from the popup', async () => {
        const host = content.createTranslatePopup();
        let resolveClipboard;
        const clipboardWrite = jest.fn(() => new Promise(resolve => {
            resolveClipboard = resolve;
        }));
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: { writeText: clipboardWrite }
        });

        const sendMessageMock = jest.fn().mockImplementation((message) => {
            switch (message.action) {
                case 'TRANSLATE':
                    return Promise.resolve({ success: true, data: { translation: 'Translated Text', detectedSourceLang: 'en' } });
                case 'STORAGE_IS_STARRED':
                    return Promise.resolve({ success: true, data: false });
                case 'STORAGE_GET_WORD_INFO':
                    return Promise.resolve({ success: true, data: null });
                default:
                    return Promise.resolve({ success: true });
            }
        });
        global.chrome.runtime.sendMessage = sendMessageMock;

        await content.showTranslatePopup('test', DEFAULT_RECT);
        await flushPromises();

        const copyBtn = host.shadowRoot.querySelector('.ht-copy-btn');
        copyBtn.click();
        copyBtn.click();
        expect(clipboardWrite).toHaveBeenCalledTimes(1);
        expect(copyBtn.disabled).toBe(true);
        resolveClipboard();
        await flushPromises();

        expect(clipboardWrite).toHaveBeenCalledWith('Translated Text');
        expect(host.shadowRoot.getElementById('ht-toast').textContent).toBe('📋 已複製翻譯');
        expect(copyBtn.disabled).toBe(false);
    });

    test('should show feedback when copying translated text fails', async () => {
        const host = content.createTranslatePopup();
        const clipboardWrite = jest.fn().mockRejectedValue(new Error('Clipboard denied'));
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: { writeText: clipboardWrite }
        });

        const sendMessageMock = jest.fn().mockImplementation((message) => {
            switch (message.action) {
                case 'TRANSLATE':
                    return Promise.resolve({ success: true, data: { translation: 'Translated Text', detectedSourceLang: 'en' } });
                case 'STORAGE_IS_STARRED':
                    return Promise.resolve({ success: true, data: false });
                case 'STORAGE_GET_WORD_INFO':
                    return Promise.resolve({ success: true, data: null });
                default:
                    return Promise.resolve({ success: true });
            }
        });
        global.chrome.runtime.sendMessage = sendMessageMock;

        await content.showTranslatePopup('test', DEFAULT_RECT);
        await flushPromises();

        host.shadowRoot.querySelector('.ht-copy-btn').click();
        await flushPromises();

        expect(host.shadowRoot.getElementById('ht-toast').textContent).toBe('複製失敗');
    });

    test('should not render copy action for an empty translation', async () => {
        const host = content.createTranslatePopup();
        global.chrome.runtime.sendMessage = jest.fn().mockResolvedValue({
            success: true,
            data: { translation: '', detectedSourceLang: 'en' }
        });

        await content.showTranslatePopup('test', DEFAULT_RECT);
        await flushPromises();

        const contentContainer = host.shadowRoot.getElementById('ht-content-container');
        expect(contentContainer.textContent).toContain('翻譯失敗');
        expect(contentContainer.querySelector('.ht-copy-btn')).toBeNull();
    });

    test('should add play button to popup and trigger playTTS on click', async () => {
        jest.useFakeTimers();
        const host = content.createTranslatePopup();
        const popup = host.shadowRoot.getElementById('translate-popup');
        
        // Mock getTranslation (fetch already mocked)
        
        // Mock settings
        content.updateLocalSettings({
            sourceLang: 'auto', 
            targetLang: 'en',
            autoPlaySpeech: false,
            autoTranslate: true
        });

        const sendMessageMock = jest.fn().mockImplementation((message) => {
            switch (message.action) {
                case 'TRANSLATE':
                    return Promise.resolve({ success: true, data: { translation: '你好', detectedSourceLang: 'zh-TW' } });
                case 'STORAGE_IS_STARRED':
                    return Promise.resolve({ success: true, data: false });
                case 'STORAGE_GET_WORD_INFO':
                    return Promise.resolve({ success: true, data: { rank: 100, level: 'A1' } });
                case 'STORAGE_GET':
                    return Promise.resolve({ success: true, data: [] });
                default:
                    return Promise.resolve({ success: true });
            }
        });
        global.chrome.runtime.sendMessage = sendMessageMock;

        // Show popup
        const showPromise = content.showTranslatePopup('你好', DEFAULT_RECT);
        await jest.runAllTimersAsync();
        await showPromise;

        const playBtn = host.shadowRoot.getElementById('floating-play-btn');
        expect(playBtn).not.toBeNull();
        
        // Simulate click
        playBtn.click();
        jest.advanceTimersByTime(100);

        expect(global.window.speechSynthesis.speak).toHaveBeenCalled();
        jest.useRealTimers();
    });

    test('should auto play TTS if autoPlaySpeech setting is true', async () => {
        jest.useFakeTimers();
        const host = content.createTranslatePopup();
        
        // Update settings using exposed helper
        content.updateLocalSettings({
            sourceLang: 'auto', 
            targetLang: 'ja',
            autoPlaySpeech: true,
            autoTranslate: true
        });

        const sendMessageMock = jest.fn().mockImplementation((message) => {
            switch (message.action) {
                case 'TRANSLATE':
                    return Promise.resolve({ success: true, data: { translation: 'Translated', detectedSourceLang: 'en' } });
                case 'STORAGE_IS_STARRED':
                    return Promise.resolve({ success: true, data: false });
                case 'STORAGE_GET_WORD_INFO':
                    return Promise.resolve({ success: true, data: { rank: 50, level: 'A1' } });
                case 'STORAGE_GET':
                    return Promise.resolve({ success: true, data: [] });
                default:
                    return Promise.resolve({ success: true });
            }
        });
        global.chrome.runtime.sendMessage = sendMessageMock;

        // Show popup
        const showPromise = content.showTranslatePopup('Original Text', DEFAULT_RECT);
        await jest.runAllTimersAsync();
        await showPromise;
        
        expect(global.window.speechSynthesis.speak).toHaveBeenCalled();
        jest.useRealTimers();
    });

    test('should handle Extension context invalidated error gracefully', async () => {
        // Mock sendMessage to throw the specific error
        chrome.runtime.sendMessage.mockRejectedValue(new Error('Extension context invalidated'));

        const host = content.createTranslatePopup();
        await content.showTranslatePopup('test', DEFAULT_RECT);
        await flushPromises();
        
        // When the extension context is invalidated, the error is caught and displayed in the popup UI
        const contentContainer = host.shadowRoot.getElementById('ht-content-container');
        expect(contentContainer.innerHTML).toContain('擴充功能已更新');
    });
    
    test('should show correct feedback when saveTranslation fails', async () => {
        const host = content.createTranslatePopup();
        const popup = host.shadowRoot.getElementById('translate-popup');
        
        // Mock sendMessage: 
        // 1. IS_STARRED -> false (not starred initially)
        // 2. SAVE -> fails
        const sendMessageMock = jest.fn((message) => {
            switch (message.action) {
                case 'TRANSLATE':
                    return Promise.resolve({ success: true, data: { translation: 'Translated', detectedSourceLang: 'en' } });
                case 'STORAGE_IS_STARRED':
                    return Promise.resolve({ success: true, data: false });
                case 'STORAGE_SAVE':
                    return Promise.resolve({ success: false, error: 'Storage Error' });
                case 'STORAGE_GET_WORD_INFO':
                    return Promise.resolve({ success: true, data: null });
                case 'STORAGE_GET':
                    return Promise.resolve({ success: true, data: [] });
                default:
                    return Promise.resolve({ success: true });
            }
        });

        global.chrome.runtime.sendMessage = sendMessageMock;

        // Show popup
        await content.showTranslatePopup('test', DEFAULT_RECT);
        await flushPromises();

        const starBtn = host.shadowRoot.getElementById('translate-popup').querySelector('.ht-star-btn');
        const toast = host.shadowRoot.getElementById('ht-toast');
        
        // Click star
        starBtn.click();
        await flushPromises(); // Allow async callbacks

        // With fixed logic, toggleStar throws, so the catch block in onclick should trigger.
        // showToast('儲存失敗');
        
        expect(toast.textContent).toBe('儲存失敗'); 
        // This confirms the fix: user sees "Save Failed" 
    });

    test('should rescan highlights after starring a translation', async () => {
        const scanSpy = jest.spyOn(HighlightService.prototype, 'scanAndHighlight').mockImplementation(() => {});
        const sendMessageMock = jest.fn((message) => {
            switch (message.action) {
                case 'TRANSLATE':
                    return Promise.resolve({ success: true, data: { translation: 'Translated', detectedSourceLang: 'en' } });
                case 'STORAGE_IS_STARRED':
                    return Promise.resolve({ success: true, data: false });
                case 'STORAGE_SAVE':
                    return Promise.resolve({ success: true });
                case 'STORAGE_GET_WORD_INFO':
                    return Promise.resolve({ success: true, data: { rank: 100, level: 'A1' } });
                case 'STORAGE_GET':
                    return Promise.resolve({ success: true, data: [{ text: 'test', translation: 'Translated' }] });
                default:
                    return Promise.resolve({ success: true });
            }
        });
        global.chrome.runtime.sendMessage = sendMessageMock;

        const host = content.createTranslatePopup();
        await content.showTranslatePopup('test', DEFAULT_RECT);
        await flushPromises();

        scanSpy.mockClear();
        const starBtn = host.shadowRoot.querySelector('.ht-star-btn');

        starBtn.click();
        await flushPromises();

        expect(scanSpy).toHaveBeenCalled();

        scanSpy.mockRestore();
    });
});

// ─── Phrasal Verbs Integration Tests ──────────────────────────────────────────
describe('HighlightService — Phrasal Verbs', () => {
    let highlightService;

    beforeEach(() => {
        highlightService = new HighlightService();
        document.body.innerHTML = '';
    });

    // Helper: create a div with textContent and run scanAndHighlight on it
    function highlightIn(text, vocab) {
        const div = document.createElement('div');
        div.textContent = text;
        document.body.appendChild(div);
        highlightService.scanAndHighlight(div, vocab);
        return div;
    }

    const giveUpEntry = { text: 'give up', translation: '放棄', cefr_level: 'A2', frequency_rank: 320 };
    const givesUpEntry = { text: 'gives up', translation: '放棄', cefr_level: 'A2', frequency_rank: 320 };
    const givingUpEntry = { text: 'giving up', translation: '放棄', cefr_level: 'A2', frequency_rank: 320 };
    const gaveUpEntry = { text: 'gave up', translation: '放棄', cefr_level: 'A2', frequency_rank: 320 };
    const lookForwardToEntry = { text: 'look forward to', translation: '期待', cefr_level: 'B1', frequency_rank: 1200 };

    test('TC-PV-01: base form "give up" is highlighted', () => {
        const div = highlightIn('She decided to give up smoking.', [giveUpEntry]);
        // processChunks uses requestIdleCallback/setTimeout — call synchronously via direct invocation
        const marks = div.querySelectorAll('mark.ht-highlight');
        // Because processChunks is async, we test the vocabMap build and regex path via HighlightService directly
        // Use highlightNode directly to verify synchronously
        const hs = new HighlightService();
        const node = document.createTextNode('She decided to give up smoking.');
        const container = document.createElement('div');
        container.appendChild(node);
        document.body.appendChild(container);
        const vocabMap = new Map([['give up', { translation: '放棄', rank: 320, level: 'A2' }]]);
        const regex = new RegExp(`\\b(give\\s+up)\\b`, 'gi');
        hs.highlightNode(node, vocabMap, regex);
        const highlighted = container.querySelectorAll('mark.ht-highlight');
        expect(highlighted.length).toBe(1);
        expect(highlighted[0].textContent).toBe('give up');
        expect(highlighted[0].dataset.translation).toBe('放棄');
    });

    test('TC-PV-02: 3rd-person-s form "gives up" is highlighted', () => {
        const hs = new HighlightService();
        const node = document.createTextNode('He never gives up.');
        const container = document.createElement('div');
        container.appendChild(node);
        document.body.appendChild(container);
        const vocabMap = new Map([['gives up', { translation: '放棄', rank: 320, level: 'A2' }]]);
        const regex = new RegExp(`\\b(gives\\s+up)\\b`, 'gi');
        hs.highlightNode(node, vocabMap, regex);
        const marks = container.querySelectorAll('mark.ht-highlight');
        expect(marks.length).toBe(1);
        expect(marks[0].textContent).toBe('gives up');
    });

    test('TC-PV-03: past form "gave up" is highlighted', () => {
        const hs = new HighlightService();
        const node = document.createTextNode('They gave up trying.');
        const container = document.createElement('div');
        container.appendChild(node);
        document.body.appendChild(container);
        const vocabMap = new Map([['gave up', { translation: '放棄', rank: 320, level: 'A2' }]]);
        const regex = new RegExp(`\\b(gave\\s+up)\\b`, 'gi');
        hs.highlightNode(node, vocabMap, regex);
        const marks = container.querySelectorAll('mark.ht-highlight');
        expect(marks.length).toBe(1);
        expect(marks[0].textContent).toBe('gave up');
    });

    test('TC-PV-04: present-participle "giving up" is highlighted', () => {
        const hs = new HighlightService();
        const node = document.createTextNode('She is giving up her seat.');
        const container = document.createElement('div');
        container.appendChild(node);
        document.body.appendChild(container);
        const vocabMap = new Map([['giving up', { translation: '放棄', rank: 320, level: 'A2' }]]);
        const regex = new RegExp(`\\b(giving\\s+up)\\b`, 'gi');
        hs.highlightNode(node, vocabMap, regex);
        const marks = container.querySelectorAll('mark.ht-highlight');
        expect(marks.length).toBe(1);
        expect(marks[0].textContent).toBe('giving up');
    });

    test('TC-PV-05: 3-word phrase "look forward to" is highlighted', () => {
        const hs = new HighlightService();
        const node = document.createTextNode('I look forward to seeing you.');
        const container = document.createElement('div');
        container.appendChild(node);
        document.body.appendChild(container);
        const vocabMap = new Map([['look forward to', { translation: '期待', rank: 1200, level: 'B1' }]]);
        const regex = new RegExp(`\\b(look\\s+forward\\s+to)\\b`, 'gi');
        hs.highlightNode(node, vocabMap, regex);
        const marks = container.querySelectorAll('mark.ht-highlight');
        expect(marks.length).toBe(1);
        expect(marks[0].textContent).toBe('look forward to');
        expect(marks[0].dataset.translation).toBe('期待');
    });

    test('TC-PV-06: frequency rank drives correct CSS class (hl-freq-high for rank<=3000)', () => {
        const hs = new HighlightService();
        const node = document.createTextNode('She decided to give up.');
        const container = document.createElement('div');
        container.appendChild(node);
        document.body.appendChild(container);
        const vocabMap = new Map([['give up', { translation: '放棄', rank: 320, level: 'A2' }]]);
        const regex = new RegExp(`\\b(give\\s+up)\\b`, 'gi');
        hs.highlightNode(node, vocabMap, regex);
        const mark = container.querySelector('mark.ht-highlight');
        expect(mark.classList.contains('hl-freq-high')).toBe(true);
    });

    test('TC-PV-07: partial substring "up" inside "give up" does not get its own highlight', () => {
        const hs = new HighlightService();
        const node = document.createTextNode('I give up.');
        const container = document.createElement('div');
        container.appendChild(node);
        document.body.appendChild(container);
        // Only the phrasal verb in map — "up" alone is not in map
        const vocabMap = new Map([['give up', { translation: '放棄', rank: 320, level: 'A2' }]]);
        const regex = new RegExp(`\\b(give\\s+up)\\b`, 'gi');
        hs.highlightNode(node, vocabMap, regex);
        const marks = container.querySelectorAll('mark.ht-highlight');
        // Only one mark for "give up", not a separate one for "up"
        expect(marks.length).toBe(1);
        expect(marks[0].textContent).toBe('give up');
    });

    test('TC-PV-08: when both phrasal and single-word forms are in vocabMap, longer phrasal match wins', () => {
        const hs = new HighlightService();
        const node = document.createTextNode('She will give up today.');
        const container = document.createElement('div');
        container.appendChild(node);
        document.body.appendChild(container);
        // Both "give" (as a single word) and "give up" in map
        const vocabMap = new Map([
            ['give up', { translation: '放棄', rank: 320, level: 'A2' }],
            ['give', { translation: '給', rank: 800, level: 'A1' }]
        ]);
        // HighlightService sorts by length descending, so "give up" (7) beats "give" (4)
        const escapedKeys = Array.from(vocabMap.keys())
            .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\ /g, '\\s+'))
            .sort((a, b) => b.length - a.length);
        const regex = new RegExp(`\\b(${escapedKeys.join('|')})\\b`, 'gi');
        hs.highlightNode(node, vocabMap, regex);
        const marks = container.querySelectorAll('mark.ht-highlight');
        // "give up" should be matched as a whole (longer alternative listed first in alternation)
        const phrasalMark = Array.from(marks).find(m => m.textContent === 'give up');
        expect(phrasalMark).toBeDefined();
        // "give" alone should NOT be a separate mark inside the phrasal match
        const singleMark = Array.from(marks).find(m => m.textContent === 'give');
        expect(singleMark).toBeUndefined();
    });
});

describe('isValidTextToTranslate optimization', () => {
    const { isValidTextToTranslate } = content;

    test('should allow valid natural language words and sentences', () => {
        expect(isValidTextToTranslate('hello')).toBe(true);
        expect(isValidTextToTranslate('Hello world')).toBe(true);
        expect(isValidTextToTranslate('這是一個測試')).toBe(true);
        expect(isValidTextToTranslate('We have 10 apples.')).toBe(true);
        expect(isValidTextToTranslate('Class is starting soon.')).toBe(true);
    });

    test('should reject text without letters', () => {
        expect(isValidTextToTranslate('123')).toBe(false);
        expect(isValidTextToTranslate('1,234.56')).toBe(false);
        expect(isValidTextToTranslate('!!!')).toBe(false);
        expect(isValidTextToTranslate('+ - =')).toBe(false);
    });

    test('should reject numbers with units, hexadecimal, scientific notation, IP addresses, and colors', () => {
        expect(isValidTextToTranslate('10px')).toBe(false);
        expect(isValidTextToTranslate('50ms')).toBe(false);
        expect(isValidTextToTranslate('100gb')).toBe(false);
        expect(isValidTextToTranslate('0xff')).toBe(false);
        expect(isValidTextToTranslate('1.2e-3')).toBe(false);
        expect(isValidTextToTranslate('v12.3.4')).toBe(false);
        expect(isValidTextToTranslate('192.168.1.1')).toBe(false);
        expect(isValidTextToTranslate('#fff')).toBe(false);
        expect(isValidTextToTranslate('#ff0000')).toBe(false);
    });

    test('should reject JSON-like objects and arrays', () => {
        expect(isValidTextToTranslate('{}')).toBe(false);
        expect(isValidTextToTranslate('[]')).toBe(false);
        expect(isValidTextToTranslate('{ "id": 123, "name": "John" }')).toBe(false);
        expect(isValidTextToTranslate('[1, 2, 3]')).toBe(false);
        // JSON-like syntax with minor syntax errors
        expect(isValidTextToTranslate('{ name: "John", age: 30 }')).toBe(false);
    });

    test('should reject HTML/XML tags', () => {
        expect(isValidTextToTranslate('<div>hello</div>')).toBe(false);
        expect(isValidTextToTranslate('<span class="badge">')).toBe(false);
    });

    test('should reject CSS syntax', () => {
        expect(isValidTextToTranslate('margin-top: 10px;')).toBe(false);
        expect(isValidTextToTranslate('.button { display: flex; }')).toBe(false);
    });

    test('should reject arrow functions and code operators', () => {
        expect(isValidTextToTranslate('x => x * 2')).toBe(false);
        expect(isValidTextToTranslate('a && b')).toBe(false);
        expect(isValidTextToTranslate('x === y')).toBe(false);
        expect(isValidTextToTranslate('x += 1')).toBe(false);
    });

    test('should allow command-line flags without rejecting postfix decrement operators', () => {
        expect(isValidTextToTranslate('Use --help for the complete command reference or provide explicit options in automation. The wizard never writes files until you review and confirm its installation plan.')).toBe(true);
        expect(isValidTextToTranslate('Use the flag (--help) or [--verbose] for options.')).toBe(true);
        expect(isValidTextToTranslate('Use --output=json to choose the destination.')).toBe(true);
        expect(isValidTextToTranslate('Run with --help, --verbose, or --quiet.')).toBe(true);
        expect(isValidTextToTranslate('count--;')).toBe(false);
        expect(isValidTextToTranslate('count-- > 0')).toBe(false);
    });

    test('should reject code keywords', () => {
        expect(isValidTextToTranslate('const x = 5;')).toBe(false);
        expect(isValidTextToTranslate('let greeting = "hello";')).toBe(false);
        expect(isValidTextToTranslate('function test() {}')).toBe(false);
        expect(isValidTextToTranslate('import React from "react";')).toBe(false);
    });

    test('should reject function calls', () => {
        expect(isValidTextToTranslate('console.log("test")')).toBe(false);
        expect(isValidTextToTranslate('foo()')).toBe(false);
    });

    test('should reject single variable names (camelCase and snake_case) and uppercase constants', () => {
        expect(isValidTextToTranslate('user_profile_id')).toBe(false);
        expect(isValidTextToTranslate('myAwesomeVariable')).toBe(false);
        expect(isValidTextToTranslate('CREATED')).toBe(false);
        expect(isValidTextToTranslate('STATUS_OK')).toBe(false);
        expect(isValidTextToTranslate('"current_state"')).toBe(false);
        expect(isValidTextToTranslate('"CREATED"')).toBe(false);
        expect(isValidTextToTranslate("'CREATED'")).toBe(false);
    });

    test('should reject JSON property/key-value lines', () => {
        expect(isValidTextToTranslate('"current_state": "CREATED",')).toBe(false);
        expect(isValidTextToTranslate('"status": 200')).toBe(false);
        expect(isValidTextToTranslate('"msg": "success"')).toBe(false);
        expect(isValidTextToTranslate('message: "error",')).toBe(false);
    });

    test('should reject file paths and URL paths (including quoted)', () => {
        expect(isValidTextToTranslate('/api/v1/users')).toBe(false);
        expect(isValidTextToTranslate('src/components/Button.js')).toBe(false);
        expect(isValidTextToTranslate('"src/components/Button.js"')).toBe(false);
        expect(isValidTextToTranslate('./styles/theme.css')).toBe(false);
    });
});
