class TranslationService {
    constructor(options = {}) {
        this.apiBaseUrl = 'https://translate.googleapis.com/translate_a/single';
        this.maxCacheSize = Number(options.maxCacheSize || 200);
        this.cacheTtlMs = Number(options.cacheTtlMs || 3600000);
        this.maxRetries = Number(options.maxRetries ?? 2);
        this.retryBaseDelayMs = Number(options.retryBaseDelayMs ?? 200);
        this._cache = new Map();
        this._inflight = new Map();
    }

    _cacheKey(text, sourceLang, targetLang) {
        return `${sourceLang}|${targetLang}|${String(text).trim()}`;
    }

    _getCached(key) {
        const entry = this._cache.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) {
            this._cache.delete(key);
            return null;
        }
        this._cache.delete(key);
        this._cache.set(key, entry);
        return entry.value;
    }

    _setCached(key, value) {
        if (this._cache.has(key)) this._cache.delete(key);
        this._cache.set(key, { value, expiresAt: Date.now() + this.cacheTtlMs });
        while (this._cache.size > this.maxCacheSize) {
            const oldestKey = this._cache.keys().next().value;
            this._cache.delete(oldestKey);
        }
    }

    clearCache() {
        this._cache.clear();
        this._inflight.clear();
    }

    _sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    _isRetryableStatus(status) {
        return status === 429 || (status >= 500 && status <= 599);
    }

    /**
     * Detects the language of the given text.
     * @param {string} text - The text to detect language for.
     * @returns {string} - The detected language code (e.g., 'en', 'es', 'zh-TW', 'ja', 'auto').
     */
    detectLanguage(text) {
        // Regex definitions moved to module scope or constants to avoid recreation
        
        // Check for specific scripts first to avoid misidentifying Kanji as Chinese
        if (TranslationService.RX_JAPANESE.test(text)) return 'ja';
        if (TranslationService.RX_KOREAN.test(text)) return 'ko';

        if (TranslationService.RX_SPANISH_UNIQUE.test(text)) return 'es';

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
     * @param {Object} [options] - Optional settings (e.g. timeoutMs)
     * @returns {Promise<{translation: string, detectedSourceLang: string}>} - The translated text.
     */
    async translate(text, sourceLang = 'auto', targetLang = 'zh-TW', options = {}) {
        const timeoutMs = options.timeoutMs || 8000;
        const maxRetries = Number(options.maxRetries ?? this.maxRetries);
        const retryDelayMs = Number(options.retryDelayMs ?? this.retryBaseDelayMs);

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

            const key = this._cacheKey(text, finalSourceLang, targetLang);
            const cached = this._getCached(key);
            if (cached) return cached;

            if (this._inflight.has(key)) {
                return this._inflight.get(key);
            }

            const task = this._fetchWithRetry(text, finalSourceLang, targetLang, {
                timeoutMs,
                maxRetries,
                retryDelayMs
            }).then((result) => {
                this._setCached(key, result);
                return result;
            }).finally(() => {
                this._inflight.delete(key);
            });

            this._inflight.set(key, task);
            return await task;

        } catch (error) {
            console.error('TranslationService error:', error);
            throw error;
        }
    }

    async _fetchWithRetry(text, finalSourceLang, targetLang, { timeoutMs, maxRetries, retryDelayMs }) {
        const url = `${this.apiBaseUrl}?client=gtx&sl=${finalSourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        let lastError = null;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            let timeoutId = null;
            try {
                const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
                const signal = controller ? controller.signal : undefined;
                if (controller) {
                    timeoutId = setTimeout(() => controller.abort(), timeoutMs);
                }

                let response;
                try {
                    response = await fetch(url, signal ? { signal } : undefined);
                } catch (fetchError) {
                    if (fetchError && fetchError.name === 'AbortError') {
                        throw new Error('翻譯請求逾時，請稍後再試 (Translation request timed out)');
                    }
                    throw fetchError;
                } finally {
                    if (timeoutId) clearTimeout(timeoutId);
                }

                if (!response.ok) {
                    if (response.status === 429) {
                        lastError = new Error('翻譯請求過於頻繁 (429 Too Many Requests)，請稍後再試');
                    } else {
                        lastError = new Error(`Translation API failed with status ${response.status}`);
                    }
                    if (this._isRetryableStatus(response.status) && attempt < maxRetries) {
                        await this._sleep(retryDelayMs * Math.pow(2, attempt));
                        continue;
                    }
                    throw lastError;
                }

                const data = await response.json();

                if (data && Array.isArray(data[0])) {
                    const segments = data[0]
                        .map(segment => (Array.isArray(segment) && typeof segment[0] === 'string' ? segment[0] : ''))
                        .filter(Boolean);

                    if (segments.length > 0) {
                        const translation = segments.join('');
                        const detectedSourceLang = data[2] || finalSourceLang; // specific to 'gtx' client response format
                        return { translation, detectedSourceLang };
                    }
                }
                throw new Error('Invalid response format');

            } catch (error) {
                lastError = error;
                const retryableNetwork = error && error.message && /network|fetch|Failed to fetch|Load failed/i.test(error.message);
                const retryableTimeout = error && /逾時|timed out/i.test(error.message);
                if ((retryableNetwork || retryableTimeout) && attempt < maxRetries) {
                    await this._sleep(retryDelayMs * Math.pow(2, attempt));
                    continue;
                }
                if (error && /Invalid response format|empty/i.test(error.message)) {
                    throw error;
                }
                if (lastError && attempt >= maxRetries) throw lastError;
                throw error;
            }
        }
        throw lastError;
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
    static RX_JAPANESE = /[\u3040-\u309f\u30a0-\u30ff]/;
    static RX_KOREAN = /[\uac00-\ud7af]/;
    static RX_SPANISH_UNIQUE = /[¿¡ñ]|(?<![\p{L}])(?:hola|gracias|ad[ií]os|espa[nñ]ol|pel[ií]cula|incre[ií]ble|pued(?:o|es|e|en)|quier(?:o|es|e|en)|necesit(?:o|as?|a|amos|an)|teng(?:o|as?|a|amos|an)|ma[nñ]ana|tamb[ií]en|se[nñ]or(?:a|ita)?|d[oó]nde|c[oó]mo|cu[aá]ndo|est[aá](?:s|n)?|buen(?:os|as)|d[ií]as|gusta|idioma|por\s+favor|de\s+nada|qu[eé]\s+tal|no\s+entiendo|[\p{L}]+ción(?:es)?)(?![\p{L}])/iu;
    static RX_GERMAN = /[äöüßÄÖÜ]/;
    static RX_VIETNAMESE = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/;
    static RX_ENGLISH = /[a-zA-Z]/;
    static RX_CHINESE = /[\u4e00-\u9fff]/g;
    static RX_TRADITIONAL = /[豐併佈閒與會過於陣險離復讓貓體發這測]/g;
    static RX_SIMPLIFIED = /[丰并布闲与会过于阵险离复让猫体发这测]/g;
}

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
