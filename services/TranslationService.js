class TranslationService {
    constructor() {
        this.apiBaseUrl = 'https://translate.googleapis.com/translate_a/single';
    }

    /**
     * Detects the language of the given text.
     * @param {string} text - The text to detect language for.
     * @returns {string} - The detected language code (e.g., 'en', 'zh-TW', 'ja', 'auto').
     */
    detectLanguage(text) {
        // Regex definitions moved to module scope or constants to avoid recreation
        
        // Check for specific scripts first to avoid misidentifying Kanji as Chinese
        if (TranslationService.RX_JAPANESE.test(text)) return 'ja';
        if (TranslationService.RX_KOREAN.test(text)) return 'ko';
        if (TranslationService.RX_VIETNAMESE.test(text)) return 'vi';
        if (TranslationService.RX_GERMAN.test(text)) return 'de';

        const chineseCount = (text.match(TranslationService.RX_CHINESE) || []).length;
        const traditionalCount = (text.match(TranslationService.RX_TRADITIONAL) || []).length;
        const simplifiedCount = (text.match(TranslationService.RX_SIMPLIFIED) || []).length;

        if (chineseCount > 0) {
            if (traditionalCount > 0) return 'zh-TW';
            if (simplifiedCount > 0) return 'zh-CN';
            // Default to Traditional for ambiguous cases in this app context
            return 'zh-TW';
        }

        if (TranslationService.RX_ENGLISH.test(text)) return 'en';

        return 'auto';
    }

    /**
     * Translates the given text.
     * @param {string} text - The text to translate.
     * @param {string} sourceLang - The source language code.
     * @param {string} targetLang - The target language code.
     * @returns {Promise<string>} - The translated text.
     */
    async translate(text, sourceLang = 'auto', targetLang = 'zh-TW') {
        try {
            if (!text || !text.trim()) {
                throw new Error('Text to translate is empty');
            }

            // If source language is auto, try to detect it first for better accuracy
            // or just let Google handle 'auto'
            let finalSourceLang = sourceLang;
            if (sourceLang === 'auto') {
                const detected = this.detectLanguage(text);
                finalSourceLang = detected === 'auto' ? 'auto' : detected;
            }

            const url = `${this.apiBaseUrl}?client=gtx&sl=${finalSourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Translation API failed with status ${response.status}`);
            }

            const data = await response.json();

            if (data && data[0] && data[0][0] && data[0][0][0]) {
                const translation = data[0][0][0];
                const detectedSourceLang = data[2] || sourceLang; // specific to 'gtx' client response format
                return { translation, detectedSourceLang };
            }
            throw new Error('Invalid response format');

        } catch (error) {
            console.error('TranslationService error:', error);
            throw error;
        }
    }

    /**
     * Determines if translation is needed based on source and target languages.
     * @param {string} text 
     * @param {string} sourceLang 
     * @param {string} targetLang 
     * @returns {boolean}
     */
    shouldTranslate(text, sourceLang, targetLang) {
        if (sourceLang === 'auto') {
            sourceLang = this.detectLanguage(text);
        }

        if (sourceLang === targetLang) {
            return false;
        }

        // Special case: Auto-detect -> zh-TW but text is mostly Chinese
        if (sourceLang === 'zh-TW' && targetLang === 'zh-TW') {
             return false;
        }

        // More robust check for the "Special case" in original code
        if (targetLang === 'zh-TW') {
             const detected = this.detectLanguage(text);
             if (detected === 'zh-TW') return false;
        }
        
        return true;
    }

    // Static Regex Definitions
    static RX_JAPANESE = /[\u3040-\u309f\u30a0-\u30ff]/g;
    static RX_KOREAN = /[\uac00-\ud7af]/g;
    static RX_GERMAN = /[äöüßÄÖÜ]/;
    static RX_VIETNAMESE = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/;
    static RX_ENGLISH = /[a-zA-Z]/g;
    static RX_CHINESE = /[\u4e00-\u9fff]/g;
    static RX_TRADITIONAL = /[豐併佈閒與會過於陣險離復讓貓體發這測]/g;
    static RX_SIMPLIFIED = /[丰并布闲与会过于阵险离复让猫体发这测]/g;
}

// Make it available globally
// Make it available globally
if (typeof window !== 'undefined') {
    window.TranslationService = TranslationService;
} else if (typeof self !== 'undefined') {
    self.TranslationService = TranslationService;
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TranslationService;
}
