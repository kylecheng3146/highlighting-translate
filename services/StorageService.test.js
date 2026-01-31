const StorageService = require('./StorageService');

describe('StorageService', () => {
    let service;
    
    beforeEach(() => {
        // Mock chrome.storage.local and chrome.runtime
        global.chrome = {
            storage: {
                local: {
                    get: jest.fn(),
                    set: jest.fn()
                }
            },
            runtime: {
                sendMessage: jest.fn()
            }
        };
        // Force background mode for these unit tests to test the actual logic 
        // that interacts with chrome.storage.local
        StorageService.forceBackgroundMode = true;
        service = new StorageService();
    });

    test('saveTranslation should add item to the beginning of the list', async () => {
        chrome.storage.local.get.mockResolvedValue({ savedTranslations: [{ text: 'old' }] });
        
        const newItem = { text: 'new', translation: '譯' };
        await service.saveTranslation(newItem);
        
        expect(chrome.storage.local.set).toHaveBeenCalledWith({
            savedTranslations: [newItem, { text: 'old' }]
        });
    });

    test('saveTranslation should remove duplicate before adding', async () => {
        const item = { text: 'test', translation: '測試' };
        chrome.storage.local.get.mockResolvedValue({ savedTranslations: [item] });
        
        await service.saveTranslation(item);
        
        // Should still be just one item
        expect(chrome.storage.local.set).toHaveBeenCalledWith({
            savedTranslations: [item]
        });
    });

    test('getTranslations should return sliced items', async () => {
        const items = Array.from({ length: 10 }, (_, i) => ({ text: `t${i}` }));
        chrome.storage.local.get.mockResolvedValue({ savedTranslations: items });
        
        const result = await service.getTranslations(2, 1);
        expect(result).toEqual([{ text: 't1' }, { text: 't2' }]);
    });

    test('removeTranslation should filter out the item', async () => {
        const items = [{ text: 'a', translation: 'A' }, { text: 'b', translation: 'B' }];
        chrome.storage.local.get.mockResolvedValue({ savedTranslations: items });
        
        await service.removeTranslation('a', 'A');
        
        expect(chrome.storage.local.set).toHaveBeenCalledWith({
            savedTranslations: [{ text: 'b', translation: 'B' }]
        });
    });

    test('clearAll should set empty array', async () => {
        await service.clearAll();
        expect(chrome.storage.local.set).toHaveBeenCalledWith({
            savedTranslations: []
        });
    });

    test('isStarred should return true if item exists', async () => {
        chrome.storage.local.get.mockResolvedValue({ savedTranslations: [{ text: 'a', translation: 'A' }] });
        
        expect(await service.isStarred('a', 'A')).toBe(true);
        expect(await service.isStarred('b', 'B')).toBe(false);
    });

    test('updateSRSStatus should update fields without changing order', async () => {
        const items = [
            { text: 'a', translation: 'A', nextReview: 0 },
            { text: 'b', translation: 'B', nextReview: 0 }
        ];
        chrome.storage.local.get.mockResolvedValue({ savedTranslations: items });

        const updates = { nextReview: 1000, interval: 2 };
        const result = await service.updateSRSStatus('b', 'B', updates);

        expect(result).toBe(true);
        expect(chrome.storage.local.set).toHaveBeenCalledWith({
            savedTranslations: [
                { text: 'a', translation: 'A', nextReview: 0 },
                { text: 'b', translation: 'B', nextReview: 1000, interval: 2 }
            ]
        });
    });

    test('updateSRSStatus should return false if item not found', async () => {
        chrome.storage.local.get.mockResolvedValue({ savedTranslations: [] });
        const result = await service.updateSRSStatus('x', 'X', {});
        expect(result).toBe(false);
        expect(chrome.storage.local.set).not.toHaveBeenCalled();
    });
});
