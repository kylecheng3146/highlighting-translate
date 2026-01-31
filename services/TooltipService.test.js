
const TooltipService = require('./TooltipService');

describe('TooltipService', () => {
    let tooltipService;
    let mockHost;

    beforeEach(() => {
        tooltipService = new TooltipService();
        
        // Mock host element (like a shadowRoot or document.body)
        mockHost = document.createElement('div');
        mockHost.getElementById = jest.fn();
        mockHost.appendChild = jest.fn();
        
        global.window.scrollX = 0;
        global.window.scrollY = 0;
        global.window.innerWidth = 1024;
    });

    test('should initialize and create tooltip element if not exists', () => {
        mockHost.getElementById.mockReturnValue(null);

        tooltipService.init(mockHost);

        expect(mockHost.getElementById).toHaveBeenCalledWith('ht-tooltip');
        expect(mockHost.appendChild).toHaveBeenCalled();
        const appendedNode = mockHost.appendChild.mock.calls[0][0];
        expect(appendedNode.id).toBe('ht-tooltip');
        expect(appendedNode.className).toBe('ht-tooltip');
    });

    test('should use existing tooltip element if exists', () => {
        const existingTooltip = document.createElement('div');
        mockHost.getElementById.mockReturnValue(existingTooltip);

        tooltipService.init(mockHost);

        expect(mockHost.getElementById).toHaveBeenCalledWith('ht-tooltip');
        expect(mockHost.appendChild).not.toHaveBeenCalled();
        expect(tooltipService.tooltip).toBe(existingTooltip);
    });

    test('show should update content and position', () => {
        const tooltip = document.createElement('div');
        // Mock offset dimensions
        Object.defineProperty(tooltip, 'offsetWidth', { configurable: true, value: 100 });
        Object.defineProperty(tooltip, 'offsetHeight', { configurable: true, value: 50 });
        
        mockHost.getElementById.mockReturnValue(tooltip);
        tooltipService.init(mockHost);

        const rect = {
            left: 200,
            top: 200,
            width: 50,
            height: 20,
            bottom: 220
        };

        tooltipService.show('Hello', rect);

        expect(tooltip.textContent).toBe('Hello');
        expect(tooltip.style.display).toBe('block');
        
        // Logic check:
        // left = 200 + 0 + (50/2) - (100/2) = 200 + 25 - 50 = 175
        // top = 200 + 0 - 50 - 8 = 142
        expect(tooltip.style.left).toBe('175px');
        expect(tooltip.style.top).toBe('142px');
    });

    test('hide should set display to none', () => {
        const tooltip = document.createElement('div');
        mockHost.getElementById.mockReturnValue(tooltip);
        tooltipService.init(mockHost);

        tooltip.style.display = 'block';
        tooltipService.hide();

        expect(tooltip.style.display).toBe('none');
    });
    
    test('show should constrain to viewport edges (left)', () => {
        const tooltip = document.createElement('div');
        Object.defineProperty(tooltip, 'offsetWidth', { configurable: true, value: 100 });
        Object.defineProperty(tooltip, 'offsetHeight', { configurable: true, value: 50 });
        mockHost.getElementById.mockReturnValue(tooltip);
        tooltipService.init(mockHost);

        const rect = { left: 0, top: 200, width: 20, height: 20, bottom: 220 };
        // Calculated left would be: 0 + 10 - 50 = -40
        // Should be clamped to 10
        
        tooltipService.show('Test', rect);
        expect(tooltip.style.left).toBe('10px');
    });
});
