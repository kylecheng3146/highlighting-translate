const FocusTrackService = require('./FocusTrackService');

describe('FocusTrackService', () => {
    let service;

    beforeEach(() => {
        service = new FocusTrackService();
    });

    test('should generate stable ISO week id', () => {
        const id = service.getWeekId(new Date('2026-03-28T12:00:00Z'));
        expect(id).toMatch(/^2026-W\d{2}$/);
    });

    test('should regenerate when focus is missing or stale', () => {
        expect(service.shouldRegenerateWeek(null, Date.parse('2026-03-28T00:00:00Z'))).toBe(true);

        const track = { weekId: service.getWeekId(new Date('2026-03-28T00:00:00Z')) };
        expect(service.shouldRegenerateWeek(track, Date.parse('2026-03-29T00:00:00Z'))).toBe(false);

        expect(service.shouldRegenerateWeek(track, Date.parse('2026-04-10T00:00:00Z'))).toBe(true);
    });

    test('should create at least one focus topic', () => {
        const vocab = [
            { text: 'abandon', sourceUrl: 'https://example.com/a', learningRate: 30 },
            { text: 'explain', sourceUrl: 'https://example.com/b', learningRate: 50 }
        ];

        const track = service.generateFocusTrack(vocab, null, Date.now());
        expect(track.topics.length).toBeGreaterThan(0);
    });

    test('should cap progress at target', () => {
        const vocab = [
            { text: 'abandon', sourceUrl: 'https://example.com/a', learningRate: 30 }
        ];
        let track = service.generateFocusTrack(vocab, null, Date.now());
        const topic = track.topics[0];

        for (let i = 0; i < topic.target + 3; i++) {
            track = service.applyEvent(track, { type: 'REVIEW_COMPLETED', word: 'abandon', sourceUrl: 'https://example.com/a' });
        }

        const updated = track.topics[0];
        expect(updated.progress).toBe(updated.target);
    });

    test('should build focus words from topics', () => {
        const track = {
            weekId: '2026-W14',
            topics: [
                { id: 'domain:example.com', words: ['alpha', 'beta'] },
                { id: 'weak_words', words: ['beta', 'gamma'] }
            ],
            summary: { score: 0, targetTotal: 0, progressTotal: 0 }
        };

        const words = service.buildFocusWords(track);
        expect(words.sort()).toEqual(['alpha', 'beta', 'gamma']);
    });
});
