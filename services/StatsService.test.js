const StatsService = require('./StatsService');
const StreakService = require('./StreakService');
const MilestoneService = require('./MilestoneService');

describe('StatsService', () => {
    let mockStorageData;
    let mockStorage;
    let statsService;

    beforeEach(() => {
        mockStorageData = {};
        mockStorage = {
            get: jest.fn((keys, cb) => {
                const res = {};
                const keyList = Array.isArray(keys) ? keys : [keys];
                keyList.forEach(k => {
                    if (mockStorageData[k] !== undefined) {
                        res[k] = JSON.parse(JSON.stringify(mockStorageData[k]));
                    }
                });
                cb(res);
            }),
            set: jest.fn((items, cb) => {
                Object.assign(mockStorageData, JSON.parse(JSON.stringify(items)));
                if (cb) cb();
            })
        };

        statsService = new StatsService({
            streakService: new StreakService(),
            milestoneService: new MilestoneService(),
            storage: mockStorage
        });
    });

    test('should record translation and update daily reading progress', async () => {
        const testDate = new Date('2026-08-21T10:00:00');
        const overview = await statsService.recordTranslation('apple', false, testDate);

        expect(overview.todayTranslations).toBe(1);
        expect(overview.todaySaved).toBe(0);
        expect(overview.totalWords).toBe(1);
        expect(overview.streak).toBe(1);

        const storageReading = mockStorageData['readingProgress'];
        expect(storageReading['2026-08-21'].translations).toBe(1);
        expect(storageReading['2026-08-21'].words).toContain('apple');
    });

    test('should record saved word and update total words count', async () => {
        const testDate = new Date('2026-08-21T10:00:00');
        await statsService.recordTranslation('apple', true, testDate);
        const overview = await statsService.recordTranslation('banana', true, testDate);

        expect(overview.todaySaved).toBe(2);
        expect(overview.totalWords).toBe(2);
        expect(overview.streak).toBe(1);
    });

    test('should calculate monthlyNew accurately for current month', async () => {
        const testDate = new Date('2026-08-21T10:00:00');
        mockStorageData['readingProgress'] = {
            '2026-08-01': { translations: 3, saved: 1, words: ['alpha', 'beta'] },
            '2026-08-20': { translations: 2, saved: 0, words: ['gamma'] },
            '2026-07-15': { translations: 10, saved: 5, words: ['old1', 'old2'] } // previous month
        };

        const overview = await statsService.getOverview(testDate);
        expect(overview.monthlyNew).toBe(3); // alpha, beta, gamma in August
        expect(overview.totalWords).toBe(5); // 5 unique words in total
    });

    test('should count only first-time words in monthlyNew', async () => {
        const testDate = new Date('2026-08-21T10:00:00');
        mockStorageData['readingProgress'] = {
            '2026-07-31': { translations: 1, saved: 0, words: ['repeat'] },
            '2026-08-01': { translations: 2, saved: 0, words: ['repeat', 'new-word'] },
            '2026-08-02': { translations: 1, saved: 0, words: ['new-word'] }
        };

        const overview = await statsService.getOverview(testDate);
        expect(overview.monthlyNew).toBe(1);
    });

    test('should expose daily and aggregate storage queries', async () => {
        const testDate = new Date('2026-08-21T10:00:00');
        mockStorageData.readingProgress = {
            '2026-08-21': { translations: 2, saved: 1, words: ['hello'], readingMinutes: 4 }
        };
        mockStorageData.learningStats = { totalWords: 4, bestStreak: 2 };

        await expect(statsService.getDailyProgress(testDate)).resolves.toEqual({
            date: '2026-08-21',
            translations: 2,
            saved: 1,
            words: ['hello'],
            readingMinutes: 4
        });
        await expect(statsService.getAggregatedStats()).resolves.toEqual({ totalWords: 4, bestStreak: 2 });
    });

    test('should estimate thisWeekMinutes reading time', async () => {
        const testDate = new Date('2026-08-21T10:00:00');
        mockStorageData['readingProgress'] = {
            '2026-08-21': { translations: 10, saved: 0 }, // 10 * 1.5 = 15m
            '2026-08-20': { translations: 10, saved: 0 }  // 10 * 1.5 = 15m
        };

        const overview = await statsService.getOverview(testDate);
        expect(overview.thisWeekMinutes).toBe(30);
    });

    test('should generate growth chart data points for specified days', async () => {
        const testDate = new Date('2026-08-21T10:00:00');
        mockStorageData['readingProgress'] = {
            '2026-08-20': { translations: 5, saved: 0, words: ['w1', 'w2'] },
            '2026-08-21': { translations: 3, saved: 1, words: ['w3'] }
        };

        const chart7D = await statsService.getGrowthChart(7, testDate);
        expect(chart7D).toHaveLength(7);
        expect(chart7D[chart7D.length - 1].date).toBe('2026-08-21');
        expect(chart7D[chart7D.length - 1].count).toBe(1); // 1 unique word w3
        expect(chart7D[chart7D.length - 2].count).toBe(2); // 2 unique words w1, w2
    });

    test('should calculate learning insights (peak day, average daily words)', async () => {
        const testDate = new Date('2026-08-21T10:00:00');
        mockStorageData['readingProgress'] = {
            '2026-08-19': { translations: 10, saved: 2 }, // Wednesday
            '2026-08-20': { translations: 2, saved: 0 },  // Thursday
            '2026-08-21': { translations: 4, saved: 0 }   // Friday
        };

        const insights = await statsService.getInsights(testDate);
        expect(insights.peakDayName).toBe('Wednesday');
        expect(insights.activeDaysCount).toBe(3);
        expect(insights.totalActivity).toBe(18);
        expect(insights.avgDailyWords).toBe(6.0);
        expect(insights.hasEnoughHistory).toBe(false);
    });

    test('should only mark insights ready after 14 calendar days of history', async () => {
        const testDate = new Date('2026-08-21T10:00:00');
        mockStorageData.readingProgress = {
            '2026-08-08': { translations: 1, saved: 0 },
            '2026-08-21': { translations: 1, saved: 0 }
        };

        const insights = await statsService.getInsights(testDate);
        expect(insights.historyDays).toBe(14);
        expect(insights.hasEnoughHistory).toBe(true);
    });

    test('should aggregate and clean up data older than 90 days', () => {
        const refDate = new Date('2026-08-21T10:00:00');
        const readingProgress = {
            '2026-01-01': { translations: 20, saved: 5 }, // > 90 days ago
            '2026-08-20': { translations: 3, saved: 1 }    // recent
        };

        const result = statsService.aggregateOldData(readingProgress, 90, refDate);
        expect(result.removedTranslations).toBe(20);
        expect(result.removedSaved).toBe(5);
        expect(result.readingProgress['2026-01-01']).toBeUndefined();
        expect(result.readingProgress['2026-08-20']).toBeDefined();
    });
});
