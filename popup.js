// 載入設定
async function loadSettings() {
    try {
        const settings = await chrome.storage.sync.get({
            autoTranslate: true,
            autoPlaySpeech: false,
            sourceLang: 'auto',
            targetLang: 'zh-TW',
            delay: 500
        });

        // 更新 UI
        const autoTranslateCheck = document.getElementById('autoTranslateCheck');
        if (autoTranslateCheck) autoTranslateCheck.checked = settings.autoTranslate;

        const autoPlaySpeechCheck = document.getElementById('autoPlaySpeechCheck');
        if (autoPlaySpeechCheck) autoPlaySpeechCheck.checked = settings.autoPlaySpeech;
        
        const sourceLang = document.getElementById('sourceLang');
        if (sourceLang) sourceLang.value = settings.sourceLang;
        
        const targetLang = document.getElementById('targetLang');
        if (targetLang) targetLang.value = settings.targetLang;
        
        const delay = document.getElementById('delay');
        if (delay) delay.value = settings.delay;
    } catch (error) {
        console.error('Failed to load settings:', error);
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
    const settings = {
        autoTranslate: document.getElementById('autoTranslateCheck').checked,
        autoPlaySpeech: document.getElementById('autoPlaySpeechCheck').checked,
        sourceLang: document.getElementById('sourceLang').value,
        targetLang: document.getElementById('targetLang').value,
        delay: parseInt(document.getElementById('delay').value) || 500
    };

    try {
        await chrome.storage.sync.set(settings);
        showSnackbar();

        await sendMessageToContentScript({
            action: 'updateSettings',
            settings: settings
        });
    } catch (error) {
        console.error('Failed to save settings:', error);
    }
}

// Localization
const translations = {
    "en": {
        "settingsTitle": "Highlighting Translate Settings",
        "autoTranslateLabel": "Auto Translate",
        "autoTranslateDesc": "Show popup automatically after selecting text",
        "autoPlaySpeechLabel": "Auto Play Speech",
        "autoPlaySpeechDesc": "Automatically read result after translation",
        "sourceLangLabel": "Source Language",
        "sourceLangDesc": "Smartly detect source language",
        "targetLangLabel": "Target Language",
        "targetLangDesc": "Language of the translation result",
        "delayLabel": "Display Delay (ms)",
        "delayDesc": "Time before popup appears",
        "settingsSaved": "Settings Saved"
    },
    "zh-CN": {
        "settingsTitle": "翻译设置",
        "autoTranslateLabel": "自动显示翻译",
        "autoTranslateDesc": "选取文字后自动显示弹窗",
        "autoPlaySpeechLabel": "自动播放语音",
        "autoPlaySpeechDesc": "翻译完成后自动朗读结果",
        "sourceLangLabel": "源语言",
        "sourceLangDesc": "智能判断网页原始语言",
        "targetLangLabel": "目标语言",
        "targetLangDesc": "翻译后的结果语言",
        "delayLabel": "显示延迟 (毫秒)",
        "delayDesc": "选取文字后到弹窗出现的时间",
        "settingsSaved": "设置已保存"
    },
    "zh-TW": {
        "settingsTitle": "翻譯設定",
        "autoTranslateLabel": "自動顯示翻譯",
        "autoTranslateDesc": "選取文字後自動顯示彈窗",
        "autoPlaySpeechLabel": "自動播放語音",
        "autoPlaySpeechDesc": "翻譯完成後自動朗讀結果",
        "sourceLangLabel": "源語言",
        "sourceLangDesc": "智慧判斷網頁原始語言",
        "targetLangLabel": "目標語言",
        "targetLangDesc": "翻譯後的結果語言",
        "delayLabel": "顯示延遲 (毫秒)",
        "delayDesc": "選取文字後到彈窗出現的時間",
        "settingsSaved": "設定已儲存"
    },
    "ja": {
        "settingsTitle": "翻訳設定",
        "autoTranslateLabel": "自動翻訳表示",
        "autoTranslateDesc": "テキストを選択すると自動的にポップアップを表示",
        "autoPlaySpeechLabel": "自動音声再生",
        "autoPlaySpeechDesc": "翻訳完了後に結果を自動的に読み上げ",
        "sourceLangLabel": "翻訳元言語",
        "sourceLangDesc": "Webページの言語を自動検出",
        "targetLangLabel": "翻訳先言語",
        "targetLangDesc": "翻訳結果の言語",
        "delayLabel": "表示遅延 (ms)",
        "delayDesc": "テキスト選択からポップアップ表示までの時間",
        "settingsSaved": "設定を保存しました"
    },
    "ko": {
        "settingsTitle": "번역 설정",
        "autoTranslateLabel": "자동 번역 표시",
        "autoTranslateDesc": "텍스트 선택 시 자동으로 팝업 표시",
        "autoPlaySpeechLabel": "자동 음성 재생",
        "autoPlaySpeechDesc": "번역 완료 후 결과 자동 읽기",
        "sourceLangLabel": "원본 언어",
        "sourceLangDesc": "웹페이지 언어 스마트 감지",
        "targetLangLabel": "대상 언어",
        "targetLangDesc": "번역 결과 언어",
        "delayLabel": "표시 지연 (ms)",
        "delayDesc": "텍스트 선택 후 팝업이 나타날 때까지의 시간",
        "settingsSaved": "설정이 저장되었습니다"
    },
    "es": {
        "settingsTitle": "Configuración de traducción",
        "autoTranslateLabel": "Traducción automática",
        "autoTranslateDesc": "Mostrar popup automáticamente al seleccionar texto",
        "autoPlaySpeechLabel": "Reproducción automática",
        "autoPlaySpeechDesc": "Leer resultado automáticamente tras traducir",
        "sourceLangLabel": "Idioma de origen",
        "sourceLangDesc": "Detectar idioma de la página web",
        "targetLangLabel": "Idioma de destino",
        "targetLangDesc": "Idioma del resultado de la traducción",
        "delayLabel": "Retraso (ms)",
        "delayDesc": "Tiempo antes de que aparezca la ventana",
        "settingsSaved": "Configuración guardada"
    },
    "fr": {
        "settingsTitle": "Paramètres de traduction",
        "autoTranslateLabel": "Traduction automatique",
        "autoTranslateDesc": "Afficher le popup après la sélection du texte",
        "autoPlaySpeechLabel": "Lecture vocale auto",
        "autoPlaySpeechDesc": "Lire automatiquement le résultat",
        "sourceLangLabel": "Langue source",
        "sourceLangDesc": "Détecter intelligemment la langue",
        "targetLangLabel": "Langue cible",
        "targetLangDesc": "Langue du résultat de la traduction",
        "delayLabel": "Délai d'affichage (ms)",
        "delayDesc": "Temps avant l'apparition du popup",
        "settingsSaved": "Paramètres enregistrés"
    },
    "de": {
        "settingsTitle": "Übersetzungseinstellungen",
        "autoTranslateLabel": "Automatische Übersetzung",
        "autoTranslateDesc": "Popup nach Textauswahl automatisch anzeigen",
        "autoPlaySpeechLabel": "Automatische Sprachausgabe",
        "autoPlaySpeechDesc": "Ergebnis nach Übersetzung vorlesen",
        "sourceLangLabel": "Ausgangssprache",
        "sourceLangDesc": "Webseitensprache automatisch erkennen",
        "targetLangLabel": "Zielsprache",
        "targetLangDesc": "Sprache des Übersetzungsergebnisses",
        "delayLabel": "Verzögerung (ms)",
        "delayDesc": "Zeit bis das Popup erscheint",
        "settingsSaved": "Einstellungen gespeichert"
    }
};

function localize() {
    let lang = navigator.language;
    if (chrome.i18n && chrome.i18n.getUILanguage) {
        lang = chrome.i18n.getUILanguage();
    }
    
    // Normalize language code
    let t = translations['en']; // Default to English

    if (lang === 'zh-CN' || lang === 'zh-SG') {
        t = translations['zh-CN'];
    } else if (lang.startsWith('zh')) {
        t = translations['zh-TW'];
    } else if (lang.startsWith('ja')) {
        t = translations['ja'];
    } else if (lang.startsWith('ko')) {
        t = translations['ko'];
    } else if (lang.startsWith('es')) {
        t = translations['es'];
    } else if (lang.startsWith('fr')) {
        t = translations['fr'];
    } else if (lang.startsWith('de')) {
        t = translations['de'];
    }

    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            el.textContent = t[key];
        }
    });
}

// 事件監聽
document.addEventListener('DOMContentLoaded', () => {
    localize();
    loadSettings();

    const autoTranslateCheck = document.getElementById('autoTranslateCheck');
    if (autoTranslateCheck) autoTranslateCheck.addEventListener('change', saveSettings);

    const autoPlaySpeechCheck = document.getElementById('autoPlaySpeechCheck');
    if (autoPlaySpeechCheck) autoPlaySpeechCheck.addEventListener('change', saveSettings);

    const sourceLang = document.getElementById('sourceLang');
    if (sourceLang) sourceLang.addEventListener('change', saveSettings);

    const targetLang = document.getElementById('targetLang');
    if (targetLang) targetLang.addEventListener('change', saveSettings);

    const delay = document.getElementById('delay');
    if (delay) delay.addEventListener('change', saveSettings);

    // List available TTS voices for debugging
    chrome.tts.getVoices((voices) => {
        console.log('Available TTS Voices:', voices);
        const voiceNames = voices.map(v => `${v.voiceName} (${v.lang})`);
        console.log(voiceNames.join('\n'));
    });
});