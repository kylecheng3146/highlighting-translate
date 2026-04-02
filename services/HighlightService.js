class HighlightService {
    constructor() {
        this.minWordLength = 3;
        this.maxHighlights = 100;
        this.highlightCount = 0;
    }

    /**
     * Highlights all occurrences of words from the vocabulary list in the given root element.
     * @param {HTMLElement} rootElement 
     * @param {Array} vocabularyList - Array of objects with {text, translation}
     */
    scanAndHighlight(rootElement, vocabularyList) {
        if (!vocabularyList || vocabularyList.length === 0) return;

        this.highlightCount = 0;

        // Create a map for faster lookup: text -> translation
        const vocabMap = new Map();
        vocabularyList.forEach(item => {
            if (item.text && item.text.length >= this.minWordLength) {
                const normalized = item.text.toLowerCase();
                const existing = vocabMap.get(normalized);
            vocabMap.set(normalized, {
                translation: item.translation,
                rank: item.frequency_rank,
                level: item.cefr_level,
                isMissionWord: Boolean(item.isMissionWord || existing?.isMissionWord)
            });
            }
        });

        if (vocabMap.size === 0) return;

        // Build regex ONCE here and reuse across all nodes
        // Escape regex special chars, then replace literal spaces with '\s+' to allow
        // matching phrasal verbs across arbitrary whitespace (multiple spaces, newlines, etc.)
        const escapedKeys = Array.from(vocabMap.keys())
            .map(key => key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+'))
            .sort((a, b) => b.length - a.length);
        const regex = new RegExp(`\\b(${escapedKeys.join('|')})\\b`, 'gi');

        const walker = document.createTreeWalker(
            rootElement,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    const parent = node.parentNode;
                    if (!parent) return NodeFilter.FILTER_REJECT;
                    
                    const tagName = parent.tagName;
                    if (['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT'].includes(tagName)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    if (parent.classList.contains('ht-highlight')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        const nodesToHighlight = [];
        let currentNode = walker.nextNode();
        while (currentNode) {
            nodesToHighlight.push(currentNode);
            currentNode = walker.nextNode();
        }

        this.processChunks(nodesToHighlight, vocabMap, regex);
    }

    /**
     * Processes text nodes in chunks using requestIdleCallback if available,
     * falling back to synchronous processing otherwise (e.g. in test environments).
     */
    processChunks(nodes, vocabMap, regex) {
        const CHUNK_SIZE = 50;

        // Synchronous fallback: used when requestIdleCallback is unavailable (e.g. jsdom/tests)
        if (typeof window === 'undefined' || !window.requestIdleCallback) {
            for (let i = 0; i < nodes.length; i++) {
                if (this.highlightCount >= this.maxHighlights) return;
                this.highlightNode(nodes[i], vocabMap, regex);
            }
            return;
        }

        let index = 0;
        const process = (deadline) => {
            while (index < nodes.length) {
                // Yield back to browser if idle time is running out
                if (deadline && deadline.timeRemaining() <= 0) {
                    window.requestIdleCallback(process);
                    return;
                }

                const chunkEnd = Math.min(index + CHUNK_SIZE, nodes.length);
                for (; index < chunkEnd; index++) {
                    if (this.highlightCount >= this.maxHighlights) return;
                    this.highlightNode(nodes[index], vocabMap, regex);
                }

                if (this.highlightCount >= this.maxHighlights) return;
            }
        };

        window.requestIdleCallback(process);
    }

    /**
     * Highlights words in a single text node.
     * @param {Text} node 
     * @param {Map} vocabMap
     * @param {RegExp} regex - Pre-compiled regex shared across all nodes
     */
    highlightNode(node, vocabMap, regex) {
        const text = node.nodeValue;
        if (!text.trim()) return;

        // Reset stateful regex before each use (required for /g flag)
        regex.lastIndex = 0;
        if (!regex.test(text)) return;

        const fragment = document.createDocumentFragment();
        let lastIndex = 0;
        let match;
        
        regex.lastIndex = 0;

        while ((match = regex.exec(text)) !== null) {
            if (this.highlightCount >= this.maxHighlights) break;

            const matchedText = match[0];
            const matchIndex = match.index;

            // Append text before match
            if (matchIndex > lastIndex) {
                fragment.appendChild(document.createTextNode(text.substring(lastIndex, matchIndex)));
            }

            // Create highlight element
            // Normalize whitespace in matched text to look up the vocab map key
            const data = vocabMap.get(matchedText.toLowerCase().replace(/\s+/g, ' '));
            const mark = document.createElement('mark');
            mark.className = 'ht-highlight';
            
            // Apply frequency classes
            if (data.rank) {
                if (data.rank <= 3000) mark.classList.add('hl-freq-high');
                else if (data.rank <= 10000) mark.classList.add('hl-freq-mid');
                else mark.classList.add('hl-freq-low');
                
                mark.dataset.rank = data.rank;
                mark.dataset.level = data.level || '';
            }

            mark.textContent = matchedText;
            mark.dataset.translation = data.translation;
            if (data.isMissionWord) {
                mark.dataset.mission = 'true';
            }
            fragment.appendChild(mark);

            this.highlightCount++;
            lastIndex = regex.lastIndex;
        }

        // Append remaining text
        if (lastIndex < text.length) {
            fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
        }

        node.parentNode.replaceChild(fragment, node);
    }
}

// Make it available globally
window.HighlightService = HighlightService;

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HighlightService;
}
