/**
 * Service to handle data persistence using chrome.storage.local.
 */
class StorageService {
    constructor() {
        this.STORAGE_KEY = 'savedTranslations';
    }

    /**
     * Saves a translation item.
     * @param {Object} item - { text, translation, sourceLang, targetLang, sourceUrl, timestamp }
     */
    async saveTranslation(item) {
        const data = await chrome.storage.local.get(this.STORAGE_KEY);
        let items = data[this.STORAGE_KEY] || [];
        
        // Remove existing if duplicate to move it to the top
        const existingIndex = items.findIndex(i => i.text === item.text && i.translation === item.translation);
        if (existingIndex !== -1) {
            items.splice(existingIndex, 1);
        }
        
        items.unshift(item);
        await chrome.storage.local.set({ [this.STORAGE_KEY]: items });
        return true;
    }

    /**
     * Retrieves saved translations.
     * @param {number} limit 
     * @param {number} offset 
     */
    async getTranslations(limit = 100, offset = 0) {
        const data = await chrome.storage.local.get(this.STORAGE_KEY);
        const items = data[this.STORAGE_KEY] || [];
        return items.slice(offset, offset + limit);
    }

    /**
     * Removes a specific translation.
     */
    async removeTranslation(text, translation) {
        const data = await chrome.storage.local.get(this.STORAGE_KEY);
        let items = data[this.STORAGE_KEY] || [];
        
        const filtered = items.filter(i => !(i.text === text && i.translation === translation));
        await chrome.storage.local.set({ [this.STORAGE_KEY]: filtered });
        return true;
    }

    /**
     * Clears all saved translations.
     */
    async clearAll() {
        await chrome.storage.local.set({ [this.STORAGE_KEY]: [] });
        return true;
    }

    /**
     * Checks if a translation is already saved.
     */
    async isStarred(text, translation) {
        const data = await chrome.storage.local.get(this.STORAGE_KEY);
        const items = data[this.STORAGE_KEY] || [];
        return items.some(i => i.text === text && i.translation === translation);
    }
}

// Make it available globally
window.StorageService = StorageService;

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageService;
}
