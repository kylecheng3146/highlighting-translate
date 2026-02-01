# 06-animations.md - Smart Frequency UI Animations

## 1. Mastery Progress Bar Filling (儀表板進度條填充)
當使用者打開儀表板時，進度條應從 0% 動態增長至目標百分比，營造「進步」的視覺感。

```css
/* Tailwind 配置擴展建議 */
@keyframes progress-fill {
  from { width: 0%; }
  to { width: var(--target-width); }
}

.animate-progress {
  animation: progress-fill 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
```

## 2. Tooltip Rank Badge Pop-in (頻率標籤彈出)
Tooltip 出現時，頻率標籤（如 #450）應稍微延遲並以「彈出」方式顯示，強調其重要性。

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

## 3. Highlighting Pulse (新高亮詞脈衝)
當一個新單字被自動高亮時，它會輕微閃爍一次，提示使用者「這是一個新紀錄」。

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

## 4. Dashboard Stat Number Counting (數字滾動)
儀表板上的「詞彙總數」或「百分比」應從 0 快速滾動到目標數字。

**JS 實作邏輯：**
使用 `requestAnimationFrame` 在 1 秒內線性增加顯示數字。

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
