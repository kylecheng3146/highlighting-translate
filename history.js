const storageService = new StorageService();
const i18nService = new I18nService();
let currentOffset = 0;
const PAGE_SIZE = 50;
let currentSourceLang = 'all'; // Default filter

document.addEventListener("DOMContentLoaded", async () => {
  i18nService.localizePage();

  // 1. Migrate Data (if needed)
  if (storageService.isBackground) {
     // Direct call
     await storageService.migrateAutoSourceLang();
  } else {
     // Via message
     await chrome.runtime.sendMessage({ action: 'STORAGE_MIGRATE_AUTO_LANG' });
  }

  // 2. Initialize Sidebar
  await loadLanguageSidebar();

  // 3. Load Content
  loadHistory(true);
  updateDashboard();

  document
    .getElementById("clearAll")
    .addEventListener("click", clearAllHistory);
  document
    .getElementById("loadMoreBtn")
    .addEventListener("click", () => loadHistory(false));

  // Toggle Archived
  const toggleBtn = document.getElementById("toggleArchivedBtn");
  const archList = document.getElementById("archivedList");
  const chevron = document.getElementById("archivedChevron");

  toggleBtn.addEventListener("click", () => {
    const isHidden = archList.style.display === "none";
    archList.style.display = isHidden ? "grid" : "none";
    chevron.innerText = isHidden ? "▲" : "▼";
  });
});

async function loadLanguageSidebar() {
    try {
        const langs = await storageService.getSourceLanguages();
        const list = document.getElementById('languageList');
        
        // Keep "All" but reset others
        list.innerHTML = '';
        const allLi = document.createElement('li');
        allLi.className = `language-item ${currentSourceLang === 'all' ? 'active' : ''}`;
        allLi.dataset.lang = 'all';
        allLi.tabIndex = 0;
        allLi.setAttribute('role', 'button');
        allLi.setAttribute('aria-pressed', String(currentSourceLang === 'all'));
        const allNameSpan = document.createElement('span');
        allNameSpan.className = 'lang-name';
        allNameSpan.dataset.i18n = 'allLanguages';
        allNameSpan.textContent = 'All Languages';
        const allCountSpan = document.createElement('span');
        allCountSpan.className = 'lang-count';
        allCountSpan.id = 'totalLangCount';
        allCountSpan.textContent = '0';
        allLi.appendChild(allNameSpan);
        allLi.appendChild(allCountSpan);
        list.appendChild(allLi);

        let totalCount = 0;
        langs.forEach(l => {
            const li = document.createElement('li');
            li.className = `language-item ${currentSourceLang === l.code ? 'active' : ''}`;
            li.dataset.lang = l.code;
            li.tabIndex = 0;
            li.setAttribute('role', 'button');
            li.setAttribute('aria-pressed', currentSourceLang === l.code);
            
            // Display name map (optional, could use Intl.DisplayNames)
            const displayName = getLanguageName(l.code);
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'lang-name';
            nameSpan.textContent = displayName;
            const countSpan = document.createElement('span');
            countSpan.className = 'lang-count';
            countSpan.textContent = l.count;
            li.appendChild(nameSpan);
            li.appendChild(countSpan);
            
            const activate = () => switchLanguage(l.code);
            li.addEventListener('click', activate);
            li.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    activate();
                }
            });
            
            list.appendChild(li);
            totalCount += l.count;
        });

        // Update All count
        document.getElementById('totalLangCount').innerText = totalCount;
        
        // Bind click for All
        const activateAll = () => switchLanguage('all');
        allLi.addEventListener('click', activateAll);
        allLi.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                activateAll();
            }
        });

    } catch (e) {
        console.error("Failed to load languages", e);
    }
}

function getLanguageName(code) {
    // Simple map or Intl
    try {
        const regionNames = new Intl.DisplayNames([navigator.language], {type: 'language'});
        return regionNames.of(code) || code;
    } catch (e) {
        return code;
    }
}

async function switchLanguage(langCode) {
    if (currentSourceLang === langCode) return;
    
    currentSourceLang = langCode;
    
    // Update UI active state
    document.querySelectorAll('.language-item').forEach(el => {
        const isActive = el.dataset.lang === langCode;
        if (isActive) el.classList.add('active');
        else el.classList.remove('active');
        el.setAttribute('aria-pressed', isActive);
    });
    
    // Reload data
    loadHistory(true);
    updateDashboard(); // Check if dashboard needs filtering
}

async function updateDashboard() {
  try {
    // Load all items (filtered) to calculate stats
    // Note: getTranslations supports filter now
    // For specific stats we might want to fetch all for that language
    const allItems = await storageService.getTranslations(5000, 0, currentSourceLang);
    const totalCount = allItems.length;

    // Mastery Index based on SRS stage (assuming stage 5+ is mastered)
    const masteredCount = allItems.filter(
      (item) => (item.srs_stage || 0) >= 5,
    ).length;
    const masteryIndex =
      totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;

    // Coverage Stats
    const top2kMastered = new Set(
      allItems
        .filter((i) => i.frequency_rank && i.frequency_rank <= 2000)
        .map((i) => i.text.toLowerCase()),
    ).size;
    const top5kMastered = new Set(
      allItems
        .filter((i) => i.frequency_rank && i.frequency_rank <= 5000)
        .map((i) => i.text.toLowerCase()),
    ).size;

    // Animate Numbers
    animateNumber(
      document.getElementById("stat-total-count"),
      0,
      totalCount,
      1000,
    );
    animateNumber(
      document.getElementById("stat-mastery-index"),
      0,
      masteryIndex,
      1000,
      "%",
    );

    const missionResponse = await chrome.runtime.sendMessage({ action: 'GET_WEEKLY_MISSION' });
    const mission = missionResponse && missionResponse.success ? missionResponse.data : null;
    const missionScore = Number(mission?.summary?.score || 0);
    const missionTarget = Number(mission?.summary?.targetTotal || 0);
    const missionProgress = Number(mission?.summary?.progressTotal || 0);

    animateNumber(
      document.getElementById("stat-mission-score"),
      0,
      missionScore,
      1000,
      "%",
    );

    // Update Progress Bars
    const coverage2kPercent = Math.min((top2kMastered / 2000) * 100, 100);
    const coverage5kPercent = Math.min((top5kMastered / 5000) * 100, 100);

    setTimeout(() => {
      document.getElementById("bar-mission").style.width = `${missionScore}%`;
      document.getElementById("mission-summary-ratio").innerText = `${missionProgress} / ${missionTarget}`;
      const summaryText = document.getElementById("mission-summary-text");
      if (summaryText) {
        summaryText.innerText = mission?.completed
          ? `${i18nService.getText('missionSummaryCompleted')} (${mission.weekId})`
          : `${i18nService.getText('missionSummaryProgress')} (${mission?.weekId || '--'})`;
      }

      document.getElementById("bar-coverage-2k").style.width =
        `${coverage2kPercent}%`;
      document.getElementById("bar-coverage-5k").style.width =
        `${coverage5kPercent}%`;
      document.getElementById("label-coverage-2k").innerText =
        `${top2kMastered} / 2000`;
      document.getElementById("label-coverage-5k").innerText =
        `${top5kMastered} / 5000`;
    }, 100);
  } catch (error) {
    console.error("Failed to update dashboard:", error);
  }
}

function animateNumber(element, start, end, duration, suffix = "") {
  let startTime = null;
  const step = (timestamp) => {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    const value = Math.floor(progress * (end - start) + start);
    element.innerText = value + suffix;
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

async function loadHistory(reset = true) {
  const list = document.getElementById("historyList");
  const archivedList = document.getElementById("archivedList");
  const archivedContainer = document.getElementById("archivedContainer");
  const archivedCountLabel = document.getElementById("archivedCount");
  const emptyState = document.getElementById("emptyState");
  const loadMoreContainer = document.getElementById("loadMoreContainer");

  if (reset) {
    list.innerHTML = "";
    archivedList.innerHTML = "";
    currentOffset = 0;
  }

  try {
    // Pass currentSourceLang to filter
    const items = await storageService.getTranslations(
      PAGE_SIZE,
      currentOffset,
      currentSourceLang === 'all' ? undefined : currentSourceLang
    );

    // If no items at all (and reset), show empty
    if (reset && items.length === 0) {
      emptyState.style.display = "block";
      loadMoreContainer.style.display = "none";
      archivedContainer.style.display = "none";
      return;
    }

    emptyState.style.display = "none";

    // Check for more
    const nextItems = await storageService.getTranslations(
      1,
      currentOffset + PAGE_SIZE,
      currentSourceLang
    );
    loadMoreContainer.style.display = nextItems.length > 0 ? "block" : "none";

    let hasArchived = false;

    items.forEach((item) => {
      const li = document.createElement("li");
      li.className = "history-item";
      if (item.isArchived) li.classList.add("is-archived");

      const date = new Date(item.timestamp).toLocaleString();
      let shortUrl = "";
      let safeSourceUrl = "";
      if (item.sourceUrl) {
          try {
              const parsedUrl = new URL(item.sourceUrl);
              // Only allow http/https to prevent javascript: or data: URLs in href
              if (parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:') {
                  shortUrl = parsedUrl.hostname;
                  safeSourceUrl = item.sourceUrl;
              }
          } catch (e) { /* invalid URL, ignore */ }
      }
      const freqBadge = item.frequency_rank
        ? `
                <span style="font-size: 10px; background: #eee; padding: 2px 6px; border-radius: 4px; color: #666; font-weight: bold; margin-bottom: 8px; display: inline-block;">
                    #${item.frequency_rank} ${item.cefr_level || ""}
                </span>
            `
        : "";

      li.innerHTML = `
                <div class="actions-overlay">
                    <button class="icon-btn tts-btn" title="Listen" aria-label="Listen to pronunciation">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                    </button>
                    <button class="icon-btn archive" title="${item.isArchived ? "Unarchive" : "Archive"}" aria-label="${item.isArchived ? "Unarchive item" : "Archive item"}">
                        ${item.isArchived 
                            ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 14 4 9 9 4"></polyline><path d="M20 20v-7a4 4 0 0 0-4-4H4"></path></svg>' 
                            : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>'}
                    </button>
                    <button class="icon-btn delete" title="Delete" aria-label="Delete item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </div>

                <div class="item-content">
                    ${freqBadge}
                    <div class="original">${escapeHtml(item.text)}</div>
                    <div class="translation">${escapeHtml(item.translation)}</div>
                    ${item.context ? `<div class="context">"${highlightContext(item.context, item.text)}"</div>` : ""}
                    
                    <div class="progress-wrapper">
                         <div class="item-progress-bar" title="Mastery: ${item.learningRate || 0}%">
                            <div class="item-progress-fill" style="width: ${item.learningRate || 0}%"></div>
                         </div>
                    </div>

                    <div class="meta">
                        <div class="meta-info">
                            <span>${date}</span>
                             ${shortUrl ? `<span>•</span><a href="${escapeHtml(safeSourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(shortUrl)}</a>` : ""}
                        </div>
                    </div>
                </div>
            `;

      // TTS event
      li.querySelector(".tts-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        playTTS(item.text, item.sourceLang || 'en');
      });

      // Archive event
      const archiveBtn = li.querySelector(".archive");
      archiveBtn.addEventListener("click", () => {
        archiveItem(item.text, item.translation, !item.isArchived); // Toggle
      });

      // Delete event
      li.querySelector(".delete").addEventListener("click", () => {
        deleteItem(item.text, item.translation);
      });

      // Distribute to containers
      if (item.isArchived) {
        archivedList.appendChild(li);
        hasArchived = true;
      } else {
        list.appendChild(li);
      }
    });

    // Update Archived Count & Visibility (Accumulative logic if load more?
    // Ideally we should count ALL archived items in DB.
    // For now let's just show count of LOADED archived items or fetch stats)

    // Simple hack: count children
    const totalArchived = archivedList.children.length;
    if (totalArchived > 0) {
      archivedContainer.style.display = "block";
      archivedCountLabel.innerText = totalArchived;
    }

    currentOffset += items.length;
  } catch (error) {
    console.error("Failed to load history:", error);
  }
}

async function deleteItem(text, translation) {
  if (!confirm(i18nService.getText("deleteConfirm"))) {
    return;
  }
  try {
    await storageService.removeTranslation(text, translation);
    // Reload sidebar counts too
    await loadLanguageSidebar();
    loadHistory(true); 
  } catch (error) {
    console.error("Failed to delete item:", error);
  }
}

async function archiveItem(text, translation, newState = true) {
  try {
    await storageService.updateSRSStatus(text, translation, {
      isArchived: newState,
    });
    loadHistory(true); // Need reset to move item between lists
  } catch (error) {
    console.error("Failed to update archive status:", error);
  }
}

async function clearAllHistory() {
  const confirmMsg = currentSourceLang === 'all' 
    ? i18nService.getText("clearConfirm")
    : `${i18nService.getText("clearConfirm")} (${getLanguageName(currentSourceLang)})`;

  if (!confirm(confirmMsg)) {
    return;
  }

  try {
    await storageService.clearAll(currentSourceLang);
    await loadLanguageSidebar();
    loadHistory(true);
  } catch (error) {
    console.error("Failed to clear history:", error);
  }
}

function highlightContext(context, text) {
  if (!context || !text) return context;

  try {
    const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escapedText})`, "gi");
    return escapeHtml(context).replace(regex, "<mark>$1</mark>");
  } catch (e) {
    return escapeHtml(context);
  }
}

function playTTS(text, lang) {
  if (!text) return;
  chrome.runtime.sendMessage({
      action: 'playTTS',
      text: text,
      lang: lang
  }, () => {
      if (chrome.runtime.lastError) {
          console.warn('TTS message failed:', chrome.runtime.lastError.message);
      }
  });
}

function escapeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
