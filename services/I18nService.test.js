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
});
