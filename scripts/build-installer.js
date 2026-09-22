#!/usr/bin/env node

/**
 * 打包脚本
 * 1. 构建项目（npm run build）
 * 2. 生成 zip 安装包到 installer/
 * 3. 生成独立安装程序到 installer/
 *    - Windows: pkg 打包的可执行文件（.exe）
 *    - macOS: Apple Installer 安装包（.pkg，用户域安装，双击即装、无需执行位）
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const INSTALLER_DIR = path.join(ROOT, 'installer');
const EXTENSION_ID = 'com.layertool.panel';
const VERSION = (process.env.VERSION || require(path.join(ROOT, 'package.json')).version).replace(/^v/, '');

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

  // 根据平台选择压缩方式
  try {
    if (process.platform === 'win32') {
      // Windows: 使用 PowerShell
      execSync(
        `powershell -Command "Compress-Archive -Path '${pluginDir}' -DestinationPath '${zipPath}' -Force"`,
        { stdio: 'inherit' }
      );
    } else {
      // macOS/Linux: 使用 zip 命令
      execSync(
        `cd '${tempDir}' && zip -r '${zipPath}' 'com.layertool.panel'`,
        { stdio: 'inherit' }
      );
    }
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

  // 复制 CSXS、dist、doc 到临时目录（打包进可执行文件）
  copyDirSync(path.join(ROOT, 'CSXS'), path.join(tempDir, 'CSXS'));
  copyDirSync(path.join(ROOT, 'dist'), path.join(tempDir, 'dist'));
  copyDirSync(path.join(ROOT, 'doc'), path.join(tempDir, 'doc'));

  // 创建 package.json 给 pkg 用（安装程序）
  const pkgJsonInstaller = {
    name: 'layer-tool-installer',
    version: VERSION,
    bin: 'install.js',
    pkg: {
      assets: ['CSXS/**/*', 'dist/**/*', 'doc/**/*'],
    },
  };
  fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(pkgJsonInstaller, null, 2));

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

  // 创建 package.json 给 pkg 用（卸载程序）
  const pkgJsonUninstaller = {
    name: 'layer-tool-uninstaller',
    version: VERSION,
    bin: 'uninstall.js',
    pkg: {
      assets: ['CSXS/**/*', 'dist/**/*', 'doc/**/*'],
    },
  };
  fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(pkgJsonUninstaller, null, 2));

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

  // macOS 安装/卸载产物由 buildMacPkg() 生成：Apple Installer .pkg（用户域安装）。
  // 不再使用 vercel/pkg 二进制（已停止维护、无 arm64 目标、未签名会被 Gatekeeper 拦截）。

  // 清理临时目录
  fs.rmSync(tempDir, { recursive: true, force: true });
}


/**
 * 渲染 scripts/templates/macos-pkg/ 下的模板
 * - __VERSION__ → 实际版本号
 * - `# __COMMON__` → common.sh 全部内容（内联，避免三份脚本逻辑分叉）
 * 注意: 用函数式 replace，避免 common.sh 里的 `$1` 等被当成替换模式
 */
function renderMacPkgTemplate(fileName, commonSource) {
  const raw = fs.readFileSync(path.join(__dirname, 'templates', 'macos-pkg', fileName), 'utf8');
  return raw
    .replace(/__VERSION__/g, VERSION)
    .replace('# __COMMON__', function () { return commonSource; });
}

/**
 * 生成 macOS .pkg 安装包与卸载包（Apple Installer）
 * - 安装包: payload（CSXS/dist/doc）+ preinstall/postinstall，用户域安装
 * - 卸载包: --nopayload（payload 无法删除文件）+ postinstall 执行删除
 * 安装路径：~/Library/Application Support/Adobe/CEP/extensions/（与 zip 手动安装一致）
 * 仅在 macOS 上执行（依赖 pkgbuild / productbuild）
 */
function buildMacPkg() {
  log('正在打包 macOS .pkg 安装/卸载包...');

  const tempDir = path.join(ROOT, '.installer-temp', 'pkg');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  const tplDir = path.join(__dirname, 'templates', 'macos-pkg');
  const commonSource = fs.readFileSync(path.join(tplDir, 'common.sh'), 'utf8');

  // 1. payload：与 zip / exe 同一套目录结构，另加用户家目录相对路径
  //    install-location 用 "/" + 家目录相对路径（已实测：用户域下落到 ~/Library/...）
  const pluginDir = path.join(
    tempDir, 'root', 'Library', 'Application Support', 'Adobe', 'CEP', 'extensions', EXTENSION_ID
  );
  fs.mkdirSync(pluginDir, { recursive: true });
  copyDirSync(path.join(ROOT, 'CSXS'), path.join(pluginDir, 'CSXS'));
  copyDirSync(path.join(ROOT, 'dist'), path.join(pluginDir, 'dist'));
  copyDirSync(path.join(ROOT, 'doc'), path.join(pluginDir, 'doc'));

  // 2. 包脚本（pkgbuild --scripts 目录里除脚本外不能有其它文件）
  const installScriptsDir = path.join(tempDir, 'scripts-install');
  const uninstallScriptsDir = path.join(tempDir, 'scripts-uninstall');
  fs.mkdirSync(installScriptsDir, { recursive: true });
  fs.mkdirSync(uninstallScriptsDir, { recursive: true });

  const writeScript = (dir, name, templateName) => {
    const filePath = path.join(dir, name);
    fs.writeFileSync(filePath, renderMacPkgTemplate(templateName, commonSource));
    fs.chmodSync(filePath, 0o755);
  };
  writeScript(installScriptsDir, 'preinstall', 'install-preinstall');
  writeScript(installScriptsDir, 'postinstall', 'install-postinstall');
  writeScript(uninstallScriptsDir, 'postinstall', 'uninstall-postinstall');

  // 3. distribution XML 与安装器界面资源
  const installDistPath = path.join(tempDir, 'install-distribution.xml');
  const uninstallDistPath = path.join(tempDir, 'uninstall-distribution.xml');
  fs.writeFileSync(installDistPath, renderMacPkgTemplate('install-distribution.xml', commonSource));
  fs.writeFileSync(uninstallDistPath, renderMacPkgTemplate('uninstall-distribution.xml', commonSource));

  const resDir = path.join(tempDir, 'resources');
  fs.mkdirSync(resDir, { recursive: true });
  // 安装器界面资源：介绍页用 welcome（readme 会额外带「打印/存储」按钮）
  ['install-welcome.html', 'install-conclusion.html', 'uninstall-welcome.html', 'uninstall-conclusion.html'].forEach((name) => {
    fs.copyFileSync(path.join(tplDir, name), path.join(resDir, name));
  });

  const installComp = path.join(tempDir, 'install-comp.pkg');
  const uninstallComp = path.join(tempDir, 'uninstall-comp.pkg');
  const installPkg = path.join(INSTALLER_DIR, `${EXTENSION_ID}-installer.pkg`);
  const uninstallPkg = path.join(INSTALLER_DIR, `${EXTENSION_ID}-uninstaller.pkg`);

  try {
    // 安装包：payload + preinstall/postinstall（脚本必须执行 → require-scripts="true"）
    execSync(
      `pkgbuild --root '${path.join(tempDir, 'root')}' --identifier '${EXTENSION_ID}' ` +
      `--version '${VERSION}' --install-location '/' --scripts '${installScriptsDir}' '${installComp}'`,
      { stdio: 'inherit' }
    );
    execSync(
      `productbuild --distribution '${installDistPath}' --resources '${resDir}' ` +
      `--package-path '${tempDir}' '${installPkg}'`,
      { stdio: 'inherit' }
    );
    log(`macOS 安装包已生成: ${installPkg}`);

    // 卸载包：无 payload，删除动作由 postinstall 完成
    execSync(
      `pkgbuild --nopayload --identifier '${EXTENSION_ID}.uninstaller' ` +
      `--version '${VERSION}' --scripts '${uninstallScriptsDir}' '${uninstallComp}'`,
      { stdio: 'inherit' }
    );
    execSync(
      `productbuild --distribution '${uninstallDistPath}' --resources '${resDir}' ` +
      `--package-path '${tempDir}' '${uninstallPkg}'`,
      { stdio: 'inherit' }
    );
    log(`macOS 卸载包已生成: ${uninstallPkg}`);

    // 可选签名：设置 MACOS_INSTALLER_IDENTITY 后自动 productsign（默认不签）
    const identity = process.env.MACOS_INSTALLER_IDENTITY;
    if (identity) {
      [installPkg, uninstallPkg].forEach((pkgPath) => {
        const signed = `${pkgPath}.signed`;
        execSync(`productsign --sign '${identity}' --timestamp '${pkgPath}' '${signed}'`, { stdio: 'inherit' });
        fs.renameSync(signed, pkgPath);
      });
      log(`已使用 Developer ID 签名: ${identity}`);
    } else {
      log('未设置 MACOS_INSTALLER_IDENTITY，产物未签名（属预期）');
    }
  } catch (e) {
    console.error('[错误] macOS .pkg 打包失败:', e.message);
  }

  fs.rmSync(tempDir, { recursive: true, force: true });
  // 清掉空的 .installer-temp 父目录（非空或不存在时忽略）
  try {
    fs.rmdirSync(path.join(ROOT, '.installer-temp'));
  } catch (e) {
    // ignore
  }
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

  // 2.1 清理已被 .pkg 取代的历史 macOS 自解压 shell 脚本
  [
    `${EXTENSION_ID}-installer.sh`,
    `${EXTENSION_ID}-installer.command`,
    `${EXTENSION_ID}-uninstaller.sh`,
    `${EXTENSION_ID}-uninstaller.command`,
  ].forEach((legacyName) => {
    const legacyPath = path.join(INSTALLER_DIR, legacyName);
    if (fs.existsSync(legacyPath)) {
      fs.rmSync(legacyPath, { force: true });
      log(`已移除历史产物: ${legacyName}`);
    }
  });

  // 3. 生成 zip 安装包
  buildZip();

  // 4. 生成 Windows 独立安装程序（pkg 交叉编译）
  buildInstaller();

  // 5. 生成 macOS .pkg 安装包与卸载包（需在 macOS 上执行）
  if (process.platform === 'darwin') {
    buildMacPkg();
  } else {
    log(`当前为 ${process.platform} 系统，macOS .pkg 安装包需在 macOS 上打包`);
  }

  // 6. 输出结果
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
  console.log('║    .exe - Windows 双击运行自动安装/卸载      ║');
  console.log('║    .pkg - macOS 双击安装/卸载                ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
}

main();
