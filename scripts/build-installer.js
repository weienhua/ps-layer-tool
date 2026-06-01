#!/usr/bin/env node

/**
 * 打包脚本
 * 1. 构建项目（npm run build）
 * 2. 生成 zip 安装包到 installer/
 * 3. 生成独立安装程序到 installer/
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const INSTALLER_DIR = path.join(ROOT, 'installer');
const VERSION = require(path.join(ROOT, 'package.json')).version;

function log(msg) {
  console.log(`[打包] ${msg}`);
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
 * 生成 zip 安装包
 */
function buildZip() {
  const zipName = `com.layertool.panel-v${VERSION}.zip`;
  const zipPath = path.join(INSTALLER_DIR, zipName);

  log(`生成 zip 安装包: ${zipName}`);

  // 创建临时目录结构
  const tempDir = path.join(ROOT, '.zip-temp');
  const pluginDir = path.join(tempDir, 'com.layertool.panel');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(pluginDir, { recursive: true });

  // 复制 CSXS、dist、doc 到临时目录
  copyDirSync(path.join(ROOT, 'CSXS'), path.join(pluginDir, 'CSXS'));
  copyDirSync(path.join(ROOT, 'dist'), path.join(pluginDir, 'dist'));
  copyDirSync(path.join(ROOT, 'doc'), path.join(pluginDir, 'doc'));

  // 使用 PowerShell 压缩（Windows 内置）
  try {
    execSync(
      `powershell -Command "Compress-Archive -Path '${pluginDir}' -DestinationPath '${zipPath}' -Force"`,
      { stdio: 'inherit' }
    );
    log(`zip 安装包已生成: ${zipPath}`);
  } catch (e) {
    console.error('[错误] zip 打包失败:', e.message);
  }

  // 清理临时目录
  fs.rmSync(tempDir, { recursive: true, force: true });
}

/**
 * 生成独立安装程序（pkg 打包）
 */
function buildInstaller() {
  log('正在打包独立安装程序...');

  // 创建临时打包目录
  const tempDir = path.join(ROOT, '.installer-temp');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  // 复制脚本到临时目录
  fs.copyFileSync(path.join(__dirname, 'install.js'), path.join(tempDir, 'install.js'));
  fs.copyFileSync(path.join(__dirname, 'uninstall.js'), path.join(tempDir, 'uninstall.js'));

  // 复制 dist 到临时目录（打包进可执行文件）
  copyDirSync(path.join(ROOT, 'dist'), path.join(tempDir, 'dist'));

  // 创建 package.json 给 pkg 用
  const pkgJson = {
    name: 'layer-tool-installer',
    version: VERSION,
    bin: {
      install: 'install.js',
      uninstall: 'uninstall.js',
    },
  };
  fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(pkgJson, null, 2));

  // 打包 Windows 安装程序
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

  // 打包 Windows 卸载程序
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

  // macOS 打包（需要在 macOS 上执行）
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

  // 清理临时目录
  fs.rmSync(tempDir, { recursive: true, force: true });
}

function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║             打包发布文件                     ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  // 1. 检查 dist 目录（npm run build 已在 package.json 中先执行）
  const distDir = path.join(ROOT, 'dist');
  if (!fs.existsSync(distDir)) {
    console.error('[错误] dist/ 目录不存在，请先运行 npm run build');
    process.exit(1);
  }

  // 2. 创建 installer 输出目录
  if (!fs.existsSync(INSTALLER_DIR)) {
    fs.mkdirSync(INSTALLER_DIR, { recursive: true });
  }

  // 3. 生成 zip 安装包
  buildZip();

  // 4. 生成独立安装程序
  buildInstaller();

  // 5. 输出结果
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║             打包完成！                       ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log('║  输出目录: installer/                        ║');
  console.log('║                                              ║');
  console.log('║  文件列表:                                   ║');

  if (fs.existsSync(INSTALLER_DIR)) {
    const files = fs.readdirSync(INSTALLER_DIR);
    files.forEach(f => {
      const stats = fs.statSync(path.join(INSTALLER_DIR, f));
      const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
      console.log(`║    ${f} (${sizeMB} MB)`);
    });
  }

  console.log('║                                              ║');
  console.log('║  使用说明:                                   ║');
  console.log('║    .zip - 手动解压到 CEP 扩展目录            ║');
  console.log('║    .exe - 双击运行自动安装                    ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
}

main();
