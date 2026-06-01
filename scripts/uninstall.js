#!/usr/bin/env node

/**
 * 图层处理工具 - 自动卸载脚本
 * 支持 Windows / macOS
 */

const fs = require('fs');
const path = require('path');


const EXTENSION_ID = 'com.layertool.panel';

// ==================== 工具函数 ====================

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
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('按回车键退出...', () => {
      rl.close();
    });
    return;
  }

  // 3. 删除插件目录
  try {
    rmrfSync(targetDir);
    log('插件文件已删除', 'success');
  } catch (e) {
    log(`删除失败: ${e.message}`, 'error');
    process.exit(1);
  }

  // 4. 完成
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
