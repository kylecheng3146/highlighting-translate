const fs = require('fs');
const path = require('path');

jest.mock('./services/I18nService.js', () => {
    return jest.fn().mockImplementation(() => ({
        localizePage: jest.fn(),
        getText: (key) => key,
        formatMilestone: jest.fn((milestone = {}, totalWords = 0) => {
            const count = (milestone && milestone.currentWords !== undefined) ? milestone.currentWords : totalWords;
            const target = (milestone && milestone.targetWords !== undefined) ? milestone.targetWords : 100;
            return `🌱 Beginner (${count}/${target})`;
        }),
        getLocaleMetadata: () => ({
            auto: { label: 'Auto Detect' },
            en: { label: 'English' },
            ja: { label: '日本語' },
            'ar-EG': { label: 'العربية المصرية', direction: 'rtl' }
        })
    }));
});

global.I18nService = require('./services/I18nService.js');


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
    },
    runtime: {
        sendMessage: jest.fn().mockResolvedValue({ success: false })
    },
    tts: {
        getVoices: jest.fn().mockImplementation((cb) => cb([]))
    }
}; 

global.ThemeService = class MockThemeService {
    constructor() {
        this.presets = [];
    }
    loadAndApply() {
        return Promise.resolve('#ffffff');
    }
    applyTheme() {}
    saveTheme() {}
};

// Simple DOM mock helper
function setupDOM() {
    const html = fs.readFileSync(path.resolve(__dirname, './popup.html'), 'utf8');
    document.body.innerHTML = html;
    jest.resetModules();
    jest.isolateModules(() => {
        require('./popup.js');
    });
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

        // Wait for async saveSettings
        await new Promise(resolve => setTimeout(resolve, 50));

        expect(chrome.storage.sync.set).toHaveBeenCalled();
    });

    test('should handle autoPlaySpeech toggle', async () => {
        chrome.storage.sync.get.mockResolvedValue({
            autoTranslate: true,
            sourceLang: 'auto',
            targetLang: 'zh-TW',
            delay: 500,
            autoPlaySpeech: false,
            enableHighlighting: true,
            domainBlacklist: []
        });
        setupDOM();
        await new Promise(resolve => setTimeout(resolve, 50));

        const checkbox = document.getElementById('autoPlaySpeechCheck');
        expect(checkbox).not.toBeNull();
        expect(checkbox.checked).toBe(false);

        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change'));

        // Wait for async saveSettings
        await new Promise(resolve => setTimeout(resolve, 50));

        expect(chrome.storage.sync.set).toHaveBeenCalledWith(expect.objectContaining({
            autoPlaySpeech: true
        }));
    });

    test('should render locale options from metadata', async () => {
        setupDOM();
        await new Promise(resolve => setTimeout(resolve, 50));

        const targetOptions = Array.from(document.querySelectorAll('#targetLang option'));
        const sourceOptions = Array.from(document.querySelectorAll('#sourceLang option'));

        const hasArabicTarget = targetOptions.some(opt => opt.value === 'ar-EG' && opt.textContent.includes('العربية'));
        const hasArabicSource = sourceOptions.some(opt => opt.value === 'ar-EG');

        expect(hasArabicTarget).toBe(true);
        expect(hasArabicSource).toBe(true);
    });

    test('should annotate locale options with direction metadata', async () => {
        setupDOM();
        await new Promise(resolve => setTimeout(resolve, 50));

        const targetArabicOption = document.querySelector('#targetLang option[value="ar-EG"]');
        expect(targetArabicOption).not.toBeNull();
        expect(targetArabicOption.dataset.direction).toBe('rtl');
    });

    test('should format and localize milestone title initially and after stats load', async () => {
        chrome.runtime.sendMessage.mockImplementation(async (msg) => {
            if (msg.action === 'GET_STATS') {
                return {
                    success: true,
                    data: {
                        streak: 5,
                        totalWords: 77,
                        monthlyNew: 12,
                        thisWeekMinutes: 20,
                        milestone: {
                            currentMilestone: null,
                            nextMilestone: { id: 'beginner', threshold: 100 },
                            currentWords: 77,
                            targetWords: 100,
                            percentage: 77,
                            isMax: false,
                            displayText: '🌱 起步者 (77/100)'
                        }
                    }
                };
            }
            return { success: false };
        });

        setupDOM();
        await new Promise(resolve => setTimeout(resolve, 50));

        const milestoneTitleEl = document.getElementById('milestoneTitle');
        const milestonePercentEl = document.getElementById('milestonePercent');

        expect(milestoneTitleEl).not.toBeNull();
        expect(milestoneTitleEl.textContent).toBe('🌱 Beginner (77/100)');
        expect(milestonePercentEl.textContent).toBe('77%');
    });
});
