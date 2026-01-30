const HighlightService = require('./HighlightService');

describe('HighlightService', () => {
    let service;
    
    beforeEach(() => {
        service = new HighlightService();
        // Setup simple DOM environment
        document.body.innerHTML = '<div id="root">Hello world this is a test</div>';
    });

    test('should ignore short words', () => {
        const root = document.getElementById('root');
        const vocab = [
            { text: 'is', translation: '是' }, // < 3 chars
            { text: 'test', translation: '測試' }
        ];

        service.scanAndHighlight(root, vocab);

        // 'is' should not be highlighted, 'test' should be
        const marks = root.querySelectorAll('mark');
        expect(marks.length).toBe(1);
        expect(marks[0].textContent).toBe('test');
        expect(marks[0].dataset.translation).toBe('測試');
    });

    test('should highlight matching words case-insensitively', () => {
        const root = document.getElementById('root');
        const vocab = [{ text: 'HELLO', translation: '你好' }];

        service.scanAndHighlight(root, vocab);

        const marks = root.querySelectorAll('mark');
        expect(marks.length).toBe(1);
        expect(marks[0].textContent).toBe('Hello'); // Original text case preserved
        expect(marks[0].dataset.translation).toBe('你好');
    });

    test('should handle multiple matches in one node', () => {
        document.body.innerHTML = '<div id="root">apple banana apple</div>';
        const root = document.getElementById('root');
        const vocab = [{ text: 'apple', translation: '蘋果' }];

        service.scanAndHighlight(root, vocab);

        const marks = root.querySelectorAll('mark');
        expect(marks.length).toBe(2);
        expect(marks[0].textContent).toBe('apple');
        expect(marks[1].textContent).toBe('apple');
    });

    test('should not highlight existing highlights', () => {
        document.body.innerHTML = '<div id="root">apple <mark class="ht-highlight">banana</mark></div>';
        const root = document.getElementById('root');
        const vocab = [{ text: 'banana', translation: '香蕉' }];

        service.scanAndHighlight(root, vocab);

        // Only the existing one should remain, no nested marks
        const marks = root.querySelectorAll('mark');
        expect(marks.length).toBe(1);
        expect(marks[0].innerHTML).not.toContain('<mark');
    });
});
