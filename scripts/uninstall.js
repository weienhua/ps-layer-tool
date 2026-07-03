#!/usr/bin/env node

/**
 * 图层处理工具 - 自动卸载脚本
 * 支持 Windows / macOS
 */

const fs = require('fs');
const path = require('path');


const EXTENSION_ID = 'com.layertool.panel';
// 卸载时需要保留的用户文件（相对于 lib/ 目录）
const LIB_KEEP_FILES = ['presets.md', 'template.md'];
// 卸载时需要保留的用户目录（相对于 dist/lib/ 目录，与 template.md 同级）
const LIB_KEEP_DIRS = ['presets'];

// ==================== 工具函数 ====================

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

function log(msg, type = 'info') {
  const prefix = {
    info: '\x1b[36m[信息]\x1b[0m',
    success: '\x1b[32m[成功]\x1b[0m',
    warn: '\x1b[33m[警告]\x1b[0m',
    error: '\x1b[31m[错误]\x1b[0m',
  };
  console.log(`${prefix[type] || prefix.info} ${msg}`);
}

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
 * 递归备份目录
 * @param {string} dirPath - 目录路径
 * @returns {Object|null} 备份数据，目录不存在返回 null
 */
function backupDir(dirPath) {
  if (!fs.existsSync(dirPath)) return null;
  const result = {};
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      result[entry.name] = backupDir(fullPath);
    } else {
      result[entry.name] = fs.readFileSync(fullPath);
    }
  }
  return result;
}

/**
 * 递归恢复目录
 * @param {string} dirPath - 目标目录路径
 * @param {Object|null} backup - 备份数据
 */
function restoreDir(dirPath, backup) {
  if (!backup) return;
  fs.mkdirSync(dirPath, { recursive: true });
  for (const [name, data] of Object.entries(backup)) {
    const fullPath = path.join(dirPath, name);
    if (Buffer.isBuffer(data)) {
      fs.writeFileSync(fullPath, data);
    } else {
      restoreDir(fullPath, data);
    }
  }
}

/**
 * 备份 dist/lib 目录下需要保留的用户目录（与 template.md 同级）
 * @param {string} targetDir - 目标插件目录
 * @returns {Object} 备份数据，key 为目录名
 */
function backupLibKeepDirs(targetDir) {
  const backups = {};
  for (const dirName of LIB_KEEP_DIRS) {
    const dirPath = path.join(targetDir, 'dist', 'lib', dirName);
    const backup = backupDir(dirPath);
    if (backup) {
      backups[dirName] = backup;
    }
  }
  return backups;
}

// ==================== 主流程 ====================

function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║       图层处理工具 - 自动卸载程序            ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  const isWin = process.platform === 'win32';
  const isMac = process.platform === 'darwin';

  if (!isWin && !isMac) {
    log('不支持当前操作系统', 'error');
    process.exit(1);
  }

  // 1. 获取 CEP 扩展目录
  let extensionsPath;
  if (isWin) {
    const appData = process.env.APPDATA || '';
    if (!appData) {
      log('无法获取 APPDATA 环境变量', 'error');
      process.exit(1);
    }
    extensionsPath = path.join(appData, 'Adobe', 'CEP', 'extensions');
  } else {
    const home = process.env.HOME || '';
    if (!home) {
      log('无法获取 HOME 环境变量', 'error');
      process.exit(1);
    }
    extensionsPath = path.join(home, 'Library', 'Application Support', 'Adobe', 'CEP', 'extensions');
  }

  const targetDir = path.join(extensionsPath, EXTENSION_ID);

  // 2. 检查是否已安装
  if (!fs.existsSync(targetDir)) {
    log('未检测到已安装的图层处理工具插件', 'warn');
    console.log('');
    console.log('按任意键退出...');
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on('data', () => process.exit(0));
    } else {
      setTimeout(() => process.exit(0), 30000);
    }
    return;
  }

  // 3. 检测是否为符号链接
  const stat = fs.lstatSync(targetDir);
  let userFileBackups = [];
  let userDirBackups = {};

  if (stat.isSymbolicLink()) {
    // 链接：备份用户文件后删除链接本身
    log('检测到目录链接，正在备份用户文件并移除链接...');
    userFileBackups = backupLibKeepFiles(targetDir);
    if (userFileBackups.length > 0) {
      log(`已备份用户文件: ${userFileBackups.map(b => b.name).join(', ')}`);
    }
    userDirBackups = backupLibKeepDirs(targetDir);
    const backedUpDirs = Object.keys(userDirBackups);
    if (backedUpDirs.length > 0) {
      log(`已备份用户目录: ${backedUpDirs.join(', ')}`);
    }

    try {
      fs.unlinkSync(targetDir);
      log('链接已移除', 'success');
    } catch (e) {
      log(`删除链接失败: ${e.message}`, 'error');
      process.exit(1);
    }
  } else {
    // 真实目录：备份用户文件和目录后删除
    userFileBackups = backupLibKeepFiles(targetDir);
    if (userFileBackups.length > 0) {
      log(`已备份用户文件: ${userFileBackups.map(b => b.name).join(', ')}`);
    }
    userDirBackups = backupLibKeepDirs(targetDir);
    const backedUpDirs = Object.keys(userDirBackups);
    if (backedUpDirs.length > 0) {
      log(`已备份用户目录: ${backedUpDirs.join(', ')}`);
    }

    try {
      rmrfSync(targetDir);
      log('插件文件已删除', 'success');
    } catch (e) {
      log(`删除失败: ${e.message}`, 'error');
      process.exit(1);
    }
  }

  // 4. 将备份文件和目录保存到插件目录旁边
  if (userFileBackups.length > 0 || Object.keys(userDirBackups).length > 0) {
    const backupDirPath = path.join(path.dirname(targetDir), EXTENSION_ID + '_user_files');
    fs.mkdirSync(backupDirPath, { recursive: true });
    // 保存文件
    for (const { name, data } of userFileBackups) {
      fs.writeFileSync(path.join(backupDirPath, name), data);
    }
    // 保存目录
    for (const [dirName, backup] of Object.entries(userDirBackups)) {
      restoreDir(path.join(backupDirPath, dirName), backup);
    }
    log(`用户文件已保存到: ${backupDirPath}`, 'success');
  }

  // 5. 完成
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║             卸载完成！                       ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log('║  请重启 Photoshop 以使更改生效。             ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  console.log('按任意键退出...');
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', () => process.exit(0));
  } else {
    setTimeout(() => process.exit(0), 30000);
  }
}

main();
