#!/bin/bash
# ============================================================
#  图层处理工具 — macOS .pkg 安装包校验
#
#  用法:
#    bash scripts/verify-macos-pkg.sh                    # 校验 installer/ 下的 .pkg
#    INSTALLER_PKG=/path/a.pkg UNINSTALLER_PKG=/path/b.pkg bash scripts/verify-macos-pkg.sh
#
#  两部分:
#    A. 结构断言: 包可解析、安装域=当前用户域、payload 路径、脚本存在可执行、
#                 XML 合法、版本号一致、模板占位符已全部替换
#    B. 隔离行为演练: 用假 HOME 直接跑包内脚本，逐条验证与 install.js/uninstall.js/
#                 原 install.sh 的行为契约（不触碰真实系统，不需要 root，沙箱内可跑）
#
#  演练使用 PS_LT_TEST_HOME / PS_LT_TEST_USER 覆盖目标用户目录（生产环境不存在）；
#  `defaults` 命令通过 PATH 垫片拦截，避免写真实用户域。
# ============================================================

set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
INSTALLER_DIR="$ROOT/installer"
EXTENSION_ID="com.layertool.panel"
INSTALL_PKG="${INSTALLER_PKG:-$INSTALLER_DIR/$EXTENSION_ID-installer.pkg}"
UNINSTALL_PKG="${UNINSTALLER_PKG:-$INSTALLER_DIR/$EXTENSION_ID-uninstaller.pkg}"
EXPECTED_VERSION="$(node -p "require('$ROOT/package.json').version" 2>/dev/null)"

PASS=0
FAIL=0

pass() { PASS=$((PASS + 1)); printf '  \033[32m✓\033[0m %s\n' "$1"; }
fail() { FAIL=$((FAIL + 1)); printf '  \033[31m✗\033[0m %s\n' "$1"; if [ -n "${2:-}" ]; then printf '      → %s\n' "$2"; fi; }
section() { printf '\n\033[1m%s\033[0m\n' "$1"; }

# check <描述> <命令...>
check() {
  local desc="$1"
  shift
  if "$@" >/dev/null 2>&1; then
    pass "$desc"
  else
    fail "$desc" "命令失败: $*"
  fi
}

# check_eq <描述> <期望> <实际>
check_eq() {
  if [ "$2" = "$3" ]; then
    pass "$1"
  else
    fail "$1" "期望 [$2] 实际 [$3]"
  fi
}

# check_contains <描述> <文本> <子串>
check_contains() {
  case "$2" in
    *"$3"*) pass "$1" ;;
    *) fail "$1" "未包含 [$3]" ;;
  esac
}

# check_file_contains <描述> <文件> <子串>
check_file_contains() {
  local desc="$1"
  local file="$2"
  local needle="$3"
  if [ -f "$file" ] && grep -q -- "$needle" "$file" 2>/dev/null; then
    pass "$desc"
  else
    fail "$desc" "文件 [$file] 未包含 [$needle]"
  fi
}

TMP="$(mktemp -d "${TMPDIR:-/tmp}/dsh-verify-pkg.XXXXXX")"
trap 'rm -rf "$TMP"' EXIT

# ============================================================
# A. 结构断言
# ============================================================
section "A. 结构断言"

if [ ! -f "$INSTALL_PKG" ]; then
  fail "安装包存在" "$INSTALL_PKG 不存在，请先运行 npm run package"
  echo ""
  echo "校验中止：缺少产物。"
  exit 1
fi
pass "安装包存在: $(basename "$INSTALL_PKG")"

if [ ! -f "$UNINSTALL_PKG" ]; then
  fail "卸载包存在" "$UNINSTALL_PKG 不存在，请先运行 npm run package"
  echo ""
  echo "校验中止：缺少产物。"
  exit 1
fi
pass "卸载包存在: $(basename "$UNINSTALL_PKG")"

# 安装域 = 当前用户域（保证装到 ~/Library 且文件属主是用户，面板才能写预设）
check_eq "安装包安装域 = CurrentUserHomeDirectory" \
  "CurrentUserHomeDirectory" "$(installer -dominfo -pkg "$INSTALL_PKG" 2>/dev/null | head -1)"
check_eq "卸载包安装域 = CurrentUserHomeDirectory" \
  "CurrentUserHomeDirectory" "$(installer -dominfo -pkg "$UNINSTALL_PKG" 2>/dev/null | head -1)"

# 展开（--expand-full 同时取出 payload 与脚本）
EXP_INSTALL="$TMP/exp-install"
EXP_UNINSTALL="$TMP/exp-uninstall"
check "安装包可展开 (pkgutil --expand-full)" pkgutil --expand-full "$INSTALL_PKG" "$EXP_INSTALL"
check "卸载包可展开 (pkgutil --expand-full)" pkgutil --expand-full "$UNINSTALL_PKG" "$EXP_UNINSTALL"

INSTALL_COMP="$EXP_INSTALL/install-comp.pkg"
UNINSTALL_COMP="$EXP_UNINSTALL/uninstall-comp.pkg"
PAYLOAD_ROOT="$INSTALL_COMP/Payload/Library/Application Support/Adobe/CEP/extensions/$EXTENSION_ID"

# distribution 内容
if [ -f "$EXP_INSTALL/Distribution" ]; then
  check "Distribution XML 合法 (xmllint)" xmllint --noout "$EXP_INSTALL/Distribution"
  DIST="$(cat "$EXP_INSTALL/Distribution")"
  check_contains "Distribution 仅开启当前用户域" "$DIST" 'enable_currentUserHome="true"'
  check_contains "Distribution 关闭系统域" "$DIST" 'enable_localSystem="false"'
  check_contains "Distribution 关闭任意域" "$DIST" 'enable_anywhere="false"'
  check_contains "Distribution 要求脚本必须执行" "$DIST" 'require-scripts="true"'
  check_contains "安装 Distribution 限制启动卷" "$DIST" 'rootVolumeOnly="true"'
  check_contains "安装 Distribution 用 welcome 展示说明" "$DIST" '<welcome'
  check_contains "安装 Distribution 声明双架构" "$DIST" 'hostArchitectures="x86_64,arm64"'
  if grep -q '<readme' "$EXP_INSTALL/Distribution" 2>/dev/null; then
    fail "安装 Distribution 不使用 readme" "readme 会带来「打印/存储」按钮"
  else
    pass "安装 Distribution 不使用 readme（无打印/存储按钮）"
  fi
else
  fail "Distribution 存在" "$EXP_INSTALL/Distribution 不存在"
fi

# 卸载包：同样要隐藏位置入口，并用「卸载」语境的 welcome 说明
if [ -f "$EXP_UNINSTALL/Distribution" ]; then
  check "卸载 Distribution XML 合法 (xmllint)" xmllint --noout "$EXP_UNINSTALL/Distribution"
  UN_DIST="$(cat "$EXP_UNINSTALL/Distribution")"
  check_contains "卸载 Distribution 用 welcome 说明卸载语境" "$UN_DIST" '<welcome'
  check_contains "卸载 Distribution 限制启动卷" "$UN_DIST" 'rootVolumeOnly="true"'
  check_contains "卸载 Distribution 不显示自定义选项" "$UN_DIST" 'customize="never"'
  if grep -q '<readme' "$EXP_UNINSTALL/Distribution" 2>/dev/null; then
    fail "卸载 Distribution 不使用 readme" "readme 会带来「打印/存储」按钮"
  else
    pass "卸载 Distribution 不使用 readme（无打印/存储按钮）"
  fi
else
  fail "卸载 Distribution 存在" "$EXP_UNINSTALL/Distribution 不存在"
fi

# 安装器界面资源（缺失会在打开安装器时报错）
check "安装包含 welcome 资源" test -f "$EXP_INSTALL/Resources/install-welcome.html"
check "安装包含 conclusion 资源" test -f "$EXP_INSTALL/Resources/install-conclusion.html"
check "卸载包含 welcome 资源" test -f "$EXP_UNINSTALL/Resources/uninstall-welcome.html"
check "卸载包含 conclusion 资源" test -f "$EXP_UNINSTALL/Resources/uninstall-conclusion.html"

# payload 内容（必须与 zip / exe 安装包一致：CSXS + dist + doc）
check "payload 含 CSXS/manifest.xml" test -f "$PAYLOAD_ROOT/CSXS/manifest.xml"
check "payload 含 dist/jsx/hostscript.js" test -f "$PAYLOAD_ROOT/dist/jsx/hostscript.js"
check "payload 含 dist/index.html" test -f "$PAYLOAD_ROOT/dist/index.html"
check "payload 含内置模板 presets.md" test -f "$PAYLOAD_ROOT/dist/lib/presets.md"
check "payload 含内置模板 template.md" test -f "$PAYLOAD_ROOT/dist/lib/template.md"
check "payload 含 doc/ 目录" test -d "$PAYLOAD_ROOT/doc"

# 卸载包必须无 payload（payload 无法删除文件，删除靠脚本）
check "卸载包无 Payload 目录" test ! -d "$UNINSTALL_COMP/Payload"

# 包内脚本
PREINSTALL="$INSTALL_COMP/Scripts/preinstall"
POSTINSTALL="$INSTALL_COMP/Scripts/postinstall"
UN_POSTINSTALL="$UNINSTALL_COMP/Scripts/postinstall"
check "安装包含 Scripts/preinstall" test -f "$PREINSTALL"
check "安装包含 Scripts/postinstall" test -f "$POSTINSTALL"
check "卸载包含 Scripts/postinstall" test -f "$UN_POSTINSTALL"
check "preinstall 可执行" test -x "$PREINSTALL"
check "postinstall 可执行" test -x "$POSTINSTALL"
check "卸载 postinstall 可执行" test -x "$UN_POSTINSTALL"
check "preinstall 语法合法 (bash -n)" bash -n "$PREINSTALL"
check "postinstall 语法合法 (bash -n)" bash -n "$POSTINSTALL"
check "卸载 postinstall 语法合法 (bash -n)" bash -n "$UN_POSTINSTALL"

# 模板占位符必须全部替换
for f in "$PREINSTALL" "$POSTINSTALL" "$UN_POSTINSTALL"; do
  name="$(basename "$(dirname "$f")")/$(basename "$f")"
  if grep -q '__VERSION__' "$f" 2>/dev/null; then
    fail "$name 占位符已替换" "仍存在 __VERSION__"
  else
    pass "$name 占位符已替换"
  fi
  if grep -q '^# __COMMON__$' "$f" 2>/dev/null; then
    fail "$name 公共函数已内联" "仍存在未替换的占位行 # __COMMON__"
  elif ! grep -q '^resolve_target_home()' "$f" 2>/dev/null; then
    fail "$name 公共函数已内联" "未找到 resolve_target_home() 定义"
  else
    pass "$name 公共函数已内联"
  fi
done

# 版本号与 package.json 一致（只取 <pkg-info> 行，避免命中 XML 声明的 version="1.0"）
PKG_INFO_LINE="$(grep -m1 '<pkg-info' "$INSTALL_COMP/PackageInfo" 2>/dev/null)"
PKG_VERSION="$(printf '%s' "$PKG_INFO_LINE" | sed -n 's/.* version="\([^"]*\)".*/\1/p')"
check_eq "包版本与 package.json 一致" "$EXPECTED_VERSION" "$PKG_VERSION"

# 签名状态（本轮为未签名，仅信息性输出）
SIG="$(pkgutil --check-signature "$INSTALL_PKG" 2>&1 | sed -n '2p' | sed 's/^ *//')"
printf '  \033[36mi\033[0m 签名状态: %s\n' "$SIG"

# ============================================================
# B. 隔离行为演练（假 HOME + defaults 垫片，不需要 root）
# ============================================================
section "B. 隔离行为演练（假 HOME）"

FAKE_HOME="$TMP/home"
SHIM_BIN="$TMP/bin"
DEFAULTS_LOG="$TMP/defaults.log"
mkdir -p "$FAKE_HOME" "$SHIM_BIN"
cat > "$SHIM_BIN/defaults" <<EOF
#!/bin/bash
echo "defaults \$*" >> "$DEFAULTS_LOG"
exit 0
EOF
chmod 755 "$SHIM_BIN/defaults"
: > "$DEFAULTS_LOG"

EXTENSIONS_DIR="$FAKE_HOME/Library/Application Support/Adobe/CEP/extensions"
TARGET_DIR="$EXTENSIONS_DIR/$EXTENSION_ID"
BACKUP_DIR="$EXTENSIONS_DIR/${EXTENSION_ID}_user_files"
USER_PRESET='[{"name":"用户自定义预设","alignModeX":"ink"}]'
USER_TEMPLATE_MARK="# 用户自定义模板标记"
USER_PRESET_FILE="$TARGET_DIR/dist/lib/presets/all/default.json"

# 以假 HOME 运行包内脚本（模拟 Installer 以用户身份执行）
run_script() {
  env -i \
    PATH="$SHIM_BIN:/usr/bin:/bin:/usr/sbin:/sbin" \
    HOME="$FAKE_HOME" \
    PS_LT_TEST_HOME="$FAKE_HOME" \
    PS_LT_TEST_USER="$(id -un)" \
    bash "$1"
}

# 模拟 Installer 落 payload（复制 payload 内容并合并，避免 cp -R 把 Library 套成 Library/Library）
materialize_payload() {
  mkdir -p "$FAKE_HOME"
  cp -R "$INSTALL_COMP/Payload/." "$FAKE_HOME/"
}

reset_fake_home() {
  rm -rf "$FAKE_HOME"
  mkdir -p "$FAKE_HOME"
}

# --- 场景 1: 全新安装 ---
reset_fake_home
if run_script "$PREINSTALL" >/dev/null 2>&1; then
  pass "全新安装: preinstall 退出 0"
else
  fail "全新安装: preinstall 退出 0"
fi
materialize_payload
if run_script "$POSTINSTALL" >/dev/null 2>&1; then
  pass "全新安装: postinstall 退出 0"
else
  fail "全新安装: postinstall 退出 0"
fi
check "全新安装: 插件文件就位" test -f "$TARGET_DIR/CSXS/manifest.xml"
check "全新安装: 宿主脚本就位" test -f "$TARGET_DIR/dist/jsx/hostscript.js"
check "全新安装: 内置模板就位" test -f "$TARGET_DIR/dist/lib/presets.md"
check "全新安装: 内置模板 template.md 就位" test -f "$TARGET_DIR/dist/lib/template.md"
check "全新安装: 未残留包内预设目录" test ! -e "$TARGET_DIR/dist/lib/presets"
check "全新安装: 未残留备份目录" test ! -e "$BACKUP_DIR"
if grep -q 'com.adobe.CSXS.12' "$DEFAULTS_LOG" 2>/dev/null && grep -q 'com.adobe.CSXS.6 ' "$DEFAULTS_LOG" 2>/dev/null; then
  pass "全新安装: 已开启 CEP 调试模式 CSXS 6-12"
else
  fail "全新安装: 已开启 CEP 调试模式 CSXS 6-12" "defaults 调用记录不完整"
fi

# --- 场景 2: 覆盖安装保留用户预设，并清掉陈旧文件 ---
mkdir -p "$(dirname "$USER_PRESET_FILE")"
printf '%s' "$USER_PRESET" > "$USER_PRESET_FILE"
printf '%s\n' "$USER_TEMPLATE_MARK" > "$TARGET_DIR/dist/lib/presets.md"
echo "stale" > "$TARGET_DIR/dist/old-stale-file.js"
if run_script "$PREINSTALL" >/dev/null 2>&1; then
  pass "覆盖安装: preinstall 退出 0"
else
  fail "覆盖安装: preinstall 退出 0"
fi
check "覆盖安装: 旧安装已移除" test ! -e "$TARGET_DIR"
check_file_contains "覆盖安装: 用户预设已备份" "$BACKUP_DIR/presets/all/default.json" "用户自定义预设"
check_file_contains "覆盖安装: 用户 presets.md 已备份" "$BACKUP_DIR/presets.md" "$USER_TEMPLATE_MARK"
materialize_payload
if run_script "$POSTINSTALL" >/dev/null 2>&1; then
  pass "覆盖安装: postinstall 退出 0"
else
  fail "覆盖安装: postinstall 退出 0"
fi
check_file_contains "覆盖安装: 用户预设已恢复（未被包内数据覆盖）" "$USER_PRESET_FILE" "用户自定义预设"
check_file_contains "覆盖安装: 用户 presets.md 已恢复" "$TARGET_DIR/dist/lib/presets.md" "$USER_TEMPLATE_MARK"
check "覆盖安装: 陈旧文件已清除" test ! -e "$TARGET_DIR/dist/old-stale-file.js"
check "覆盖安装: 已清理备份目录" test ! -e "$BACKUP_DIR"

# --- 场景 3: 符号链接（开发安装）只删链接，源目录不受损 ---
SRC_DIR="$TMP/devrepo/$EXTENSION_ID"
mkdir -p "$SRC_DIR/dist/lib/presets/all" "$SRC_DIR/CSXS"
printf '%s' "$USER_PRESET" > "$SRC_DIR/dist/lib/presets/all/default.json"
printf '%s\n' "$USER_TEMPLATE_MARK" > "$SRC_DIR/dist/lib/template.md"
echo "manifest" > "$SRC_DIR/CSXS/manifest.xml"
rm -rf "$TARGET_DIR"
ln -s "$SRC_DIR" "$TARGET_DIR"
if run_script "$PREINSTALL" >/dev/null 2>&1; then
  pass "符号链接安装: preinstall 退出 0"
else
  fail "符号链接安装: preinstall 退出 0"
fi
check "符号链接安装: 链接已移除" test ! -L "$TARGET_DIR"
if [ -f "$SRC_DIR/CSXS/manifest.xml" ] && [ -f "$SRC_DIR/dist/lib/presets/all/default.json" ]; then
  pass "符号链接安装: 源目录完好（未被删除/覆盖）"
else
  fail "符号链接安装: 源目录完好（未被删除/覆盖）"
fi
check_file_contains "符号链接安装: 链接目标预设已备份" "$BACKUP_DIR/presets/all/default.json" "用户自定义预设"
materialize_payload
run_script "$POSTINSTALL" >/dev/null 2>&1
check "符号链接安装: 已变成真实安装目录" test -d "$TARGET_DIR"

# --- 场景 4: 卸载写备份并删除插件 ---
if run_script "$UN_POSTINSTALL" >/dev/null 2>&1; then
  pass "卸载: postinstall 退出 0"
else
  fail "卸载: postinstall 退出 0"
fi
check "卸载: 插件目录已删除" test ! -e "$TARGET_DIR"
check_file_contains "卸载: 用户预设已备份" "$BACKUP_DIR/presets/all/default.json" "用户自定义预设"
check_file_contains "卸载: 用户 template.md 已备份" "$BACKUP_DIR/template.md" "$USER_TEMPLATE_MARK"

# --- 场景 5: 重装自动恢复卸载时的备份 ---
run_script "$PREINSTALL" >/dev/null 2>&1
materialize_payload
if run_script "$POSTINSTALL" >/dev/null 2>&1; then
  pass "重装: postinstall 退出 0"
else
  fail "重装: postinstall 退出 0"
fi
check_file_contains "重装: 已恢复卸载时的用户预设备份" "$USER_PRESET_FILE" "用户自定义预设"
check_file_contains "重装: 已恢复卸载时的 template.md" "$TARGET_DIR/dist/lib/template.md" "$USER_TEMPLATE_MARK"
check "重装: 备份目录已清理" test ! -e "$BACKUP_DIR"

# --- 场景 6: 未安装时卸载幂等 ---
reset_fake_home
if run_script "$UN_POSTINSTALL" >/dev/null 2>&1; then
  pass "幂等卸载: 未安装时退出 0（不报错）"
else
  fail "幂等卸载: 未安装时退出 0（不报错）"
fi
check "幂等卸载: 未创建多余目录" test ! -e "$FAKE_HOME/Library"

# --- 场景 7: 用户原先无预设时，包内预设必须被清除（与 Windows/shell 安装包语义一致）---
reset_fake_home
run_script "$PREINSTALL" >/dev/null 2>&1
materialize_payload
mkdir -p "$(dirname "$USER_PRESET_FILE")"
printf '%s' '{"name":"打包机上的预设"}' > "$USER_PRESET_FILE"
if run_script "$POSTINSTALL" >/dev/null 2>&1; then
  pass "无预设用户安装: postinstall 退出 0"
else
  fail "无预设用户安装: postinstall 退出 0"
fi
check "无预设用户安装: 包内 presets 目录已清除" test ! -e "$TARGET_DIR/dist/lib/presets"

# ============================================================
# 汇总
# ============================================================
echo ""
echo "──────────────────────────────────────────"
printf '通过 %d 项' "$PASS"
if [ "$FAIL" -gt 0 ]; then
  printf '，失败 \033[31m%d\033[0m 项\n' "$FAIL"
  echo "──────────────────────────────────────────"
  exit 1
fi
printf '，失败 0 项 — \033[32m全部通过\033[0m\n'
echo "──────────────────────────────────────────"
exit 0
