/**
 * @jest-environment jsdom
 */

const { ReviewManager } = require('./review');
const StorageService = require('./services/StorageService');
const SRSService = require('./services/SRSService');

// Mock dependencies
jest.mock('./services/StorageService');
jest.mock('./services/SRSService');

// Mock Globals
global.StorageService = require('./services/StorageService');
global.SRSService = require('./services/SRSService');

describe('ReviewManager', () => {
    let reviewManager;
    let mockStorage;
    let mockSRS;
    let mockView;

    beforeEach(() => {
        // Setup Mocks
        StorageService.mockClear();
        SRSService.mockClear();

        mockStorage = {
            getTranslations: jest.fn(),
            updateSRSStatus: jest.fn()
        };
        StorageService.mockImplementation(() => mockStorage);

        mockSRS = {
            calculateNextReview: jest.fn(),
            getDueDate: jest.fn()
        };
        SRSService.mockImplementation(() => mockSRS);

        // Mock View for State Pattern
        mockView = {
            bindEvents: jest.fn(),
            render: jest.fn(),
            updateRatingPreviews: jest.fn(),
            close: jest.fn()
        };

        window.__TESTING__ = true;
    });

    test('should initialize and render initial state', async () => {
        const item = { text: 'hello', translation: '你好' };
        mockStorage.getTranslations.mockResolvedValue([item]);
        
        reviewManager = new ReviewManager(mockView);
        await reviewManager.init();

        expect(mockStorage.getTranslations).toHaveBeenCalled();
        expect(reviewManager.state.queue.length).toBe(1);
        
        // Verify render called with state
        expect(mockView.render).toHaveBeenCalledWith(expect.objectContaining({
            currentCard: item,
            currentIndex: 0,
            isFlipped: false
        }));
    });

    test('should flip card logic', async () => {
        mockStorage.getTranslations.mockResolvedValue([{ text: 'a', translation: 'b' }]);
        
        reviewManager = new ReviewManager(mockView);
        await reviewManager.init();

        reviewManager.flipCard();
        
        expect(reviewManager.state.isFlipped).toBe(true);
        expect(mockView.render).toHaveBeenLastCalledWith(expect.objectContaining({
            isFlipped: true
        }));
    });

    test('should handle rating and move to next', async () => {
        const item1 = { text: '1', translation: '1' };
        const item2 = { text: '2', translation: '2' };
        mockStorage.getTranslations.mockResolvedValue([item1, item2]);
        mockSRS.calculateNextReview.mockReturnValue({ interval: 2 });
        mockStorage.updateSRSStatus.mockResolvedValue(true);

        reviewManager = new ReviewManager(mockView);
        await reviewManager.init();

        // Must flip before rating
        reviewManager.flipCard();

        // Rate
        await reviewManager.handleRating(3);

        expect(mockStorage.updateSRSStatus).toHaveBeenCalled();
        
        // State updated to next card
        expect(reviewManager.state.currentIndex).toBe(1);
        expect(reviewManager.state.currentCard).toEqual(item2);
        expect(reviewManager.state.isFlipped).toBe(false);

        expect(mockView.render).toHaveBeenLastCalledWith(expect.objectContaining({
            currentCard: item2,
            isFlipped: false
        }));
    });

    test('should finish session', async () => {
        mockStorage.getTranslations.mockResolvedValue([{ text: 'last', translation: 'last' }]);
        mockSRS.calculateNextReview.mockReturnValue({ interval: 1 });
        
        reviewManager = new ReviewManager(mockView);
        await reviewManager.init();
        reviewManager.flipCard();
        await reviewManager.handleRating(3);

        expect(reviewManager.state.finished).toBe(true);
        expect(mockView.render).toHaveBeenLastCalledWith(expect.objectContaining({
            finished: true
        }));
    });
});
