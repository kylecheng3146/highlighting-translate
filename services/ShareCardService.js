/**
 * ShareCardService - Generates branded shareable PNG cards for social sharing.
 */
class ShareCardService {
    constructor() {
        this.width = 384;
        this.height = 384;
    }

    /**
     * Generate canvas card from stats
     * @param {Object} stats - { streak, totalWords, monthlyNew, milestone, lastActivity }
     * @param {HTMLCanvasElement|null} [targetCanvas=null]
     * @returns {HTMLCanvasElement}
     */
    generateCard(stats = {}, targetCanvas = null) {
        let canvas = targetCanvas;
        if (!canvas) {
            if (typeof document !== 'undefined' && document.createElement) {
                canvas = document.createElement('canvas');
            } else if (typeof OffscreenCanvas !== 'undefined') {
                canvas = new OffscreenCanvas(this.width, this.height);
            }
        }

        if (!canvas) {
            throw new Error('Canvas context not available');
        }

        const scale = 2; // High-DPI scale for crisp text
        canvas.width = this.width * scale;
        canvas.height = this.height * scale;
        if (canvas.style) {
            canvas.style.width = `${this.width}px`;
            canvas.style.height = `${this.height}px`;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Failed to get 2D context');
        }
        ctx.scale(scale, scale);

        // 1. Background Gradient
        const bgGradient = ctx.createLinearGradient(0, 0, this.width, this.height);
        bgGradient.addColorStop(0, '#1a1a2e');
        bgGradient.addColorStop(0.5, '#16213e');
        bgGradient.addColorStop(1, '#0f3460');
        ctx.fillStyle = bgGradient;
        this._roundRect(ctx, 0, 0, this.width, this.height, 20);
        ctx.fill();

        // 2. Decorative Teal Glow Accents
        const glowGradient = ctx.createRadialGradient(this.width - 40, 40, 10, this.width - 40, 40, 120);
        glowGradient.addColorStop(0, 'rgba(38, 166, 154, 0.35)');
        glowGradient.addColorStop(1, 'rgba(38, 166, 154, 0)');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(0, 0, this.width, this.height);

        // 3. Header: App Name & Logo
        ctx.fillStyle = '#26a69a';
        ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('Highlighting Translate', 24, 40);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('📊 Learning Progress', 24, 70);

        // 4. Milestone Level Badge
        const milestoneText = stats.milestone && stats.milestone.displayText ? stats.milestone.displayText : (stats.milestone && stats.milestone.currentMilestone ? `${stats.milestone.currentMilestone.icon} ${stats.milestone.currentMilestone.label || stats.milestone.currentMilestone.title}` : '🌱 Beginner (0/100)');
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        this._roundRect(ctx, 24, 90, this.width - 48, 36, 10);
        ctx.fill();

        ctx.fillStyle = '#80cbc4';
        ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(`Milestone: ${milestoneText}`, 36, 113);

        // 5. Stat Cards 2x2 Grid
        const cards = [
            { icon: '🔥', label: 'Day Streak', value: `${stats.streak || 0} days` },
            { icon: '📚', label: 'Total Words', value: `${stats.totalWords || 0}` },
            { icon: '📈', label: 'This Month', value: `+${stats.monthlyNew || 0}` },
            { icon: '⏱️', label: 'Reading Time', value: `${stats.thisWeekMinutes || 0}m` }
        ];

        const startX = 24;
        const startY = 142;
        const cardW = (this.width - 48 - 12) / 2;
        const cardH = 82;
        const gap = 12;

        cards.forEach((card, index) => {
            const row = Math.floor(index / 2);
            const col = index % 2;
            const x = startX + col * (cardW + gap);
            const y = startY + row * (cardH + gap);

            // Card background
            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            this._roundRect(ctx, x, y, cardW, cardH, 12);
            ctx.fill();

            // Card border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Card content
            ctx.font = '20px sans-serif';
            ctx.fillText(card.icon, x + 14, y + 32);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillText(card.value, x + 44, y + 32);

            ctx.fillStyle = '#90a4ae';
            ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillText(card.label, x + 14, y + 60);
        });

        // 6. Footer: Date stamp
        const todayStr = stats.lastActivity || new Date().toISOString().split('T')[0];
        ctx.fillStyle = '#78909c';
        ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(`Generated on ${todayStr}`, 24, this.height - 24);

        ctx.fillStyle = '#26a69a';
        ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const brandTag = 'Keep learning ✨';
        const brandW = ctx.measureText(brandTag).width;
        ctx.fillText(brandTag, this.width - 24 - brandW, this.height - 24);

        return canvas;
    }

    /**
     * Round rectangle drawing utility
     */
    _roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    /**
     * Trigger PNG download from canvas
     * @param {HTMLCanvasElement} canvas
     * @param {string} [filename]
     */
    downloadCard(canvas, filename) {
        const dateStr = new Date().toISOString().split('T')[0];
        const name = filename || `highlighting-translate-progress-${dateStr}.png`;
        const dataUrl = canvas.toDataURL('image/png');
        
        const link = document.createElement('a');
        link.download = name;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Copy canvas image to clipboard as PNG blob
     * @param {HTMLCanvasElement} canvas
     * @returns {Promise<boolean>}
     */
    async copyToClipboard(canvas) {
        if (!navigator.clipboard || !window.ClipboardItem) {
            throw new Error('Clipboard API unavailable');
        }

        return new Promise((resolve, reject) => {
            canvas.toBlob(async (blob) => {
                if (!blob) {
                    reject(new Error('Failed to create image blob'));
                    return;
                }
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]);
                    resolve(true);
                } catch (err) {
                    reject(err);
                }
            }, 'image/png');
        });
    }
}

if (typeof window !== 'undefined') {
    window.ShareCardService = ShareCardService;
} else if (typeof self !== 'undefined') {
    self.ShareCardService = ShareCardService;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShareCardService;
}
