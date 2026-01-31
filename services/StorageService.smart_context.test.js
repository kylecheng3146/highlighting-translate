const StorageService = require('./StorageService');

describe('StorageService (Smart Context)', () => {
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
        StorageService.forceBackgroundMode = true;
        service = new StorageService();
    });

    test('saveTranslation should include context field if provided', async () => {
        chrome.storage.local.get.mockResolvedValue({ savedTranslations: [] });
        
        const newItem = { 
            text: 'apple', 
            translation: '蘋果',
            context: 'I eat an apple every day.'
        };
        await service.saveTranslation(newItem);
        
        expect(chrome.storage.local.set).toHaveBeenCalledWith({
            savedTranslations: [newItem]
        });
        
        const savedData = chrome.storage.local.set.mock.calls[0][0].savedTranslations[0];
        expect(savedData.context).toBe('I eat an apple every day.');
    });
});
