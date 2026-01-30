const storageService = new StorageService();
const i18nService = new I18nService();
let currentOffset = 0;
const PAGE_SIZE = 50;

document.addEventListener('DOMContentLoaded', () => {
    i18nService.localizePage();
    loadHistory(true);

    document.getElementById('clearAll').addEventListener('click', clearAllHistory);
    document.getElementById('loadMoreBtn').addEventListener('click', () => loadHistory(false));
});

async function loadHistory(reset = true) {
    const list = document.getElementById('historyList');
    const emptyState = document.getElementById('emptyState');
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    
    if (reset) {
        list.innerHTML = '';
        currentOffset = 0;
    }
    
    try {
        const items = await storageService.getTranslations(PAGE_SIZE, currentOffset);

        if (reset && items.length === 0) {
            emptyState.style.display = 'block';
            loadMoreContainer.style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';
        
        // Check if there are more items
        const nextItems = await storageService.getTranslations(1, currentOffset + PAGE_SIZE);
        loadMoreContainer.style.display = nextItems.length > 0 ? 'block' : 'none';

        items.forEach((item) => {
            const li = document.createElement('li');
            li.className = 'history-item';
            
            const date = new Date(item.timestamp).toLocaleString();
            // Truncate URL for display
            const shortUrl = item.sourceUrl ? new URL(item.sourceUrl).hostname : '';

            li.innerHTML = `
                <div class="item-content">
                    <div class="original">${escapeHtml(item.text)}</div>
                    <div class="translation">${escapeHtml(item.translation)}</div>
                    <div class="meta">
                        <span>${escapeHtml(item.sourceLang)} → ${escapeHtml(item.targetLang)}</span>
                        <span>•</span>
                        <span>${date}</span>
                        ${shortUrl ? `<span>•</span><a href="${item.sourceUrl}" target="_blank">${shortUrl}</a>` : ''}
                    </div>
                </div>
                <button class="delete-btn" title="Delete">×</button>
            `;

            // Delete button event
            li.querySelector('.delete-btn').addEventListener('click', () => {
                deleteItem(item.text, item.translation);
            });

            list.appendChild(li);
        });

        currentOffset += items.length;
    } catch (error) {
        console.error('Failed to load history:', error);
    }
}

async function deleteItem(text, translation) {
    if (!confirm(i18nService.getText('deleteConfirm'))) {
        return;
    }
    try {
        await storageService.removeTranslation(text, translation);
        loadHistory(true); // Reload list from start to reflect changes
    } catch (error) {
        console.error('Failed to delete item:', error);
    }
}

async function clearAllHistory() {
    if (!confirm(i18nService.getText('clearConfirm'))) {
        return;
    }

    try {
        await storageService.clearAll();
        loadHistory(true);
    } catch (error) {
        console.error('Failed to clear history:', error);
    }
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
