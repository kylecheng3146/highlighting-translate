const fs = require('fs');
const path = require('path');

// Mock chrome API
global.chrome = {
    storage: {
        sync: {
            get: jest.fn(),
            set: jest.fn(),
        }
    },
    tabs: {
        query: jest.fn(),
        sendMessage: jest.fn(),
    }
};

// Simple DOM mock helper
function setupDOM() {
    const html = fs.readFileSync(path.resolve(__dirname, './popup.html'), 'utf8');
    document.body.innerHTML = html;
    jest.resetModules();
    require('./popup.js');
    // Manually trigger DOMContentLoaded since we are in JSDOM and might have missed it
    document.dispatchEvent(new Event('DOMContentLoaded'));
}

describe('popup.js', () => {
    beforeEach(() => {
        chrome.storage.sync.get.mockResolvedValue({
            autoTranslate: true,
            sourceLang: 'auto',
            targetLang: 'zh-TW',
            delay: 500
        });
        setupDOM();
    });

    test('should load settings from storage on init', async () => {
        const mockSettings = {
            autoTranslate: true,
            sourceLang: 'en',
            targetLang: 'ja',
            delay: 1000
        };
        // Reset and re-setup with specific mock
        chrome.storage.sync.get.mockResolvedValue(mockSettings);
        setupDOM();

        // Wait for async loadSettings
        await new Promise(resolve => setTimeout(resolve, 50));

        expect(document.getElementById('sourceLang').value).toBe('en');
        expect(document.getElementById('targetLang').value).toBe('ja');
        expect(document.getElementById('delay').value).toBe('1000');
        expect(document.getElementById('autoTranslateCheck').checked).toBe(true);
    });

    test('should save settings when checkbox is changed', async () => {
        const checkbox = document.getElementById('autoTranslateCheck');
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change'));

        expect(chrome.storage.sync.set).toHaveBeenCalled();
    });
});
