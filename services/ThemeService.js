class ThemeService {
    constructor() {
        this.defaultColor = '#26A69A'; // Teal
        this.presets = [
            { name: 'Teal', color: '#26A69A' },
            { name: 'Blue', color: '#42A5F5' },
            { name: 'Purple', color: '#AB47BC' },
            { name: 'Orange', color: '#FF7043' },
            { name: 'Red', color: '#EF5350' },
            { name: 'Slate', color: '#78909C' }
        ];
    }

    /**
     * Applies the theme color to the document root variables.
     * @param {string} colorHex 
     */
    applyTheme(colorHex) {
        if (!colorHex) colorHex = this.defaultColor;

        const root = document.documentElement;
        root.style.setProperty('--primary', colorHex);
        
        // Calculate darker hover color (approximate)
        const hoverColor = this.adjustBrightness(colorHex, -15);
        root.style.setProperty('--primary-hover', hoverColor);

        // Calculate lighter background tint
        const lightColor = this.adjustBrightness(colorHex, 180); // Very light
        root.style.setProperty('--primary-light', lightColor);
        
        // For Content Script injection
        root.style.setProperty('--ht-primary', colorHex);
        root.style.setProperty('--ht-primary-hover', hoverColor);
    }

    /**
     * Loads the saved theme from storage and applies it.
     */
    async loadAndApply() {
        try {
            const { themeColor } = await chrome.storage.sync.get('themeColor');
            this.applyTheme(themeColor || this.defaultColor);
            return themeColor || this.defaultColor;
        } catch (e) {
            console.error('Failed to load theme:', e);
            this.applyTheme(this.defaultColor);
            return this.defaultColor;
        }
    }

    /**
     * Saves the theme color to storage.
     * @param {string} colorHex 
     */
    async saveTheme(colorHex) {
        try {
            await chrome.storage.sync.set({ themeColor: colorHex });
            this.applyTheme(colorHex);
            
            // Notify content scripts
            this.notifyContentScript(colorHex);
        } catch (e) {
            console.error('Failed to save theme:', e);
        }
    }

    async notifyContentScript(colorHex) {
        try {
            const tabs = await chrome.tabs.query({active: true, currentWindow: true});
            if (tabs && tabs[0]) {
                 chrome.tabs.sendMessage(tabs[0].id, {
                     action: 'updateTheme',
                     themeColor: colorHex
                 });
            }
        } catch (e) {
            console.log('Error notifying content script:', e);
        }
    }

    // Helper to adjust brightness
    adjustBrightness(col, amt) {
        let usePound = false;
        if (col[0] == "#") {
            col = col.slice(1);
            usePound = true;
        }
        let num = parseInt(col, 16);
        let r = (num >> 16) + amt;
        if (r > 255) r = 255;
        else if (r < 0) r = 0;
        let b = ((num >> 8) & 0x00FF) + amt;
        if (b > 255) b = 255;
        else if (b < 0) b = 0;
        let g = (num & 0x0000FF) + amt;
        if (g > 255) g = 255;
        else if (g < 0) g = 0;
        return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
    }
}

// Export global for standard usage
window.ThemeService = ThemeService;
if (typeof module !== 'undefined') module.exports = ThemeService;
