const i18nService = new I18nService();

let weeklyReports = [];
let selectedWeekId = null;
let taskFilter = 'all';

document.addEventListener('DOMContentLoaded', async () => {
    i18nService.localizePage();

    const filterEl = document.getElementById('taskFilter');
    if (filterEl) {
        filterEl.addEventListener('change', (e) => {
            taskFilter = e.target.value;
            renderTaskBreakdown();
        });
    }

    const exportBtn = document.getElementById('exportCsvBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportWeeklyReportCsv);
    }

    await loadWeeklyReports();
});

async function loadWeeklyReports() {
    try {
    const response = await chrome.runtime.sendMessage({
        action: 'GET_FOCUS_TRACK_REPORTS',
        limit: 8
    });

    weeklyReports = response && response.success && Array.isArray(response.data)
        ? response.data
        : [];

        if (!selectedWeekId && weeklyReports.length > 0) {
            selectedWeekId = weeklyReports[0].weekId;
        }

        renderAll();
    } catch (error) {
        console.error('Failed to load weekly mission reports:', error);
        weeklyReports = [];
        renderAll();
    }
}

function renderAll() {
    renderTrend();
    renderWeekTabs();
    renderMetricCards();
    renderTaskBreakdown();
}

function getSelectedReport() {
    if (!selectedWeekId) return null;
    return weeklyReports.find((r) => r.weekId === selectedWeekId) || null;
}

function renderTrend() {
    const trendBars = document.getElementById('trendBars');
    const trendHint = document.getElementById('trendHint');
    if (!trendBars || !trendHint) return;

    trendBars.innerHTML = '';
    if (weeklyReports.length === 0) {
        trendHint.textContent = i18nService.getText('weeklyFocusReportNoData');
        return;
    }

    const ordered = [...weeklyReports].reverse();
    const best = Math.max(...ordered.map((r) => Number(r.score || 0)), 1);

    ordered.forEach((report) => {
        const score = Number(report.score || 0);
        const wrapper = document.createElement('div');
        const bar = document.createElement('div');
        const label = document.createElement('div');

        bar.className = `bar ${report.weekId === selectedWeekId ? 'active' : ''}`;
        bar.style.height = `${Math.max(8, Math.round((score / best) * 100))}%`;
        bar.title = `${report.weekId}: ${score}%`;

        label.className = 'bar-label';
        label.textContent = String(report.weekId || '--').replace(/^\d{4}-/, '');

        wrapper.appendChild(bar);
        wrapper.appendChild(label);
        trendBars.appendChild(wrapper);
    });

    const latest = weeklyReports[0];
    trendHint.textContent = `${i18nService.getText('weeklyFocusReportLatest')}: ${latest.weekId} (${latest.score}%)`;
}

function renderWeekTabs() {
    const tabs = document.getElementById('weekTabs');
    if (!tabs) return;
    tabs.innerHTML = '';

    weeklyReports.forEach((report) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `week-btn ${report.weekId === selectedWeekId ? 'active' : ''}`;
        btn.textContent = report.weekId;
        btn.addEventListener('click', () => {
            selectedWeekId = report.weekId;
            renderAll();
        });
        tabs.appendChild(btn);
    });
}

function renderMetricCards() {
    const cards = document.getElementById('metricCards');
    const selectedWeek = document.getElementById('selectedWeek');
    if (!cards || !selectedWeek) return;

    cards.innerHTML = '';
    const report = getSelectedReport();
    if (!report) {
        selectedWeek.textContent = i18nService.getText('weeklyFocusReportNoData');
        return;
    }

    selectedWeek.textContent = report.weekId;

    const metrics = [
        { label: i18nService.getText('statWeeklyFocus'), value: `${Number(report.score || 0)}%` },
        { label: i18nService.getText('weeklyFocusReportActiveVocab'), value: Number(report?.stats?.activeVocab || 0) },
        { label: i18nService.getText('weeklyFocusReportWeakCount'), value: Number(report?.stats?.weakWordCount || 0) },
        { label: i18nService.getText('weeklyFocusReportTargetTotal'), value: Number(report?.focusTargetTotal || 0) },
        { label: i18nService.getText('weeklyFocusReportProgressTotal'), value: Number(report?.focusProgressTotal || 0) }
    ];

    metrics.forEach((metric) => {
        const card = document.createElement('div');
        card.className = 'metric';
        card.innerHTML = `<div class="label">${escapeHtml(String(metric.label))}</div><div class="value">${escapeHtml(String(metric.value))}</div>`;
        cards.appendChild(card);
    });
}

function renderTaskBreakdown() {
    const taskList = document.getElementById('taskList');
    const empty = document.getElementById('taskEmpty');
    if (!taskList || !empty) return;

    taskList.innerHTML = '';
    const report = getSelectedReport();
    if (!report || !Array.isArray(report.topicBreakdown)) {
        empty.style.display = 'block';
        return;
    }

        const list = report.topicBreakdown.filter((topic) => taskFilter === 'all' || topic.id === taskFilter);
        if (list.length === 0) {
            empty.style.display = 'block';
            return;
        }
        empty.style.display = 'none';

        const filterEl = document.getElementById('taskFilter');
        if (filterEl) {
            const topics = report.topicBreakdown.map((topic) => ({
                id: topic.id,
                label: topic.label || topic.id
            }));
            filterEl.innerHTML = [
                `<option value="all">${escapeHtml(i18nService.getText('weeklyFocusReportFilterAll'))}</option>`,
                ...topics.map((topic) => `<option value="${escapeHtml(topic.id)}">${escapeHtml(topic.label)}</option>`)
            ].join('');
            if (taskFilter !== 'all' && !topics.find((topic) => topic.id === taskFilter)) {
                taskFilter = 'all';
            }
            filterEl.value = taskFilter;
        }

    list.forEach((topic) => {
        const title = topic.label || topic.id;
        const reason = topic.reason || i18nService.getText('weeklyFocusReportNoReason');
        const target = Number(topic.target || 0);
        const progress = Number(topic.progress || 0);
        const remaining = Math.max(0, target - progress);
        const reasonText = remaining > 0
            ? `${i18nService.getText('weeklyFocusReportRemaining')}: ${remaining}. ${reason}`
            : i18nService.getText('weeklyFocusReportTopicCompleted');

        const el = document.createElement('div');
        el.className = 'task-item';
        el.innerHTML = `
            <div class="task-top">
                <span>${escapeHtml(title)}</span>
                <span>${progress}/${target}</span>
            </div>
            <div class="task-reason">${escapeHtml(reasonText)}</div>
        `;
        taskList.appendChild(el);
    });
}

function exportWeeklyReportCsv() {
    if (!Array.isArray(weeklyReports) || weeklyReports.length === 0) return;

    const header = [
        'weekId',
        'score',
        'focusProgressTotal',
        'focusTargetTotal',
        'activeVocab',
        'weakWordCount',
        'completed'
    ];

    const rows = weeklyReports.map((r) => [
        r.weekId,
        Number(r.score || 0),
        Number(r.focusProgressTotal || 0),
        Number(r.focusTargetTotal || 0),
        Number(r?.stats?.activeVocab || 0),
        Number(r?.stats?.weakWordCount || 0),
        Boolean(r.completed)
    ]);

    const csv = [header, ...rows]
        .map((cols) => cols.map(csvSafe).join(','))
        .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weekly-focus-report-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function csvSafe(value) {
    const str = String(value === undefined || value === null ? '' : value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
