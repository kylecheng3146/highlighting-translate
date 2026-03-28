class MissionService {
    constructor() {
        this.STORAGE_KEY = 'weeklyMission';
        this.FOCUS_WORDS_KEY = 'weeklyMissionFocusWords';
        this.TASK_IDS = {
            REVIEW_DUE_WORDS: 'review_due_words',
            MASTER_WEAK_WORDS: 'master_weak_words',
            DISCOVER_NEW_WORDS: 'discover_new_words'
        };
    }

    getWeekId(date = new Date()) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        const week = String(weekNo).padStart(2, '0');
        return `${d.getUTCFullYear()}-W${week}`;
    }

    shouldRegenerateWeek(existingMission, now = Date.now()) {
        if (!existingMission || !existingMission.weekId) return true;
        return existingMission.weekId !== this.getWeekId(new Date(now));
    }

    _clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    _roundTarget(value) {
        return Math.max(1, Math.round(value));
    }

    _calculatePersonalizationFactor(previousMission) {
        if (!previousMission || !Array.isArray(previousMission.tasks) || previousMission.tasks.length === 0) {
            return 1;
        }

        let targetTotal = 0;
        let progressTotal = 0;
        previousMission.tasks.forEach((task) => {
            targetTotal += Number(task.target || 0);
            progressTotal += Number(task.progress || 0);
        });

        if (targetTotal <= 0) return 1;

        const completionRate = progressTotal / targetTotal;
        if (completionRate >= 0.9) return 1.15;
        if (completionRate >= 0.7) return 1.05;
        if (completionRate >= 0.4) return 1;
        return 0.85;
    }

    _buildStats(vocabList, now = Date.now()) {
        const active = (vocabList || []).filter((item) => !item.isArchived);
        const dueWords = active.filter((item) => item.nextReview && item.nextReview <= now);
        const weakWords = active.filter((item) => Number(item.learningRate || 0) < 60);

        return {
            activeCount: active.length,
            dueCount: dueWords.length,
            weakCount: weakWords.length,
            dueWords,
            weakWords
        };
    }

    _getFocusWords(stats) {
        const due = stats.dueWords
            .sort((a, b) => (a.nextReview || 0) - (b.nextReview || 0))
            .slice(0, 25)
            .map((item) => String(item.text || '').toLowerCase().trim())
            .filter(Boolean);

        const weak = stats.weakWords
            .sort((a, b) => Number(a.learningRate || 0) - Number(b.learningRate || 0))
            .slice(0, 25)
            .map((item) => String(item.text || '').toLowerCase().trim())
            .filter(Boolean);

        return Array.from(new Set([...due, ...weak]));
    }

    _buildTasks(stats, previousMission) {
        const factor = this._clamp(this._calculatePersonalizationFactor(previousMission), 0.8, 1.2);

        const starterMode = stats.activeCount < 30;
        const dueBase = starterMode ? 6 : 12;
        const weakBase = starterMode ? 3 : 6;
        const discoverBase = starterMode ? 2 : 4;

        const dueTarget = this._roundTarget(Math.min(Math.max(3, stats.dueCount || 0), dueBase) * factor);
        const weakTarget = this._roundTarget(Math.min(Math.max(2, Math.ceil((stats.weakCount || 0) * 0.35)), weakBase) * factor);
        const discoverTarget = this._roundTarget(discoverBase * factor);

        return [
            {
                id: this.TASK_IDS.REVIEW_DUE_WORDS,
                title: '複習到期詞彙',
                reason: '優先處理近期到期，防止遺忘曲線下滑',
                target: dueTarget,
                progress: 0,
                status: 'pending'
            },
            {
                id: this.TASK_IDS.MASTER_WEAK_WORDS,
                title: '強化弱項詞彙',
                reason: '學習率低於 60% 的詞彙需要重點補強',
                target: weakTarget,
                progress: 0,
                status: 'pending'
            },
            {
                id: this.TASK_IDS.DISCOVER_NEW_WORDS,
                title: '新增新詞',
                reason: '持續擴充可理解輸入範圍',
                target: discoverTarget,
                progress: 0,
                status: 'pending'
            }
        ];
    }

    _withSummary(mission) {
        const tasks = mission.tasks || [];
        const targetTotal = tasks.reduce((sum, task) => sum + Number(task.target || 0), 0);
        const progressTotal = tasks.reduce((sum, task) => sum + Number(task.progress || 0), 0);
        const score = targetTotal > 0 ? Math.round((progressTotal / targetTotal) * 100) : 0;

        const completed = tasks.every((task) => Number(task.progress || 0) >= Number(task.target || 0));
        const normalizedTasks = tasks.map((task) => ({
            ...task,
            status: Number(task.progress || 0) >= Number(task.target || 0) ? 'completed' : (Number(task.progress || 0) > 0 ? 'in_progress' : 'pending')
        }));

        return {
            ...mission,
            tasks: normalizedTasks,
            completed,
            summary: {
                score,
                targetTotal,
                progressTotal,
                weeklyStreak: Number(mission?.summary?.weeklyStreak || 0)
            }
        };
    }

    generateWeeklyMission(vocabList, previousMission = null, now = Date.now()) {
        const stats = this._buildStats(vocabList, now);
        const weekId = this.getWeekId(new Date(now));
        const tasks = this._buildTasks(stats, previousMission);
        const focusWords = this._getFocusWords(stats);

        const mission = {
            weekId,
            generatedAt: now,
            completed: false,
            tasks,
            stretchTasks: [],
            focusWords,
            summary: {
                score: 0,
                targetTotal: 0,
                progressTotal: 0,
                weeklyStreak: previousMission?.completed ? Number(previousMission?.summary?.weeklyStreak || 0) + 1 : Number(previousMission?.summary?.weeklyStreak || 0)
            }
        };

        return this._withSummary(mission);
    }

    applyEvent(mission, event = {}) {
        if (!mission || !Array.isArray(mission.tasks)) return mission;

        const updated = {
            ...mission,
            tasks: mission.tasks.map((task) => ({ ...task }))
        };

        const byId = (id) => updated.tasks.find((task) => task.id === id);
        const inc = (id, amount = 1) => {
            const task = byId(id);
            if (!task) return;
            task.progress = Number(task.progress || 0) + amount;
            if (task.progress > Number(task.target || 0)) {
                task.progress = Number(task.target || 0);
            }
        };

        switch (event.type) {
            case 'REVIEW_COMPLETED':
                if (event.isDue !== false) {
                    inc(this.TASK_IDS.REVIEW_DUE_WORDS, 1);
                }
                if (event.weakWordImproved) {
                    inc(this.TASK_IDS.MASTER_WEAK_WORDS, 1);
                }
                break;
            case 'NEW_WORD_SAVED':
                inc(this.TASK_IDS.DISCOVER_NEW_WORDS, 1);
                break;
            case 'WEAK_WORD_IMPROVED':
                inc(this.TASK_IDS.MASTER_WEAK_WORDS, 1);
                break;
            default:
                break;
        }

        return this._withSummary(updated);
    }
}

if (typeof window !== 'undefined') {
    window.MissionService = MissionService;
} else if (typeof self !== 'undefined') {
    self.MissionService = MissionService;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MissionService;
}
