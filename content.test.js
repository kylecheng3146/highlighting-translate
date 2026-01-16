global.chrome = {
    storage: {
        sync: {
            get: jest.fn().mockImplementation((defaults) => Promise.resolve(defaults)),
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
        
        const rect = { left: 100, top: 150, bottom: 200, width: 50, height: 50 };
        showTranslatePopup('test', rect);

        expect(popup.classList.contains('ht-show')).toBe(true); 
        expect(popup.style.display).toBe('block');
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

    test('should call playTTS and initialize Audio with correct URL', () => {
        const mockPlay = jest.fn().mockResolvedValue(undefined);
        global.Audio = jest.fn().mockImplementation(() => ({
            play: mockPlay
        }));

        const { playTTS } = require('./content.js');
        playTTS('hello', 'en');

        expect(global.Audio).toHaveBeenCalledWith(expect.stringContaining('q=hello'));
        expect(global.Audio).toHaveBeenCalledWith(expect.stringContaining('tl=en'));
        expect(mockPlay).toHaveBeenCalled();
    });

    test('should add play button to popup and trigger playTTS on click', async () => {
        const host = createTranslatePopup();
        const popup = host.shadowRoot.getElementById('translate-popup');
        
        // Mock getTranslation to resolve immediately
        // Note: We can't easily mock internal getTranslation call without rewiring, 
        // so we rely on the mocked fetch in beforeEach.
        // But we need to make sure getTranslation returns 'Translated Text' if we want to check args.
        // Since we mocked fetch to return [[['translated']]], the text will be 'translated'.

        // Mock settings
        global.chrome.storage.sync.get.mockResolvedValue({
            sourceLang: 'auto', 
            targetLang: 'en',
            autoPlaySpeech: false
        });

        // Mock Audio
        const mockPlay = jest.fn().mockResolvedValue(undefined);
        global.Audio = jest.fn().mockImplementation(() => ({
            play: mockPlay
        }));

        // Show popup
        showTranslatePopup('Original Text', { left: 0, top: 0, bottom: 0, width: 0, height: 0 });

        // Wait for async operations
        await new Promise(resolve => setTimeout(resolve, 0));

        const playBtn = popup.querySelector('.ht-play-btn');
        expect(playBtn).not.toBeNull();
        
        // Simulate click
        playBtn.click();
        
        expect(global.Audio).toHaveBeenCalledWith(expect.stringContaining('q=translated'));
        expect(global.Audio).toHaveBeenCalledWith(expect.stringContaining('tl=zh-TW'));
        expect(mockPlay).toHaveBeenCalled();
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

        // Mock Audio
        const mockPlay = jest.fn().mockResolvedValue(undefined);
        global.Audio = jest.fn().mockImplementation(() => ({
            play: mockPlay
        }));

        // Show popup
        content.showTranslatePopup('Original Text', { left: 0, top: 0, bottom: 0, width: 0, height: 0 });

        // Wait for async operations
        await new Promise(resolve => setTimeout(resolve, 0));
        
        expect(global.Audio).toHaveBeenCalledWith(expect.stringContaining('q=translated'));
        expect(global.Audio).toHaveBeenCalledWith(expect.stringContaining('tl=ja'));
        expect(mockPlay).toHaveBeenCalled();
    });
});
