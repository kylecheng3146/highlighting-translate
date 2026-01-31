const SRSService = require('./SRSService');

describe('SRSService', () => {
    let service;

    beforeEach(() => {
        service = new SRSService();
    });

    test('should define rating constants', () => {
        expect(service.RATING_FORGET).toBeDefined();
        expect(service.RATING_HARD).toBeDefined();
        expect(service.RATING_GOOD).toBeDefined();
        expect(service.RATING_EASY).toBeDefined();
    });

    describe('calculateNextReview for New Cards', () => {
        test('should return correct interval for FORGET (Reset)', () => {
            const result = service.calculateNextReview(null, service.RATING_FORGET);
            expect(result.interval).toBeLessThan(1); // Should be very short (e.g. 0 or 1/1440 for 1 min)
            expect(result.repetitions).toBe(0);
        });

        test('should return correct interval for HARD', () => {
            const result = service.calculateNextReview(null, service.RATING_HARD);
            expect(result.interval).toBe(2);
            expect(result.repetitions).toBe(1);
            expect(result.easeFactor).toBe(2.5); // Default EF
        });

        test('should return correct interval for GOOD', () => {
            const result = service.calculateNextReview(null, service.RATING_GOOD);
            expect(result.interval).toBe(4);
            expect(result.repetitions).toBe(1);
        });

        test('should return correct interval for EASY', () => {
            const result = service.calculateNextReview(null, service.RATING_EASY);
            expect(result.interval).toBe(7);
            expect(result.repetitions).toBe(1);
        });
    });

    describe('calculateNextReview for Existing Cards', () => {
        test('should update EF and Interval for GOOD review', () => {
            const currentStats = {
                interval: 4,
                repetitions: 1,
                easeFactor: 2.5
            };
            
            const result = service.calculateNextReview(currentStats, service.RATING_GOOD);
            
            // SM-2: EF' = EF + (0.1 - (5-q)*(0.08+(5-q)*0.02))
            // q=4 (GOOD). 5-4=1.
            // change = 0.1 - 1*(0.08 + 0.02) = 0.1 - 0.1 = 0.
            // EF should remain 2.5.
            expect(result.easeFactor).toBeCloseTo(2.5);
            
            // Interval = I * EF = 4 * 2.5 = 10
            expect(result.interval).toBe(10);
            expect(result.repetitions).toBe(2);
        });

        test('should decrease EF for HARD review', () => {
            const currentStats = {
                interval: 10,
                repetitions: 2,
                easeFactor: 2.5
            };
            
            // Assuming HARD maps to quality 3
            // q=3. 5-3=2.
            // change = 0.1 - 2*(0.08 + 2*0.02) = 0.1 - 2*(0.12) = 0.1 - 0.24 = -0.14
            // New EF = 2.5 - 0.14 = 2.36
            
            const result = service.calculateNextReview(currentStats, service.RATING_HARD);
            
            expect(result.easeFactor).toBeCloseTo(2.36);
            expect(result.interval).toBeGreaterThan(10); // 10 * 2.36 = 23.6 -> 24?
            expect(result.repetitions).toBe(3);
        });

        test('should reset repetitions on FORGET', () => {
            const currentStats = {
                interval: 10,
                repetitions: 2,
                easeFactor: 2.5
            };
            
            const result = service.calculateNextReview(currentStats, service.RATING_FORGET);
            
            expect(result.repetitions).toBe(0);
            expect(result.interval).toBeLessThan(1);
            // EF usually doesn't change on failure in simplified versions, or drops.
            // Let's assume keep or slight drop. For now, check repetitions reset.
        });

        test('should not let EF drop below 1.3', () => {
            const currentStats = {
                interval: 10,
                repetitions: 5,
                easeFactor: 1.3
            };
            
            // Hard review (q=3) drops EF by 0.14
            const result = service.calculateNextReview(currentStats, service.RATING_HARD);
            
            expect(result.easeFactor).toBe(1.3); // Clamped
        });
    });

    describe('Utilities', () => {
        test('getDueDate should return correct timestamp', () => {
            const interval = 2; // 2 days
            const now = Date.now();
            const dueDate = service.getDueDate(interval);
            
            const expected = now + 2 * 24 * 60 * 60 * 1000;
            // Allow small delta for execution time
            expect(dueDate).toBeGreaterThanOrEqual(expected - 1000);
            expect(dueDate).toBeLessThanOrEqual(expected + 1000);
        });
    });
});
