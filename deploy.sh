#!/bin/bash

# 專案名稱與路徑
PROJECT_NAME="highlighting-translate"
DIST_DIR="dist"
BUILD_DIR="temp_build"

# 檢查 manifest.json 是否存在
if [ ! -f "manifest.json" ]; then
    echo "❌ 錯誤: 找不到 manifest.json，請在專案根目錄執行此腳本。"
    exit 1
fi

# 從 manifest.json 讀取版本號 (相容 macOS/Linux)
VERSION=$(grep '"version":' manifest.json | head -1 | cut -d '"' -f 4)
ZIP_NAME="${PROJECT_NAME}-v${VERSION}.zip"

echo "🚀 開始打包 $PROJECT_NAME v$VERSION..."

# 清理並建立目錄
rm -rf "$DIST_DIR"
rm -rf "$BUILD_DIR"
mkdir -p "$DIST_DIR"
mkdir -p "$BUILD_DIR"

# --- 1. 複製核心檔案 ---
echo "📂 正在複製必要檔案..."
FILES=(
    "manifest.json"
    "background.js"
    "content.js"
    "popup.html"
    "popup.js"
    "history.html"
    "history.js"
    "review.html"
    "review.js"
    "review.css"
    "report.html"
    "report.js"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "$BUILD_DIR/"
    else
        echo "⚠️ 警告: 找不到 $file"
    fi
done

# --- 2. 複製必要資料夾 ---
DIRECTORIES=(
    "services"
    "icons"
    "assets"
)

for dir in "${DIRECTORIES[@]}"; do
    if [ -d "$dir" ]; then
        cp -r "$dir" "$BUILD_DIR/"
    else
        echo "⚠️ 警告: 找不到 $dir 資料夾"
    fi
done

# --- 3. 清理不需要的檔案 (如測試檔) ---
echo "🧹 清理開發用檔案 (測試檔等)..."
find "$BUILD_DIR" -name "*.test.js" -type f -delete

# --- 4. 檢查 icons 是否為空 ---
if [ -d "icons" ] && [ -z "$(ls -A icons)" ]; then
    echo "⚠️  注意: icons/ 資料夾目前是空的，發佈前請記得放入圖示檔案。"
fi

# --- 5. 打包成 ZIP ---
echo "📦 正在壓縮為 $ZIP_NAME..."
cd "$BUILD_DIR" || exit
zip -rq "../$DIST_DIR/$ZIP_NAME" ./*
cd ..

# 清理暫存目錄
rm -rf "$BUILD_DIR"

echo "-------------------------------------------"
echo "✅ 打包完成！"
echo "📦 ZIP 檔案位置: $DIST_DIR/$ZIP_NAME"
echo "-------------------------------------------"
