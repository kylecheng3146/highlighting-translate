/**
 * MilestoneService - Manages learner milestones, level badges, and progress calculations.
 */
class MilestoneService {
    constructor() {
        this.MILESTONES = [
            { id: 'beginner', threshold: 100, label: '起步者', title: 'Beginner', icon: '🌱', level: 1 },
            { id: 'intermediate', threshold: 500, label: '進階者', title: 'Intermediate', icon: '🌿', level: 2 },
            { id: 'advanced', threshold: 1000, label: '精通者', title: 'Advanced', icon: '🌳', level: 3 },
            { id: 'master', threshold: 5000, label: '大師', title: 'Master', icon: '🏆', level: 4 }
        ];
    }

    /**
     * Get the current milestone level achieved
     * @param {number} totalWords
     * @returns {Object|null}
     */
    getCurrentMilestone(totalWords = 0) {
        const count = Math.max(0, Number(totalWords) || 0);
        let current = null;
        for (const milestone of this.MILESTONES) {
            if (count >= milestone.threshold) {
                current = milestone;
            } else {
                break;
            }
        }
        return current;
    }

    /**
     * Get the next milestone target
     * @param {number} totalWords
     * @returns {Object|null}
     */
    getNextMilestone(totalWords = 0) {
        const count = Math.max(0, Number(totalWords) || 0);
        for (const milestone of this.MILESTONES) {
            if (count < milestone.threshold) {
                return milestone;
            }
        }
        return null; // Master level reached or exceeded
    }

    /**
     * Calculate progress details towards the next milestone
     * @param {number} totalWords
     * @param {Object|null} [i18nService=null]
     * @returns {Object}
     */
    getProgressToNext(totalWords = 0, i18nService = null) {
        const count = Math.max(0, Number(totalWords) || 0);
        const currentMilestone = this.getCurrentMilestone(count);
        const nextMilestone = this.getNextMilestone(count);

        if (!nextMilestone) {
            // Master reached (>= 5000)
            const result = {
                currentMilestone,
                nextMilestone: null,
                currentWords: count,
                targetWords: 5000,
                percentage: 100,
                isMax: true,
                displayText: `🏆 ${currentMilestone ? currentMilestone.label : '大師'} (${count} 詞)`
            };
            if (i18nService && typeof i18nService.formatMilestone === 'function') {
                result.displayText = i18nService.formatMilestone(result, count);
            }
            return result;
        }

        const prevThreshold = currentMilestone ? currentMilestone.threshold : 0;
        const targetThreshold = nextMilestone.threshold;
        const boundedCount = Math.min(count, targetThreshold);

        // Overall progress percentage to the next threshold
        const percentage = Math.min(100, Math.max(0, Math.round((boundedCount / targetThreshold) * 100)));

        const currentLabel = currentMilestone ? `${currentMilestone.icon} ${currentMilestone.label}` : '🌱 起步者';

        const result = {
            currentMilestone,
            nextMilestone,
            currentWords: count,
            targetWords: targetThreshold,
            percentage,
            isMax: false,
            displayText: `${currentLabel} (${count}/${targetThreshold})`
        };
        if (i18nService && typeof i18nService.formatMilestone === 'function') {
            result.displayText = i18nService.formatMilestone(result, count);
        }
        return result;
    }
}

if (typeof window !== 'undefined') {
    window.MilestoneService = MilestoneService;
} else if (typeof self !== 'undefined') {
    self.MilestoneService = MilestoneService;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MilestoneService;
}
