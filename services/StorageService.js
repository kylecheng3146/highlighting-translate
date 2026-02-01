/**
 * Service to handle data persistence using chrome.storage.local.
 */
class StorageService {
    constructor() {
        this.STORAGE_KEY = 'savedTranslations';
        this.DB_VERSION_KEY = 'db_version';
        this.CURRENT_VERSION = 2; // Version 2 introduces frequency_rank
        // Check if we are in the Service Worker context
        // In actual Service Worker, ServiceWorkerGlobalScope is a global function/constructor
        this.isBackground = (typeof self !== 'undefined' && typeof ServiceWorkerGlobalScope !== 'undefined' && self instanceof ServiceWorkerGlobalScope) || StorageService.forceBackgroundMode;
        this.cache = null; // In-memory cache for Host mode
        this.frequencyDb = null;
    }

    /**
     * Helper to send messages if not in background
     */
    async _request(action, data) {
        if (this.isBackground) {
            throw new Error('Internal Error: _request called in background context');
        }
        try {
            const response = await chrome.runtime.sendMessage({ action, ...data });
            if (!response || !response.success) {
                throw new Error(response ? response.error : 'Request failed');
            }
            return response.data;
        } catch (error) {
            if (error.message && error.message.includes('Extension context invalidated')) {
                throw new Error('擴充功能已更新，請重新整理頁面 (Extension updated, please reload page)');
            }
            throw error;
        }
    }

    /**
     * Loads the frequency database from assets
     */
    async _loadFrequencyDb() {
        if (this.frequencyDb) return this.frequencyDb;
        try {
            const response = await fetch(chrome.runtime.getURL('assets/frequency_db.json'));
            this.frequencyDb = await response.json();
            return this.frequencyDb;
        } catch (error) {
            console.error('Failed to load frequency database:', error);
            return null;
        }
    }

    /**
     * Migration logic for frequency rank
     */
    async _migrate() {
        if (!this.isBackground) return;

        const db = await this._loadFrequencyDb();
        if (!db) return;

        let migrated = false;
        this.cache = this.cache.map(item => {
            if (item.frequency_rank === undefined) {
                const word = item.text.toLowerCase().trim();
                if (db[word]) {
                    item.frequency_rank = db[word];
                    migrated = true;
                }
            }
            return item;
        });

        if (migrated) {
            await chrome.storage.local.set({ [this.STORAGE_KEY]: this.cache });
        }
        await chrome.storage.local.set({ [this.DB_VERSION_KEY]: this.CURRENT_VERSION });
        console.log('Storage migration to v2 complete.');
    }

    /**
     * Initializes cache if not already loaded (Host mode only)
     */
    async _ensureCache() {
        if (this.cache) return;
        const storageData = await chrome.storage.local.get([this.STORAGE_KEY, this.DB_VERSION_KEY]);
        this.cache = storageData[this.STORAGE_KEY] || [];
        
        // Handle migration in background
        if (this.isBackground) {
            const version = storageData[this.DB_VERSION_KEY] || 1;
            if (version < this.CURRENT_VERSION) {
                await this._migrate();
            }
        }
    }

    /**
     * Gets frequency info for a word
     */
    async getWordInfo(word) {
        if (!this.isBackground) {
            return this._request('STORAGE_GET_WORD_INFO', { word });
        }

        const db = await this._loadFrequencyDb();
        if (!db) return null;

        const normalized = word.toLowerCase().trim();
        const rank = db[normalized];
        
        if (!rank) return null;

        return {
            rank,
            level: this._calculateLevel(rank)
        };
    }

    _calculateLevel(rank) {
        if (rank <= 500) return 'A1';
        if (rank <= 1000) return 'A2';
        if (rank <= 2000) return 'B1';
        if (rank <= 4000) return 'B2';
        if (rank <= 8000) return 'C1';
        return 'C2';
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
        
        // Auto-fill frequency rank if missing
        if (item.frequency_rank === undefined) {
            const info = await this.getWordInfo(item.text);
            if (info) {
                item.frequency_rank = info.rank;
                item.cefr_level = info.level;
            }
        }

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
