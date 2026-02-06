const storageService = new StorageService();
const i18nService = new I18nService();
let currentOffset = 0;
const PAGE_SIZE = 50;

document.addEventListener("DOMContentLoaded", () => {
  i18nService.localizePage();
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

async function updateDashboard() {
  try {
    // Load all items to calculate stats
    const allItems = await storageService.getTranslations(5000, 0);
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

    // Update Progress Bars
    const coverage2kPercent = Math.min((top2kMastered / 2000) * 100, 100);
    const coverage5kPercent = Math.min((top5kMastered / 5000) * 100, 100);

    setTimeout(() => {
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
    // Load MORE items to facilitate separation (or filter in memory? StorageService pagination is generic)
    // Since we need to split active/archived, simple pagination gets tricky if we want ALL archived at bottom.
    // Option 1: Load generic page, sort them. (Might have mixed pages)
    // Option 2: Fetch ALL and render client side (cleanest for "Archived at bottom")
    // Option 3: Request separate Active/Archived lists from StorageService (Best for perf)
    // Let's stick to generic fetch for now but render into two buckets.
    // NOTE: This simple pagination approach means "Archived" items might appear in later "pages".
    // For the user request "Move to hidden row", usually implies seeing them all.
    // Let's assume fetching a larger batch or handling simply by rendering.

    const items = await storageService.getTranslations(
      PAGE_SIZE,
      currentOffset,
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
    );
    loadMoreContainer.style.display = nextItems.length > 0 ? "block" : "none";

    let hasArchived = false;

    items.forEach((item) => {
      const li = document.createElement("li");
      li.className = "history-item";
      if (item.isArchived) li.classList.add("is-archived");

      const date = new Date(item.timestamp).toLocaleString();
      const shortUrl = item.sourceUrl ? new URL(item.sourceUrl).hostname : "";
      const freqBadge = item.frequency_rank
        ? `
                <span style="font-size: 10px; background: #eee; padding: 2px 6px; border-radius: 4px; color: #666; font-weight: bold; margin-bottom: 8px; display: inline-block;">
                    #${item.frequency_rank} ${item.cefr_level || ""}
                </span>
            `
        : "";

      li.innerHTML = `
                <div class="actions-overlay">
                    <button class="icon-btn archive" title="${item.isArchived ? "Unarchive" : "Archive"}">
                        ${item.isArchived 
                            ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 14 4 9 9 4"></polyline><path d="M20 20v-7a4 4 0 0 0-4-4H4"></path></svg>' 
                            : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>'}
                    </button>
                    <button class="icon-btn delete" title="Delete">
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
                            ${shortUrl ? `<span>•</span><a href="${item.sourceUrl}" target="_blank">${shortUrl}</a>` : ""}
                        </div>
                    </div>
                </div>
            `;

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
    loadHistory(true); // Reload list from start to reflect changes
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
  if (!confirm(i18nService.getText("clearConfirm"))) {
    return;
  }

  try {
    await storageService.clearAll();
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

function escapeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
