const TranslationService = require('./TranslationService');

describe('TranslationService', () => {
    let service;

    beforeEach(() => {
        service = new TranslationService();
        // Mock window.TranslationService because the file assigns it
        global.window = { TranslationService: TranslationService };
        // Mock fetch
        global.fetch = jest.fn();
    });

    describe('detectLanguage', () => {
        test('should detect Traditional Chinese', () => {
            expect(service.detectLanguage('繁體中文')).toBe('zh-TW');
            expect(service.detectLanguage('這是一個測試')).toBe('zh-TW');
        });

        test('should detect Simplified Chinese', () => {
            expect(service.detectLanguage('简体中文')).toBe('zh-CN');
            expect(service.detectLanguage('这是一个测试')).toBe('zh-CN');
        });

        test('should detect Japanese', () => {
            expect(service.detectLanguage('日本語のテスト')).toBe('ja');
            expect(service.detectLanguage('あいうえお')).toBe('ja');
        });

        test('should detect English', () => {
            expect(service.detectLanguage('English text')).toBe('en');
            expect(service.detectLanguage('Hello World')).toBe('en');
        });

        test('should return auto for unknown characters', () => {
            expect(service.detectLanguage('123456')).toBe('auto');
            expect(service.detectLanguage('!!!')).toBe('auto');
        });
    });

    describe('shouldTranslate', () => {
        test('should return false if source and target are same', () => {
            expect(service.shouldTranslate('hello', 'en', 'en')).toBe(false);
            expect(service.shouldTranslate('你好', 'zh-TW', 'zh-TW')).toBe(false);
        });

        test('should return true if source and target are different', () => {
            expect(service.shouldTranslate('hello', 'en', 'zh-TW')).toBe(true);
        });

        test('should detect language when source is auto', () => {
            expect(service.shouldTranslate('hello', 'auto', 'en')).toBe(false);
            expect(service.shouldTranslate('你好', 'auto', 'zh-TW')).toBe(false);
            expect(service.shouldTranslate('hello', 'auto', 'zh-TW')).toBe(true);
        });

        test('should not translate if text is mostly target language (ZH-TW case)', () => {
            // Even if auto-detect says ZH-TW, if target is ZH-TW it should be false
            expect(service.shouldTranslate('這是一段繁體中文', 'auto', 'zh-TW')).toBe(false);
        });
    });

    describe('translate', () => {
        test('should call Google Translate API with correct parameters', async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve([[['translated text', 'original text']]])
            });

            const result = await service.translate('original text', 'en', 'zh-TW');
            
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('sl=en&tl=zh-TW&dt=t&q=original%20text')
            );
            expect(result).toBe('translated text');
        });

        test('should handle auto source language by detecting it', async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve([[['translated text']]])
            });

            await service.translate('hello', 'auto', 'zh-TW');
            
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('sl=en')
            );
        });

        test('should throw error on API failure', async () => {
            global.fetch.mockResolvedValue({
                ok: false,
                status: 500
            });

            await expect(service.translate('test')).rejects.toThrow('Translation API failed');
        });

        test('should throw error on invalid response format', async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({})
            });

            await expect(service.translate('test')).rejects.toThrow('Invalid response format');
        });

        test('should throw error if text is empty', async () => {
            await expect(service.translate('  ')).rejects.toThrow('Text to translate is empty');
        });
    });
});
