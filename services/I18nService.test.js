const I18nService = require('./I18nService');

describe('I18nService', () => {
    let i18nService;
    let originalNavigator;
    let originalChrome;

    beforeEach(() => {
        i18nService = new I18nService();
        originalNavigator = global.navigator;
        originalChrome = global.chrome;
        
        // Mock global objects
        global.navigator = { language: 'en-US' };
        global.chrome = {
            i18n: {
                getUILanguage: jest.fn()
            }
        };
    });

    afterEach(() => {
        global.navigator = originalNavigator;
        global.chrome = originalChrome;
    });

    test('should return English text by default', () => {
        global.chrome.i18n.getUILanguage.mockReturnValue('en-US');
        expect(i18nService.getText('settingsTitle')).toBe('Highlighting Translate Settings');
    });

    test('should return German text when language is de', () => {
        global.chrome.i18n.getUILanguage.mockReturnValue('de');
        expect(i18nService.getText('settingsTitle')).toBe('Übersetzungseinstellungen');
    });

    test('should return Vietnamese text when language is vi', () => {
        global.chrome.i18n.getUILanguage.mockReturnValue('vi');
        expect(i18nService.getText('settingsTitle')).toBe('Cài đặt Dịch');
    });

    test('should fallback to English if key not found', () => {
        global.chrome.i18n.getUILanguage.mockReturnValue('en-US');
        expect(i18nService.getText('nonExistentKey')).toBe('nonExistentKey');
    });

    test('should interpolate dynamic dashboard text', () => {
        global.chrome.i18n.getUILanguage.mockReturnValue('en-US');
        expect(i18nService.getText('dashboardAverageDailyDescription', {
            average: 2.5,
            days: 4
        })).toBe('Average of 2.5 words on active days (4 active days).');
    });

    test('should localize page metadata and translated attributes', () => {
        global.chrome.i18n.getUILanguage.mockReturnValue('ar-EG');
        document.body.innerHTML = '<button data-i18n-title="backBtnTitle">placeholder</button>';

        i18nService.localizePage();

        expect(document.documentElement.lang).toBe('ar-EG');
        expect(document.documentElement.dir).toBe('rtl');
        expect(document.querySelector('button').title).toBe('رجوع');
    });

    describe('locale metadata helpers', () => {
        test('reads metadata and RTL flag from injected locale', () => {
            i18nService.locales['mock-rtl'] = {
                label: 'Mock RTL',
                direction: 'rtl',
                strings: { settingsTitle: 'Mock' }
            };
            jest.spyOn(i18nService, 'getLanguage').mockReturnValue('mock-rtl');

            const locale = i18nService.getActiveLocale();
            expect(locale.code).toBe('mock-rtl');
            expect(locale.direction).toBe('rtl');
            expect(i18nService.isRTL()).toBe(true);
        });
    });

    describe('formatMilestone', () => {
        test('formats starter level (77/100) in English', () => {
            global.chrome.i18n.getUILanguage.mockReturnValue('en-US');
            const milestone = {
                currentMilestone: null,
                nextMilestone: { id: 'beginner', threshold: 100 },
                currentWords: 77,
                targetWords: 100,
                percentage: 77,
                isMax: false
            };
            expect(i18nService.formatMilestone(milestone, 77)).toBe('🌱 Beginner (77/100)');
        });

        test('formats starter level (77/100) in Traditional Chinese', () => {
            global.chrome.i18n.getUILanguage.mockReturnValue('zh-TW');
            const milestone = {
                currentMilestone: null,
                nextMilestone: { id: 'beginner', threshold: 100 },
                currentWords: 77,
                targetWords: 100,
                percentage: 77,
                isMax: false
            };
            expect(i18nService.formatMilestone(milestone, 77)).toBe('🌱 起步者 (77/100)');
        });

        test('formats starter level (77/100) in Japanese', () => {
            global.chrome.i18n.getUILanguage.mockReturnValue('ja');
            const milestone = {
                currentMilestone: null,
                nextMilestone: { id: 'beginner', threshold: 100 },
                currentWords: 77,
                targetWords: 100,
                percentage: 77,
                isMax: false
            };
            expect(i18nService.formatMilestone(milestone, 77)).toBe('🌱 初心者 (77/100)');
        });

        test('formats intermediate level (750/1000) in German', () => {
            global.chrome.i18n.getUILanguage.mockReturnValue('de');
            const milestone = {
                currentMilestone: { id: 'intermediate', threshold: 500, icon: '🌿' },
                nextMilestone: { id: 'advanced', threshold: 1000 },
                currentWords: 750,
                targetWords: 1000,
                percentage: 75,
                isMax: false
            };
            expect(i18nService.formatMilestone(milestone, 750)).toBe('🌿 Fortgeschritten (750/1000)');
        });

        test('formats max level (5200 words) in English and Traditional Chinese', () => {
            const milestone = {
                currentMilestone: { id: 'master', threshold: 5000, icon: '🏆' },
                nextMilestone: null,
                currentWords: 5200,
                targetWords: 5000,
                percentage: 100,
                isMax: true
            };

            global.chrome.i18n.getUILanguage.mockReturnValue('en-US');
            expect(i18nService.formatMilestone(milestone, 5200)).toBe('🏆 Master (5200 words)');

            global.chrome.i18n.getUILanguage.mockReturnValue('zh-TW');
            expect(i18nService.formatMilestone(milestone, 5200)).toBe('🏆 大師 (5200 詞)');
        });

        test('provides fallback formatting when called with empty or undefined arguments', () => {
            global.chrome.i18n.getUILanguage.mockReturnValue('en-US');
            expect(i18nService.formatMilestone()).toBe('🌱 Beginner (0/100)');
        });
    });
});
