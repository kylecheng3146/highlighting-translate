// Node.js script to create PNG icons
// Run this script with Node.js to generate icon files

const fs = require('fs');
const { createCanvas } = require('canvas');

function createIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // 背景
    ctx.fillStyle = '#4285f4';
    ctx.beginPath();
    const radius = size * 0.125;
    ctx.roundRect(0, 0, size, size, radius);
    ctx.fill();
    
    // 縮放比例
    const scale = size / 128;
    ctx.save();
    ctx.scale(scale, scale);
    
    // 左側對話框
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.moveTo(30, 35);
    ctx.lineTo(30, 50);
    ctx.quadraticCurveTo(30, 55, 35, 55);
    ctx.lineTo(55, 55);
    ctx.quadraticCurveTo(60, 55, 60, 50);
    ctx.lineTo(60, 35);
    ctx.quadraticCurveTo(60, 30, 55, 30);
    ctx.lineTo(35, 30);
    ctx.quadraticCurveTo(30, 30, 30, 35);
    ctx.fill();
    
    // 左側對話框尾巴
    ctx.beginPath();
    ctx.moveTo(30, 50);
    ctx.lineTo(30, 57);
    ctx.lineTo(40, 50);
    ctx.fill();
    
    // 右側對話框
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(68, 60);
    ctx.lineTo(68, 75);
    ctx.quadraticCurveTo(68, 80, 73, 80);
    ctx.lineTo(93, 80);
    ctx.quadraticCurveTo(98, 80, 98, 75);
    ctx.lineTo(98, 60);
    ctx.quadraticCurveTo(98, 55, 93, 55);
    ctx.lineTo(73, 55);
    ctx.quadraticCurveTo(68, 55, 68, 60);
    ctx.fill();
    
    // 右側對話框尾巴
    ctx.beginPath();
    ctx.moveTo(98, 75);
    ctx.lineTo(98, 82);
    ctx.lineTo(88, 75);
    ctx.fill();
    
    // 文字
    ctx.fillStyle = '#4285f4';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('A', 45, 45);
    ctx.fillText('文', 83, 70);
    
    ctx.restore();
    
    return canvas.toBuffer('image/png');
}

// 創建圖標
console.log('Creating icons...');

try {
    fs.writeFileSync('icon-16.png', createIcon(16));
    console.log('✓ Created icon-16.png');
    
    fs.writeFileSync('icon-48.png', createIcon(48));
    console.log('✓ Created icon-48.png');
    
    fs.writeFileSync('icon-128.png', createIcon(128));
    console.log('✓ Created icon-128.png');
    
    console.log('\nIcons created successfully!');
} catch (error) {
    console.error('Error creating icons:', error);
    console.log('\nTo run this script, you need to install the canvas package:');
    console.log('npm install canvas');
}
