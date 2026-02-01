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

    show(text, rect, rank = null, level = null) {
        if (!this.tooltip) return;

        let content = '';
        if (rank) {
            const levelClass = rank <= 3000 ? 'level-high' : (rank <= 10000 ? 'level-mid' : 'level-low');
            content = `
                <div class="ht-tooltip-header">
                    <span class="ht-rank-badge ${levelClass}">#${rank}</span>
                    <span class="ht-rank-badge ${levelClass}">${level || ''}</span>
                </div>
                <div class="ht-tooltip-translation">${text}</div>
            `;
        } else {
            content = `<div class="ht-tooltip-translation">${text}</div>`;
        }

        this.tooltip.innerHTML = content;
        this.tooltip.style.display = 'block';
        
        const tooltipWidth = this.tooltip.offsetWidth;
        const tooltipHeight = this.tooltip.offsetHeight;
        
        let left = rect.left + window.scrollX + (rect.width / 2) - (tooltipWidth / 2);
        let top = rect.top + window.scrollY - tooltipHeight - 12;

        // Boundary checks
        if (left < 10) left = 10;
        if (left + tooltipWidth > window.innerWidth - 10) left = window.innerWidth - tooltipWidth - 10;
        
        // If it would go off the top of the screen, show it below the text
        if (top < window.scrollY + 10) {
            top = rect.bottom + window.scrollY + 12;
        }

        this.tooltip.style.left = left + 'px';
        this.tooltip.style.top = top + 'px';
        
        // Trigger animation
        void this.tooltip.offsetWidth;
        this.tooltip.classList.add('ht-show');
    }

    hide() {
        if (this.tooltip) {
            this.tooltip.classList.remove('ht-show');
            setTimeout(() => {
                if (!this.tooltip.classList.contains('ht-show')) {
                    this.tooltip.style.display = 'none';
                }
            }, 200);
        }
    }
}

// Make it available globally
window.TooltipService = TooltipService;

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TooltipService;
}