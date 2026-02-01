const storageService = new StorageService();
const i18nService = new I18nService();
let currentOffset = 0;
const PAGE_SIZE = 50;

document.addEventListener('DOMContentLoaded', () => {
    i18nService.localizePage();
    loadHistory(true);
    updateDashboard();

    document.getElementById('clearAll').addEventListener('click', clearAllHistory);
    document.getElementById('loadMoreBtn').addEventListener('click', () => loadHistory(false));
});

async function updateDashboard() {
    try {
        // Load all items to calculate stats
        const allItems = await storageService.getTranslations(5000, 0);
        const totalCount = allItems.length;
        
        // Mastery Index based on SRS stage (assuming stage 5+ is mastered)
        const masteredCount = allItems.filter(item => (item.srs_stage || 0) >= 5).length;
        const masteryIndex = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;

        // Coverage Stats
        const top2kMastered = new Set(allItems.filter(i => i.frequency_rank && i.frequency_rank <= 2000).map(i => i.text.toLowerCase())).size;
        const top5kMastered = new Set(allItems.filter(i => i.frequency_rank && i.frequency_rank <= 5000).map(i => i.text.toLowerCase())).size;

        // Animate Numbers
        animateNumber(document.getElementById('stat-total-count'), 0, totalCount, 1000);
        animateNumber(document.getElementById('stat-mastery-index'), 0, masteryIndex, 1000, '%');

        // Update Progress Bars
        const coverage2kPercent = Math.min((top2kMastered / 2000) * 100, 100);
        const coverage5kPercent = Math.min((top5kMastered / 5000) * 100, 100);

        setTimeout(() => {
            document.getElementById('bar-coverage-2k').style.width = `${coverage2kPercent}%`;
            document.getElementById('bar-coverage-5k').style.width = `${coverage5kPercent}%`;
            document.getElementById('label-coverage-2k').innerText = `${top2kMastered} / 2000`;
            document.getElementById('label-coverage-5k').innerText = `${top5kMastered} / 5000`;
        }, 100);

    } catch (error) {
        console.error('Failed to update dashboard:', error);
    }
}

function animateNumber(element, start, end, duration, suffix = '') {
    let startTime = null;
    const step = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.innerText = value + suffix;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

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

            const freqBadge = item.frequency_rank ? `
                <span style="font-size: 10px; background: #eee; padding: 2px 6px; border-radius: 4px; color: #666; font-weight: bold; margin-bottom: 8px; display: inline-block;">
                    #${item.frequency_rank} ${item.cefr_level || ''}
                </span>
            ` : '';

            li.innerHTML = `
                <div class="item-content">
                    ${freqBadge}
                    <div class="original">${escapeHtml(item.text)}</div>
                    <div class="translation">${escapeHtml(item.translation)}</div>
                    ${item.context ? `<div class="context">"${highlightContext(item.context, item.text)}"</div>` : ''}
                    <div class="meta">
                        <div class="meta-info">
                            <span>${date}</span>
                            ${shortUrl ? `<span>•</span><a href="${item.sourceUrl}" target="_blank">${shortUrl}</a>` : ''}
                        </div>
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

function highlightContext(context, text) {
    if (!context || !text) return context;
    
    try {
        const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedText})`, 'gi');
        return escapeHtml(context).replace(regex, '<mark>$1</mark>');
    } catch (e) {
        return escapeHtml(context);
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
