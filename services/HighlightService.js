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
                vocabMap.set(item.text.toLowerCase(), item.translation);
            }
        });

        if (vocabMap.size === 0) return;

        const walker = document.createTreeWalker(
            rootElement,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    // Skip script, style, and already highlighted nodes
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

        // Process nodes in chunks to avoid blocking
        this.processChunks(nodesToHighlight, vocabMap);
    }

    /**
     * Processes text nodes in chunks using requestIdleCallback if available.
     */
    processChunks(nodes, vocabMap) {
        let index = 0;
        const CHUNK_SIZE = 50;

        const process = (deadline) => {
            while (index < nodes.length && (deadline ? deadline.timeRemaining() > 0 : true)) {
                const chunkEnd = Math.min(index + CHUNK_SIZE, nodes.length);
                for (; index < chunkEnd; index++) {
                    if (this.highlightCount >= this.maxHighlights) return;
                    this.highlightNode(nodes[index], vocabMap);
                }
                
                if (this.highlightCount >= this.maxHighlights) return;
            }

            if (index < nodes.length) {
                if (window.requestIdleCallback) {
                    window.requestIdleCallback(process);
                } else {
                    setTimeout(() => process(), 10);
                }
            }
        };

        if (window.requestIdleCallback) {
            window.requestIdleCallback(process);
        } else {
            process();
        }
    }

    /**
     * Highlights words in a single text node.
     * @param {Text} node 
     * @param {Map} vocabMap 
     */
    highlightNode(node, vocabMap) {
        const text = node.nodeValue;
        if (!text.trim()) return;

        // Build a regex from vocab keys
        // Escape special regex chars in keys
        const escapedKeys = Array.from(vocabMap.keys()).map(key => key.replace(/[.*+?^${}()|[\\]/g, '\\$&'));
        if (escapedKeys.length === 0) return;

        // Match whole words only (word boundaries), case insensitive
        // Note: \b doesn't work well with non-ASCII chars like Chinese/Japanese.
        // For mixed content, we might need a more complex regex or separate logic.
        // For MVP, assuming mostly space-separated languages or exact matches.
        // Let's use a simpler approach: replace known terms.
        
        // Sorting keys by length descending to match longest terms first
        escapedKeys.sort((a, b) => b.length - a.length);
        
        const regex = new RegExp(`(${escapedKeys.join('|')})`, 'gi');
        
        if (!regex.test(text)) return;

        const fragment = document.createDocumentFragment();
        let lastIndex = 0;
        let match;
        
        // Reset regex state
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
            const mark = document.createElement('mark');
            mark.className = 'ht-highlight';
            mark.textContent = matchedText;
            mark.dataset.translation = vocabMap.get(matchedText.toLowerCase());
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
