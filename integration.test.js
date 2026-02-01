/**
 * Integration Tests: Smart Highlight & Storage Messaging
 */

// Mock Chrome API
global.chrome = {
    runtime: {
        sendMessage: jest.fn(),
        getManifest: jest.fn(),
        onMessage: { addListener: jest.fn() }
    },
    storage: {
        local: { get: jest.fn(), set: jest.fn() },
        sync: { get: jest.fn(), set: jest.fn() }
    }
};

describe('HighlightService Integration', () => {
    let StorageService;
    let HighlightService;
    let documentBody;

    beforeEach(() => {
        jest.resetModules();
        global.window = { location: { hostname: 'example.com' } }; 
        const createTreeWalkerMock = jest.fn();
        global.document = {
            body: { innerHTML: '', appendChild: jest.fn() },
            createElement: (tag) => ({ tagName: tag.toUpperCase(), classList: { add: jest.fn() }, style: {} }),
            createTreeWalker: createTreeWalkerMock,
            ELEMENT_NODE: 1,
            TEXT_NODE: 3
        };
        
        // Mock TreeWalker for a simple text node
        const mockNode = {
            nodeType: 3,
            textContent: 'Apple is a fruit',
            parentNode: { nodeName: 'DIV', normalize: jest.fn() },
            replaceData: jest.fn(),
            splitText: jest.fn().mockImplementation(() => ({ nodeType: 3, textContent: '' }))
        };

        createTreeWalkerMock.mockReturnValue({
            nextNode: jest.fn()
                .mockReturnValueOnce(mockNode)
                .mockReturnValue(null)
        });

        StorageService = require('./services/StorageService');
        HighlightService = require('./services/HighlightService');
        
        // Ensure StorageService behaves as Client
        StorageService.forceBackgroundMode = false;
        
        global.chrome.runtime.sendMessage.mockReset();
    });

    test('should fetch vocabulary via Messaging and trigger highlight', async () => {
        const storage = new StorageService();
        const highlighter = new HighlightService();

        // 1. Mock Background Response (Client Mode Request)
        global.chrome.runtime.sendMessage.mockResolvedValue({ 
            success: true, 
            data: [
                { text: 'Apple', translation: '蘋果' }
            ] 
        });

        // 2. Simulate fetching vocab
        const vocab = await storage.getTranslations(1000);
        
        expect(global.chrome.runtime.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
            action: 'STORAGE_GET'
        }));
        expect(vocab).toHaveLength(1);
        expect(vocab[0].text).toEqual('Apple');

        // 3. Simulate Highlight Scan
        // We mock scanning logic just to verify flow, full DOM logic is tested in HighlightService.test.js
        // Here we just check if it CAN run with the data from storage
        
        await highlighter.scanAndHighlight(global.document.body, vocab);
        
        // If no errors thrown, integration is good regarding data shape
    });



    test('Performance: should handle 1000 vocab items within reasonable time', async () => {
        const largeVocab = Array.from({ length: 1000 }, (_, i) => ({
            text: `word${i}`,
            translation: `翻譯${i}`
        }));
        
        // Setup a larger DOM to scan
        // In this mock, scanning is fast because TreeWalker mock is simple
        // But we want to ensure the loop doesn't crash or take excessive time
        const highlighter = new HighlightService();
        // HighlightService is stateless regarding settings, it just runs when called.

        const start = Date.now();
        await highlighter.scanAndHighlight(global.document.body, largeVocab);
        const duration = Date.now() - start;

        expect(duration).toBeLessThan(1500); // 1.5s tolerance for JSDOM overhead
    });
});
