# ============================================================
#  图层处理工具 — macOS .pkg 脚本公共函数
#
#  说明: 本文件不单独执行。构建时由 scripts/build-installer.js
#        内联到 install-preinstall / install-postinstall /
#        uninstall-postinstall 中 `# __COMMON__` 占位处，
#        避免三份脚本逻辑分叉。
# ============================================================

EXTENSION_ID="com.layertool.panel"
APP_NAME="图层处理工具"

# 需要跨安装保留的用户文件（相对 dist/lib/），与 scripts/install.js 的
# LIB_KEEP_FILES / LIB_KEEP_DIRS 保持一致，保证三个平台语义相同。
KEEP_FILES="presets.md template.md"
KEEP_DIRS="presets"

info() { echo "[信息] $*"; }
ok()   { echo "[成功] $*"; }
warn() { echo "[警告] $*"; }
err()  { echo "[错误] $*" >&2; }

# 当前是否以 root 运行
is_root() {
  if [ "$(id -u)" = "0" ]; then
    return 0
  fi
  return 1
}

# 取指定用户的 HOME（dscl 优先，~user 展开兜底）
home_for_user() {
  _u="$1"
  _h="$(dscl . -read "/Users/$_u" NFSHomeDirectory 2>/dev/null | awk '{print $2}')"
  if [ -z "$_h" ]; then
    _h="$(eval echo "~$_u" 2>/dev/null)"
  fi
  printf '%s' "$_h"
}

# 解析目标用户与路径。
# 成功: 导出 TARGET_USER / TARGET_HOME / EXTENSIONS_DIR / TARGET_DIR / BACKUP_DIR 并返回 0
# 失败: 返回 1（调用方负责提示并中止，绝不静默乱删）
#
# 注意: 本函数必须在 preinstall 与 postinstall 中给出相同结果 —— 两者是独立进程，
#       除确定性路径外没有任何状态传递通道。
resolve_target_home() {
  TARGET_USER=""
  TARGET_HOME=""

  # 0. 隔离演练覆盖（仅 scripts/verify-macos-pkg.sh 使用，Installer 不会设置该变量）
  if [ -n "${PS_LT_TEST_HOME:-}" ]; then
    TARGET_HOME="$PS_LT_TEST_HOME"
    if [ -n "${PS_LT_TEST_USER:-}" ]; then
      TARGET_USER="$PS_LT_TEST_USER"
    else
      TARGET_USER="$(id -un)"
    fi
  fi

  # 1. sudo installer 场景
  if [ -z "$TARGET_HOME" ] && [ -n "${SUDO_USER:-}" ] && [ "$SUDO_USER" != "root" ]; then
    TARGET_USER="$SUDO_USER"
    TARGET_HOME="$(home_for_user "$TARGET_USER")"
  fi

  # 2. 以用户身份运行（用户域安装的常见情形，实测 Installer 即如此）
  if [ -z "$TARGET_HOME" ] && [ -n "${HOME:-}" ] && [ "$HOME" != "/var/root" ] && [ "$HOME" != "/" ]; then
    TARGET_USER="$(id -un)"
    TARGET_HOME="$HOME"
  fi

  # 3. 以 root 运行：取当前登录的控制台用户
  if [ -z "$TARGET_HOME" ]; then
    _cu="$(stat -f '%Su' /dev/console 2>/dev/null)"
    if [ -n "$_cu" ] && [ "$_cu" != "root" ] && [ "$_cu" != "loginwindow" ]; then
      TARGET_USER="$_cu"
      TARGET_HOME="$(home_for_user "$TARGET_USER")"
    fi
  fi

  # 4. 兜底：扫描 /Users/*，找刚刚（5 分钟内）安装过插件的家目录
  if [ -z "$TARGET_HOME" ]; then
    for _h in /Users/*; do
      if [ ! -d "$_h" ]; then
        continue
      fi
      case "$_h" in
        */Shared|*/Guest) continue ;;
      esac
      _m="$_h/Library/Application Support/Adobe/CEP/extensions/$EXTENSION_ID/CSXS/manifest.xml"
      if [ -f "$_m" ] && [ -n "$(find "$_m" -mmin -5 2>/dev/null)" ]; then
        TARGET_HOME="$_h"
        TARGET_USER="$(stat -f '%Su' "$_h" 2>/dev/null)"
        break
      fi
    done
  fi

  if [ -z "$TARGET_HOME" ]; then
    return 1
  fi

  EXTENSIONS_DIR="$TARGET_HOME/Library/Application Support/Adobe/CEP/extensions"
  TARGET_DIR="$EXTENSIONS_DIR/$EXTENSION_ID"
  # 备份目录布局与 Windows 安装/卸载程序（scripts/install.js、uninstall.js）一致，跨平台互通
  BACKUP_DIR="$EXTENSIONS_DIR/${EXTENSION_ID}_user_files"
  return 0
}

# 备份现有安装的用户文件到 BACKUP_DIR：
#   BACKUP_DIR/presets.md、BACKUP_DIR/template.md、BACKUP_DIR/presets/
# 与卸载备份目录（BACKUP_DIR）布局相同，因此重装时可以复用同一套恢复逻辑。
# 采用确定性路径（不走临时文件），因为 preinstall / postinstall 是两个独立进程。
# 失败返回 1 —— 调用方必须中止，绝不丢用户数据。
backup_user_files() {
  if [ ! -d "$TARGET_DIR/dist/lib" ]; then
    return 0
  fi
  if ! mkdir -p "$BACKUP_DIR"; then
    err "无法创建备份目录: $BACKUP_DIR"
    return 1
  fi

  _f=""
  for _f in $KEEP_FILES; do
    if [ -f "$TARGET_DIR/dist/lib/$_f" ]; then
      if ! cp -p "$TARGET_DIR/dist/lib/$_f" "$BACKUP_DIR/$_f"; then
        err "备份用户文件失败: $_f"
        return 1
      fi
    fi
  done

  _d=""
  for _d in $KEEP_DIRS; do
    if [ -d "$TARGET_DIR/dist/lib/$_d" ]; then
      rm -rf "$BACKUP_DIR/$_d"
      if ! cp -R "$TARGET_DIR/dist/lib/$_d" "$BACKUP_DIR/$_d"; then
        err "备份用户目录失败: $_d"
        return 1
      fi
    fi
  done

  ok "用户文件已备份到: $BACKUP_DIR"
  return 0
}

# 把 <源目录> 中的用户文件/目录恢复到 TARGET_DIR/dist/lib/
# 源目录是 BACKUP_DIR —— 覆盖安装时是 preinstall 的临时备份，重装时是上次卸载留下的
# 备份目录，两者布局相同。失败返回 1（备份保留在原地，安装报错中止，不静默吞掉）。
restore_user_files() {
  _src="$1"
  if [ ! -d "$_src" ]; then
    return 0
  fi
  if ! mkdir -p "$TARGET_DIR/dist/lib"; then
    err "无法创建目录: $TARGET_DIR/dist/lib"
    return 1
  fi

  _f=""
  for _f in $KEEP_FILES; do
    if [ -f "$_src/$_f" ]; then
      if ! cp -p "$_src/$_f" "$TARGET_DIR/dist/lib/$_f"; then
        err "恢复用户文件失败: $_f"
        return 1
      fi
    fi
  done

  _d=""
  for _d in $KEEP_DIRS; do
    if [ -d "$_src/$_d" ]; then
      if ! cp -R "$_src/$_d" "$TARGET_DIR/dist/lib/"; then
        err "恢复用户目录失败: $_d"
        return 1
      fi
    fi
  done

  return 0
}

# 纠正路径属主为目标用户。
# Installer 以用户身份安装用户域包时文件已属该用户；以 root 安装（sudo installer）
# 时会是 root 属主，必须纠正，否则面板无法写 dist/lib/presets 下的预设文件。
chown_user() {
  _path="$1"
  if ! is_root; then
    return 0
  fi
  if [ -z "${TARGET_USER:-}" ]; then
    warn "无法确定目标用户，跳过属主纠正: $_path"
    return 0
  fi
  if [ -e "$_path" ] || [ -L "$_path" ]; then
    if ! chown -R "$TARGET_USER" "$_path" 2>/dev/null; then
      warn "属主纠正失败: $_path"
    fi
  fi
  return 0
}

# 开启 CEP 调试模式（CSXS 6-12）
# root 下必须 sudo -u 以目标用户身份写，否则写进 /var/root 的用户域。
enable_cep_debug_mode() {
  for _v in 6 7 8 9 10 11 12; do
    if is_root; then
      sudo -u "$TARGET_USER" defaults write "com.adobe.CSXS.$_v" PlayerDebugMode -integer 1 2>/dev/null
    else
      defaults write "com.adobe.CSXS.$_v" PlayerDebugMode -integer 1 2>/dev/null
    fi
  done
  ok "已开启 CEP 调试模式 (CSXS 6-12)"
}

# 检测 Photoshop（仅提示，不阻断安装）
detect_photoshop() {
  _count="$(ls -d /Applications/Adobe\ Photoshop* 2>/dev/null | wc -l | tr -d ' ')"
  if [ "${_count:-0}" -gt 0 ]; then
    info "检测到 $_count 个 Photoshop 安装"
  else
    warn "未检测到 Photoshop（插件本体仍会安装）"
  fi
}
