const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, 'dashboard.html'), 'utf8');

describe('Dashboard page structure', () => {
    test('includes progress details, recovery action, and chart accessibility hooks', () => {
        expect(html).toContain('id="dashBestStreakVal"');
        expect(html).toContain('id="dashWeekReadingDesc"');
        expect(html).toContain('id="dashAvgReadingDesc"');
        expect(html).toContain('id="dashTopDomainInsight"');
        expect(html).toContain('id="dashboardError" role="alert"');
        expect(html).toContain('id="retryDashboardBtn"');
        expect(html).toContain('id="growthCanvas" role="img" tabindex="0"');
        expect(html).toContain('aria-describedby="chartSummary"');
    });

    test('marks the share modal as hidden until it is opened', () => {
        expect(html).toContain('id="shareModalOverlay" aria-hidden="true"');
    });
});

describe('Dashboard interactions', () => {
    test('shows a retry state and restores focus after closing the share modal', async () => {
        document.body.innerHTML = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)[1];

        const canvasContext = {
            scale: jest.fn(),
            clearRect: jest.fn(),
            createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
            beginPath: jest.fn(),
            moveTo: jest.fn(),
            lineTo: jest.fn(),
            bezierCurveTo: jest.fn(),
            closePath: jest.fn(),
            fill: jest.fn(),
            stroke: jest.fn(),
            fillText: jest.fn(),
            arc: jest.fn()
        };
        const getContext = HTMLCanvasElement.prototype.getContext;
        const getBoundingClientRect = HTMLCanvasElement.prototype.getBoundingClientRect;
        HTMLCanvasElement.prototype.getContext = jest.fn(() => canvasContext);
        HTMLCanvasElement.prototype.getBoundingClientRect = jest.fn(() => ({
            width: 600,
            height: 240,
            left: 0,
            top: 0
        }));

        global.ThemeService = class {
            loadAndApply() {
                return Promise.resolve();
            }
        };
        global.I18nService = class {
            localizePage() {}
            formatMilestone() {
                return '🌱 Beginner (0/100)';
            }
            getText(key, values = {}) {
                const text = {
                    dashboardBestStreakDescription: 'Best streak: {best} days',
                    dashboardPeakDayDescription: '{day} ({minutes} minutes)',
                    dashboardAverageDailyDescription: '{average} words ({days} days)',
                    dashboardReadingMinutesDescription: '{minutes} minutes this week',
                    dashboardAverageReadingDescription: '{average} minutes ({days} days)',
                    dashboardTopDomainDescription: '{domain} ({count} saved words)',
                    dashboardNoDomainInsight: 'No reading focus yet',
                    dashboardStreakInactiveDescription: 'Start today',
                    dashboardChartNoData: 'No chart data'
                }[key] || key;
                return Object.entries(values).reduce(
                    (result, [name, value]) => result.replace(`{${name}}`, String(value)),
                    text
                );
            }
        };
        global.ShareCardService = class {
            generateCard() {}
            downloadCard() {}
            copyToClipboard() {
                return Promise.resolve(true);
            }
        };
        global.chrome = {
            runtime: {
                sendMessage: jest.fn().mockRejectedValue(new Error('offline'))
            }
        };
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        jest.resetModules();
        require('./dashboard.js');
        document.dispatchEvent(new Event('DOMContentLoaded'));
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(document.getElementById('dashboardError').hidden).toBe(false);

        chrome.runtime.sendMessage.mockResolvedValue({
            success: true,
            data: {
                overview: {
                    streak: 2,
                    bestStreak: 4,
                    totalWords: 12,
                    monthlyNew: 3,
                    thisWeekMinutes: 8,
                    milestone: {}
                },
                chart: [
                    { date: '2026-09-15', label: '9/15', dayName: 'Tue', count: 2, cumulative: 11 },
                    { date: '2026-09-16', label: '9/16', dayName: 'Wed', count: 1, cumulative: 12 }
                ],
                insights: {
                    hasEnoughHistory: false,
                    peakDayName: 'Wednesday',
                    peakDayMinutes: 3,
                    avgDailyWords: 1,
                    activeDaysCount: 1,
                    avgDailyMinutes: 3,
                    weeklyActiveDays: 1,
                    topDomain: 'docs.example.com',
                    topDomainCount: 2
                }
            }
        });
        document.getElementById('retryDashboardBtn').click();
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(document.getElementById('dashboardError').hidden).toBe(true);
        expect(document.getElementById('dashBestStreakVal').textContent).toBe('Best streak: 4 days');
        expect(document.getElementById('dashTopDomainInsight').textContent).toBe('docs.example.com (2 saved words)');
        expect(document.querySelector('.insights-grid').classList.contains('single-card')).toBe(true);

        const chart = document.getElementById('growthCanvas');
        chart.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
        expect(document.getElementById('chartSummary').textContent).toContain('2026-09-15');

        const shareButton = document.getElementById('openShareModalBtn');
        const overlay = document.getElementById('shareModalOverlay');
        shareButton.focus();
        shareButton.click();
        expect(overlay.getAttribute('aria-hidden')).toBe('false');
        overlay.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(overlay.getAttribute('aria-hidden')).toBe('true');
        expect(document.activeElement).toBe(shareButton);

        errorSpy.mockRestore();
        HTMLCanvasElement.prototype.getContext = getContext;
        HTMLCanvasElement.prototype.getBoundingClientRect = getBoundingClientRect;
    });
});
