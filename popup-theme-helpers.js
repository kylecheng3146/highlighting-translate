function renderThemeSwatches(activeColor) {
    const container = document.getElementById('themeSwatches');
    if (!container) return;
    
    container.innerHTML = '';
    
    themeService.presets.forEach(preset => {
        const swatch = document.createElement('div');
        swatch.className = 'swatch';
        swatch.style.backgroundColor = preset.color;
        swatch.title = preset.name;
        
        // Check equality (case insensitive)
        if (preset.color.toLowerCase() === activeColor.toLowerCase()) {
            swatch.classList.add('active');
        }
        
        swatch.addEventListener('click', () => {
             handleThemeChange(preset.color);
             themeService.saveTheme(preset.color);
             // Update active state UI
             document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
             swatch.classList.add('active');
             
             // Update picker value
             const picker = document.getElementById('customColorPicker');
             if (picker) picker.value = preset.color;
        });
        
        container.appendChild(swatch);
    });
}

function handleThemeChange(color) {
    themeService.applyTheme(color);
}
