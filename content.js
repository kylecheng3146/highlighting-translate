// 建立翻譯視窗元素
function createTranslatePopup() {
  const popup = document.createElement('div');
  popup.id = 'translate-popup';
  popup.style.cssText = `
    position: absolute;
    background: white;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 10000;
    display: none;
    max-width: 300px;
    font-family: Arial, sans-serif;
    font-size: 14px;
  `;
  document.body.appendChild(popup);
  return popup;
}

// 獲取翻譯結果
async function getTranslation(text, sourceLang = 'auto', targetLang = 'zh-TW') {
  try {
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
  popup.innerHTML = '<div style="color: #666;">翻譯中...</div>';
  popup.style.display = 'block';
  popup.style.left = x + 'px';
  popup.style.top = y + 'px';
  
  // 獲取翻譯
  getTranslation(text).then(translation => {
    popup.innerHTML = `
      <div style="margin-bottom: 8px; color: #333; font-weight: bold;">原文：</div>
      <div style="margin-bottom: 12px; color: #666;">${text}</div>
      <div style="margin-bottom: 8px; color: #333; font-weight: bold;">翻譯：</div>
      <div style="color: #000;">${translation}</div>
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
    
    if (selectedText && selectedText.length > 0) {
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
  }, 500); // 延遲500毫秒，避免誤觸發
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
