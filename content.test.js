global.chrome = {
    storage: {
        sync: {
            get: jest.fn().mockResolvedValue({}),
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
    });

    test('should create popup with correct class names', () => {
        const popup = createTranslatePopup();
        
        expect(popup.classList.contains('ht-popup')).toBe(true);
        expect(popup.id).toBe('translate-popup'); // Keep the ID for backward compatibility if needed, or we can remove it. Let's keep it for now but check class.
        
        const closeBtn = popup.querySelector('.ht-close-btn');
        expect(closeBtn).not.toBeNull();
        expect(closeBtn.innerHTML).toBe('×');
    });

    test('should not have inline styles for layout', () => {
        const popup = createTranslatePopup();
        // We expect styles to be handled by CSS classes, so inline cssText should not contain the bulk of styles
        // But the current implementation sets cssText.
        // New implementation should ideally use classes. 
        // We can check if specific styles are ABSENT from inline styles
        expect(popup.style.position).toBe(''); 
        expect(popup.style.background).toBe('');
    });
});
