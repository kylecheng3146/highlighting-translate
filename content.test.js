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
    });

    test('should create popup with correct class names', () => {
        const popup = createTranslatePopup();
        
        expect(popup.classList.contains('ht-popup')).toBe(true);
        expect(popup.id).toBe('translate-popup'); // Keep the ID for backward compatibility if needed, or we can remove it. Let's keep it for now but check class.
        
        const closeBtn = popup.querySelector('.ht-close-btn');
        expect(closeBtn).not.toBeNull();
        expect(closeBtn.innerHTML).toBe('×');
    });

    test('should add visible class when showing popup', () => {
        const popup = createTranslatePopup();
        
        // Mock getBoundingClientRect
        document.getSelection = jest.fn().mockReturnValue({
            toString: () => 'test',
            getRangeAt: () => ({
                getBoundingClientRect: () => ({ left: 100, bottom: 200 })
            })
        });

        // We need to call showTranslatePopup. 
        // Note: showTranslatePopup might need to accept the popup element or we rely on getElementById
        // The current implementation calls createTranslatePopup internally if not found.
        
        // Mock getTranslation to return immediately
        global.fetch = jest.fn().mockResolvedValue({
            json: () => Promise.resolve([[['translated']]])
        });

        const { showTranslatePopup } = content;
        showTranslatePopup('test', 100, 200);

        // Expect the class to be added (after a small delay if we implement it that way for transition)
        // For now, let's assume we toggle a class.
        // Wait for async operations?
        expect(popup.classList.contains('ht-show')).toBe(true); 
    });
});
