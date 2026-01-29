# Highlighting Translate Chrome Extension

A simple Chrome extension that automatically translates text you select on any webpage.

## Features

*   **Instant Translation:** Simply highlight text on a webpage to see the translation.
*   **Smart Language Detection:** Automatically detects the source language or allows manual selection.
*   **Vocabulary History:** Save translations to your personal word list by clicking the star icon. View and manage your history in a dedicated page.
*   **Text-to-Speech (TTS):** Listen to the pronunciation of the original text by clicking the speaker icon.
*   **Skip Same Language:** Intelligently skips translation popup when source and target languages are the same.
*   **Customizable Source & Target Languages:** Choose your desired source and target languages from the settings panel.
*   **Toggle On/Off:** Easily enable or disable the automatic translation feature.
*   **Adjustable Delay:** Set a custom delay (in milliseconds) before the translation popup appears.
*   **Clean UI:** The translation is displayed in a clean, non-intrusive popup.

## How to Use

1.  **Select Text:** Use your mouse to highlight any text on a webpage.
2.  **View Translation:** After a short delay, a small popup will appear next to your selection with the translated text.
3.  **Save to History:** Click the **star icon** in the popup to save the translation to your history.
4.  **Listen to Pronunciation:** Click the **speaker icon** above the selection to hear the text read aloud.
5.  **Manage History:** Click the extension icon in the Chrome toolbar and then click **"單字本" (History)** to view your saved translations.
6.  **Configure Settings:** Click the extension icon in the Chrome toolbar to open the settings panel. Here you can:
    - Change the source language (auto-detect or manual selection)
    - Change the target language
    - Toggle the feature on/off
    - Adjust the delay
    - Toggle auto-play speech

## Smart Features

*   **Language Detection:** The extension can automatically detect the source language or you can manually specify it.
*   **Skip Unnecessary Translation:** When the source and target languages are the same, the extension will not show any translation popup.
*   **Optimized for Chinese:** Special handling for Traditional and Simplified Chinese text detection.

## Installation (for Development)

To install this extension locally for development or testing:

1.  Clone or download this repository to your local machine.
2.  Open Google Chrome and navigate to `chrome://extensions`.
3.  Enable **"Developer mode"** using the toggle switch in the top-right corner.
4.  Click the **"Load unpacked"** button.
5.  Select the directory where you cloned or downloaded the project files.
6.  The "Highlighting Translate" extension should now be active in your browser.

## Project Files

*   `manifest.json`: The core file that defines the extension's properties, permissions, and scripts.
*   `content.js`: This script is injected into web pages. It listens for text selection events, detects languages, calls the translation API, and displays the result in a popup.
*   `popup.html` & `popup.js`: These files create the settings panel that appears when you click the extension icon. It allows you to configure the extension's behavior including source and target languages.
*   `background.js`: The service worker for handling background tasks, such as managing context menus or future complex logic.
*   `icon.svg`: The icon for the extension.

## Supported Languages

*   繁體中文 (Traditional Chinese)
*   簡體中文 (Simplified Chinese)
*   English
*   日本語 (Japanese)
*   한국어 (Korean)
*   Español (Spanish)
*   Français (French)
*   Deutsch (German)
*   Auto-detect (for source language)
