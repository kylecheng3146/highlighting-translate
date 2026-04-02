importScripts(
    'services/TranslationService.js',
    'services/SRSService.js',
    'services/StorageService.js',
    'services/MissionService.js',
    'services/FocusTrackService.js'
);

// Initialize Services
const translationService = new TranslationService();
const srsService = new SRSService();
const storageService = new StorageService();
const missionService = new MissionService();
const focusTrackService = new FocusTrackService();

// 擴展安裝時的初始化
chrome.runtime.onInstalled.addListener(async () => {
    // 創建右鍵菜單
    chrome.contextMenus.create({
        id: "translate",
        title: "Translate: %s",
        contexts: ["selection"]
    });

    // Load phrasal verbs DB into storage
    await loadPhrasalVerbsDB();
    await ensureWeeklyMission(true);
    await ensureFocusTrack(true);

    // Dynamic Injection: Inject content scripts into existing tabs
    await injectContentScripts();
});

// Service Workers are ephemeral — reload phrasal verbs DB on every startup
// Note: Top-level service instances (translationService, storageService, etc.) are
// re-created each time the SW wakes up. StorageService uses _ensureCache() lazily,
// so no state is lost across SW terminations.
chrome.runtime.onStartup.addListener(async () => {
    await loadPhrasalVerbsDB();
    await ensureWeeklyMission();
    await ensureFocusTrack();
});

async function ensureWeeklyMission(forceRegenerate = false) {
    try {
        const data = await chrome.storage.local.get(missionService.STORAGE_KEY);
        const existingMission = data[missionService.STORAGE_KEY];
        const vocab = await storageService.getTranslations(5000, 0);

        if (!forceRegenerate && !missionService.shouldRegenerateWeek(existingMission)) {
            const reconciled = missionService.reconcileWithCurrentData(existingMission, vocab || [], Date.now());
            await chrome.storage.local.set({
                [missionService.STORAGE_KEY]: reconciled,
                [missionService.FOCUS_WORDS_KEY]: reconciled?.focusWords || []
            });
            await upsertMissionWeeklyReport(reconciled, vocab || []);
            return reconciled;
        }

        const nextMission = missionService.generateWeeklyMission(vocab || [], existingMission || null, Date.now());
        await chrome.storage.local.set({
            [missionService.STORAGE_KEY]: nextMission,
            [missionService.FOCUS_WORDS_KEY]: nextMission.focusWords || []
        });
        await upsertMissionWeeklyReport(nextMission, vocab || []);
        return nextMission;
    } catch (error) {
        console.error('Failed to ensure weekly mission:', error);
        return null;
    }
}

async function ensureFocusTrack(forceRegenerate = false) {
    try {
        const data = await chrome.storage.local.get(focusTrackService.STORAGE_KEY);
        const existingTrack = data[focusTrackService.STORAGE_KEY];
        const vocab = await storageService.getTranslations(5000, 0);

        if (!forceRegenerate && !focusTrackService.shouldRegenerateWeek(existingTrack)) {
            const reconciled = focusTrackService.reconcileWithCurrentData(existingTrack, vocab || [], Date.now());
            const focusWords = focusTrackService.buildFocusWords(reconciled);
            await chrome.storage.local.set({
                [focusTrackService.STORAGE_KEY]: reconciled,
                [focusTrackService.FOCUS_WORDS_KEY]: focusWords
            });
            await upsertFocusWeeklyReport(reconciled, vocab || []);
            return reconciled;
        }

        const nextTrack = focusTrackService.generateFocusTrack(vocab || [], existingTrack || null, Date.now());
        const focusWords = focusTrackService.buildFocusWords(nextTrack);
        await chrome.storage.local.set({
            [focusTrackService.STORAGE_KEY]: nextTrack,
            [focusTrackService.FOCUS_WORDS_KEY]: focusWords
        });
        await upsertFocusWeeklyReport(nextTrack, vocab || []);
        return nextTrack;
    } catch (error) {
        console.error('Failed to ensure focus track:', error);
        return null;
    }
}

function normalizeFocusReport(report = {}) {
    return {
        weekId: report.weekId || '',
        completed: Boolean(report.completed),
        score: Number(report.score || 0),
        generatedAt: Number(report.generatedAt || 0),
        updatedAt: Number(report.updatedAt || Date.now()),
        focusProgressTotal: Number(report.focusProgressTotal || 0),
        focusTargetTotal: Number(report.focusTargetTotal || 0),
        stats: {
            activeVocab: Number(report?.stats?.activeVocab || 0),
            weakWordCount: Number(report?.stats?.weakWordCount || 0)
        },
        topicBreakdown: Array.isArray(report.topicBreakdown) ? report.topicBreakdown.map((topic) => ({
            id: topic.id,
            label: topic.label,
            reason: topic.reason,
            target: Number(topic.target || 0),
            progress: Number(topic.progress || 0),
            status: topic.status || 'pending'
        })) : []
    };
}

function buildFocusReport(track, vocabList = [], now = Date.now()) {
    if (!track || !Array.isArray(track.topics)) return null;

    const activeWords = (vocabList || []).filter((item) => !item.isArchived);
    const weakWordCount = activeWords.filter((item) => Number(item.learningRate || 0) < 60).length;

    return normalizeFocusReport({
        weekId: track.weekId,
        completed: track.completed,
        score: Number(track?.summary?.score || 0),
        generatedAt: Number(track.generatedAt || now),
        updatedAt: now,
        focusProgressTotal: Number(track?.summary?.progressTotal || 0),
        focusTargetTotal: Number(track?.summary?.targetTotal || 0),
        stats: {
            activeVocab: activeWords.length,
            weakWordCount
        },
        topicBreakdown: track.topics
    });
}

async function upsertFocusWeeklyReport(track, vocabList = null) {
    if (!track || !track.weekId) return;

    const now = Date.now();
    const vocab = Array.isArray(vocabList) ? vocabList : await storageService.getTranslations(5000, 0);
    const report = buildFocusReport(track, vocab || [], now);
    if (!report) return;

    const data = await chrome.storage.local.get(focusTrackService.REPORTS_KEY);
    const existing = Array.isArray(data[focusTrackService.REPORTS_KEY])
        ? data[focusTrackService.REPORTS_KEY].map((item) => normalizeFocusReport(item))
        : [];

    const index = existing.findIndex((item) => item.weekId === report.weekId);
    if (index >= 0) {
        existing[index] = report;
    } else {
        existing.push(report);
    }

    existing.sort((a, b) => Number(b.generatedAt || 0) - Number(a.generatedAt || 0));
    const trimmed = existing.slice(0, 24);
    await chrome.storage.local.set({ [focusTrackService.REPORTS_KEY]: trimmed });
}

async function getFocusWeeklyReports(limit = 8) {
    const data = await chrome.storage.local.get(focusTrackService.REPORTS_KEY);
    const items = Array.isArray(data[focusTrackService.REPORTS_KEY]) ? data[focusTrackService.REPORTS_KEY] : [];
    return items
        .map((item) => normalizeFocusReport(item))
        .sort((a, b) => Number(b.generatedAt || 0) - Number(a.generatedAt || 0))
        .slice(0, Math.max(1, Number(limit || 8)));
}

function normalizeMissionReport(report = {}) {
    return {
        weekId: report.weekId || '',
        completed: Boolean(report.completed),
        score: Number(report.score || 0),
        generatedAt: Number(report.generatedAt || 0),
        updatedAt: Number(report.updatedAt || Date.now()),
        missionProgressTotal: Number(report.missionProgressTotal || 0),
        missionTargetTotal: Number(report.missionTargetTotal || 0),
        weeklyStreak: Number(report.weeklyStreak || 0),
        stats: {
            activeVocab: Number(report?.stats?.activeVocab || 0),
            dueWordCount: Number(report?.stats?.dueWordCount || 0),
            weakWordCount: Number(report?.stats?.weakWordCount || 0)
        },
        metrics: {
            reviewAttempts: Number(report?.metrics?.reviewAttempts || 0),
            reviewCorrect: Number(report?.metrics?.reviewCorrect || 0),
            reviewAccuracy: Number(report?.metrics?.reviewAccuracy || 0),
            totalLearningVolume: Number(report?.metrics?.totalLearningVolume || 0),
            dueCoverage: Number(report?.metrics?.dueCoverage || 0),
            weakImprovement: Number(report?.metrics?.weakImprovement || 0)
        },
        taskBreakdown: Array.isArray(report.taskBreakdown) ? report.taskBreakdown.map((task) => ({
            id: task.id,
            title: task.title,
            reason: task.reason,
            target: Number(task.target || 0),
            progress: Number(task.progress || 0),
            status: task.status || 'pending'
        })) : []
    };
}

function buildMissionReport(mission, vocabList = [], now = Date.now()) {
    if (!mission || !Array.isArray(mission.tasks)) return null;

    const dueTask = mission.tasks.find((task) => task.id === missionService.TASK_IDS.REVIEW_DUE_WORDS);
    const weakTask = mission.tasks.find((task) => task.id === missionService.TASK_IDS.MASTER_WEAK_WORDS);
    const summary = mission.summary || {};
    const eventStats = summary.eventStats || {};

    const reviewAttempts = Number(eventStats.reviewAttempts || 0);
    const reviewCorrect = Number(eventStats.reviewCorrect || 0);
    const reviewAccuracy = reviewAttempts > 0 ? Math.round((reviewCorrect / reviewAttempts) * 100) : 0;
    const newWordsSaved = Number(eventStats.newWordsSaved || 0);
    const weakWordsImproved = Number(eventStats.weakWordsImproved || 0);
    const totalLearningVolume = reviewAttempts + newWordsSaved + weakWordsImproved;

    const dueCoverage = Number(dueTask?.target || 0) > 0
        ? Math.round((Number(dueTask?.progress || 0) / Number(dueTask?.target || 0)) * 100)
        : 100;
    const weakImprovement = Number(weakTask?.target || 0) > 0
        ? Math.round((Number(weakTask?.progress || 0) / Number(weakTask?.target || 0)) * 100)
        : 100;

    const activeWords = (vocabList || []).filter((item) => !item.isArchived);
    const dueWordCount = activeWords.filter((item) => item.nextReview && item.nextReview <= now).length;
    const weakWordCount = activeWords.filter((item) => Number(item.learningRate || 0) < 60).length;

    return normalizeMissionReport({
        weekId: mission.weekId,
        completed: mission.completed,
        score: Number(summary.score || 0),
        generatedAt: Number(mission.generatedAt || now),
        updatedAt: now,
        missionProgressTotal: Number(summary.progressTotal || 0),
        missionTargetTotal: Number(summary.targetTotal || 0),
        weeklyStreak: Number(summary.weeklyStreak || 0),
        stats: {
            activeVocab: activeWords.length,
            dueWordCount,
            weakWordCount
        },
        metrics: {
            reviewAttempts,
            reviewCorrect,
            reviewAccuracy,
            totalLearningVolume,
            dueCoverage,
            weakImprovement
        },
        taskBreakdown: mission.tasks
    });
}

async function upsertMissionWeeklyReport(mission, vocabList = null) {
    if (!mission || !mission.weekId) return;

    const now = Date.now();
    const vocab = Array.isArray(vocabList) ? vocabList : await storageService.getTranslations(5000, 0);
    const report = buildMissionReport(mission, vocab || [], now);
    if (!report) return;

    const data = await chrome.storage.local.get(missionService.REPORTS_KEY);
    const existing = Array.isArray(data[missionService.REPORTS_KEY])
        ? data[missionService.REPORTS_KEY].map((item) => normalizeMissionReport(item))
        : [];

    const index = existing.findIndex((item) => item.weekId === report.weekId);
    if (index >= 0) {
        existing[index] = report;
    } else {
        existing.push(report);
    }

    existing.sort((a, b) => Number(b.generatedAt || 0) - Number(a.generatedAt || 0));
    const trimmed = existing.slice(0, 24);
    await chrome.storage.local.set({ [missionService.REPORTS_KEY]: trimmed });
}

async function getMissionWeeklyReports(limit = 8) {
    const data = await chrome.storage.local.get(missionService.REPORTS_KEY);
    const items = Array.isArray(data[missionService.REPORTS_KEY]) ? data[missionService.REPORTS_KEY] : [];
    return items
        .map((item) => normalizeMissionReport(item))
        .sort((a, b) => Number(b.generatedAt || 0) - Number(a.generatedAt || 0))
        .slice(0, Math.max(1, Number(limit || 8)));
}

async function applyMissionEvent(event) {
    const mission = await ensureWeeklyMission();
    if (!mission) return null;
    const updated = missionService.applyEvent(mission, event);
    const vocab = await storageService.getTranslations(5000, 0);
    await chrome.storage.local.set({ [missionService.STORAGE_KEY]: updated });
    await upsertMissionWeeklyReport(updated, vocab || []);
    return updated;
}

async function refreshMissionProgress() {
    const mission = await ensureWeeklyMission();
    if (!mission) return null;
    const normalized = missionService.applyEvent(mission, { type: 'NOOP' });
    const vocab = await storageService.getTranslations(5000, 0);
    await chrome.storage.local.set({ [missionService.STORAGE_KEY]: normalized });
    await upsertMissionWeeklyReport(normalized, vocab || []);
    return normalized;
}

async function applyFocusEvent(event) {
    const track = await ensureFocusTrack();
    if (!track) return null;
    const updated = focusTrackService.applyEvent(track, event);
    const focusWords = focusTrackService.buildFocusWords(updated);
    await chrome.storage.local.set({
        [focusTrackService.STORAGE_KEY]: updated,
        [focusTrackService.FOCUS_WORDS_KEY]: focusWords
    });
    await upsertFocusWeeklyReport(updated, null);
    return updated;
}

async function scheduleMissionReminder(enabled, hour = 20) {
    if (!chrome.alarms || !chrome.notifications) return { success: false, error: 'Alarms or notifications API unavailable' };
    await chrome.alarms.clear('weeklyMissionReminder');

    if (!enabled) {
        return { success: true };
    }

    const now = new Date();
    const next = new Date();
    next.setHours(hour, 0, 0, 0);
    if (next <= now) {
        next.setDate(next.getDate() + 1);
    }

    await chrome.alarms.create('weeklyMissionReminder', {
        when: next.getTime(),
        periodInMinutes: 60 * 24
    });

    return { success: true };
}

if (chrome.alarms && chrome.notifications) {
    chrome.alarms.onAlarm.addListener(async (alarm) => {
        if (alarm.name !== 'weeklyMissionReminder') return;

        try {
            const mission = await ensureWeeklyMission();
            if (!mission || mission.completed) return;

            const pendingTask = mission.tasks.find((task) => task.progress < task.target);
            const message = pendingTask
                ? `${pendingTask.title}: ${pendingTask.progress}/${pendingTask.target}`
                : '今天完成 1 個任務步驟，保持連續學習';

            await chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icon.svg',
                title: 'Highlighting Translate 每日任務提醒',
                message
            });
        } catch (error) {
            console.error('Mission reminder alarm failed:', error);
        }
    });
}

/**
 * Fetches phrasal_verbs_db.json, expands all forms into a flat lookup array,
 * and stores it in chrome.storage.local as 'phrasalVerbsExpanded'.
 * Each entry in the expanded array has: { text, translation, cefr_level, frequency_rank }
 * where `text` is the inflected form (e.g. "giving up") and all other fields
 * come from the base entry so HighlightService can resolve them directly.
 */
async function loadPhrasalVerbsDB() {
    try {
        const url = chrome.runtime.getURL('assets/phrasal_verbs_db.json');
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch phrasal_verbs_db.json: ${response.status}`);
        const db = await response.json();

        const expanded = [];
        for (const entry of db) {
            const base = {
                translation: entry.translation,
                cefr_level: entry.cefr_level,
                frequency_rank: entry.frequency_rank
            };
            // Always include the canonical base form (e.g. "give up")
            expanded.push({ text: entry.text, ...base });
            // Expand all inflected forms (e.g. "gives up", "gave up", ...)
            if (Array.isArray(entry.forms)) {
                for (const form of entry.forms) {
                    expanded.push({ text: form, ...base });
                }
            }
        }

        await chrome.storage.local.set({ phrasalVerbsExpanded: expanded });
        console.log(`Phrasal verbs DB loaded: ${expanded.length} expanded entries from ${db.length} base entries.`);
    } catch (error) {
        console.error('Failed to load phrasal verbs DB:', error);
    }
}

/**
 * Injects content scripts into all tabs that match the manifest patterns.
 * This ensures the extension works immediately after install/update without reload.
 */
async function injectContentScripts() {
    try {
        const manifest = chrome.runtime.getManifest();
        const contentScripts = manifest.content_scripts;

        if (!contentScripts || !contentScripts.length) return;

        for (const cs of contentScripts) {
            // Query all tabs since we removed the 'tabs' permission
            // Without 'tabs' permission, we can't query by URL or explicitly read tab.url
            const tabs = await chrome.tabs.query({});
            
            for (const tab of tabs) {
                // If we somehow have the URL, skip restricted pages explicitly
                if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://'))) continue;

                try {
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id, allFrames: cs.all_frames },
                        files: cs.js,
                    });
                } catch (err) {
                    // Ignore errors for tabs where we can't inject (e.g. restricted domains or no access)
                    console.debug(`Failed to inject into tab ${tab.id}:`, err);
                }
            }
        }
    } catch (error) {
        console.error('Dynamic injection failed:', error);
    }
}

// 處理右鍵菜單點擊
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "translate") {
        const selectedText = info.selectionText;
        const googleTranslateUrl = `https://translate.google.com/?sl=auto&tl=auto&text=${encodeURIComponent(selectedText)}`;
        chrome.tabs.create({url: googleTranslateUrl});
    }
});

// 處理來自 popup 和 content script 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    handleMessage(request, sender, sendResponse);
    return true; // Keep channel open for async response
});

async function handleMessage(request, sender, sendResponse) {
    try {
        switch (request.action) {
            case 'playTTS':
                handleTTS(request, sendResponse);
                break;
            case 'TRANSLATE': {
                const result = await translationService.translate(request.text, request.sourceLang, request.targetLang);
                sendResponse({success: true, data: result});
                break;
            }
            case 'DETECT_LANGUAGE': {
                const lang = translationService.detectLanguage(request.text);
                sendResponse({success: true, data: lang});
                break;
            }
            // Storage Handlers
            case 'STORAGE_SAVE':
                const existedBeforeSave = await storageService.isStarred(request.item.text, request.item.translation);
                await storageService.saveTranslation(request.item);
                if (!existedBeforeSave) {
                    await applyMissionEvent({ type: 'NEW_WORD_SAVED' });
                    await applyFocusEvent({
                        type: 'NEW_WORD_SAVED',
                        word: request.item.text,
                        sourceUrl: request.item.sourceUrl
                    });
                }
                sendResponse({success: true});
                break;
            case 'STORAGE_GET': {
                const requestItems = await storageService.getTranslations(request.limit, request.offset, request.sourceLangFilter);
                sendResponse({success: true, data: requestItems});
                break;
            }
            case 'STORAGE_GET_SOURCE_LANGS': {
                const langs = await storageService.getSourceLanguages();
                sendResponse({success: true, data: langs});
                break;
            }
            case 'STORAGE_MIGRATE_AUTO_LANG': {
                const migrated = await storageService.migrateAutoSourceLang();
                sendResponse({success: true, data: migrated});
                break;
            }
            case 'STORAGE_REMOVE':
                await storageService.removeTranslation(request.text, request.translation);
                sendResponse({success: true});
                break;
            case 'STORAGE_CLEAR':
                await storageService.clearAll(request.sourceLangFilter);
                sendResponse({success: true});
                break;
            case 'STORAGE_IS_STARRED': {
                const isStarred = await storageService.isStarred(request.text, request.translation);
                sendResponse({success: true, data: isStarred});
                break;
            }
            case 'STORAGE_UPDATE_SRS':
                await storageService.updateSRSStatus(request.text, request.translation, request.updates);
                sendResponse({success: true});
                break;
            case 'GET_WEEKLY_MISSION': {
                const mission = await ensureWeeklyMission();
                sendResponse({ success: true, data: mission });
                break;
            }
            case 'GET_FOCUS_TRACK': {
                const track = await ensureFocusTrack();
                sendResponse({ success: true, data: track });
                break;
            }
            case 'GET_WEEKLY_MISSION_REPORTS': {
                await ensureWeeklyMission();
                const reports = await getMissionWeeklyReports(Number(request.limit || 8));
                sendResponse({ success: true, data: reports });
                break;
            }
            case 'GET_FOCUS_TRACK_REPORTS': {
                await ensureFocusTrack();
                const reports = await getFocusWeeklyReports(Number(request.limit || 8));
                sendResponse({ success: true, data: reports });
                break;
            }
            case 'MISSION_APPLY_EVENT': {
                const mission = await applyMissionEvent(request.event || {});
                sendResponse({ success: true, data: mission });
                break;
            }
            case 'FOCUS_APPLY_EVENT': {
                const track = await applyFocusEvent(request.event || {});
                sendResponse({ success: true, data: track });
                break;
            }
            case 'MISSION_RECALC_PROGRESS': {
                const mission = await refreshMissionProgress();
                sendResponse({ success: true, data: mission });
                break;
            }
            case 'SET_MISSION_REMINDER': {
                const result = await scheduleMissionReminder(Boolean(request.enabled), Number(request.hour || 20));
                if (!result.success) {
                    sendResponse({ success: false, error: result.error });
                    break;
                }
                sendResponse({ success: true });
                break;
            }
            case 'STORAGE_GET_WORD_INFO': {
                const wordInfo = await storageService.getWordInfo(request.word);
                sendResponse({success: true, data: wordInfo});
                break;
            }
            default:
                console.warn('Unknown action:', request.action);
                sendResponse({success: false, error: 'Unknown action'});
        }
    } catch (error) {
        console.error('Message handler error:', error);
        sendResponse({success: false, error: error.message});
    }
}

function handleTTS(request, sendResponse) {
    // 尋找最佳語音
    chrome.tts.getVoices((voices) => {
        let selectedVoice = null;
        
        // 優先找包含 'Google' 且語言符合的語音 (通常品質較好)
        selectedVoice = voices.find(v => 
            v.lang.toLowerCase().startsWith(request.lang.toLowerCase()) && 
            v.voiceName.includes('Google')
        );
        
        // 如果沒找到，找任何語言符合的語音
        if (!selectedVoice) {
            selectedVoice = voices.find(v => 
                v.lang.toLowerCase().startsWith(request.lang.toLowerCase())
            );
        }
        
        const options = {
            lang: request.lang,
            voiceName: selectedVoice ? selectedVoice.voiceName : undefined,
            rate: 1.0
        };
        
        chrome.tts.speak(request.text, options, () => {
            if (chrome.runtime.lastError) {
                console.error('TTS execution failed:', chrome.runtime.lastError);
                // Can't sendResponse here easily as it wraps the initial sync return, 
                // but logging is better than silent failure.
            }
        });
        sendResponse({success: true});
    });
}
