#!/usr/bin/env node

/**
 * 打包安装程序脚本
 * 使用 pkg 将 install.js 和 uninstall.js 打包成独立可执行文件
 * 生成的安装程序包含 dist/ 目录的所有插件文件
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const INSTALLER_DIR = path.join(ROOT, 'installer');

function log(msg) {
  console.log(`[打包] ${msg}`);
}

function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║         打包自动安装/卸载程序                ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  // 1. 检查 dist 目录
  const distDir = path.join(ROOT, 'dist');
  if (!fs.existsSync(distDir)) {
    console.error('[错误] dist/ 目录不存在，请先运行 npm run build');
    process.exit(1);
  }

  // 2. 创建 installer 输出目录
  if (!fs.existsSync(INSTALLER_DIR)) {
    fs.mkdirSync(INSTALLER_DIR, { recursive: true });
  }

  // 3. 创建临时打包目录（pkg 需要 dist 在脚本同级）
  const tempDir = path.join(ROOT, '.installer-temp');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  // 复制脚本到临时目录
  fs.copyFileSync(path.join(__dirname, 'install.js'), path.join(tempDir, 'install.js'));
  fs.copyFileSync(path.join(__dirname, 'uninstall.js'), path.join(tempDir, 'uninstall.js'));

  // 复制 dist 到临时目录（打包进可执行文件）
  log('复制插件文件到打包目录...');
  copyDirSync(distDir, path.join(tempDir, 'dist'));

  // 4. 创建 package.json 给 pkg 用
  const pkgJson = {
    name: 'layer-tool-installer',
    version: '1.0.0',
    bin: {
      install: 'install.js',
      uninstall: 'uninstall.js',
    },
  };
  fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(pkgJson, null, 2));

  // 5. 使用 pkg 打包
  log('正在打包 Windows 安装程序...');
  try {
    execSync(
      `npx pkg . --targets node18-win-x64 --output ../installer/com.layertool.panel-installer.exe`,
      { cwd: tempDir, stdio: 'inherit' }
    );
    log('Windows 安装程序打包完成');
  } catch (e) {
    console.error('[错误] Windows 打包失败:', e.message);
  }

  log('正在打包 Windows 卸载程序...');
  try {
    execSync(
      `npx pkg . --targets node18-win-x64 --output ../installer/com.layertool.panel-uninstaller.exe`,
      { cwd: tempDir, stdio: 'inherit' }
    );
    log('Windows 卸载程序打包完成');
  } catch (e) {
    console.error('[错误] Windows 卸载打包失败:', e.message);
  }

  // macOS 打包（需要在 macOS 上执行，此处仅提示）
  if (process.platform === 'darwin') {
    log('正在打包 macOS 安装程序...');
    try {
      execSync(
        `npx pkg . --targets node18-macos-x64 --output ../installer/com.layertool.panel-installer-macos`,
        { cwd: tempDir, stdio: 'inherit' }
      );
      log('macOS 安装程序打包完成');
    } catch (e) {
      console.error('[错误] macOS 打包失败:', e.message);
    }
  } else {
    log('当前为 Windows 系统，macOS 版本需要在 macOS 上打包');
  }

  // 6. 清理临时目录
  fs.rmSync(tempDir, { recursive: true, force: true });

  // 7. 输出结果
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║             打包完成！                       ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log('║  输出目录: installer/                        ║');
  console.log('║                                              ║');
  console.log('║  Windows:                                    ║');
  console.log('║    com.layertool.panel-installer.exe         ║');
  console.log('║    com.layertool.panel-uninstaller.exe       ║');
  console.log('║                                              ║');
  console.log('║  macOS (需在 macOS 上打包):                  ║');
  console.log('║    com.layertool.panel-installer-macos       ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
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

main();
