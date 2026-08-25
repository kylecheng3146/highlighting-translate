const MilestoneService = require('./MilestoneService');

describe('MilestoneService', () => {
    let service;

    beforeEach(() => {
        service = new MilestoneService();
    });

    test('should return correct milestone levels for total words', () => {
        expect(service.getCurrentMilestone(0)).toBeNull();
        expect(service.getCurrentMilestone(99)).toBeNull();

        const beginner = service.getCurrentMilestone(100);
        expect(beginner.id).toBe('beginner');
        expect(beginner.icon).toBe('🌱');

        const intermediate = service.getCurrentMilestone(500);
        expect(intermediate.id).toBe('intermediate');
        expect(intermediate.icon).toBe('🌿');

        const advanced = service.getCurrentMilestone(1000);
        expect(advanced.id).toBe('advanced');
        expect(advanced.icon).toBe('🌳');

        const master = service.getCurrentMilestone(5000);
        expect(master.id).toBe('master');
        expect(master.icon).toBe('🏆');
    });

    test('should return next milestone correctly', () => {
        expect(service.getNextMilestone(50).threshold).toBe(100);
        expect(service.getNextMilestone(100).threshold).toBe(500);
        expect(service.getNextMilestone(750).threshold).toBe(1000);
        expect(service.getNextMilestone(1200).threshold).toBe(5000);
        expect(service.getNextMilestone(5000)).toBeNull();
        expect(service.getNextMilestone(6000)).toBeNull();
    });

    test('should calculate progress percentage towards next milestone accurately', () => {
        const p1 = service.getProgressToNext(50);
        expect(p1.percentage).toBe(50);
        expect(p1.targetWords).toBe(100);
        expect(p1.isMax).toBe(false);

        const p2 = service.getProgressToNext(347);
        // 347 / 500 = 69.4% -> 69%
        expect(p2.percentage).toBe(69);
        expect(p2.targetWords).toBe(500);
        expect(p2.isMax).toBe(false);

        const pMax = service.getProgressToNext(5500);
        expect(pMax.percentage).toBe(100);
        expect(pMax.isMax).toBe(true);
        expect(pMax.nextMilestone).toBeNull();
    });
});
