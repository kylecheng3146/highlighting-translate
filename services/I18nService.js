class I18nService {
    constructor() {
        this.translations = {
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
                "settingsSaved": "Settings Saved",
                "historyBtn": "History",
                "historyTitle": "Vocabulary History",
                "clearAllBtn": "Clear All",
                "emptyStateTitle": "No translations saved yet",
                "emptyStateText": "Select text on a webpage and click the star icon to start building your vocabulary list!",
                "deleteConfirm": "Are you sure you want to delete this item?",
                "clearConfirm": "Are you sure you want to clear all history?",
                "loadMoreBtn": "Load More",
                "enableHighlightLabel": "Smart Highlight",
                "enableHighlightDesc": "Highlight saved words in web pages",
                "blacklistBtn": "Disable for this site",
                "whitelistBtn": "Enable for this site"
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
                "settingsSaved": "设置已保存",
                "historyBtn": "单词本",
                "historyTitle": "单词本 (History)",
                "clearAllBtn": "清空全部",
                "emptyStateTitle": "尚未收藏任何翻译",
                "emptyStateText": "选取网页上的文字，并点击翻译窗口中的星号开始建立您的单词本！",
                "deleteConfirm": "确定要删除这条记录吗？",
                "clearConfirm": "确定要清空所有记录吗？",
                "loadMoreBtn": "显示更多",
                "enableHighlightLabel": "智能高亮",
                "enableHighlightDesc": "在网页中自动高亮已收藏的单词",
                "blacklistBtn": "在此网站禁用",
                "whitelistBtn": "在此网站启用"
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
                "settingsSaved": "設定已儲存",
                "historyBtn": "單字本",
                "historyTitle": "單字本 (History)",
                "clearAllBtn": "清空全部",
                "emptyStateTitle": "尚未收藏任何翻譯",
                "emptyStateText": "選取網頁上的文字，並點擊翻譯視窗中的星號開始建立您的單字本！",
                "deleteConfirm": "確定要刪除這筆紀錄嗎？",
                "clearConfirm": "確定要清空所有紀錄嗎？",
                "loadMoreBtn": "顯示更多",
                "enableHighlightLabel": "智能高亮",
                "enableHighlightDesc": "在網頁中自動高亮已收藏的單字",
                "blacklistBtn": "在此網站禁用",
                "whitelistBtn": "在此網站啟用"
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
                "settingsSaved": "設定を保存しました",
                "historyBtn": "単語帳",
                "historyTitle": "単語帳 (History)",
                "clearAllBtn": "すべて削除",
                "emptyStateTitle": "保存された翻訳はありません",
                "emptyStateText": "Webページ上のテキストを選択し、翻訳ウィンドウの星マークをクリックして単語帳を作成しましょう！",
                "deleteConfirm": "この項目を削除してもよろしいですか？",
                "clearConfirm": "履歴をすべて削除してもよろしいですか？",
                "loadMoreBtn": "もっと見る",
                "enableHighlightLabel": "自動ハイライト",
                "enableHighlightDesc": "保存した単語をページ内でハイライト表示",
                "blacklistBtn": "このサイトで無効にする",
                "whitelistBtn": "このサイトで有効にする"
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
                "settingsSaved": "설정이 저장되었습니다",
                "historyBtn": "단어장",
                "historyTitle": "단어장 (History)",
                "clearAllBtn": "모두 지우기",
                "emptyStateTitle": "저장된 번역이 없습니다",
                "emptyStateText": "웹페이지에서 텍스트를 선택하고 번역 창의 별표를 클릭하여 단어장을 만들어보세요!",
                "deleteConfirm": "이 항목을 삭제하시겠습니까?",
                "clearConfirm": "모든 기록을 삭제하시겠습니까?",
                "loadMoreBtn": "더 보기",
                "enableHighlightLabel": "스마트 하이라이트",
                "enableHighlightDesc": "저장된 단어를 페이지에서 하이라이트",
                "blacklistBtn": "이 사이트에서 비활성화",
                "whitelistBtn": "이 사이트에서 활성화"
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
                "settingsSaved": "Configuración guardada",
                "historyBtn": "Historial",
                "historyTitle": "Historial de vocabulario",
                "clearAllBtn": "Borrar todo",
                "emptyStateTitle": "Aún no hay traducciones guardadas",
                "emptyStateText": "¡Selecciona texto en una página web y haz clic en la estrella para comenzar tu lista!",
                "deleteConfirm": "¿Estás seguro de que quieres eliminar este elemento?",
                "clearConfirm": "¿Estás seguro de que quieres borrar todo el historial?",
                "loadMoreBtn": "Cargar más",
                "enableHighlightLabel": "Resaltado inteligente",
                "enableHighlightDesc": "Resaltar palabras guardadas en las páginas",
                "blacklistBtn": "Desactivar para este sitio",
                "whitelistBtn": "Activar para este sitio"
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
                "settingsSaved": "Paramètres enregistrés",
                "historyBtn": "Historique",
                "historyTitle": "Historique du vocabulaire",
                "clearAllBtn": "Tout effacer",
                "emptyStateTitle": "Aucune traduction enregistrée",
                "emptyStateText": "Sélectionnez du texte et cliquez sur l'étoile pour commencer votre liste !",
                "deleteConfirm": "Voulez-vous vraiment supprimer cet élément ?",
                "clearConfirm": "Voulez-vous vraiment effacer tout l'historique ?",
                "loadMoreBtn": "Charger plus",
                "enableHighlightLabel": "Surlignage intelligent",
                "enableHighlightDesc": "Surligner les mots enregistrés",
                "blacklistBtn": "Désactiver pour ce site",
                "whitelistBtn": "Activer pour ce site"
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
                "settingsSaved": "Einstellungen gespeichert",
                "historyBtn": "Verlauf",
                "historyTitle": "Vokabelheft",
                "clearAllBtn": "Alles löschen",
                "emptyStateTitle": "Noch keine Übersetzungen gespeichert",
                "emptyStateText": "Markieren Sie Text und klicken Sie auf den Stern, um Ihre Liste zu erstellen!",
                "deleteConfirm": "Möchten Sie diesen Eintrag wirklich löschen?",
                "clearConfirm": "Möchten Sie den gesamten Verlauf löschen?",
                "loadMoreBtn": "Mehr laden",
                "enableHighlightLabel": "Smart Highlight",
                "enableHighlightDesc": "Gespeicherte Wörter in Seiten hervorheben",
                "blacklistBtn": "Für diese Seite deaktivieren",
                "whitelistBtn": "Für diese Seite aktivieren"
            }
        };
    }

    getLanguage() {
        let lang = navigator.language;
        if (chrome.i18n && chrome.i18n.getUILanguage) {
            lang = chrome.i18n.getUILanguage();
        }
        return lang;
    }

    getText(key) {
        const lang = this.getLanguage();
        
        let t = this.translations['en']; // Default

        if (lang === 'zh-CN' || lang === 'zh-SG') {
            t = this.translations['zh-CN'];
        } else if (lang.startsWith('zh')) {
            t = this.translations['zh-TW'];
        } else if (lang.startsWith('ja')) {
            t = this.translations['ja'];
        } else if (lang.startsWith('ko')) {
            t = this.translations['ko'];
        } else if (lang.startsWith('es')) {
            t = this.translations['es'];
        } else if (lang.startsWith('fr')) {
            t = this.translations['fr'];
        } else if (lang.startsWith('de')) {
            t = this.translations['de'];
        }

        return t[key] || key;
    }

    localizePage() {
        const lang = this.getLanguage();
        
        let t = this.translations['en'];

        if (lang === 'zh-CN' || lang === 'zh-SG') {
            t = this.translations['zh-CN'];
        } else if (lang.startsWith('zh')) {
            t = this.translations['zh-TW'];
        } else if (lang.startsWith('ja')) {
            t = this.translations['ja'];
        } else if (lang.startsWith('ko')) {
            t = this.translations['ko'];
        } else if (lang.startsWith('es')) {
            t = this.translations['es'];
        } else if (lang.startsWith('fr')) {
            t = this.translations['fr'];
        } else if (lang.startsWith('de')) {
            t = this.translations['de'];
        }

        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (t[key]) {
                if (el.tagName === 'INPUT' && el.getAttribute('placeholder')) {
                    el.placeholder = t[key];
                } else {
                    el.textContent = t[key];
                }
            }
        });
        
        // Update document title if data-i18n is present on body or separate element, 
        // but often title is hard to target via selector in body. 
        // We can check if title element has it.
        const titleEl = document.querySelector('title[data-i18n]');
        if (titleEl) {
            const key = titleEl.getAttribute('data-i18n');
            if (t[key]) document.title = t[key];
        }
    }
}

// Make it available globally
window.I18nService = I18nService;
