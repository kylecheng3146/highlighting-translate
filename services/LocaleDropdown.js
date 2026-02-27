let I18nServiceRef = typeof I18nService !== 'undefined' ? I18nService : null;
if (typeof module !== 'undefined' && module.exports && !I18nServiceRef) {
    I18nServiceRef = require('./I18nService.js');
}

class LocaleDropdown {
    constructor(i18nServiceInstance) {
        const i18n = i18nServiceInstance || new I18nServiceRef();
        this.metadata = i18n.getLocaleMetadata();
    }

    static getEntries(metadata) {
        return Object.entries(metadata)
            .filter(([code]) => code !== 'auto')
            .sort(([codeA, a], [codeB, b]) => (a.label || codeA).localeCompare(b.label || codeB, undefined, { sensitivity: 'base' }));
    }

    render(selectEl, { includeAuto = false } = {}) {
        if (!selectEl) return;
        const metadata = this.metadata;
        const entries = LocaleDropdown.getEntries(metadata);
        const currentValue = selectEl.value;
        selectEl.innerHTML = '';

        if (includeAuto && metadata.auto) {
            const option = document.createElement('option');
            option.value = 'auto';
            option.textContent = metadata.auto.label || 'Auto';
            selectEl.appendChild(option);
        }

        entries.forEach(([code, locale]) => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = locale.label || code;
            if (locale.direction) {
                option.dataset.direction = locale.direction;
            }
            selectEl.appendChild(option);
        });

        if (currentValue) {
            selectEl.value = currentValue;
        }
    }
}

if (typeof window !== 'undefined') {
    window.LocaleDropdown = LocaleDropdown;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LocaleDropdown;
}
