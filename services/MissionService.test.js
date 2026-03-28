const MissionService = require('./MissionService');

describe('MissionService', () => {
    let service;

    beforeEach(() => {
        service = new MissionService();
    });

    test('should generate stable ISO week id', () => {
        const id = service.getWeekId(new Date('2026-03-28T12:00:00Z'));
        expect(id).toMatch(/^2026-W\d{2}$/);
    });

    test('should regenerate when mission is missing or stale', () => {
        expect(service.shouldRegenerateWeek(null, Date.parse('2026-03-28T00:00:00Z'))).toBe(true);

        const mission = { weekId: service.getWeekId(new Date('2026-03-28T00:00:00Z')) };
        expect(service.shouldRegenerateWeek(mission, Date.parse('2026-03-29T00:00:00Z'))).toBe(false);

        expect(service.shouldRegenerateWeek(mission, Date.parse('2026-04-10T00:00:00Z'))).toBe(true);
    });

    test('should create three core mission tasks', () => {
        const vocab = [
            { text: 'abandon', nextReview: Date.now() - 1000, learningRate: 30 },
            { text: 'explain', learningRate: 50 },
            { text: 'maintain', learningRate: 80 }
        ];

        const mission = service.generateWeeklyMission(vocab, null, Date.now());
        expect(mission.tasks).toHaveLength(3);
        expect(mission.tasks.map((t) => t.id)).toEqual([
            service.TASK_IDS.REVIEW_DUE_WORDS,
            service.TASK_IDS.MASTER_WEAK_WORDS,
            service.TASK_IDS.DISCOVER_NEW_WORDS
        ]);
    });

    test('should set due-review target to 0 when there are no due words', () => {
        const vocab = [
            { text: 'future', nextReview: Date.now() + 86400000, learningRate: 30 },
            { text: 'active', learningRate: 80 }
        ];
        const mission = service.generateWeeklyMission(vocab, null, Date.now());
        const dueTask = mission.tasks.find((task) => task.id === service.TASK_IDS.REVIEW_DUE_WORDS);
        expect(dueTask.target).toBe(0);
        expect(dueTask.status).toBe('completed');
    });

    test('should clamp personalization factor through target bounds', () => {
        const previousMission = {
            tasks: [
                { id: 'a', target: 10, progress: 10 },
                { id: 'b', target: 10, progress: 10 },
                { id: 'c', target: 10, progress: 10 }
            ],
            completed: true,
            summary: { weeklyStreak: 2 }
        };
        const mission = service.generateWeeklyMission([], previousMission, Date.now());
        mission.tasks.forEach((task) => {
            expect(task.target).toBeGreaterThanOrEqual(0);
            expect(task.target).toBeLessThanOrEqual(20);
        });
    });

    test('should apply events and cap progress at target', () => {
        let mission = service.generateWeeklyMission([], null, Date.now());
        const discoverTask = mission.tasks.find((t) => t.id === service.TASK_IDS.DISCOVER_NEW_WORDS);

        for (let i = 0; i < discoverTask.target + 5; i++) {
            mission = service.applyEvent(mission, { type: 'NEW_WORD_SAVED' });
        }

        const updated = mission.tasks.find((t) => t.id === service.TASK_IDS.DISCOVER_NEW_WORDS);
        expect(updated.progress).toBe(updated.target);
    });

    test('should reconcile existing mission and complete due task when none are due', () => {
        const mission = {
            weekId: '2026-W13',
            tasks: [
                { id: service.TASK_IDS.REVIEW_DUE_WORDS, target: 3, progress: 0, title: 'due' },
                { id: service.TASK_IDS.MASTER_WEAK_WORDS, target: 2, progress: 0, title: 'weak' },
                { id: service.TASK_IDS.DISCOVER_NEW_WORDS, target: 2, progress: 0, title: 'new' }
            ],
            summary: { weeklyStreak: 0 }
        };

        const vocab = [{ text: 'future', nextReview: Date.now() + 86400000, learningRate: 75 }];
        const reconciled = service.reconcileWithCurrentData(mission, vocab, Date.now());
        const dueTask = reconciled.tasks.find((task) => task.id === service.TASK_IDS.REVIEW_DUE_WORDS);

        expect(dueTask.target).toBe(0);
        expect(dueTask.status).toBe('completed');
    });
});
