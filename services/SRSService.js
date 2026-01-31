/**
 * Service to handle Spaced Repetition System (SRS) logic using SM-2 algorithm.
 */
class SRSService {
    constructor() {
        // Rating Constants
        this.RATING_FORGET = 1;
        this.RATING_HARD = 2;
        this.RATING_GOOD = 3;
        this.RATING_EASY = 4;
    }

    /**
     * Calculates the next review schedule based on current stats and rating.
     * @param {Object} currentStats - { interval, repetitions, easeFactor } (or null/undefined)
     * @param {number} rating - One of RATING_* constants
     * @returns {Object} { interval, repetitions, easeFactor }
     */
    calculateNextReview(currentStats, rating) {
        // Default values for new cards
        let interval = currentStats?.interval || 0;
        let repetitions = currentStats?.repetitions || 0;
        let easeFactor = currentStats?.easeFactor || 2.5;

        // Logic for New Cards (repetitions == 0)
        if (repetitions === 0) {
            switch (rating) {
                case this.RATING_FORGET:
                    return { interval: 0, repetitions: 0, easeFactor };
                case this.RATING_HARD:
                    return { interval: 2, repetitions: 1, easeFactor };
                case this.RATING_GOOD:
                    // Standard SM-2 starts with 1, then 6.
                    // We map GOOD to a customized first interval, e.g. 4 days.
                    return { interval: 4, repetitions: 1, easeFactor };
                case this.RATING_EASY:
                    return { interval: 7, repetitions: 1, easeFactor };
                default:
                    // Fallback to GOOD behavior
                    return { interval: 4, repetitions: 1, easeFactor };
            }
        }

        // Logic for Existing Cards (repetitions > 0)
        
        // Map Rating to Quality (0-5)
        let quality;
        switch (rating) {
            case this.RATING_FORGET: quality = 0; break; // Fail
            case this.RATING_HARD: quality = 3; break;   // Pass with difficulty
            case this.RATING_GOOD: quality = 4; break;   // Pass
            case this.RATING_EASY: quality = 5; break;   // Perfect
            default: quality = 4;
        }

        if (quality < 3) {
            // Failed: Reset repetitions, interval -> 0 (or 1)
            // SM-2 says IF q<3 -> Reps=0, Interval=1.
            // But we want to align with "Forget" behavior.
            return { interval: 0, repetitions: 0, easeFactor }; 
            // Note: Some SM-2 variants keep EF unchanged on fail, or reduce it.
            // Standard SM-2 usually doesn't change EF on fail (only on pass > 3).
        }

        // Passed (q >= 3)
        
        // Update Ease Factor
        // EF' = EF + (0.1 - (5-q)*(0.08+(5-q)*0.02))
        const qSub = 5 - quality;
        easeFactor = easeFactor + (0.1 - qSub * (0.08 + qSub * 0.02));
        
        if (easeFactor < 1.3) easeFactor = 1.3;

        repetitions += 1;

        // Calculate Interval
        if (repetitions === 1) {
            // Should not happen here since we handle reps=0 above, 
            // but if we somehow had reps=0 passed into "Existing" logic...
            interval = 1; 
        } else if (repetitions === 2) {
            // Standard SM-2 says interval 6 here.
            // But if our previous interval was 7 (EASY), 6 is a regression.
            // If previous was 2 (HARD), 6 is 3x.
            // If previous was 4 (GOOD), 6 is 1.5x.
            // Let's stick to I * EF for smooth progression from custom starts.
            interval = interval * easeFactor;
        } else {
            interval = interval * easeFactor;
        }

        // Round interval to nearest integer (or 1 decimal?) use integer for days
        interval = Math.round(interval * 10) / 10; // Simple rounding or Math.ceil

        return { interval, repetitions, easeFactor };
    }

    /**
     * Helper to get due date timestamp.
     * @param {number} intervalDays 
     * @returns {number} Timestamp
     */
    getDueDate(intervalDays) {
        return Date.now() + intervalDays * 24 * 60 * 60 * 1000;
    }
}

// Make it available globally
// Make it available globally
if (typeof window !== 'undefined') {
    window.SRSService = SRSService;
} else if (typeof self !== 'undefined') {
    self.SRSService = SRSService;
}

// Export for usage (if needed) and testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SRSService;
}
