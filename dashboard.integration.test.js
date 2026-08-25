const StatsService = require('./services/StatsService');
const StreakService = require('./services/StreakService');
const MilestoneService = require('./services/MilestoneService');
const ShareCardService = require('./services/ShareCardService');

describe('Reading Progress Dashboard End-to-End Pipeline', () => {
    let mockStorageData;
    let mockStorage;
    let streakService;
    let milestoneService;
    let statsService;
    let shareCardService;

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

        streakService = new StreakService();
        milestoneService = new MilestoneService();
        statsService = new StatsService({
            streakService,
            milestoneService,
            storage: mockStorage
        });
        shareCardService = new ShareCardService();
    });

    test('should progress from beginner to milestone as words accumulate', async () => {
        const testDate = new Date('2026-08-21T12:00:00');

        // 1. Initial State
        const initialStats = await statsService.getOverview(testDate);
        expect(initialStats.totalWords).toBe(0);
        expect(initialStats.streak).toBe(0);
        expect(initialStats.milestone.percentage).toBe(0);

        // 2. Perform 5 translations today
        for (let i = 0; i < 5; i++) {
            await statsService.recordTranslation(`word_${i}`, false, testDate);
        }

        const midStats = await statsService.getOverview(testDate);
        expect(midStats.todayTranslations).toBe(5);
        expect(midStats.streak).toBe(1);
        expect(midStats.hasLearnedToday).toBe(true);

        // 3. Populate 100 words in saved vocabulary
        mockStorageData['savedTranslations'] = Array.from({ length: 120 }, (_, idx) => ({
            text: `vocab_${idx}`,
            translation: `翻譯_${idx}`
        }));

        const milestoneOverview = await statsService.getOverview(testDate);
        expect(milestoneOverview.totalWords).toBe(125);
        expect(milestoneOverview.milestone.currentMilestone.id).toBe('beginner');
        expect(milestoneOverview.milestone.nextMilestone.id).toBe('intermediate');
        // 125 / 500 = 25%
        expect(milestoneOverview.milestone.percentage).toBe(25);

        // 4. Test Growth Chart retrieval
        const chart = await statsService.getGrowthChart(30, testDate);
        expect(chart).toHaveLength(30);
        const lastPoint = chart[chart.length - 1];
        expect(lastPoint.date).toBe('2026-08-21');
        expect(lastPoint.count).toBe(5);

        // 5. Test Learning Insights
        const insights = await statsService.getInsights(testDate);
        expect(insights.activeDaysCount).toBe(1);
        expect(insights.totalActivity).toBe(5);

        // 6. Test Share Card generation
        const mockCanvas = {
            width: 0,
            height: 0,
            style: {},
            getContext: jest.fn(() => ({
                scale: jest.fn(),
                createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
                createRadialGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
                fillStyle: '',
                strokeStyle: '',
                font: '',
                fillRect: jest.fn(),
                fillText: jest.fn(),
                beginPath: jest.fn(),
                moveTo: jest.fn(),
                lineTo: jest.fn(),
                quadraticCurveTo: jest.fn(),
                closePath: jest.fn(),
                fill: jest.fn(),
                stroke: jest.fn(),
                measureText: jest.fn(() => ({ width: 60 }))
            }))
        };

        const canvas = shareCardService.generateCard(milestoneOverview, mockCanvas);
        expect(canvas).toBe(mockCanvas);
    });
});
