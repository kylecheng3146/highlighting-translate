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
            action: 'GET_WEEKLY_MISSION_REPORTS',
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
        trendHint.textContent = i18nService.getText('weeklyReportNoData');
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
    trendHint.textContent = `${i18nService.getText('weeklyReportLatest')}: ${latest.weekId} (${latest.score}%)`;
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
        selectedWeek.textContent = i18nService.getText('weeklyReportNoData');
        return;
    }

    selectedWeek.textContent = report.weekId;

    const metrics = [
        { label: i18nService.getText('statWeeklyMission'), value: `${Number(report.score || 0)}%` },
        { label: i18nService.getText('weeklyReportLearningVolume'), value: Number(report?.metrics?.totalLearningVolume || 0) },
        { label: i18nService.getText('weeklyReportDueCoverage'), value: `${Number(report?.metrics?.dueCoverage || 0)}%` },
        { label: i18nService.getText('weeklyReportWeakImprovement'), value: `${Number(report?.metrics?.weakImprovement || 0)}%` },
        { label: i18nService.getText('weeklyReportAccuracy'), value: `${Number(report?.metrics?.reviewAccuracy || 0)}%` },
        { label: i18nService.getText('weeklyReportStreak'), value: Number(report.weeklyStreak || 0) }
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
    if (!report || !Array.isArray(report.taskBreakdown)) {
        empty.style.display = 'block';
        return;
    }

    const list = report.taskBreakdown.filter((task) => taskFilter === 'all' || task.id === taskFilter);
    if (list.length === 0) {
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';

    const taskLabelMap = {
        review_due_words: i18nService.getText('missionTaskReviewDue'),
        master_weak_words: i18nService.getText('missionTaskMasterWeak'),
        discover_new_words: i18nService.getText('missionTaskDiscover')
    };
    const taskReasonMap = {
        review_due_words: i18nService.getText('missionReasonReviewDue'),
        master_weak_words: i18nService.getText('missionReasonMasterWeak'),
        discover_new_words: i18nService.getText('missionReasonDiscover')
    };

    list.forEach((task) => {
        const title = taskLabelMap[task.id] || task.title || task.id;
        const reason = taskReasonMap[task.id] || task.reason || i18nService.getText('weeklyReportNoReason');
        const target = Number(task.target || 0);
        const progress = Number(task.progress || 0);
        const remaining = Math.max(0, target - progress);
        const reasonText = remaining > 0
            ? `${i18nService.getText('weeklyReportRemaining')}: ${remaining}. ${reason}`
            : i18nService.getText('weeklyReportTaskCompleted');

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
        'missionProgressTotal',
        'missionTargetTotal',
        'totalLearningVolume',
        'reviewAttempts',
        'reviewCorrect',
        'reviewAccuracy',
        'dueCoverage',
        'weakImprovement',
        'weeklyStreak',
        'completed'
    ];

    const rows = weeklyReports.map((r) => [
        r.weekId,
        Number(r.score || 0),
        Number(r.missionProgressTotal || 0),
        Number(r.missionTargetTotal || 0),
        Number(r?.metrics?.totalLearningVolume || 0),
        Number(r?.metrics?.reviewAttempts || 0),
        Number(r?.metrics?.reviewCorrect || 0),
        Number(r?.metrics?.reviewAccuracy || 0),
        Number(r?.metrics?.dueCoverage || 0),
        Number(r?.metrics?.weakImprovement || 0),
        Number(r.weeklyStreak || 0),
        Boolean(r.completed)
    ]);

    const csv = [header, ...rows]
        .map((cols) => cols.map(csvSafe).join(','))
        .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weekly-mission-report-${Date.now()}.csv`;
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
