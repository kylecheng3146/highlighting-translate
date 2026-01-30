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
        }
    }
};

const TranslationService = require('./services/TranslationService');
global.TranslationService = TranslationService;
const StorageService = require('./services/StorageService');
global.StorageService = StorageService;
const HighlightService = require('./services/HighlightService');
global.HighlightService = HighlightService;

const content = require('./content.js');
const { createTranslatePopup, showTranslatePopup } = content;

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
                }
            }
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

    test('should call playTTS and send message to background', () => {
        const sendMessageMock = jest.fn().mockResolvedValue({success: true});
        global.chrome.runtime.sendMessage = sendMessageMock;

        // Note: playTTS is internal but we can trigger it via exposed method if we want, 
        // or just rely on the fact that we are testing the function logic.
        // Since playTTS is exported for testing, we can call it directly.
        content.playTTS('hello', 'en');

        expect(sendMessageMock).toHaveBeenCalledWith({
            action: 'playTTS',
            text: 'hello',
            lang: 'en'
        });
    });

    test('should add play button to popup and trigger playTTS on click', async () => {
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

        const sendMessageMock = jest.fn().mockResolvedValue({success: true});
        global.chrome.runtime.sendMessage = sendMessageMock;

        // Show popup
        content.showTranslatePopup('你好', { left: 0, top: 0, bottom: 0, width: 0, height: 0 });

        // Wait for async operations
        await new Promise(resolve => setTimeout(resolve, 0));

        const playBtn = host.shadowRoot.getElementById('floating-play-btn');
        expect(playBtn).not.toBeNull();
        
        // Simulate click
        playBtn.click();
        
        expect(sendMessageMock).toHaveBeenCalledWith({
            action: 'playTTS',
            text: '你好', // Source text
            lang: 'zh-TW' // Detected from '你好'
        });
    });

    test('should auto play TTS if autoPlaySpeech setting is true', async () => {
        const host = content.createTranslatePopup();
        
        // Update settings using exposed helper
        content.updateLocalSettings({
            sourceLang: 'auto', 
            targetLang: 'ja',
            autoPlaySpeech: true,
            autoTranslate: true
        });

        const sendMessageMock = jest.fn().mockResolvedValue({success: true});
        global.chrome.runtime.sendMessage = sendMessageMock;

        // Show popup
        content.showTranslatePopup('Original Text', { left: 0, top: 0, bottom: 0, width: 0, height: 0 });

        // Wait for async operations
        await new Promise(resolve => setTimeout(resolve, 0));
        
        expect(sendMessageMock).toHaveBeenCalledWith({
            action: 'playTTS',
            text: 'Original Text', // Source text
            lang: 'en' // Detected from 'Original Text'
        });
    });
});
