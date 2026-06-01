#!/usr/bin/env node

/**
 * 图层处理工具 - 自动安装脚本
 * 支持 Windows / macOS
 * 自动检测 Photoshop 版本、复制插件文件、开启调试模式
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');


const EXTENSION_ID = 'com.layertool.panel';
const CSXS_VERSIONS = [6, 7, 8, 9, 10, 11];
// 安装时需要保留的用户文件（相对于 lib/ 目录）
const LIB_KEEP_FILES = ['presets.md', 'template.md'];

// ==================== 工具函数 ====================

/**
 * 打印带颜色的消息
 */
function log(msg, type = 'info') {
  const prefix = {
    info: '\x1b[36m[信息]\x1b[0m',
    success: '\x1b[32m[成功]\x1b[0m',
    warn: '\x1b[33m[警告]\x1b[0m',
    error: '\x1b[31m[错误]\x1b[0m',
  };
  console.log(`${prefix[type] || prefix.info} ${msg}`);
}

/**
 * 递归复制目录
 */
function copyDirSync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * 递归删除目录
 */
function rmrfSync(dir) {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        rmrfSync(full);
      } else {
        fs.unlinkSync(full);
      }
    });
    fs.rmdirSync(dir);
  }
}

/**
 * 备份 lib 目录下需要保留的用户文件
 * @param {string} targetDir - 目标插件目录
 * @returns {Array<{name: string, data: Buffer}>} 备份文件数组
 */
function backupLibKeepFiles(targetDir) {
  const backups = [];
  const libDir = path.join(targetDir, 'dist', 'lib');
  if (fs.existsSync(libDir)) {
    for (const name of LIB_KEEP_FILES) {
      const filePath = path.join(libDir, name);
      if (fs.existsSync(filePath)) {
        backups.push({ name, data: fs.readFileSync(filePath) });
      }
    }
  }
  return backups;
}

/**
 * 恢复备份的用户文件到目标 lib 目录
 * @param {string} targetDir - 目标插件目录
 * @param {Array<{name: string, data: Buffer}>} backups - 备份文件数组
 */
function restoreLibKeepFiles(targetDir, backups) {
  if (backups.length === 0) return;
  const libDir = path.join(targetDir, 'dist', 'lib');
  fs.mkdirSync(libDir, { recursive: true });
  for (const { name, data } of backups) {
    fs.writeFileSync(path.join(libDir, name), data);
  }
}

// ==================== Windows 平台 ====================

/**
 * 从注册表读取 Photoshop 安装路径
 */
function getPSPathFromRegistry() {
  const results = [];
  try {
    // 读取 HKLM\SOFTWARE\Adobe\Photoshop 下的所有版本
    const output = execSync('reg query "HKLM\\SOFTWARE\\Adobe\\Photoshop" /s 2>nul', {
      encoding: 'utf-8',
      timeout: 5000,
    });

    const lines = output.split('\n');
    let currentVersion = null;

    for (const line of lines) {
      const trimmed = line.trim();
      // 匹配版本号键，如 "HKLM\SOFTWARE\Adobe\Photoshop\120.0"
      const versionMatch = trimmed.match(/Photoshop\\(\d+\.\d+)$/);
      if (versionMatch) {
        currentVersion = versionMatch[1];
      }
      // 匹配 AppPath 值
      const appPathMatch = trimmed.match(/AppPath\s+REG_SZ\s+(.+)/);
      if (appPathMatch && currentVersion) {
        const psPath = appPathMatch[1].trim();
        if (fs.existsSync(psPath)) {
          results.push({
            version: currentVersion,
            path: psPath,
          });
        }
      }
    }
  } catch (e) {
    // 注册表读取失败，忽略
  }
  return results;
}

/**
 * 扫描默认安装路径查找 Photoshop
 */
function scanDefaultPaths() {
  const results = [];
  const basePaths = [
    'C:\\Program Files\\Adobe',
    'C:\\Program Files (x86)\\Adobe',
  ];

  for (const basePath of basePaths) {
    if (!fs.existsSync(basePath)) continue;

    try {
      const dirs = fs.readdirSync(basePath);
      for (const dir of dirs) {
        // 匹配 "Adobe Photoshop 202x" 或 "Adobe Photoshop CC 20xx"
        const match = dir.match(/Adobe Photoshop\s+(?:CC\s+)?(\d{4})/);
        if (match) {
          const psPath = path.join(basePath, dir);
          // 检查主程序是否存在
          const exePath = path.join(psPath, 'Photoshop.exe');
          if (fs.existsSync(exePath)) {
            results.push({
              version: match[1] + '.0',
              path: psPath,
            });
          }
        }
      }
    } catch (e) {
      // 目录读取失败，忽略
    }
  }
  return results;
}

/**
 * 获取 CEP 扩展目录（Windows）
 */
function getCEPExtensionsPath() {
  const appData = process.env.APPDATA || '';
  if (!appData) return null;
  return path.join(appData, 'Adobe', 'CEP', 'extensions');
}

/**
 * 开启 CEP 调试模式（Windows 注册表）
 */
function enableDebugModeWindows() {
  for (const ver of CSXS_VERSIONS) {
    const key = `HKCU\\Software\\Adobe\\CSXS.${ver}`;
    try {
      execSync(`reg add "${key}" /v PlayerDebugMode /t REG_SZ /d "1" /f 2>nul`, {
        encoding: 'utf-8',
        timeout: 3000,
      });
    } catch (e) {
      // 忽略
    }
  }
}

// ==================== macOS 平台 ====================

/**
 * 扫描 macOS 默认路径查找 Photoshop
 */
function scanDefaultPathsMac() {
  const results = [];
  const basePaths = ['/Applications'];

  for (const basePath of basePaths) {
    if (!fs.existsSync(basePath)) continue;

    try {
      const dirs = fs.readdirSync(basePath);
      for (const dir of dirs) {
        const match = dir.match(/Adobe Photoshop\s+(?:CC\s+)?(\d{4})/);
        if (match) {
          const psPath = path.join(basePath, dir);
          results.push({
            version: match[1] + '.0',
            path: psPath,
          });
        }
      }
    } catch (e) {
      // 忽略
    }
  }
  return results;
}

/**
 * 获取 CEP 扩展目录（macOS）
 */
function getCEPExtensionsPathMac() {
  const home = process.env.HOME || '';
  if (!home) return null;
  return path.join(home, 'Library', 'Application Support', 'Adobe', 'CEP', 'extensions');
}

/**
 * 开启 CEP 调试模式（macOS defaults）
 */
function enableDebugModeMac() {
  for (const ver of CSXS_VERSIONS) {
    try {
      execSync(`defaults write com.adobe.CSXS.${ver} PlayerDebugMode -integer 1`, {
        encoding: 'utf-8',
        timeout: 3000,
      });
    } catch (e) {
      // 忽略
    }
  }
}

// ==================== 主流程 ====================

function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║       图层处理工具 - 自动安装程序            ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  const isWin = process.platform === 'win32';
  const isMac = process.platform === 'darwin';

  if (!isWin && !isMac) {
    log('不支持当前操作系统，仅支持 Windows 和 macOS', 'error');
    process.exit(1);
  }

  // 1. 获取插件源文件目录（打包时包含 CSXS、dist、doc）
  let rootSource;
  if (typeof process.pkg !== 'undefined') {
    // pkg 打包模式：assets 打包在 snapshot 中
    rootSource = __dirname;
  } else {
    // 开发模式：从项目根目录读取
    rootSource = path.join(__dirname, '..');
  }

  const dirsToCopy = ['CSXS', 'dist', 'doc'];
  for (const dir of dirsToCopy) {
    if (!fs.existsSync(path.join(rootSource, dir))) {
      log(`找不到 ${dir}/ 目录，请确保安装程序完整`, 'error');
      process.exit(1);
    }
  }

  log(`插件源目录: ${rootSource}`);

  // 2. 检测 Photoshop 安装
  // （复制 CSXS 和 doc 目录）
  let psInstallations = [];

  if (isWin) {
    // 先从注册表找
    psInstallations = getPSPathFromRegistry();
    if (psInstallations.length === 0) {
      // 注册表找不到，扫描默认路径
      psInstallations = scanDefaultPaths();
    }
  } else {
    psInstallations = scanDefaultPathsMac();
  }

  if (psInstallations.length > 0) {
    log(`检测到 ${psInstallations.length} 个 Photoshop 安装:`);
    psInstallations.forEach((ps, i) => {
      console.log(`   ${i + 1}. Photoshop ${ps.version} - ${ps.path}`);
    });
  } else {
    log('未检测到 Photoshop 安装，将直接安装插件到 CEP 扩展目录', 'warn');
  }

  // 3. 获取 CEP 扩展目录
  const extensionsPath = isWin ? getCEPExtensionsPath() : getCEPExtensionsPathMac();

  if (!extensionsPath) {
    log('无法确定 CEP 扩展目录', 'error');
    process.exit(1);
  }

  const targetDir = path.join(extensionsPath, EXTENSION_ID);
  log(`安装目标: ${targetDir}`);

  // 4. 如果已存在，备份用户文件后卸载
  const userFileBackups = [];
  if (fs.existsSync(targetDir)) {
    log('检测到已安装的版本，正在卸载...');
    userFileBackups.push(...backupLibKeepFiles(targetDir));
    if (userFileBackups.length > 0) {
      log(`已备份用户文件: ${userFileBackups.map(b => b.name).join(', ')}`);
    }
    rmrfSync(targetDir);
  }

  // 5. 创建扩展目录并复制文件（CSXS、dist、doc）
  try {
    fs.mkdirSync(targetDir, { recursive: true });
    for (const dir of dirsToCopy) {
      copyDirSync(path.join(rootSource, dir), path.join(targetDir, dir));
      log(`复制 ${dir}/ 完成`);
    }
    log('插件文件复制完成', 'success');
  } catch (e) {
    log(`复制文件失败: ${e.message}`, 'error');
    process.exit(1);
  }

  // 恢复用户文件（覆盖安装包中的默认文件）
  restoreLibKeepFiles(targetDir, userFileBackups);

  // 从卸载备份目录恢复用户文件（如果存在）
  const backupDir = path.join(path.dirname(targetDir), EXTENSION_ID + '_user_files');
  if (fs.existsSync(backupDir)) {
    const restoredFiles = [];
    for (const name of LIB_KEEP_FILES) {
      const backupFile = path.join(backupDir, name);
      if (fs.existsSync(backupFile)) {
        fs.copyFileSync(backupFile, path.join(targetDir, 'dist', 'lib', name));
        restoredFiles.push(name);
      }
    }
    if (restoredFiles.length > 0) {
      log(`已从备份恢复用户文件: ${restoredFiles.join(', ')}`, 'success');
      try { rmrfSync(backupDir); } catch (e) { /* 忽略 */ }
    }
  }

  // 6. 开启调试模式
  if (isWin) {
    enableDebugModeWindows();
    log('已开启 CEP 调试模式 (Windows 注册表)', 'success');
  } else {
    enableDebugModeMac();
    log('已开启 CEP 调试模式 (macOS defaults)', 'success');
  }

  // 7. 完成
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║             安装完成！                       ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log('║  请重启 Photoshop，然后在菜单中找到：        ║');
  console.log('║  窗口 → 扩展 → 图层处理工具                 ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  // 等待用户按键退出
  console.log('按任意键退出...');
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', () => process.exit(0));
  } else {
    // 非 TTY 环境（如打包后），等待一段时间后退出
    setTimeout(() => process.exit(0), 30000);
  }
}

main();
