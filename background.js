importScripts(
    'services/TranslationService.js',
    'services/SRSService.js',
    'services/StorageService.js',
    'services/MissionService.js'
);

// Initialize Services
const translationService = new TranslationService();
const srsService = new SRSService();
const storageService = new StorageService();
const missionService = new MissionService();

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
            return reconciled;
        }

        const nextMission = missionService.generateWeeklyMission(vocab || [], existingMission || null, Date.now());
        await chrome.storage.local.set({
            [missionService.STORAGE_KEY]: nextMission,
            [missionService.FOCUS_WORDS_KEY]: nextMission.focusWords || []
        });
        return nextMission;
    } catch (error) {
        console.error('Failed to ensure weekly mission:', error);
        return null;
    }
}

async function applyMissionEvent(event) {
    const mission = await ensureWeeklyMission();
    if (!mission) return null;
    const updated = missionService.applyEvent(mission, event);
    await chrome.storage.local.set({ [missionService.STORAGE_KEY]: updated });
    return updated;
}

async function refreshMissionProgress() {
    const mission = await ensureWeeklyMission();
    if (!mission) return null;
    const normalized = missionService.applyEvent(mission, { type: 'NOOP' });
    await chrome.storage.local.set({ [missionService.STORAGE_KEY]: normalized });
    return normalized;
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
            case 'MISSION_APPLY_EVENT': {
                const mission = await applyMissionEvent(request.event || {});
                sendResponse({ success: true, data: mission });
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
