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
    beforeEach(() => {
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
