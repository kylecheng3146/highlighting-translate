// 載入設定
async function loadSettings() {
    try {
        const settings = await chrome.storage.sync.get({
            autoTranslate: true,
            autoCopy: false,
            autoPlaySpeech: false,
            sourceLang: 'auto',
            targetLang: 'zh-TW',
            delay: 500,
            enableHighlighting: true,
            enablePhrasalVerbs: true,
            enableMissionReminder: false,
            missionReminderHour: 20,
            domainBlacklist: [],
            enableFocusTrack: true,
            focusInTooltip: true,
            focusInReview: true,
            focusInPopup: true,
            focusExperimentFlag: false
        });

        // 更新 UI
        const autoTranslateCheck = document.getElementById('autoTranslateCheck');
        if (autoTranslateCheck) autoTranslateCheck.checked = settings.autoTranslate;

        const autoCopyCheck = document.getElementById('autoCopyCheck');
        if (autoCopyCheck) autoCopyCheck.checked = settings.autoCopy;

        const autoPlaySpeechCheck = document.getElementById('autoPlaySpeechCheck');
        if (autoPlaySpeechCheck) autoPlaySpeechCheck.checked = settings.autoPlaySpeech;
        
        const sourceLang = document.getElementById('sourceLang');
        if (sourceLang) sourceLang.value = settings.sourceLang;
        
        const targetLang = document.getElementById('targetLang');
        if (targetLang) targetLang.value = settings.targetLang;
        
        const delay = document.getElementById('delay');
        if (delay) delay.value = settings.delay;

        const enableHighlightCheck = document.getElementById('enableHighlightCheck');
        if (enableHighlightCheck) enableHighlightCheck.checked = settings.enableHighlighting;

        const enablePhrasalVerbsCheck = document.getElementById('enablePhrasalVerbsCheck');
        if (enablePhrasalVerbsCheck) enablePhrasalVerbsCheck.checked = settings.enablePhrasalVerbs;

        const enableMissionReminderCheck = document.getElementById('enableMissionReminderCheck');
        if (enableMissionReminderCheck) enableMissionReminderCheck.checked = !!settings.enableMissionReminder;

        const enableFocusTrackCheck = document.getElementById('enableFocusTrackCheck');
        if (enableFocusTrackCheck) enableFocusTrackCheck.checked = settings.enableFocusTrack !== false;

        const focusInTooltipCheck = document.getElementById('focusInTooltipCheck');
        if (focusInTooltipCheck) focusInTooltipCheck.checked = settings.focusInTooltip !== false;

        const focusInReviewCheck = document.getElementById('focusInReviewCheck');
        if (focusInReviewCheck) focusInReviewCheck.checked = settings.focusInReview !== false;

        const focusInPopupCheck = document.getElementById('focusInPopupCheck');
        if (focusInPopupCheck) focusInPopupCheck.checked = settings.focusInPopup !== false;

        const focusExperimentFlagCheck = document.getElementById('focusExperimentFlagCheck');
        if (focusExperimentFlagCheck) focusExperimentFlagCheck.checked = settings.focusExperimentFlag === true;

        // Blacklist button logic
        updateBlacklistButton(settings.domainBlacklist);
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
}

async function updateBlacklistButton(blacklist) {
    const btn = document.getElementById('blacklistBtn');
    if (!btn) return;

    try {
        const tabs = await chrome.tabs.query({active: true, currentWindow: true});
        if (tabs && tabs[0] && tabs[0].url) {
            const url = new URL(tabs[0].url);
            const domain = url.hostname;
            
            if (['chrome:', 'chrome-extension:', 'edge:', 'about:', 'moz-extension:'].includes(url.protocol)) {
                btn.style.display = 'none';
                return;
            }

            btn.style.display = 'block';
            const isBlacklisted = blacklist.includes(domain);
            btn.textContent = i18nService.getText(isBlacklisted ? 'whitelistBtn' : 'blacklistBtn');
            btn.dataset.domain = domain;
            btn.dataset.isBlacklisted = isBlacklisted;
        } else {
            btn.style.display = 'none';
        }
    } catch (e) {
        btn.style.display = 'none';
    }
}

// 安全地發送消息到 content script
async function sendMessageToContentScript(message) {
    try {
        const tabs = await chrome.tabs.query({active: true, currentWindow: true});
        if (tabs && tabs[0]) {
            const tab = tabs[0];

            if (!tab.url || tab.url.startsWith('chrome://') ||
                tab.url.startsWith('chrome-extension://') ||
                tab.url.startsWith('edge://') ||
                tab.url.startsWith('about:') ||
                tab.url.startsWith('moz-extension://')) {
                return;
            }

            await chrome.tabs.sendMessage(tab.id, message);
        }
    } catch (error) {
        console.log('Cannot send message to content script:', error.message);
    }
}

// 顯示 Snackbar
function showSnackbar() {
    const snackbar = document.getElementById("snackbar");
    if (snackbar) {
        snackbar.className = "show";
        setTimeout(() => {
            snackbar.className = snackbar.className.replace("show", "");
        }, 2000);
    }
}

// 儲存設定
async function saveSettings() {
    const enableMissionReminder = document.getElementById('enableMissionReminderCheck').checked;

    if (enableMissionReminder) {
        const granted = await ensureMissionReminderPermission();
        if (!granted) {
            document.getElementById('enableMissionReminderCheck').checked = false;
        }
    }

    const settings = {
        autoTranslate: document.getElementById('autoTranslateCheck').checked,
        autoCopy: document.getElementById('autoCopyCheck').checked,
        autoPlaySpeech: document.getElementById('autoPlaySpeechCheck').checked,
        sourceLang: document.getElementById('sourceLang').value,
        targetLang: document.getElementById('targetLang').value,
        delay: parseInt(document.getElementById('delay').value) || 500,
        enableHighlighting: document.getElementById('enableHighlightCheck').checked,
        enablePhrasalVerbs: document.getElementById('enablePhrasalVerbsCheck').checked,
        enableMissionReminder: document.getElementById('enableMissionReminderCheck').checked,
        missionReminderHour: 20,
        enableFocusTrack: document.getElementById('enableFocusTrackCheck')?.checked ?? true,
        focusInTooltip: document.getElementById('focusInTooltipCheck')?.checked ?? true,
        focusInReview: document.getElementById('focusInReviewCheck')?.checked ?? true,
        focusInPopup: document.getElementById('focusInPopupCheck')?.checked ?? true,
        focusExperimentFlag: document.getElementById('focusExperimentFlagCheck')?.checked ?? false
    };

    try {
        // Merge with existing blacklist which isn't in UI but in storage
        const data = await chrome.storage.sync.get({ domainBlacklist: [] });
        settings.domainBlacklist = data.domainBlacklist;

        await chrome.storage.sync.set(settings);
        await chrome.runtime.sendMessage({
            action: 'SET_MISSION_REMINDER',
            enabled: settings.enableMissionReminder,
            hour: settings.missionReminderHour
        });
        showSnackbar();

        await sendMessageToContentScript({
            action: 'updateSettings',
            settings: settings
        });
    } catch (error) {
        console.error('Failed to save settings:', error);
    }
}

async function ensureMissionReminderPermission() {
    if (!chrome.permissions || !chrome.permissions.request) {
        return false;
    }

    try {
        const alreadyGranted = await chrome.permissions.contains({ permissions: ['notifications', 'alarms'] });
        if (alreadyGranted) return true;
        return await chrome.permissions.request({ permissions: ['notifications', 'alarms'] });
    } catch (error) {
        console.warn('Mission reminder permission denied:', error);
        return false;
    }
}

async function loadWeeklyMission() {
    const weekEl = document.getElementById('missionWeek');
    const progressTextEl = document.getElementById('missionProgressText');
    const progressBarEl = document.getElementById('missionProgressBar');
    const tasksEl = document.getElementById('missionTasks');

    if (!weekEl || !progressTextEl || !progressBarEl || !tasksEl) return;

    try {
        const response = await chrome.runtime.sendMessage({ action: 'GET_WEEKLY_MISSION' });
        const mission = response && response.success ? response.data : null;

        const taskLabelMap = {
            review_due_words: i18nService.getText('missionTaskReviewDue'),
            master_weak_words: i18nService.getText('missionTaskMasterWeak'),
            discover_new_words: i18nService.getText('missionTaskDiscover')
        };

        if (!mission || !Array.isArray(mission.tasks)) {
            weekEl.textContent = i18nService.getText('missionNoData');
            progressTextEl.textContent = '0%';
            progressBarEl.style.width = '0%';
            tasksEl.innerHTML = `<li>${i18nService.getText('missionNoTask')}</li>`;
            return;
        }

        weekEl.textContent = mission.weekId;
        const score = Number(mission?.summary?.score || 0);
        progressTextEl.textContent = `${score}%`;
        progressBarEl.style.width = `${score}%`;

        tasksEl.innerHTML = mission.tasks
            .map((task) => {
                const taskLabel = taskLabelMap[task.id] || task.title || task.id;
                return `<li>- ${taskLabel} ${task.progress}/${task.target}</li>`;
            })
            .join('');
    } catch (error) {
        console.warn('Failed to load weekly mission:', error);
        weekEl.textContent = i18nService.getText('missionError');
    }
}

async function loadFocusTrack() {
    const weekEl = document.getElementById('focusWeek');
    const progressTextEl = document.getElementById('focusProgressText');
    const progressBarEl = document.getElementById('focusProgressBar');
    const topicsEl = document.getElementById('focusTopics');
    const focusCard = document.getElementById('focusCard');

    if (!weekEl || !progressTextEl || !progressBarEl || !topicsEl || !focusCard) return;

    const settings = await chrome.storage.sync.get({
        enableFocusTrack: true,
        focusInPopup: true,
        focusExperimentFlag: false
    });

    const enabled = settings.enableFocusTrack !== false && settings.focusInPopup !== false && !settings.focusExperimentFlag;
    focusCard.style.display = enabled ? 'flex' : 'none';
    if (!enabled) return;

    try {
        const response = await chrome.runtime.sendMessage({ action: 'GET_FOCUS_TRACK' });
        const track = response && response.success ? response.data : null;

        if (!track || !Array.isArray(track.topics)) {
            weekEl.textContent = i18nService.getText('focusNoData');
            progressTextEl.textContent = '0%';
            progressBarEl.style.width = '0%';
            topicsEl.innerHTML = `<li>${i18nService.getText('focusNoTopic')}</li>`;
            return;
        }

        weekEl.textContent = track.weekId;
        const score = Number(track?.summary?.score || 0);
        progressTextEl.textContent = `${score}%`;
        progressBarEl.style.width = `${score}%`;

        topicsEl.innerHTML = track.topics
            .map((topic) => {
                const label = topic.label || topic.id;
                return `<li>- ${label} ${topic.progress}/${topic.target}</li>`;
            })
            .join('');
    } catch (error) {
        console.warn('Failed to load focus track:', error);
        weekEl.textContent = i18nService.getText('focusError');
    }
}

async function loadDashboardStats() {
    const streakValEl = document.getElementById('statStreakVal');
    const wordsValEl = document.getElementById('statWordsVal');
    const monthlyValEl = document.getElementById('statMonthlyVal');
    const weekTimeValEl = document.getElementById('statWeekTimeVal');
    const milestoneTitleEl = document.getElementById('milestoneTitle');
    const milestonePercentEl = document.getElementById('milestonePercent');
    const milestoneProgressBarEl = document.getElementById('milestoneProgressBar');
    const streakPromptBox = document.getElementById('streakPromptBox');

    if (!streakValEl || !wordsValEl) return;

    try {
        const response = await chrome.runtime.sendMessage({ action: 'GET_STATS' });
        if (!response || !response.success || !response.data) return;

        const data = response.data;

        // Animate / Set Values
        updateStatNumber(streakValEl, `${data.streak || 0}`);
        updateStatNumber(wordsValEl, `${data.totalWords || 0}`);
        updateStatNumber(monthlyValEl, `+${data.monthlyNew || 0}`);
        updateStatNumber(weekTimeValEl, `${data.thisWeekMinutes || 0}m`);

        // Milestone
        if (data.milestone) {
            if (milestoneTitleEl) {
                milestoneTitleEl.textContent = typeof i18nService.formatMilestone === 'function'
                    ? i18nService.formatMilestone(data.milestone, data.totalWords || 0)
                    : (data.milestone.displayText || '🌱 Beginner (0/100)');
            }
            const percentage = Math.max(0, Math.min(100, Number(data.milestone.percentage || 0)));
            if (milestonePercentEl) milestonePercentEl.textContent = `${percentage}%`;
            if (milestoneProgressBarEl) {
                milestoneProgressBarEl.style.width = `${percentage}%`;
                milestoneProgressBarEl.setAttribute('aria-valuenow', String(percentage));
            }
        }

        // Streak reminder prompt
        if (streakPromptBox) {
            if (!data.hasLearnedToday) {
                streakPromptBox.style.display = 'block';
            } else {
                streakPromptBox.style.display = 'none';
            }
        }
    } catch (error) {
        console.warn('Failed to load dashboard stats:', error);
    }
}

function updateStatNumber(el, newValue) {
    if (!el) return;
    if (el.textContent !== newValue) {
        el.textContent = newValue;
        el.classList.remove('pop');
        void el.offsetWidth; // Trigger reflow for CSS animation
        el.classList.add('pop');
    }
}

async function toggleBlacklist() {
    const btn = document.getElementById('blacklistBtn');
    const domain = btn.dataset.domain;
    const isBlacklisted = btn.dataset.isBlacklisted === 'true';

    try {
        const data = await chrome.storage.sync.get({ domainBlacklist: [] });
        let blacklist = data.domainBlacklist;

        if (isBlacklisted) {
            blacklist = blacklist.filter(d => d !== domain);
        } else {
            blacklist.push(domain);
        }

        await chrome.storage.sync.set({ domainBlacklist: blacklist });
        showSnackbar();
        
        // Refresh UI
        updateBlacklistButton(blacklist);

        // Update content script
        const settings = await chrome.storage.sync.get();
        await sendMessageToContentScript({
            action: 'updateSettings',
            settings: settings
        });
    } catch (error) {
        console.error('Failed to toggle blacklist:', error);
    }
}

// I18nService instance
const i18nService = new I18nService();
const LocaleDropdownClass = typeof LocaleDropdown !== 'undefined'
    ? LocaleDropdown
    : (typeof module !== 'undefined' ? require('./services/LocaleDropdown.js') : null);
const localeDropdown = LocaleDropdownClass ? new LocaleDropdownClass(i18nService) : null;
const themeService = new ThemeService();

function renderLanguageOptions() {
    const sourceSelect = document.getElementById('sourceLang');
    const targetSelect = document.getElementById('targetLang');
    if (!localeDropdown) return;
    localeDropdown.render(sourceSelect, { includeAuto: true });
    localeDropdown.render(targetSelect);
}

// 事件監聽
document.addEventListener('DOMContentLoaded', async () => {
    i18nService.localizePage();
    renderLanguageOptions();

    const initialMilestoneEl = document.getElementById('milestoneTitle');
    if (initialMilestoneEl && typeof i18nService.formatMilestone === 'function') {
        initialMilestoneEl.textContent = i18nService.formatMilestone();
    }
    
    // Load Theme First (Visual Priority)
    const currentColor = await themeService.loadAndApply();
    renderThemeSwatches(currentColor);
    
    // Load other settings
    loadSettings();
    loadDashboardStats();
    loadWeeklyMission();
    loadFocusTrack();

    const openDashboardBtn = document.getElementById('openDashboardBtn');
    if (openDashboardBtn) {
        openDashboardBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: 'dashboard.html' });
        });
    }

    const dismissStreakPrompt = document.getElementById('dismissStreakPrompt');
    if (dismissStreakPrompt) {
        dismissStreakPrompt.addEventListener('click', () => {
            const box = document.getElementById('streakPromptBox');
            if (box) box.style.display = 'none';
        });
    }

    const customColorPicker = document.getElementById('customColorPicker');
    if (customColorPicker) {
        customColorPicker.value = currentColor;
        customColorPicker.addEventListener('input', (e) => {
            handleThemeChange(e.target.value);
        });
        customColorPicker.addEventListener('change', (e) => {
             // Final save on change
             themeService.saveTheme(e.target.value);
        });
    }

    // ... existing listeners ...

    const autoTranslateCheck = document.getElementById('autoTranslateCheck');
    if (autoTranslateCheck) autoTranslateCheck.addEventListener('change', saveSettings);

    const autoCopyCheck = document.getElementById('autoCopyCheck');
    if (autoCopyCheck) autoCopyCheck.addEventListener('change', saveSettings);

    const autoPlaySpeechCheck = document.getElementById('autoPlaySpeechCheck');
    if (autoPlaySpeechCheck) autoPlaySpeechCheck.addEventListener('change', saveSettings);

    const sourceLang = document.getElementById('sourceLang');
    if (sourceLang) sourceLang.addEventListener('change', saveSettings);

    const targetLang = document.getElementById('targetLang');
    if (targetLang) targetLang.addEventListener('change', saveSettings);

    const delay = document.getElementById('delay');
    if (delay) delay.addEventListener('change', saveSettings);

    const enableHighlightCheck = document.getElementById('enableHighlightCheck');
    if (enableHighlightCheck) enableHighlightCheck.addEventListener('change', saveSettings);

    const enablePhrasalVerbsCheck = document.getElementById('enablePhrasalVerbsCheck');
    if (enablePhrasalVerbsCheck) enablePhrasalVerbsCheck.addEventListener('change', saveSettings);

    const enableMissionReminderCheck = document.getElementById('enableMissionReminderCheck');
    if (enableMissionReminderCheck) enableMissionReminderCheck.addEventListener('change', saveSettings);

    const enableFocusTrackCheck = document.getElementById('enableFocusTrackCheck');
    if (enableFocusTrackCheck) enableFocusTrackCheck.addEventListener('change', saveSettings);

    const focusInTooltipCheck = document.getElementById('focusInTooltipCheck');
    if (focusInTooltipCheck) focusInTooltipCheck.addEventListener('change', saveSettings);

    const focusInReviewCheck = document.getElementById('focusInReviewCheck');
    if (focusInReviewCheck) focusInReviewCheck.addEventListener('change', saveSettings);

    const focusInPopupCheck = document.getElementById('focusInPopupCheck');
    if (focusInPopupCheck) focusInPopupCheck.addEventListener('change', saveSettings);

    const focusExperimentFlagCheck = document.getElementById('focusExperimentFlagCheck');
    if (focusExperimentFlagCheck) focusExperimentFlagCheck.addEventListener('change', saveSettings);

    const blacklistBtn = document.getElementById('blacklistBtn');
    if (blacklistBtn) blacklistBtn.addEventListener('click', toggleBlacklist);

    // List available TTS voices for debugging
    chrome.tts.getVoices((voices) => {
        console.log('Available TTS Voices:', voices);
        const voiceNames = voices.map(v => `${v.voiceName} (${v.lang})`);
        console.log(voiceNames.join('\n'));
    });

    const historyBtn = document.getElementById('historyBtn');
    if (historyBtn) {
        historyBtn.addEventListener('click', () => {
             chrome.tabs.create({ url: 'history.html' });
        });
    }

// ... existing code ...
    const reviewBtn = document.getElementById('reviewBtn');
    if (reviewBtn) {
        reviewBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: 'review.html' });
        });
    }

    const missionReviewBtn = document.getElementById('missionReviewBtn');
    if (missionReviewBtn) {
        missionReviewBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: 'review.html' });
        });
    }

    const missionDetailBtn = document.getElementById('missionDetailBtn');
    if (missionDetailBtn) {
        missionDetailBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: 'report.html' });
        });
    }

    const focusReviewBtn = document.getElementById('focusReviewBtn');
    if (focusReviewBtn) {
        focusReviewBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: 'review.html' });
        });
    }

    const focusDetailBtn = document.getElementById('focusDetailBtn');
    if (focusDetailBtn) {
        focusDetailBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: 'history.html' });
        });
    }
});

function renderThemeSwatches(activeColor) {
    const container = document.getElementById('themeSwatches');
    if (!container) return;
    
    container.innerHTML = '';
    
    themeService.presets.forEach(preset => {
        const swatch = document.createElement('div');
        swatch.className = 'swatch';
        swatch.style.backgroundColor = preset.color;
        swatch.title = preset.name;
        
        // Check equality (case insensitive)
        if (preset.color.toLowerCase() === activeColor.toLowerCase()) {
            swatch.classList.add('active');
        }
        
        swatch.addEventListener('click', () => {
             handleThemeChange(preset.color);
             themeService.saveTheme(preset.color);
             // Update active state UI
             document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
             swatch.classList.add('active');
             
             // Update picker value
             const picker = document.getElementById('customColorPicker');
             if (picker) picker.value = preset.color;
        });
        
        container.appendChild(swatch);
    });
}

function handleThemeChange(color) {
    themeService.applyTheme(color);
}

if (typeof window !== 'undefined') {
    window.i18nService = i18nService;
    window.themeService = themeService;
}
