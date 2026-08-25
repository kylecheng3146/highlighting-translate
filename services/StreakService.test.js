const StreakService = require('./StreakService');

describe('StreakService', () => {
    let service;

    beforeEach(() => {
        service = new StreakService();
    });

    test('should return 0 streak for empty progress', () => {
        expect(service.calculateStreak({})).toBe(0);
        expect(service.calculateStreak(null)).toBe(0);
    });

    test('should detect today activity correctly', () => {
        const today = new Date('2026-08-21T10:00:00');
        const progress = {
            '2026-08-21': { translations: 5, saved: 1 }
        };
        expect(service.hasLearnedToday(progress, today)).toBe(true);

        const emptyProgress = {
            '2026-08-21': { translations: 0, saved: 0, words: [] }
        };
        expect(service.hasLearnedToday(emptyProgress, today)).toBe(false);
    });

    test('should calculate streak when user learned today', () => {
        const today = new Date('2026-08-21T10:00:00');
        const progress = {
            '2026-08-21': { translations: 3, saved: 0 },
            '2026-08-20': { translations: 2, saved: 1 },
            '2026-08-19': { translations: 1, saved: 0 },
            '2026-08-18': { translations: 0, saved: 0 } // Gap
        };
        expect(service.calculateStreak(progress, today)).toBe(3);
    });

    test('should maintain previous streak if user has not learned today yet but learned yesterday', () => {
        const today = new Date('2026-08-21T10:00:00');
        const progress = {
            '2026-08-20': { translations: 2, saved: 1 },
            '2026-08-19': { translations: 1, saved: 0 },
            '2026-08-18': { translations: 4, saved: 0 }
        };
        // Today has no entry, but yesterday is active -> streak is 3
        expect(service.calculateStreak(progress, today)).toBe(3);
        expect(service.hasLearnedToday(progress, today)).toBe(false);
    });

    test('should reset streak to 0 if yesterday was missed and today is not completed', () => {
        const today = new Date('2026-08-21T10:00:00');
        const progress = {
            '2026-08-19': { translations: 1, saved: 0 } // 2 days ago
        };
        expect(service.calculateStreak(progress, today)).toBe(0);
    });

    test('should update best streak correctly', () => {
        expect(service.updateBestStreak(5, 3)).toBe(5);
        expect(service.updateBestStreak(2, 7)).toBe(7);
        expect(service.updateBestStreak(0, 0)).toBe(0);
    });
});
