/**
 * Tests for StorageService Refactoring (Client/Host mode)
 */

// Mock Chrome API
global.chrome = {
    runtime: {
        sendMessage: jest.fn(),
        getManifest: jest.fn(),
    },
    storage: {
        local: {
            get: jest.fn(),
            set: jest.fn(),
        }
    }
};

describe('StorageService Refactor', () => {
    let StorageService;

    beforeEach(() => {
        jest.resetModules();
        global.window = {}; // Simulate Window context
        global.self = undefined;
        StorageService = require('./services/StorageService');
        global.chrome.runtime.sendMessage.mockReset();
        global.chrome.storage.local.get.mockReset();
        global.chrome.storage.local.set.mockReset();
    });

    test('Client Mode: should send message for saveTranslation', async () => {
        const service = new StorageService();
        global.chrome.runtime.sendMessage.mockResolvedValue({ success: true });

        await service.saveTranslation({ text: 'hello' });

        expect(global.chrome.runtime.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
            action: 'STORAGE_SAVE',
            item: { text: 'hello' }
        }));
        expect(global.chrome.storage.local.get).not.toHaveBeenCalled();
    });

    test('Client Mode: should send message for getTranslations', async () => {
        const service = new StorageService();
        global.chrome.runtime.sendMessage.mockResolvedValue({ success: true, data: [] });

        await service.getTranslations();

        expect(global.chrome.runtime.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
            action: 'STORAGE_GET'
        }));
    });

    test('Host Mode: should access storage directly', async () => {
        // Force Host Mode
        StorageService.forceBackgroundMode = true;
        
        // Re-require to pick up constructor check if it were dynamic (it is based on globals at construction)
        jest.resetModules();
        StorageService = require('./services/StorageService');
        StorageService.forceBackgroundMode = true; // Ensure required module has it set
        const service = new serviceClassFactory();

        global.chrome.storage.local.get.mockResolvedValue({ savedTranslations: [] });
        global.chrome.storage.local.set.mockResolvedValue();

        // First call should hit storage
        await service.saveTranslation({ text: 'hi' });
        expect(global.chrome.storage.local.get).toHaveBeenCalledTimes(1);
        expect(global.chrome.storage.local.set).toHaveBeenCalledTimes(1);

        // Second call should NOT hit storage get (cache used), only set
        await service.saveTranslation({ text: 'hello' });
        expect(global.chrome.storage.local.get).toHaveBeenCalledTimes(1); // Still 1
        expect(global.chrome.storage.local.set).toHaveBeenCalledTimes(2);

        // Get should use cache
        const items = await service.getTranslations();
        expect(global.chrome.storage.local.get).toHaveBeenCalledTimes(1); // Still 1
        expect(items).toHaveLength(2);
    });
    
    // Helper to instantiate in clean env
    function serviceClassFactory() {
        return new StorageService();
    }
});
