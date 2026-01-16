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

describe('content.js Shadow DOM', () => {
    beforeEach(() => {
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
});
