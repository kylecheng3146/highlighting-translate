// 預設設定
let settings = {
  autoTranslate: true,
  targetLang: 'zh-TW',
  delay: 500
};

// 載入設定
chrome.storage.sync.get({
  autoTranslate: true,
  targetLang: 'zh-TW',
  delay: 500
}, (items) => {
  settings = items;
});

// 監聽設定更新
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateSettings') {
    settings = request.settings;
  }
});

// 建立翻譯視窗元素
function createTranslatePopup() {
  const popup = document.createElement('div');
  popup.id = 'translate-popup';
  popup.style.cssText = `
    position: absolute;
    background: white;
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 12px;
    box-shadow: 0 2px 15px rgba(0,0,0,0.2);
    z-index: 10000;
    display: none;
    max-width: 350px;
    min-width: 200px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    font-size: 14px;
    line-height: 1.5;
  `;
  
  // 添加關閉按鈕
  const closeBtn = document.createElement('div');
  closeBtn.style.cssText = `
    position: absolute;
    top: 5px;
    right: 5px;
    width: 20px;
    height: 20px;
    cursor: pointer;
    color: #999;
    font-size: 16px;
    text-align: center;
    line-height: 20px;
  `;
  closeBtn.innerHTML = '×';
  closeBtn.onclick = hideTranslatePopup;
  
  popup.appendChild(closeBtn);
  document.body.appendChild(popup);
  return popup;
}

// 獲取翻譯結果
async function getTranslation(text, sourceLang = 'auto', targetLang = null) {
  try {
    targetLang = targetLang || settings.targetLang;
    // 使用 Google Translate API (免費版本)
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    // 解析翻譯結果
    if (data && data[0] && data[0][0] && data[0][0][0]) {
      return data[0][0][0];
    }
    return '翻譯失敗';
  } catch (error) {
    console.error('Translation error:', error);
    return '翻譯錯誤';
  }
}

// 顯示翻譯視窗
function showTranslatePopup(text, x, y) {
  const popup = document.getElementById('translate-popup') || createTranslatePopup();
  
  // 顯示載入中
  popup.innerHTML = `
    <div style="position: absolute; top: 5px; right: 5px; width: 20px; height: 20px; cursor: pointer; color: #999; font-size: 16px; text-align: center; line-height: 20px;" onclick="document.getElementById('translate-popup').style.display='none'">×</div>
    <div style="display: flex; align-items: center; justify-content: center; padding: 20px;">
      <div style="color: #666;">翻譯中...</div>
    </div>
  `;
  popup.style.display = 'block';
  
  // 調整位置，確保不超出視窗
  const popupWidth = 350;
  const popupHeight = 150;
  
  let adjustedX = x;
  let adjustedY = y;
  
  if (x + popupWidth > window.innerWidth + window.scrollX) {
    adjustedX = window.innerWidth + window.scrollX - popupWidth - 10;
  }
  
  if (y + popupHeight > window.innerHeight + window.scrollY) {
    adjustedY = y - popupHeight - 30;
  }
  
  popup.style.left = adjustedX + 'px';
  popup.style.top = adjustedY + 'px';
  
  // 獲取翻譯
  getTranslation(text).then(translation => {
    popup.innerHTML = `
      <div style="position: absolute; top: 5px; right: 5px; width: 20px; height: 20px; cursor: pointer; color: #999; font-size: 16px; text-align: center; line-height: 20px;" onclick="document.getElementById('translate-popup').style.display='none'">×</div>
      <div style="padding: 5px 0;">
        <div style="margin-bottom: 8px;">
          <div style="color: #666; font-size: 12px; margin-bottom: 4px;">原文</div>
          <div style="color: #333; word-wrap: break-word;">${text}</div>
        </div>
        <div style="border-top: 1px solid #eee; margin: 10px 0;"></div>
        <div>
          <div style="color: #666; font-size: 12px; margin-bottom: 4px;">翻譯</div>
          <div style="color: #000; font-weight: 500; word-wrap: break-word;">${translation}</div>
        </div>
      </div>
    `;
  });
}

// 隱藏翻譯視窗
function hideTranslatePopup() {
  const popup = document.getElementById('translate-popup');
  if (popup) {
    popup.style.display = 'none';
  }
}

// 監聽文字選取事件
let selectionTimeout;

document.addEventListener('mouseup', (e) => {
  // 如果未啟用自動翻譯，直接返回
  if (!settings.autoTranslate) {
    return;
  }
  
  // 清除之前的計時器
  clearTimeout(selectionTimeout);
  
  // 如果點擊的是翻譯視窗本身，不要隱藏
  if (e.target.closest('#translate-popup')) {
    return;
  }
  
  // 延遲檢查選取的文字
  selectionTimeout = setTimeout(() => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText && selectedText.length > 0 && selectedText.length < 1000) {
      // 獲取選取範圍的位置
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // 在選取文字下方顯示翻譯
      showTranslatePopup(
        selectedText,
        rect.left + window.scrollX,
        rect.bottom + window.scrollY + 5
      );
    } else {
      hideTranslatePopup();
    }
  }, settings.delay);
});

// 點擊其他地方時隱藏翻譯視窗
document.addEventListener('mousedown', (e) => {
  if (!e.target.closest('#translate-popup')) {
    hideTranslatePopup();
  }
});

// 滾動時隱藏翻譯視窗
document.addEventListener('scroll', () => {
  hideTranslatePopup();
});

// ESC 鍵隱藏翻譯視窗
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    hideTranslatePopup();
  }
});
