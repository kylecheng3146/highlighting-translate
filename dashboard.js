/**
 * Dashboard Logic - Handles data loading, Canvas growth chart rendering, range toggle, and share card export.
 */

let currentRangeDays = 30;
let dashboardData = null;
let chartPoints = [];
let shareCardService = null;
let themeService = null;
let i18nService = null;

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
    const current = milestone.currentMilestone || {};
    const labelKeys = {
        beginner: 'milestoneBeginner',
        intermediate: 'milestoneIntermediate',
        advanced: 'milestoneAdvanced',
        master: 'milestoneMaster'
    };
    const label = t(labelKeys[current.id] || 'milestoneBeginner');
    const icon = current.icon || (milestone.isMax ? '🏆' : '🌱');
    const count = milestone.currentWords ?? totalWords;

    if (milestone.isMax) {
        return t('milestoneMax', { icon, label, count });
    }
    return t('milestoneProgress', {
        icon,
        label,
        count,
        target: milestone.targetWords ?? 100
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize services
    if (typeof I18nService !== 'undefined') {
        i18nService = new I18nService();
        i18nService.localizePage();
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
    rangeButtons.forEach((btn) => {
        btn.addEventListener('click', async () => {
            rangeButtons.forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            const days = parseInt(btn.dataset.days, 10) || 30;
            currentRangeDays = days;
            await loadDashboard(currentRangeDays);
        });
    });

    // Share Modal
    const openShareModalBtn = document.getElementById('openShareModalBtn');
    const shareModalOverlay = document.getElementById('shareModalOverlay');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const shareCanvas = document.getElementById('shareCanvas');
    const downloadCardBtn = document.getElementById('downloadCardBtn');
    const copyCardBtn = document.getElementById('copyCardBtn');

    if (openShareModalBtn && shareModalOverlay) {
        openShareModalBtn.addEventListener('click', () => {
            if (dashboardData && dashboardData.overview && shareCardService && shareCanvas) {
                shareCardService.generateCard(dashboardData.overview, shareCanvas);
            }
            shareModalOverlay.classList.add('active');
        });
    }

    if (closeModalBtn && shareModalOverlay) {
        closeModalBtn.addEventListener('click', () => {
            shareModalOverlay.classList.remove('active');
        });
    }

    if (shareModalOverlay) {
        shareModalOverlay.addEventListener('click', (e) => {
            if (e.target === shareModalOverlay) {
                shareModalOverlay.classList.remove('active');
            }
        });
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
                    await shareCardService.copyToClipboard(shareCanvas);
                    showToast(t('toastCopySuccess'));
                } catch (err) {
                    console.error('Clipboard copy error:', err);
                    showToast(t('toastCopyFailed'));
                }
            }
        });
    }

    // Canvas Tooltip mouse interactions
    const growthCanvas = document.getElementById('growthCanvas');
    const chartTooltip = document.getElementById('chartTooltip');

    if (growthCanvas && chartTooltip) {
        growthCanvas.addEventListener('mousemove', (e) => {
            handleCanvasHover(e, growthCanvas, chartTooltip);
        });
        growthCanvas.addEventListener('mouseleave', () => {
            chartTooltip.style.display = 'none';
        });
    }
}

/**
 * Load dashboard overview, chart, and insights from background
 */
async function loadDashboard(days = 30) {
    try {
        const response = await chrome.runtime.sendMessage({
            action: 'GET_DASHBOARD_DATA',
            days
        });

        if (!response || !response.success || !response.data) {
            console.error('Failed to load dashboard data:', response);
            return;
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
            renderCanvasChart(chartPoints);
        }
    } catch (error) {
        console.error('Dashboard load error:', error);
    }
}

/**
 * Render Overview 4-metric cards
 */
function renderOverviewMetrics(overview = {}) {
    const streakEl = document.getElementById('dashStreakVal');
    const wordsEl = document.getElementById('dashWordsVal');
    const monthlyEl = document.getElementById('dashMonthlyVal');
    const weekTimeEl = document.getElementById('dashWeekTimeVal');

    if (streakEl) streakEl.textContent = `${overview.streak || 0}`;
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
    if (badgeEl) {
        badgeEl.textContent = formatMilestone(milestone, overview.totalWords || 0);
    }
    if (percentEl) {
        percentEl.textContent = `${milestone.percentage || 0}%`;
    }
    if (barEl) {
        barEl.style.width = `${milestone.percentage || 0}%`;
    }
}

/**
 * Render Insights & Reading statistics
 */
function renderInsights(insights = {}, overview = {}) {
    const peakDayTitleEl = document.getElementById('dashPeakDayTitle');
    const peakDayDescEl = document.getElementById('dashPeakDayDesc');
    const avgDailyDescEl = document.getElementById('dashAvgDailyDesc');
    const streakInsightEl = document.getElementById('dashStreakInsight');

    if (peakDayDescEl) {
        const dayName = localizeDayName(insights.peakDayName || insights.peakDayNameZh || 'Wednesday');
        peakDayDescEl.textContent = t('dashboardPeakDayDescription', { day: dayName });
    }
    if (avgDailyDescEl) {
        const avg = insights.avgDailyWords || 0;
        avgDailyDescEl.textContent = t('dashboardAverageDailyDescription', {
            average: avg,
            days: insights.activeDaysCount || 0
        });
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
    const mouseY = event.clientY - rect.top;

    // Find closest point by X coordinate
    let closest = null;
    let minDistance = Infinity;

    for (const pt of chartGeometry.points) {
        const dist = Math.abs(pt.x - mouseX);
        if (dist < minDistance) {
            minDistance = dist;
            closest = pt;
        }
    }

    if (closest && minDistance < 35) {
        const { data, x, y } = closest;
        tooltip.style.display = 'block';
        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
        tooltip.innerHTML = `
            <strong>${data.date} (${localizeDayName(data.dayName)})</strong><br>
            ${t('dashboardChartNewToday')}: <b>+${data.count}</b><br>
            ${t('dashboardChartCumulativeWords')}: <b>${data.cumulative}</b>
        `;
    } else {
        tooltip.style.display = 'none';
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
