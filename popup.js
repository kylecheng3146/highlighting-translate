// 載入設定
async function loadSettings() {
  const settings = await chrome.storage.sync.get({
    autoTranslate: true,
    targetLang: 'zh-TW',
    delay: 500
  });
  
  // 更新 UI
  document.getElementById('autoTranslate').classList.toggle('active', settings.autoTranslate);
  document.getElementById('targetLang').value = settings.targetLang;
  document.getElementById('delay').value = settings.delay;
}

// 儲存設定
async function saveSettings() {
  const settings = {
    autoTranslate: document.getElementById('autoTranslate').classList.contains('active'),
    targetLang: document.getElementById('targetLang').value,
    delay: parseInt(document.getElementById('delay').value)
  };
  
  await chrome.storage.sync.set(settings);
  
  // 顯示儲存成功訊息
  const status = document.getElementById('status');
  status.textContent = '設定已儲存';
  status.className = 'success';
  setTimeout(() => {
    status.textContent = '';
    status.className = '';
  }, 2000);
  
  // 通知 content scripts 更新設定
  const tabs = await chrome.tabs.query({active: true, currentWindow: true});
  if (tabs[0]) {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: 'updateSettings',
      settings: settings
    });
  }
}

// 切換開關
document.getElementById('autoTranslate').addEventListener('click', function() {
  this.classList.toggle('active');
  saveSettings();
});

// 監聽設定變更
document.getElementById('targetLang').addEventListener('change', saveSettings);
document.getElementById('delay').addEventListener('change', saveSettings);

// 初始化
loadSettings();
