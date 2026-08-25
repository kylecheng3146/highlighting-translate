/**
 * StreakService - Manages learning streak calculations and daily activity checks.
 */
class StreakService {
    /**
     * Format a Date object to YYYY-MM-DD string in local time
     * @param {Date} date
     * @returns {string}
     */
    formatDateKey(date = new Date()) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Check if a specific day has learning activity (translations or saved words)
     * @param {Object} dayRecord - { translations: number, saved: number, words?: string[] }
     * @returns {boolean}
     */
    hasActivity(dayRecord) {
        if (!dayRecord) return false;
        const translations = Number(dayRecord.translations || 0);
        const saved = Number(dayRecord.saved || 0);
        const words = Array.isArray(dayRecord.words) ? dayRecord.words.length : 0;
        return translations > 0 || saved > 0 || words > 0;
    }

    /**
     * Check if today has recorded learning activity
     * @param {Object} readingProgress - map of date strings to daily records
     * @param {Date} [currentDate=new Date()]
     * @returns {boolean}
     */
    hasLearnedToday(readingProgress = {}, currentDate = new Date()) {
        const todayKey = this.formatDateKey(currentDate);
        return this.hasActivity(readingProgress[todayKey]);
    }

    /**
     * Calculate current streak consecutive days
     * If user learned today: count today + consecutive previous days.
     * If user hasn't learned today yet: streak is preserved from yesterday (not broken yet until today ends).
     * If neither today nor yesterday has activity: streak is 0.
     * 
     * @param {Object} readingProgress - map of date strings to daily records
     * @param {Date} [currentDate=new Date()]
     * @returns {number} current streak in days
     */
    calculateStreak(readingProgress = {}, currentDate = new Date()) {
        if (!readingProgress || typeof readingProgress !== 'object') {
            return 0;
        }

        const todayKey = this.formatDateKey(currentDate);
        const learnedToday = this.hasActivity(readingProgress[todayKey]);

        let streak = 0;
        let checkDate = new Date(currentDate.getTime());

        if (learnedToday) {
            // Start counting from today
            while (true) {
                const dateKey = this.formatDateKey(checkDate);
                if (this.hasActivity(readingProgress[dateKey])) {
                    streak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    break;
                }
            }
        } else {
            // Start checking from yesterday
            checkDate.setDate(checkDate.getDate() - 1);
            const yesterdayKey = this.formatDateKey(checkDate);
            if (!this.hasActivity(readingProgress[yesterdayKey])) {
                return 0;
            }
            while (true) {
                const dateKey = this.formatDateKey(checkDate);
                if (this.hasActivity(readingProgress[dateKey])) {
                    streak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    break;
                }
            }
        }

        return streak;
    }

    /**
     * Update and return the best streak recorded
     * @param {number} currentStreak
     * @param {number} [previousBest=0]
     * @returns {number}
     */
    updateBestStreak(currentStreak = 0, previousBest = 0) {
        return Math.max(Number(currentStreak) || 0, Number(previousBest) || 0);
    }
}

if (typeof window !== 'undefined') {
    window.StreakService = StreakService;
} else if (typeof self !== 'undefined') {
    self.StreakService = StreakService;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = StreakService;
}
