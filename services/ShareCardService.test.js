const ShareCardService = require('./ShareCardService');

describe('ShareCardService', () => {
    let service;
    let mockCanvas;
    let mockContext;

    beforeEach(() => {
        service = new ShareCardService();
        mockContext = {
            scale: jest.fn(),
            createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
            createRadialGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
            fillStyle: '',
            strokeStyle: '',
            lineWidth: 1,
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
            measureText: jest.fn(() => ({ width: 80 }))
        };

        mockCanvas = {
            width: 0,
            height: 0,
            style: {},
            getContext: jest.fn(() => mockContext),
            toDataURL: jest.fn(() => 'data:image/png;base64,fakePngData'),
            toBlob: jest.fn((cb) => cb(new Blob(['fake'], { type: 'image/png' })))
        };
    });

    test('should render share card onto provided canvas with stats', () => {
        const stats = {
            streak: 12,
            totalWords: 347,
            monthlyNew: 23,
            thisWeekMinutes: 45,
            milestone: { displayText: '🌿 進階者' },
            lastActivity: '2026-08-21'
        };

        const canvas = service.generateCard(stats, mockCanvas);
        expect(canvas).toBe(mockCanvas);
        expect(mockContext.scale).toHaveBeenCalledWith(2, 2);
        expect(mockContext.fillText).toHaveBeenCalledWith('Highlighting Translate', 24, 40);
        expect(mockContext.fillText).toHaveBeenCalledWith('📊 Learning Progress', 24, 70);
    });

    test('should download card as png', () => {
        const appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation(() => {});
        const removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation(() => {});

        service.downloadCard(mockCanvas, 'test-card.png');

        expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/png');
        expect(appendChildSpy).toHaveBeenCalled();
        expect(removeChildSpy).toHaveBeenCalled();

        appendChildSpy.mockRestore();
        removeChildSpy.mockRestore();
    });

    test('should copy card blob to clipboard', async () => {
        global.ClipboardItem = jest.fn();
        Object.assign(navigator, {
            clipboard: {
                write: jest.fn().mockResolvedValue(true)
            }
        });

        const success = await service.copyToClipboard(mockCanvas);
        expect(success).toBe(true);
        expect(navigator.clipboard.write).toHaveBeenCalled();
    });
});
