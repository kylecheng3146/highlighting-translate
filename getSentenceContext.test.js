/**
 * Tests for getSentenceContext in content.js
 */

const TranslationService = require('./services/TranslationService');
global.TranslationService = TranslationService;
const StorageService = require('./services/StorageService');
global.StorageService = StorageService;
const HighlightService = require('./services/HighlightService');
global.HighlightService = HighlightService;
const TooltipService = require('./services/TooltipService');
global.TooltipService = TooltipService;

// Mock Chrome API
global.chrome = {
    storage: {
        sync: { get: jest.fn() },
        local: { get: jest.fn(), set: jest.fn() },
        onChanged: { addListener: jest.fn() }
    },
    runtime: {
        onMessage: { addListener: jest.fn() },
        sendMessage: jest.fn()
    }
};

const { getSentenceContext } = require('./content.js');

describe('getSentenceContext', () => {
    test('should extract sentence containing selection', () => {
        const text = "This is a test. I am checking the context logic. It should work.";
        document.body.innerHTML = `<div>${text}</div>`;
        const div = document.querySelector('div');
        
        // Mock Range
        const range = {
            commonAncestorContainer: div.firstChild,
            toString: () => "checking",
            cloneRange: () => range
        };

        const result = getSentenceContext(range);
        expect(result).toBe("I am checking the context logic.");
    });

    test('should handle selection at the end of sentence', () => {
        const text = "Hello world. Testing context capture!";
        document.body.innerHTML = `<div>${text}</div>`;
        const div = document.querySelector('div');
        
        const range = {
            commonAncestorContainer: div.firstChild,
            toString: () => "capture",
            cloneRange: () => range
        };

        const result = getSentenceContext(range);
        expect(result).toBe("Testing context capture!");
    });

    test('should return null if range is null', () => {
        expect(getSentenceContext(null)).toBeNull();
    });
});