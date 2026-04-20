# 图层处理工具 — PS CEP 插件

Adobe Photoshop CEP 面板插件，兼容 PS 2021（v22.0）及以上版本。

## 技术栈

- **面板侧**：TypeScript → webpack → ES6 bundle
- **宿主脚本侧**：TypeScript → tsc → ES3（ExtendScript，PS 进程内执行）
- **类型**：`ps-extendscript-types`（宿主）/ 自定义 `cep-panel.d.ts`（面板）
- **CEP 版本**：10.0+，扩展 ID：`com.layertool.panel`

## 项目结构

```
├── CSXS/manifest.xml          # CEP 清单，宿主版本、面板尺寸、路径配置
├── src/
│   ├── lib/CSInterface.js     # Adobe 官方库，不要修改，构建时原样复制
│   ├── types/cep-panel.d.ts   # CSInterface 全局类型（最小化声明）
│   ├── jsx/hostscript.ts      # 宿主脚本，tsc 编译为 ES3
│   ├── bridge.ts              # evalScript 封装，Promise 化通信
│   ├── index.ts               # 面板 UI 控制器
│   └── index.html             # 面板 HTML 模板
├── dist/                      # 构建产物，不要手动编辑
│   ├── lib/CSInterface.js     # 从 src/lib/ 原样复制
│   └── jsx/hostscript.js      # tsc 编译产物（ES3）
├── tsconfig.json              # 面板侧：target ES6，排除 src/jsx/
└── tsconfig.jsx.json          # 宿主侧：target ES3，noLib，types: ps-extendscript-types
```

## 构建命令

```bash
npm install                # 安装依赖
npm run build              # 完整构建（webpack + tsc）
npm run build:jsx          # 仅编译宿主脚本：tsc -p tsconfig.jsx.json
npm run dev                # 面板侧 webpack watch
npm run clean              # 清理 dist/
```

## 架构：两个隔离的执行上下文

```
面板（Chromium）                          PS 宿主（ExtendScript）
────────────────                          ──────────────────────
src/index.ts                              src/jsx/hostscript.ts
src/bridge.ts                                 ↓ tsc (ES3)
    │                                     dist/jsx/hostscript.js
    │  cs.evalScript("fn()")  ──────────→     全局函数
    │  callback(result)       ←──────────     return string
    ↓
Promise<string>
```

**关键约束**：两侧完全隔离，只能通过字符串传递数据。

## 宿主脚本约定（src/jsx/hostscript.ts）

所有函数必须是**全局函数**，返回值只能是**字符串**。

```typescript
// 标准模式
function getDocumentName(): string {
  try {
    if (app.documents.length === 0) return "__NO_DOCUMENT__";
    return app.activeDocument.name;
  } catch (e) {
    return "__ERROR__:" + e;
  }
}
```

返回值约定：
- 正常结果 → 直接返回字符串
- `"__NO_DOCUMENT__"` → 无打开文档
- `"__ERROR__:<msg>"` → 运行时异常

**ES3 限制**（`noLib: true`，无 polyfill）：
- `const`/`let` → tsc 自动编译为 `var` ✅
- 箭头函数 → tsc 自动编译为 `function` ✅
- `Array.forEach` / `Object.keys` → ES5 API，ExtendScript 不支持 ❌
- 模板字符串 → tsc 自动编译为字符串拼接 ✅

## 面板通信约定（src/bridge.ts）

```typescript
// 所有 PS 通信必须经过 PSBridge，禁止在 index.ts 中直接调用 CSInterface
async getDocumentName(): Promise<string> {
  return this.evalScript("getDocumentName()");
}
```

面板侧解析返回值时必须处理三种情况：正常值、`__NO_DOCUMENT__`、`__ERROR__:` 前缀。

## 添加新功能的步骤

1. `src/jsx/hostscript.ts` 添加全局函数（遵守 ES3 + 返回字符串约定）
2. `src/bridge.ts` 暴露对应异步方法
3. `src/index.ts` 添加 UI 交互逻辑
4. `src/index.html` 添加 HTML 元素
5. `npm run build` 重新构建

## CSInterface.js 管理

```
src/lib/CSInterface.js   ← 从 Adobe CEP-Resources 下载，放这里，不要修改
dist/lib/CSInterface.js  ← webpack CopyWebpackPlugin 原样复制（clean: false）
```

文件来源：https://github.com/Adobe-CEP/CEP-Resources

`index.html` 中引用路径为 `lib/CSInterface.js`（相对于 dist/）。

## 类型声明

| 文件 | 作用域 | 内容 |
|------|--------|------|
| `src/types/cep-panel.d.ts` | 面板侧 | `CSInterface` 类、`HostEnvironment`、`CSEvent` |
| `ps-extendscript-types`（npm） | 宿主脚本侧 | PS ExtendScript DOM（`app`、`Document`、`ArtLayer` 等） |

两套类型通过 tsconfig 隔离：`tsconfig.json` 的 `types: []` 不引入任何 npm 类型，`tsconfig.jsx.json` 的 `types: ["ps-extendscript-types"]` 仅作用于 `src/jsx/`。

## 安装插件到 PS

```bash
# macOS — 符号链接（开发推荐）
ln -s $(pwd) ~/Library/Application\ Support/Adobe/CEP/extensions/com.layertool.panel

# Windows — 管理员 PowerShell
New-Item -ItemType Junction -Path "$env:APPDATA\Adobe\CEP\extensions\com.layertool.panel" -Target (Get-Location)
```

开启 CEP 调试模式（macOS）：
```bash
defaults write com.adobe.CSXS.11 PlayerDebugMode 1   # PS 2022+
defaults write com.adobe.CSXS.10 PlayerDebugMode 1   # PS 2021
```

调试地址：`http://localhost:8088`（Chrome DevTools）

## 常见问题排查

| 现象 | 原因 | 解决 |
|------|------|------|
| `CSInterface is not defined` | `dist/lib/CSInterface.js` 不存在 | 放置 `src/lib/CSInterface.js` 后重新 build |
| `EvalScript error.` | 宿主脚本语法错误或未编译 | 运行 `npm run build:jsx`，检查 `dist/jsx/hostscript.js` |
| 宿主类型报错（找不到 `app`） | ps-extendscript-types 未引入 | 确认 `tsconfig.jsx.json` 中 `types: ["ps-extendscript-types"]` |
| 修改 JSX 后不生效 | PS 缓存旧脚本 | 重启 PS 或重新加载扩展 |
