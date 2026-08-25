```
TASK: 動畫規格設計
EXPECTED OUTCOME: .shared/06-animations.md
REQUIRED AGENT: Interactive Designer
CONTEXT: .shared/02-wireframes.md, .shared/03-ux-specification.md
```

# 06-animations.md — Reading Progress Dashboard 動畫規格

## 1. 數字跳動效果

### 觸發時機
- 統計數字更新時 (翻譯/收藏行為)

### 動畫規格
```css
@keyframes number-pop {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
}

.stat-number {
    animation: number-pop 0.3s ease-out;
}
```

### 行為
- 數字從舊值過渡到新值
- 過渡期間數字輕微放大再縮回
- 不影響其他 UI 元素

---

## 2. Streak 火焰動畫

### 觸發時機
- Streak 達成時 (完成今日學習)
- 開啟 Popup 時 (顯示當前 streak)

### 動畫規格
```css
@keyframes flame-flicker {
    0%, 100% { transform: scale(1) rotate(0deg); }
    25% { transform: scale(1.05) rotate(-2deg); }
    50% { transform: scale(1.1) rotate(0deg); }
    75% { transform: scale(1.05) rotate(2deg); }
}

.streak-icon {
    animation: flame-flicker 1.5s ease-in-out infinite;
}
```

### 行為
- 火焰圖標持續輕微搖曳
- 節奏自然, 不過度誇張
- 無限循環, 直到 streak 中斷

---

## 3. 進度條填充動畫

### 觸發時機
- 里程碑進度更新時
- Dashboard 載入時

### 動畫規格
```css
@keyframes progress-fill {
    from { width: 0%; }
    to { width: var(--progress); }
}

.progress-bar {
    animation: progress-fill 0.8s ease-out forwards;
}
```

### 行為
- 進度條從 0% 填充到當前百分比
- 填充速度均勻
- 完成後保持最終狀態

---

## 4. 卡片淡入效果

### 觸發時機
- Dashboard 載入時
- 切換時間範圍時

### 動畫規格
```css
@keyframes fade-in-up {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.dashboard-card {
    animation: fade-in-up 0.4s ease-out;
}
```

### 行為
- 卡片從下方淡入
- 每張卡片延遲 0.1s 顯示 (依序)
- 不阻礙使用者操作

---

## 5. 圖表繪製動畫

### 觸發時機
- Dashboard 載入時
- 切換時間範圍時

### 動畫規格
```css
@keyframes draw-line {
    from { stroke-dashoffset: 1000; }
    to { stroke-dashoffset: 0; }
}

.chart-line {
    stroke-dasharray: 1000;
    animation: draw-line 1s ease-out forwards;
}
```

### 行為
- 折線圖從左到右繪製
- 繪製速度均勻
- 資料點依序出現

---

## 6. 分享卡片生成動畫

### 觸發時機
- 點擊「Share」按鈕後

### 動畫規格
```css
@keyframes card-generate {
    0% { opacity: 0; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1.05); }
    100% { opacity: 1; transform: scale(1); }
}

.share-card {
    animation: card-generate 0.5s ease-out;
}
```

### 行為
- 卡片從中心淡入放大
- 輕微彈跳效果
- 完成後保持靜止

---

## 7. 里程碑達成動畫

### 觸發時機
- 詞彙量達到底級門檻時

### 動畫規格
```css
@keyframes milestone-celebrate {
    0% { transform: scale(1); }
    20% { transform: scale(1.3) rotate(-5deg); }
    40% { transform: scale(1.3) rotate(5deg); }
    60% { transform: scale(1.1) rotate(-3deg); }
    80% { transform: scale(1.1) rotate(3deg); }
    100% { transform: scale(1); }
}

.milestone-icon {
    animation: milestone-celebrate 0.8s ease-out;
}
```

### 行為
- 等級圖標輕微搖擺
- 持續時間短, 不過度打擾
- 一次播放, 不循環

---

## 8. Streak 提示滑入

### 觸發時機
- 今日尚未學習時
- 開啟 Popup 時

### 動畫規格
```css
@keyframes slide-in-bottom {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.streak-prompt {
    animation: slide-in-bottom 0.3s ease-out;
}
```

### 行為
- 提示從底部滑入
- 不阻礙其他 UI 操作
- 可手動關閉

---

## 9. 全局動畫原則

### 效能
- 所有動畫使用 CSS transform/opacity (GPU 加速)
- 避免觸發 layout/paint
- 動畫時間 < 1s (保持流暢感)

### 使用者偏好
- 尊重 `prefers-reduced-motion` 設定
- 若使用者開啟減少動畫, 停用所有動畫效果

```css
@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
    }
}
```

### 一致性
- 所有動畫使用相同的 ease-out 曲線
- 時間範圍: 0.2s - 0.8s
- 不使用彈跳或過度誇張的效果

---

## 10. 動畫時序

| 動畫 | 持續時間 | 延遲 | 總時間 |
|---|---|---|---|
| 數字跳動 | 0.3s | 0s | 0.3s |
| 火焰搖曳 | 1.5s | 0s | 無限循環 |
| 進度條填充 | 0.8s | 0s | 0.8s |
| 卡片淡入 | 0.4s | 0.1s * n | 0.5s + 0.1n |
| 圖表繪製 | 1s | 0s | 1s |
| 分享卡片 | 0.5s | 0s | 0.5s |
| 里程碑達成 | 0.8s | 0s | 0.8s |
| Streak 提示 | 0.3s | 0s | 0.3s |
