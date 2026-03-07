# 06-animations.md — Phrasal Verbs Level 1 UI Animations

> **版本**: v2 — 片語資料庫 Level 1 整合 (2026-03-07)

---

## 1. Mastery Progress Bar Filling (儀表板進度條填充)

當使用者打開儀表板時，進度條應從 0% 動態增長至目標百分比，營造「進步」的視覺感。

```css
@keyframes progress-fill {
  from { width: 0%; }
  to { width: var(--target-width); }
}

.animate-progress {
  animation: progress-fill 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
```

---

## 2. Tooltip Rank Badge Pop-in (頻率標籤彈出)

Tooltip 出現時，頻率標籤（如 #850 / B1）應稍微延遲並以「彈出」方式顯示，強調其重要性。片語 Tooltip 沿用相同動畫。

```css
@keyframes badge-pop {
  0% { transform: scale(0.5); opacity: 0; }
  70% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}

.badge-frequency {
  animation: badge-pop 0.4s ease-out 0.2s both;
}
```

---

## 3. Highlighting Pulse (新高亮詞脈衝)

當一個新單字或片語被自動高亮時，它會輕微閃爍一次，提示使用者「這是一個已知詞彙」。
片語高亮元素與單字完全相同，使用相同的 pulse 動畫。

```css
@keyframes hl-pulse {
  0% { box-shadow: 0 0 0 0 rgba(255, 130, 0, 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(255, 130, 0, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 130, 0, 0); }
}

.hl-freq-high.newly-added {
  animation: hl-pulse 2s infinite;
}
```

---

## 4. Dashboard Stat Number Counting (數字滾動)

儀表板上的「詞彙總數」或「百分比」應從 0 快速滾動到目標數字。

```javascript
function animateNumber(element, start, end, duration) {
  let startTime = null;
  function animation(currentTime) {
    if (!startTime) startTime = currentTime;
    const progress = Math.min((currentTime - startTime) / duration, 1);
    element.innerText = Math.floor(progress * (end - start) + start);
    if (progress < 1) requestAnimationFrame(animation);
  }
  requestAnimationFrame(animation);
}
```

---

## 5. Level 1 動畫決策

**片語不增加額外動畫差異**，沿用現有動畫系統。原因：
- 片語高亮視覺與單字相同（已決策）
- 保持 UX 一致性，避免過度刺激
- Level 2 可考慮加入「片語學習里程碑」特效
