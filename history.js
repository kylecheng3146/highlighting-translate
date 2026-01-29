document.addEventListener('DOMContentLoaded', () => {
    loadHistory();

    document.getElementById('clearAll').addEventListener('click', clearAllHistory);
});

async function loadHistory() {
    const list = document.getElementById('historyList');
    const emptyState = document.getElementById('emptyState');
    
    list.innerHTML = '';
    
    try {
        const data = await chrome.storage.sync.get('savedTranslations');
        const items = data.savedTranslations || [];

        if (items.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        items.forEach((item, index) => {
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
                deleteItem(index);
            });

            list.appendChild(li);
        });
    } catch (error) {
        console.error('Failed to load history:', error);
    }
}

async function deleteItem(index) {
    try {
        const data = await chrome.storage.sync.get('savedTranslations');
        const items = data.savedTranslations || [];
        
        items.splice(index, 1);
        
        await chrome.storage.sync.set({ savedTranslations: items });
        loadHistory(); // Reload list
    } catch (error) {
        console.error('Failed to delete item:', error);
    }
}

async function clearAllHistory() {
    if (!confirm('確定要清空所有紀錄嗎？')) {
        return;
    }

    try {
        await chrome.storage.sync.set({ savedTranslations: [] });
        loadHistory();
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
