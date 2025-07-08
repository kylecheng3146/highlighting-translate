# Highlighting Translate Chrome Extension

A simple Chrome extension that automatically translates text you select on any webpage.

## Features

*   **Instant Translation:** Simply highlight text on a webpage to see the translation.
*   **Customizable Target Language:** Choose your desired language for translations from the settings panel.
*   **Toggle On/Off:** Easily enable or disable the automatic translation feature.
*   **Adjustable Delay:** Set a custom delay (in milliseconds) before the translation popup appears.
*   **Clean UI:** The translation is displayed in a clean, non-intrusive popup.

## How to Use

1.  **Select Text:** Use your mouse to highlight any text on a webpage.
2.  **View Translation:** After a short delay, a small popup will appear next to your selection with the translated text.
3.  **Configure Settings:** Click the extension icon in the Chrome toolbar to open the settings panel. Here you can change the target language, toggle the feature on/off, and adjust the delay.

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
*   `content.js`: This script is injected into web pages. It listens for text selection events, calls the translation API, and displays the result in a popup.
*   `popup.html` & `popup.js`: These files create the settings panel that appears when you click the extension icon. It allows you to configure the extension's behavior.
*   `background.js`: The service worker for handling background tasks, such as managing context menus or future complex logic.
*   `icon.svg`: The icon for the extension.
