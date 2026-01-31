/**
 * Service to handle data persistence using chrome.storage.local.
 */
class StorageService {
    constructor() {
        this.STORAGE_KEY = 'savedTranslations';
        // Check if we are in the Service Worker context
        this.isBackground = (typeof self !== 'undefined' && self.ServiceWorkerGlobalScope === true) || StorageService.forceBackgroundMode;
        this.cache = null; // In-memory cache for Host mode
    }

    /**
     * Helper to send messages if not in background
     */
    async _request(action, data) {
        if (this.isBackground) {
            throw new Error('Internal Error: _request called in background context');
        }
        const response = await chrome.runtime.sendMessage({ action, ...data });
        if (!response || !response.success) {
            throw new Error(response ? response.error : 'Request failed');
        }
        return response.data;
    }

    /**
     * Initializes cache if not already loaded (Host mode only)
     */
    async _ensureCache() {
        if (this.cache) return;
        const data = await chrome.storage.local.get(this.STORAGE_KEY);
        this.cache = data[this.STORAGE_KEY] || [];
    }

    /**
     * Saves a translation item.
     * @param {Object} item - { text, translation, sourceLang, targetLang, sourceUrl, timestamp }
     */
    async saveTranslation(item) {
        if (!this.isBackground) {
            return this._request('STORAGE_SAVE', { item });
        }

        await this._ensureCache();
        let items = this.cache;
        
        // Remove existing if duplicate to move it to the top
        const existingIndex = items.findIndex(i => i.text === item.text && i.translation === item.translation);
        if (existingIndex !== -1) {
            items.splice(existingIndex, 1);
        }
        
        items.unshift(item);
        this.cache = items; // Update cache reference just in case
        
        await chrome.storage.local.set({ [this.STORAGE_KEY]: this.cache });
        return true;
    }

    /**
     * Retrieves saved translations.
     * @param {number} limit 
     * @param {number} offset 
     */
    async getTranslations(limit = 100, offset = 0) {
        if (!this.isBackground) {
            return this._request('STORAGE_GET', { limit, offset });
        }

        await this._ensureCache();
        return this.cache.slice(offset, offset + limit);
    }

    /**
     * Removes a specific translation.
     */
    async removeTranslation(text, translation) {
        if (!this.isBackground) {
            return this._request('STORAGE_REMOVE', { text, translation });
        }

        await this._ensureCache();
        const initialLength = this.cache.length;
        this.cache = this.cache.filter(i => !(i.text === text && i.translation === translation));
        
        if (this.cache.length !== initialLength) {
            await chrome.storage.local.set({ [this.STORAGE_KEY]: this.cache });
        }
        return true;
    }

    /**
     * Clears all saved translations.
     */
    async clearAll() {
        if (!this.isBackground) {
            return this._request('STORAGE_CLEAR');
        }

        this.cache = [];
        await chrome.storage.local.set({ [this.STORAGE_KEY]: [] });
        return true;
    }

    /**
     * Checks if a translation is already saved.
     */
    async isStarred(text, translation) {
        if (!this.isBackground) {
            return this._request('STORAGE_IS_STARRED', { text, translation });
        }

        await this._ensureCache();
        return this.cache.some(i => i.text === text && i.translation === translation);
    }

    /**
     * Updates SRS status fields for a translation item.
     * @param {string} text - The source text.
     * @param {string} translation - The translated text.
     * @param {Object} updates - The fields to update (e.g. nextReview, interval, etc.)
     * @returns {boolean} True if updated, false if not found.
     */
    async updateSRSStatus(text, translation, updates) {
        if (!this.isBackground) {
            return this._request('STORAGE_UPDATE_SRS', { text, translation, updates });
        }

        await this._ensureCache();
        const index = this.cache.findIndex(i => i.text === text && i.translation === translation);
        if (index === -1) {
            return false;
        }

        // Merge updates into the item
        this.cache[index] = { ...this.cache[index], ...updates };

        await chrome.storage.local.set({ [this.STORAGE_KEY]: this.cache });
        return true;
    }
}

// Make it available globally
// Make it available globally
if (typeof window !== 'undefined') {
    window.StorageService = StorageService;
} else if (typeof self !== 'undefined') {
    self.StorageService = StorageService;
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageService;
}
