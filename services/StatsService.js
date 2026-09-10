/**
 * StatsService - Core aggregation engine for Reading Progress Dashboard.
 * Tracks daily reading, translation counts, saved vocabulary, and growth history.
 */
class StatsService {
    constructor(dependencies = {}) {
        this.STORAGE_KEY_READING = 'readingProgress';
        this.STORAGE_KEY_STATS = 'learningStats';
        this.SAVED_VOCAB_KEY = 'savedTranslations';

        this.streakService = dependencies.streakService || (typeof StreakService !== 'undefined' ? new StreakService() : null);
        this.milestoneService = dependencies.milestoneService || (typeof MilestoneService !== 'undefined' ? new MilestoneService() : null);
        this.storage = dependencies.storage || (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local ? chrome.storage.local : null);

        // Fallback for tests or node environments if services weren't globally bound
        if (!this.streakService && typeof require !== 'undefined') {
            try {
                const S = require('./StreakService');
                this.streakService = new S();
            } catch (e) {
                // Ignore
            }
        }
        if (!this.milestoneService && typeof require !== 'undefined') {
            try {
                const M = require('./MilestoneService');
                this.milestoneService = new M();
            } catch (e) {
                // Ignore
            }
        }
    }

    /**
     * Storage helper to get data
     */
    async _getStorage(keys) {
        if (!this.storage) {
            return {};
        }
        return new Promise((resolve) => {
            this.storage.get(keys, (res) => resolve(res || {}));
        });
    }

    /**
     * Storage helper to set data
     */
    async _setStorage(items) {
        if (!this.storage) {
            return;
        }
        return new Promise((resolve) => {
            this.storage.set(items, () => resolve());
        });
    }

    /**
     * Format date to YYYY-MM-DD string
     */
    formatDateKey(date = new Date()) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Record a translation or saved word event
     * @param {string} text - the translated or saved word/phrase
     * @param {boolean} [isSaved=false] - whether this was a saved/starred action
     * @param {Date} [eventDate=new Date()]
     * @returns {Promise<Object>} updated overview stats
     */
    async recordTranslation(text = '', isSaved = false, eventDate = new Date()) {
        const dateKey = this.formatDateKey(eventDate);
        const data = await this._getStorage([this.STORAGE_KEY_READING, this.STORAGE_KEY_STATS, this.SAVED_VOCAB_KEY]);
        
        let readingProgress = data[this.STORAGE_KEY_READING] || {};
        let learningStats = data[this.STORAGE_KEY_STATS] || {
            totalWords: 0,
            bestStreak: 0,
            firstUsed: dateKey,
            lastActivity: dateKey,
            aggregatedTranslations: 0,
            aggregatedSaved: 0
        };

        const cleanWord = typeof text === 'string' ? text.trim().toLowerCase() : '';

        // Update daily reading progress
        if (!readingProgress[dateKey]) {
            readingProgress[dateKey] = {
                translations: 0,
                saved: 0,
                words: [],
                readingMinutes: 0
            };
        }

        const dayEntry = readingProgress[dateKey];
        if (isSaved) {
            dayEntry.saved = (dayEntry.saved || 0) + 1;
        } else {
            dayEntry.translations = (dayEntry.translations || 0) + 1;
        }

        if (cleanWord) {
            if (!Array.isArray(dayEntry.words)) {
                dayEntry.words = [];
            }
            if (!dayEntry.words.includes(cleanWord)) {
                dayEntry.words.push(cleanWord);
            }
        }

        // Auto-aggregate data older than 90 days
        const aggregationResult = this.aggregateOldData(readingProgress, 90, eventDate);
        readingProgress = aggregationResult.readingProgress;
        learningStats.aggregatedTranslations = (learningStats.aggregatedTranslations || 0) + aggregationResult.removedTranslations;
        learningStats.aggregatedSaved = (learningStats.aggregatedSaved || 0) + aggregationResult.removedSaved;

        // Calculate total words learned (count all unique words across active days + saved translations + aggregated)
        const allUniqueWords = new Set();
        for (const key of Object.keys(readingProgress)) {
            const entry = readingProgress[key];
            if (Array.isArray(entry.words)) {
                entry.words.forEach(w => allUniqueWords.add(w));
            }
        }

        const savedVocabList = Array.isArray(data[this.SAVED_VOCAB_KEY]) ? data[this.SAVED_VOCAB_KEY] : [];
        savedVocabList.forEach(item => {
            if (item && item.text) {
                allUniqueWords.add(item.text.trim().toLowerCase());
            }
        });

        learningStats.totalWords = Math.max(allUniqueWords.size, (learningStats.totalWords || 0) + (cleanWord && !allUniqueWords.has(cleanWord) ? 1 : 0));
        learningStats.lastActivity = dateKey;
        if (!learningStats.firstUsed) {
            learningStats.firstUsed = dateKey;
        }

        // Update streak
        const currentStreak = this.streakService ? this.streakService.calculateStreak(readingProgress, eventDate) : 0;
        learningStats.bestStreak = this.streakService ? this.streakService.updateBestStreak(currentStreak, learningStats.bestStreak) : Math.max(currentStreak, learningStats.bestStreak || 0);

        await this._setStorage({
            [this.STORAGE_KEY_READING]: readingProgress,
            [this.STORAGE_KEY_STATS]: learningStats
        });

        return this.getOverview(eventDate);
    }

    /**
     * Get overview dashboard stats
     * @param {Date} [referenceDate=new Date()]
     * @returns {Promise<Object>}
     */
    async getOverview(referenceDate = new Date()) {
        const data = await this._getStorage([this.STORAGE_KEY_READING, this.STORAGE_KEY_STATS, this.SAVED_VOCAB_KEY]);
        const readingProgress = data[this.STORAGE_KEY_READING] || {};
        const learningStats = data[this.STORAGE_KEY_STATS] || {
            totalWords: 0,
            bestStreak: 0,
            firstUsed: null,
            lastActivity: null
        };
        const savedVocabList = Array.isArray(data[this.SAVED_VOCAB_KEY]) ? data[this.SAVED_VOCAB_KEY] : [];

        const todayKey = this.formatDateKey(referenceDate);
        const todayEntry = readingProgress[todayKey] || { translations: 0, saved: 0, words: [] };

        // 1. Total Words: Count unique saved translations + unique active words
        const allUniqueWords = new Set();
        for (const key of Object.keys(readingProgress)) {
            const entry = readingProgress[key];
            if (Array.isArray(entry.words)) {
                entry.words.forEach(w => allUniqueWords.add(w));
            }
        }
        savedVocabList.forEach(item => {
            if (item && item.text) {
                allUniqueWords.add(item.text.trim().toLowerCase());
            }
        });
        const totalWords = Math.max(allUniqueWords.size, Number(learningStats.totalWords || 0));

        // 2. Monthly New (words learned in current calendar month)
        const currentYear = referenceDate.getFullYear();
        const currentMonth = referenceDate.getMonth();
        const monthlyWords = new Set();
        const knownWords = new Set();
        let monthlyTranslations = 0;

        const monthStartKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
        const entries = Object.entries(readingProgress).sort(([a], [b]) => a.localeCompare(b));

        for (const [dateStr, entry] of entries) {
            const [y, m] = dateStr.split('-').map(Number);
            if (!Number.isFinite(y) || !Number.isFinite(m)) continue;

            const words = Array.isArray(entry.words)
                ? entry.words.map((word) => String(word).trim().toLowerCase()).filter(Boolean)
                : [];

            if (dateStr < monthStartKey) {
                words.forEach((word) => knownWords.add(word));
                continue;
            }

            if (y === currentYear && m === (currentMonth + 1)) {
                monthlyTranslations += (entry.translations || 0) + (entry.saved || 0);
                words.forEach((word) => {
                    if (!knownWords.has(word)) {
                        monthlyWords.add(word);
                        knownWords.add(word);
                    }
                });
            }
        }
        const monthlyNew = monthlyWords.size > 0 ? monthlyWords.size : monthlyTranslations;

        // 3. This Week's reading time (in minutes, estimated 1.5 min per translation session)
        const thisWeekMinutes = this.calculateWeekReadingMinutes(readingProgress, referenceDate);

        // 4. Streak calculations
        const streak = this.streakService ? this.streakService.calculateStreak(readingProgress, referenceDate) : 0;
        const hasLearnedToday = this.streakService ? this.streakService.hasLearnedToday(readingProgress, referenceDate) : false;
        const bestStreak = Math.max(streak, Number(learningStats.bestStreak || 0));

        // 5. Milestone
        const milestoneProgress = this.milestoneService ? this.milestoneService.getProgressToNext(totalWords) : {
            percentage: 0,
            displayText: `${totalWords} words`
        };

        return {
            totalWords,
            monthlyNew,
            thisWeekMinutes,
            streak,
            bestStreak,
            hasLearnedToday,
            todayTranslations: todayEntry.translations || 0,
            todaySaved: todayEntry.saved || 0,
            milestone: milestoneProgress,
            lastActivity: learningStats.lastActivity || todayKey
        };
    }

    /**
     * Return the activity record for a local calendar day.
     */
    async getDailyProgress(referenceDate = new Date()) {
        const data = await this._getStorage(this.STORAGE_KEY_READING);
        const date = this.formatDateKey(referenceDate);
        const entry = data[this.STORAGE_KEY_READING]?.[date];
        return {
            date,
            translations: Number(entry?.translations || 0),
            saved: Number(entry?.saved || 0),
            words: Array.isArray(entry?.words) ? [...entry.words] : [],
            readingMinutes: Number(entry?.readingMinutes || 0)
        };
    }

    /**
     * Return persisted aggregate counters without recalculating the dashboard.
     */
    async getAggregatedStats() {
        const data = await this._getStorage(this.STORAGE_KEY_STATS);
        return data[this.STORAGE_KEY_STATS] || {
            totalWords: 0,
            bestStreak: 0,
            firstUsed: null,
            lastActivity: null
        };
    }

    /**
     * Calculate weekly reading time in minutes (Mon-Sun or past 7 days)
     */
    calculateWeekReadingMinutes(readingProgress = {}, referenceDate = new Date()) {
        let totalMinutes = 0;
        const checkDate = new Date(referenceDate.getTime());
        
        // Past 7 days
        for (let i = 0; i < 7; i++) {
            const key = this.formatDateKey(checkDate);
            const entry = readingProgress[key];
            if (entry) {
                const count = (entry.translations || 0) + (entry.saved || 0);
                // Each translation/lookup represents ~1.5 min reading immersion
                const estimatedMinutes = entry.readingMinutes ? entry.readingMinutes : Math.round(count * 1.5);
                totalMinutes += estimatedMinutes;
            }
            checkDate.setDate(checkDate.getDate() - 1);
        }
        return totalMinutes;
    }

    /**
     * Get vocabulary growth chart data
     * @param {number} [days=30] - 7, 30, or 90 days
     * @param {Date} [referenceDate=new Date()]
     * @returns {Promise<Array<Object>>}
     */
    async getGrowthChart(days = 30, referenceDate = new Date()) {
        const data = await this._getStorage([this.STORAGE_KEY_READING, this.STORAGE_KEY_STATS]);
        const readingProgress = data[this.STORAGE_KEY_READING] || {};
        const learningStats = data[this.STORAGE_KEY_STATS] || {};

        const points = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        // Build list of dates in chronological order
        const dateKeys = [];
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(referenceDate.getTime());
            d.setDate(d.getDate() - i);
            dateKeys.push(d);
        }

        // Calculate baseline cumulative words
        let cumulative = Number(learningStats.aggregatedTranslations || 0);

        for (const dateObj of dateKeys) {
            const key = this.formatDateKey(dateObj);
            const entry = readingProgress[key] || { translations: 0, saved: 0, words: [] };
            const count = (entry.words && entry.words.length) ? entry.words.length : ((entry.translations || 0) + (entry.saved || 0));
            
            cumulative += count;
            
            points.push({
                date: key,
                label: `${dateObj.getMonth() + 1}/${dateObj.getDate()}`,
                dayName: dayNames[dateObj.getDay()],
                count,
                cumulative
            });
        }

        return points;
    }

    /**
     * Get learning patterns and personalized insights
     * @param {Date} [referenceDate=new Date()]
     * @returns {Promise<Object>}
     */
    async getInsights(referenceDate = new Date()) {
        const data = await this._getStorage([this.STORAGE_KEY_READING, this.STORAGE_KEY_STATS]);
        const readingProgress = data[this.STORAGE_KEY_READING] || {};

        const dayActivity = [0, 0, 0, 0, 0, 0, 0]; // Sun to Sat
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayNamesZh = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];

        let totalWordsCount = 0;
        let activeDaysCount = 0;
        let firstActivityDate = null;

        for (const [dateStr, entry] of Object.entries(readingProgress)) {
            const count = (entry.translations || 0) + (entry.saved || 0);
            if (count > 0) {
                const parts = dateStr.split('-').map(Number);
                const d = new Date(parts[0], parts[1] - 1, parts[2]);
                dayActivity[d.getDay()] += count;
                totalWordsCount += count;
                activeDaysCount++;
                if (!firstActivityDate || dateStr < firstActivityDate) firstActivityDate = dateStr;
            }
        }

        let maxActivity = -1;
        let peakDayIdx = 3; // Default Wednesday
        for (let i = 0; i < 7; i++) {
            if (dayActivity[i] > maxActivity) {
                maxActivity = dayActivity[i];
                peakDayIdx = i;
            }
        }

        const avgDailyWords = activeDaysCount > 0 ? (totalWordsCount / activeDaysCount).toFixed(1) : '0';
        const historyStart = firstActivityDate
            ? new Date(`${firstActivityDate}T00:00:00`)
            : referenceDate;
        const historyDays = Math.floor((referenceDate - historyStart) / 86400000) + 1;

        return {
            peakDayName: dayNames[peakDayIdx],
            peakDayNameZh: dayNamesZh[peakDayIdx],
            avgDailyWords: Number(avgDailyWords),
            activeDaysCount,
            totalActivity: totalWordsCount,
            historyDays: Math.max(0, historyDays),
            hasEnoughHistory: historyDays >= 14
        };
    }

    /**
     * Automatically aggregate and purge daily records older than retention threshold
     */
    aggregateOldData(readingProgress = {}, daysToKeep = 90, referenceDate = new Date()) {
        const cutoffDate = new Date(referenceDate.getTime());
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        const cutoffKey = this.formatDateKey(cutoffDate);

        const newProgress = {};
        let removedTranslations = 0;
        let removedSaved = 0;

        for (const [dateKey, record] of Object.entries(readingProgress)) {
            if (dateKey < cutoffKey) {
                removedTranslations += Number(record.translations || 0);
                removedSaved += Number(record.saved || 0);
            } else {
                newProgress[dateKey] = record;
            }
        }

        return {
            readingProgress: newProgress,
            removedTranslations,
            removedSaved
        };
    }
}

if (typeof window !== 'undefined') {
    window.StatsService = StatsService;
} else if (typeof self !== 'undefined') {
    self.StatsService = StatsService;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = StatsService;
}
