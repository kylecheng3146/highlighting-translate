/**
 * Dashboard Logic - Handles data loading, Canvas growth chart rendering, range toggle, and share card export.
 */

let currentRangeDays = 30;
let dashboardData = null;
let chartPoints = [];
let shareCardService = null;
let themeService = null;
let i18nService = null;
let lastFocusedElement = null;
let chartFocusIndex = -1;
let dashboardLoadInProgress = false;

function t(key, values) {
    return i18nService ? i18nService.getText(key, values) : key;
}

function localizeDayName(dayName = '') {
    const dayKeys = {
        sunday: 'daySunday', sun: 'daySunday', '週日': 'daySunday',
        monday: 'dayMonday', mon: 'dayMonday', '週一': 'dayMonday',
        tuesday: 'dayTuesday', tue: 'dayTuesday', '週二': 'dayTuesday',
        wednesday: 'dayWednesday', wed: 'dayWednesday', '週三': 'dayWednesday',
        thursday: 'dayThursday', thu: 'dayThursday', '週四': 'dayThursday',
        friday: 'dayFriday', fri: 'dayFriday', '週五': 'dayFriday',
        saturday: 'daySaturday', sat: 'daySaturday', '週六': 'daySaturday'
    };
    const key = dayKeys[String(dayName).trim().toLowerCase()];
    return key ? t(key) : dayName;
}

function formatMilestone(milestone = {}, totalWords = 0) {
    if (i18nService && typeof i18nService.formatMilestone === 'function') {
        return i18nService.formatMilestone(milestone, totalWords);
    }
    const current = (milestone && milestone.currentMilestone) || {};
    const labelKeys = {
        beginner: 'milestoneBeginner',
        intermediate: 'milestoneIntermediate',
        advanced: 'milestoneAdvanced',
        master: 'milestoneMaster'
    };
    const label = t(labelKeys[current.id] || 'milestoneBeginner');
    const icon = current.icon || (milestone && milestone.isMax ? '🏆' : '🌱');
    const count = (milestone && milestone.currentWords !== undefined) ? milestone.currentWords : totalWords;

    if (milestone && milestone.isMax) {
        return t('milestoneMax', { icon, label, count });
    }
    return t('milestoneProgress', {
        icon,
        label,
        count,
        target: (milestone && milestone.targetWords !== undefined) ? milestone.targetWords : 100
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize services
    if (typeof I18nService !== 'undefined') {
        i18nService = new I18nService();
        i18nService.localizePage();
        const badgeEl = document.getElementById('dashMilestoneBadge');
        if (badgeEl && typeof i18nService.formatMilestone === 'function') {
            badgeEl.textContent = i18nService.formatMilestone();
        }
    }
    if (typeof ThemeService !== 'undefined') {
        themeService = new ThemeService();
        await themeService.loadAndApply();
    }
    if (typeof ShareCardService !== 'undefined') {
        shareCardService = new ShareCardService();
    }

    // Set up listeners
    setupEventListeners();

    // Initial load
    await loadDashboard(currentRangeDays);

    // Window resize handler for responsive chart
    window.addEventListener('resize', () => {
        if (chartPoints && chartPoints.length > 0) {
            renderCanvasChart(chartPoints);
        }
    });
});

/**
 * Event Listeners setup
 */
function setupEventListeners() {
    // Back button
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.close();
            }
        });
    }

    // Range buttons
    const rangeButtons = document.querySelectorAll('.range-btn');
    const updateRangeState = (activeButton) => {
        rangeButtons.forEach((button) => {
            const active = button === activeButton;
            button.classList.toggle('active', active);
            button.setAttribute('aria-pressed', String(active));
        });
    };

    rangeButtons.forEach((btn, index) => {
        btn.addEventListener('click', async () => {
            updateRangeState(btn);
            const days = parseInt(btn.dataset.days, 10) || 30;
            currentRangeDays = days;
            await loadDashboard(currentRangeDays);
        });
        btn.addEventListener('keydown', (event) => {
            if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
            event.preventDefault();
            const offset = event.key === 'ArrowLeft' ? -1 : 1;
            const next = rangeButtons[index + offset];
            if (next) {
                next.focus();
                next.click();
            }
        });
    });

    // Share Modal
    const openShareModalBtn = document.getElementById('openShareModalBtn');
    const shareModalOverlay = document.getElementById('shareModalOverlay');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const shareCanvas = document.getElementById('shareCanvas');
    const downloadCardBtn = document.getElementById('downloadCardBtn');
    const copyCardBtn = document.getElementById('copyCardBtn');
    const retryDashboardBtn = document.getElementById('retryDashboardBtn');

    if (retryDashboardBtn) {
        retryDashboardBtn.addEventListener('click', () => loadDashboard(currentRangeDays));
    }

    if (openShareModalBtn && shareModalOverlay) {
        openShareModalBtn.addEventListener('click', () => {
            lastFocusedElement = document.activeElement;
            if (dashboardData && dashboardData.overview && shareCardService && shareCanvas) {
                shareCardService.generateCard(dashboardData.overview, shareCanvas);
            }
            shareModalOverlay.classList.add('active');
            shareModalOverlay.setAttribute('aria-hidden', 'false');
            if (closeModalBtn) closeModalBtn.focus();
        });
    }

    if (closeModalBtn && shareModalOverlay) {
        closeModalBtn.addEventListener('click', () => {
            closeShareModal(shareModalOverlay);
        });
    }

    if (shareModalOverlay) {
        shareModalOverlay.addEventListener('click', (e) => {
            if (e.target === shareModalOverlay) {
                closeShareModal(shareModalOverlay);
            }
        });
        shareModalOverlay.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') closeShareModal(shareModalOverlay);
        });
        if (closeModalBtn) {
            closeModalBtn.setAttribute('aria-label', t('dashboardCloseModal'));
        }
        if (shareCanvas) {
            shareCanvas.setAttribute('aria-label', t('shareProgressTitle'));
        }
    }

    if (downloadCardBtn && shareCanvas) {
        downloadCardBtn.addEventListener('click', () => {
            if (shareCardService) {
                shareCardService.downloadCard(shareCanvas);
                showToast(t('toastDownloadStarted'));
            }
        });
    }

    if (copyCardBtn && shareCanvas) {
        copyCardBtn.addEventListener('click', async () => {
            if (shareCardService) {
                try {
                    copyCardBtn.disabled = true;
                    await shareCardService.copyToClipboard(shareCanvas);
                    showToast(t('toastCopySuccess'));
                } catch (err) {
                    console.error('Clipboard copy error:', err);
                    showToast(t('toastCopyFailed'));
                } finally {
                    copyCardBtn.disabled = false;
                }
            }
        });
    }

    // Canvas Tooltip mouse interactions
    const growthCanvas = document.getElementById('growthCanvas');
    const chartTooltip = document.getElementById('chartTooltip');

    if (growthCanvas && chartTooltip) {
        growthCanvas.setAttribute('aria-label', t('dashboardChartNoData'));
        growthCanvas.addEventListener('mousemove', (e) => {
            handleCanvasHover(e, growthCanvas, chartTooltip);
        });
        growthCanvas.addEventListener('keydown', (e) => {
            handleCanvasKeydown(e, chartTooltip);
        });
        growthCanvas.addEventListener('mouseleave', () => {
            chartTooltip.style.display = 'none';
        });
    }
}

function closeShareModal(overlay) {
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
    }
}

function setDashboardError(visible) {
    const errorEl = document.getElementById('dashboardError');
    if (errorEl) errorEl.hidden = !visible;
}

function setDashboardLoading(loading) {
    dashboardLoadInProgress = loading;
    const container = document.querySelector('.dashboard-container');
    const retryButton = document.getElementById('retryDashboardBtn');
    if (container) container.setAttribute('aria-busy', String(loading));
    if (retryButton) retryButton.disabled = loading;
    document.querySelectorAll('.range-btn').forEach((button) => {
        button.disabled = loading;
    });
}

/**
 * Load dashboard overview, chart, and insights from background
 */
async function loadDashboard(days = 30) {
    if (dashboardLoadInProgress) return;
    setDashboardLoading(true);
    setDashboardError(false);
    try {
        const response = await chrome.runtime.sendMessage({
            action: 'GET_DASHBOARD_DATA',
            days
        });

        if (!response || !response.success || !response.data) {
            throw new Error('Dashboard data unavailable');
        }

        dashboardData = response.data;
        const { overview, chart, insights } = dashboardData;

        // Render UI sections
        renderOverviewMetrics(overview);
        renderMilestone(overview);
        renderInsights(insights, overview);

        // Render Growth Chart
        if (chart && Array.isArray(chart)) {
            chartPoints = chart;
            const hasData = chart.some((point) => Number(point.count || 0) > 0);
            const emptyState = document.getElementById('chartEmptyState');
            if (emptyState) emptyState.hidden = hasData;
            updateChartSummary(chart, days, hasData);
            renderCanvasChart(chartPoints);
        }
    } catch (error) {
        console.error('Dashboard load error:', error);
        setDashboardError(true);
    } finally {
        setDashboardLoading(false);
    }
}

/**
 * Render Overview 4-metric cards
 */
function renderOverviewMetrics(overview = {}) {
    const streakEl = document.getElementById('dashStreakVal');
    const bestStreakEl = document.getElementById('dashBestStreakVal');
    const wordsEl = document.getElementById('dashWordsVal');
    const monthlyEl = document.getElementById('dashMonthlyVal');
    const weekTimeEl = document.getElementById('dashWeekTimeVal');

    if (streakEl) streakEl.textContent = `${overview.streak || 0}`;
    if (bestStreakEl) {
        bestStreakEl.textContent = t('dashboardBestStreakDescription', {
            best: overview.bestStreak || overview.streak || 0
        });
    }
    if (wordsEl) wordsEl.textContent = `${overview.totalWords || 0}`;
    if (monthlyEl) monthlyEl.textContent = `+${overview.monthlyNew || 0}`;
    if (weekTimeEl) weekTimeEl.textContent = `${overview.thisWeekMinutes || 0}m`;
}

/**
 * Render Milestone Level Banner
 */
function renderMilestone(overview = {}) {
    const badgeEl = document.getElementById('dashMilestoneBadge');
    const percentEl = document.getElementById('dashMilestonePercent');
    const barEl = document.getElementById('dashMilestoneBar');

    const milestone = overview.milestone || {};
    const formatted = formatMilestone(milestone, overview.totalWords || 0);
    if (overview.milestone) {
        overview.milestone.displayText = formatted;
    }
    if (badgeEl) {
        badgeEl.textContent = formatted;
    }
    if (percentEl) {
        percentEl.textContent = `${milestone.percentage || 0}%`;
    }
    if (barEl) {
        const percentage = Math.max(0, Math.min(100, Number(milestone.percentage || 0)));
        barEl.style.width = `${percentage}%`;
        barEl.setAttribute('aria-valuenow', String(percentage));
    }
}

/**
 * Render Insights & Reading statistics
 */
function renderInsights(insights = {}, overview = {}) {
    const peakDayDescEl = document.getElementById('dashPeakDayDesc');
    const avgDailyDescEl = document.getElementById('dashAvgDailyDesc');
    const weekReadingDescEl = document.getElementById('dashWeekReadingDesc');
    const avgReadingDescEl = document.getElementById('dashAvgReadingDesc');
    const streakInsightEl = document.getElementById('dashStreakInsight');
    const topDomainInsightEl = document.getElementById('dashTopDomainInsight');
    const learningInsightsCard = document.getElementById('learningInsightsCard');
    const insightsGrid = document.querySelector('.insights-grid');
    const hasEnoughHistory = insights.hasEnoughHistory === true;

    if (learningInsightsCard) {
        learningInsightsCard.hidden = !hasEnoughHistory;
    }
    if (insightsGrid) {
        insightsGrid.classList.toggle('single-card', !hasEnoughHistory);
    }

    if (peakDayDescEl) {
        if (insights.activeDaysCount > 0) {
            const dayName = localizeDayName(insights.peakDayName || insights.peakDayNameZh);
            peakDayDescEl.textContent = t('dashboardPeakDayDescription', {
                day: dayName,
                minutes: insights.peakDayMinutes || 0
            });
        } else {
            peakDayDescEl.textContent = t('dashboardChartNoData');
        }
    }
    if (avgDailyDescEl) {
        const avg = insights.avgDailyWords || 0;
        avgDailyDescEl.textContent = t('dashboardAverageDailyDescription', {
            average: avg,
            days: insights.activeDaysCount || 0
        });
    }
    if (weekReadingDescEl) {
        weekReadingDescEl.textContent = t('dashboardReadingMinutesDescription', {
            minutes: overview.thisWeekMinutes || insights.thisWeekMinutes || 0
        });
    }
    if (avgReadingDescEl) {
        avgReadingDescEl.textContent = t('dashboardAverageReadingDescription', {
            average: insights.avgDailyMinutes || 0,
            days: insights.weeklyActiveDays || 0
        });
    }
    if (topDomainInsightEl) {
        topDomainInsightEl.textContent = insights.topDomain
            ? t('dashboardTopDomainDescription', {
                domain: insights.topDomain,
                count: insights.topDomainCount || 0
            })
            : t('dashboardNoDomainInsight');
    }
    if (streakInsightEl && overview.streak !== undefined) {
        if (overview.streak > 0) {
            streakInsightEl.textContent = t('dashboardStreakActiveDescription', {
                streak: overview.streak,
                best: overview.bestStreak || overview.streak
            });
        } else {
            streakInsightEl.textContent = t('dashboardStreakInactiveDescription');
        }
    }
}

function updateChartSummary(points, days, hasData) {
    const canvas = document.getElementById('growthCanvas');
    const summary = document.getElementById('chartSummary');
    chartFocusIndex = hasData ? points.length - 1 : -1;

    if (!hasData || points.length === 0) {
        if (canvas) canvas.setAttribute('aria-label', t('dashboardChartNoData'));
        if (summary) summary.textContent = t('dashboardChartNoData');
        return;
    }

    const latest = points[points.length - 1];
    const text = `${t('growthChartTitle')} (${days}D): ${t('dashboardChartCumulativeWords')} ${latest.cumulative}; ${t('dashboardChartNewToday')} +${latest.count}`;
    if (canvas) canvas.setAttribute('aria-label', text);
    if (summary) summary.textContent = text;
}

/**
 * Custom High-DPI Canvas Line Chart Renderer
 */
let chartGeometry = { points: [], paddingLeft: 45, paddingBottom: 30, paddingTop: 20, paddingRight: 20, width: 0, height: 0 };

function renderCanvasChart(points = []) {
    const canvas = document.getElementById('growthCanvas');
    if (!canvas || points.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const width = rect.width || canvas.parentElement.clientWidth || 600;
    const height = rect.height || 240;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const padding = { left: 45, right: 20, top: 25, bottom: 30 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Determine Y scale
    let maxVal = 0;
    points.forEach((p) => {
        if (p.cumulative > maxVal) maxVal = p.cumulative;
    });
    if (maxVal === 0) maxVal = 10;
    const yMax = Math.ceil(maxVal * 1.15);

    // Clear
    ctx.clearRect(0, 0, width, height);

    // 1. Gridlines & Y-Axis Labels
    const gridRows = 4;
    ctx.strokeStyle = '#eceff1';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#90a4ae';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'right';

    for (let i = 0; i <= gridRows; i++) {
        const val = Math.round((yMax / gridRows) * (gridRows - i));
        const y = padding.top + (chartH / gridRows) * i;

        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();

        ctx.fillText(`${val}`, padding.left - 8, y + 4);
    }

    // 2. Map coordinates
    const coords = points.map((p, idx) => {
        const x = padding.left + (chartW / (points.length - 1 || 1)) * idx;
        const y = padding.top + chartH - (p.cumulative / yMax) * chartH;
        return { x, y, data: p };
    });

    chartGeometry = {
        points: coords,
        paddingLeft: padding.left,
        paddingRight: padding.right,
        paddingTop: padding.top,
        paddingBottom: padding.bottom,
        width,
        height
    };

    // 3. Area Fill (Gradient)
    const areaGradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
    areaGradient.addColorStop(0, 'rgba(38, 166, 154, 0.28)');
    areaGradient.addColorStop(1, 'rgba(38, 166, 154, 0.01)');

    ctx.beginPath();
    ctx.moveTo(coords[0].x, padding.top + chartH);
    ctx.lineTo(coords[0].x, coords[0].y);

    for (let i = 1; i < coords.length; i++) {
        const prev = coords[i - 1];
        const curr = coords[i];
        const cx = (prev.x + curr.x) / 2;
        ctx.bezierCurveTo(cx, prev.y, cx, curr.y, curr.x, curr.y);
    }

    ctx.lineTo(coords[coords.length - 1].x, padding.top + chartH);
    ctx.closePath();
    ctx.fillStyle = areaGradient;
    ctx.fill();

    // 4. Line Stroke
    ctx.beginPath();
    ctx.moveTo(coords[0].x, coords[0].y);

    for (let i = 1; i < coords.length; i++) {
        const prev = coords[i - 1];
        const curr = coords[i];
        const cx = (prev.x + curr.x) / 2;
        ctx.bezierCurveTo(cx, prev.y, cx, curr.y, curr.x, curr.y);
    }

    ctx.strokeStyle = '#26a69a';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // 5. Data Points & X-Axis Labels
    const labelStep = Math.ceil(points.length / 7);
    ctx.textAlign = 'center';

    coords.forEach((pt, idx) => {
        // Draw small dot on active or sampled points
        if (points.length <= 14 || idx % labelStep === 0 || idx === coords.length - 1) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#00897b';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Draw X-axis label
        if (idx % labelStep === 0 || idx === coords.length - 1) {
            ctx.fillStyle = '#78909c';
            ctx.font = '11px sans-serif';
            ctx.fillText(pt.data.label, pt.x, height - 8);
        }
    });
}

/**
 * Handle mouse hover over Canvas chart to show dynamic tooltip
 */
function handleCanvasHover(event, canvas, tooltip) {
    if (!chartGeometry || !chartGeometry.points || chartGeometry.points.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;

    // Find closest point by X coordinate
    let closest = null;
    let closestIndex = -1;
    let minDistance = Infinity;

    chartGeometry.points.forEach((pt, index) => {
        const dist = Math.abs(pt.x - mouseX);
        if (dist < minDistance) {
            minDistance = dist;
            closest = pt;
            closestIndex = index;
        }
    });

    if (closest && minDistance < 35) {
        chartFocusIndex = closestIndex;
        showChartPoint(closest, tooltip);
    } else {
        tooltip.style.display = 'none';
    }
}

function handleCanvasKeydown(event, tooltip) {
    if (!chartGeometry || !chartGeometry.points || chartGeometry.points.length === 0) return;

    const { key } = event;
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) return;

    event.preventDefault();
    const lastIndex = chartGeometry.points.length - 1;
    if (key === 'Home') {
        chartFocusIndex = 0;
    } else if (key === 'End') {
        chartFocusIndex = lastIndex;
    } else {
        const currentIndex = chartFocusIndex < 0 ? lastIndex : chartFocusIndex;
        chartFocusIndex = key === 'ArrowLeft'
            ? Math.max(0, currentIndex - 1)
            : Math.min(lastIndex, currentIndex + 1);
    }

    showChartPoint(chartGeometry.points[chartFocusIndex], tooltip);
}

function showChartPoint(point, tooltip) {
    const { data, x, y } = point;
    tooltip.style.display = 'block';
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
    tooltip.innerHTML = `
        <strong>${data.date} (${localizeDayName(data.dayName)})</strong><br>
        ${t('dashboardChartNewToday')}: <b>+${data.count}</b><br>
        ${t('dashboardChartCumulativeWords')}: <b>${data.cumulative}</b>
    `;

    const summary = document.getElementById('chartSummary');
    if (summary) {
        summary.textContent = `${data.date} (${localizeDayName(data.dayName)}): ${t('dashboardChartNewToday')} +${data.count}; ${t('dashboardChartCumulativeWords')} ${data.cumulative}`;
    }
}

/**
 * Toast Notification Helper
 */
function showToast(message) {
    const toast = document.getElementById('toastMsg');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2800);
}
