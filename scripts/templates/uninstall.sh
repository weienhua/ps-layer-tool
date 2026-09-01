#!/bin/bash
# ============================================================
#  图层处理工具 - macOS 自动卸载脚本
#  版本: __VERSION__
#  用法:
#    终端: bash 本文件  或  ./本文件
#    Finder: 双击 .command 副本（自动打开终端运行）
# ============================================================

set -u

EXTENSION_ID="com.layertool.panel"
KEEP_FILES=(presets.md template.md)

# ---------- 输出辅助 ----------
info() { echo "[信息] $*"; }
ok()   { echo "[成功] $*"; }
warn() { echo "[警告] $*"; }
err()  { echo "[错误] $*" >&2; }

# ---------- 确定目标 ----------
if [ -z "${HOME:-}" ]; then
  err "无法确定 HOME 目录。"
  exit 1
fi
EXTENSIONS_DIR="$HOME/Library/Application Support/Adobe/CEP/extensions"
TARGET_DIR="$EXTENSIONS_DIR/$EXTENSION_ID"

# ---------- 检查是否已安装 ----------
if [ ! -e "$TARGET_DIR" ] && [ ! -L "$TARGET_DIR" ]; then
  warn "未检测到已安装的图层处理工具插件"
  exit 0
fi

# ---------- 备份用户文件 ----------
BACKUP_DIR="$EXTENSIONS_DIR/${EXTENSION_ID}_user_files"
mkdir -p "$BACKUP_DIR"
BACKED_UP=0
for f in "${KEEP_FILES[@]}"; do
  if [ -f "$TARGET_DIR/dist/lib/$f" ]; then
    cp -p "$TARGET_DIR/dist/lib/$f" "$BACKUP_DIR/$f"
    BACKED_UP=1
  fi
done
if [ -d "$TARGET_DIR/dist/lib/presets" ]; then
  cp -R "$TARGET_DIR/dist/lib/presets" "$BACKUP_DIR/presets"
  BACKED_UP=1
  ok "用户预设已备份到: $BACKUP_DIR"
fi
if [ "$BACKED_UP" -eq 0 ]; then
  rmdir "$BACKUP_DIR" 2>/dev/null
fi

# ---------- 删除插件 ----------
if [ -L "$TARGET_DIR" ]; then
  if unlink "$TARGET_DIR"; then
    ok "目录链接已移除"
  else
    err "移除链接失败"
    exit 1
  fi
else
  if rm -rf "$TARGET_DIR"; then
    ok "插件文件已删除"
  else
    err "删除插件失败"
    exit 1
  fi
fi

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║             卸载完成！                       ║"
echo "║  请重启 Photoshop 以使更改生效。             ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "按回车键退出..."
if [ -t 0 ]; then
  read
fi
exit 0
