class TooltipService {
    constructor() {
        this.tooltip = null;
    }

    init(root) {
        if (this.tooltip) return;
        this.tooltip = root.getElementById('ht-tooltip');
        
        if (!this.tooltip) {
            this.tooltip = document.createElement('div');
            this.tooltip.id = 'ht-tooltip';
            this.tooltip.className = 'ht-tooltip';
            root.appendChild(this.tooltip);
        }
    }

    show(text, rect) {
        if (!this.tooltip) return;

        this.tooltip.textContent = text;
        this.tooltip.style.display = 'block';
        
        const tooltipWidth = this.tooltip.offsetWidth;
        const tooltipHeight = this.tooltip.offsetHeight;
        
        let left = rect.left + window.scrollX + (rect.width / 2) - (tooltipWidth / 2);
        let top = rect.top + window.scrollY - tooltipHeight - 8;

        // Boundary checks
        if (left < 10) left = 10;
        if (left + tooltipWidth > window.innerWidth - 10) left = window.innerWidth - tooltipWidth - 10;
        if (top < 10) top = rect.bottom + window.scrollY + 8;

        this.tooltip.style.left = left + 'px';
        this.tooltip.style.top = top + 'px';
    }

    hide() {
        if (this.tooltip) {
            this.tooltip.style.display = 'none';
        }
    }
}

// Make it available globally
window.TooltipService = TooltipService;

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TooltipService;
}