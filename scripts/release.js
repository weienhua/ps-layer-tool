#!/usr/bin/env node

/**
 * 自动化发布脚本
 * 1. 更新版本号（package.json + doc/使用文档.md）
 * 2. 构建发布文件
 * 3. 提交并推送到 GitHub
 * 4. 触发 GitHub Actions 自动发布
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PACKAGE_JSON = path.join(ROOT, 'package.json');
const DOC_FILE = path.join(ROOT, 'doc', '使用文档.md');

function log(msg) {
  console.log(`[发布] ${msg}`);
}

function exec(cmd, options = {}) {
  return execSync(cmd, { cwd: ROOT, stdio: 'inherit', ...options });
}

function execSilent(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf-8' }).trim();
}

/**
 * 解析版本号类型，返回新版本号
 */
function parseVersionType(current, input) {
  if (!input) {
    console.error('[错误] 请指定版本号类型或具体版本号');
    console.error('用法: npm run release [patch|minor|major|x.y.z]');
    process.exit(1);
  }

  // 直接指定版本号
  if (/^\d+\.\d+\.\d+$/.test(input)) {
    return input;
  }

  // 解析 patch/minor/major
  const parts = current.split('.').map(Number);
  switch (input) {
    case 'patch':
      parts[2] += 1;
      break;
    case 'minor':
      parts[1] += 1;
      parts[2] = 0;
      break;
    case 'major':
      parts[0] += 1;
      parts[1] = 0;
      parts[2] = 0;
      break;
    default:
      console.error(`[错误] 无效的版本号类型: ${input}`);
      console.error('支持: patch, minor, major, 或具体版本号 (如 1.2.3)');
      process.exit(1);
  }

  return parts.join('.');
}

/**
 * 更新 doc/使用文档.md 中的插件版本号
 * 注意：zip 文件名由打包脚本自动从 package.json 读取，无需手动更新
 */
function updateDocVersion(oldVersion, newVersion) {
  log('更新 doc/使用文档.md 版本号...');

  let content = fs.readFileSync(DOC_FILE, 'utf-8');
  const updated = content.replace(/\*\*插件版本\*\*: \d+\.\d+\.\d+/, `**插件版本**: ${newVersion}`);

  if (content === updated) {
    console.warn('[警告] 未找到版本号占位符，跳过文档更新');
    return false;
  }

  fs.writeFileSync(DOC_FILE, updated, 'utf-8');
  log(`doc/使用文档.md 已更新: ${oldVersion} → ${newVersion}`);
  return true;
}

function main() {
  const args = process.argv.slice(2);
  const versionInput = args[0];

  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║           发布新版本                          ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  // 1. 读取当前版本号
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf-8'));
  const currentVersion = packageJson.version;
  const newVersion = parseVersionType(currentVersion, versionInput);

  console.log(`  当前版本: ${currentVersion}`);
  console.log(`  新版本:   ${newVersion}`);
  console.log('');

  // 2. 更新 doc/使用文档.md
  const docUpdated = updateDocVersion(currentVersion, newVersion);

  // 3. 执行 npm version（更新 package.json + 创建 commit + 创建 tag）
  log(`执行 npm version ${newVersion}...`);
  try {
    exec(`npm version ${newVersion} --no-git-tag-version`);
  } catch (e) {
    console.error('[错误] npm version 失败:', e.message);
    process.exit(1);
  }

  // 4. 构建发布文件
  log('构建发布文件...');
  try {
    exec('npm run package');
  } catch (e) {
    console.error('[错误] 构建失败:', e.message);
    process.exit(1);
  }

  // 5. 提交所有修改
  log('提交修改...');
  try {
    exec('git add -A');
    exec(`git commit -m "release: v${newVersion}"`);
    exec(`git tag -a "v${newVersion}" -m "Release v${newVersion}"`);
  } catch (e) {
    console.error('[错误] Git 提交失败:', e.message);
    process.exit(1);
  }

  // 6. 推送到 GitHub
  log('推送到 GitHub...');
  try {
    exec('git push');
    exec('git push --tags');
  } catch (e) {
    console.error('[错误] 推送失败:', e.message);
    console.error('请手动执行: git push && git push --tags');
    process.exit(1);
  }

  // 7. 输出成功信息
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║           发布完成！                          ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  版本: v${newVersion.padEnd(37)}║`);
  console.log(`║  Tag:  v${newVersion.padEnd(37)}║`);
  console.log('║                                              ║');
  console.log('║  GitHub Actions 将自动构建并发布              ║');
  console.log('║  查看: https://github.com/weienhua/ps-layer-tool/actions');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
}

main();
