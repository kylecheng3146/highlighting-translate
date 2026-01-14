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
const { createTranslatePopup } = content;

describe('createTranslatePopup', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        global.innerWidth = 1024;
        global.innerHeight = 768;
        global.scrollX = 0;
        global.scrollY = 0;
    });

    test('should create popup with correct class names', () => {
        const popup = createTranslatePopup();
        
        expect(popup.classList.contains('ht-popup')).toBe(true);
        expect(popup.id).toBe('translate-popup');
        
        const closeBtn = popup.querySelector('.ht-close-btn');
        expect(closeBtn).not.toBeNull();
        expect(closeBtn.innerHTML).toBe('×');
    });

    test('should add visible class when showing popup', () => {
        const popup = createTranslatePopup();
        const { showTranslatePopup } = content;
        
        const rect = { left: 100, top: 150, bottom: 200, width: 50, height: 50 };
        showTranslatePopup('test', rect);

        expect(popup.classList.contains('ht-show')).toBe(true); 
    });

    test('should adjust position when close to right edge', () => {
        const popup = createTranslatePopup();
        const { showTranslatePopup } = content;
        
        global.innerWidth = 1000;
        const rect = { left: 900, top: 150, bottom: 200, width: 50, height: 50 };
        
        showTranslatePopup('test', rect);
        
        const left = parseInt(popup.style.left);
        expect(left + 350).toBeLessThanOrEqual(1000);
    });

    test('should show above selection if bottom edge is reached', () => {
        const popup = createTranslatePopup();
        const { showTranslatePopup } = content;
        
        global.innerHeight = 300;
        // Selection bottom at 250, popup height 150 -> total 400 > 300
        const rect = { left: 100, top: 200, bottom: 250, width: 50, height: 50 };
        
        showTranslatePopup('test', rect);
        
        const top = parseInt(popup.style.top);
        // rect.top (200) - popupHeight (150) - 5 = 45
        expect(top).toBeLessThan(200); 
        expect(top).toBe(45);
    });
});