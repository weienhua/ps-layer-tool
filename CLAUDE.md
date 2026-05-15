# 图层处理工具 — PS CEP 插件

Adobe Photoshop CEP 面板插件，兼容 PS 2021（v22.0）及以上版本。预设驱动的图层信息提取与格式化导出工具。

## 技术栈

- **面板侧**：TypeScript → webpack(ts-loader) → ES6 bundle
- **宿主脚本侧**：TypeScript → webpack(ts-loader, target: ES3) → ES3（ExtendScript，PS 进程内执行）
- **宿主运行时增强**：`extendscript-es5-shim`（ES5 API polyfill）/ `cep-shim`（面板侧 CEP 垫片）
- **宿主工具库**：`photoshop-script-api`（vendored in `src/jsx/ps-api/`，Apache 2.0）
- **类型**：`ps-extendscript-types`（宿主）/ 自定义 `cep-panel.d.ts`（面板）
- **CEP 版本**：10.0+，扩展 ID：`com.layertool.panel`

## 项目结构

```
├── CSXS/manifest.xml          # CEP 清单，宿主版本、面板尺寸、路径配置
├── src/
│   ├── lib/
│   │   ├── CSInterface.js     # Adobe 官方 CEP 库 v10.0.0，不要修改，构建时原样复制
│   │   └── presets.txt        # 内置模板预设（7 条，UI 下拉列表来源）
│   ├── types/cep-panel.d.ts   # CSInterface 全局类型（最小化声明）
│   ├── jsx/
│   │   ├── hostscript.ts      # 宿主脚本入口
│   │   └── ps-api/            # photoshop-script-api 子项目（vendored，ES3 兼容）
│   ├── bridge.ts              # evalScript 封装，Promise 化通信 + 日志回调
│   ├── index.ts               # 面板 UI 控制器（LayerToolUI）
│   ├── index.html             # 面板 HTML 模板
│   └── style.css              # 面板样式（暗色主题，CSS 自定义属性）
├── dist/                      # 构建产物，不要手动编辑
│   ├── index.html / style.css / bundle.js   # 面板产物
│   ├── lib/
│   │   ├── CSInterface.js     # 从 src/lib/ 原样复制
│   │   └── presets.txt        # 从 src/lib/ 原样复制
│   └── jsx/hostscript.js      # webpack 构建产物（ES3）
├── doc/
│   ├── Windows.png            # Windows 安装示意图
│   └── csxs.reg/              # Windows 注册表文件（PlayerDebugMode，CSXS 6-11）
├── test.jsx                   # 遗留 ExtendScript 测试脚本（参考用）
├── tsconfig.json              # 面板侧：target ES6，types: []，排除 src/jsx/
├── tsconfig.jsx.json          # 宿主侧：target ES3，types: [ps-extendscript-types]
├── webpack.config.js          # 面板 webpack：entry index.ts → bundle.js
├── webpack.config.jsx.js      # 宿主 webpack：entry hostscript.ts → hostscript.js
└── package.json               # pnpm / npm
```

## 构建命令

```bash
npm install                # 安装依赖
npm run build              # 完整构建：build:jsx → build:panel
npm run build:jsx          # 仅构建宿主脚本（webpack --config webpack.config.jsx.js）
npm run build:jsx:debug    # 宿主脚本开发模式（带 source-map）
npm run build:panel        # 仅构建面板（webpack --mode=production）
npm run build:panel:debug  # 面板开发模式（带 source-map）
npm run dev                # 同时启动面板 + 宿主 watch（concurrently）
npm run dev:panel          # 仅面板 webpack watch（开发模式）
npm run dev:jsx            # 仅宿主 webpack watch（开发模式）
npm run clean              # rimraf dist
```

## 架构：两个隔离的执行上下文

```
面板（Chromium）                          PS 宿主（ExtendScript）
────────────────                          ──────────────────────
src/index.ts                              src/jsx/hostscript.ts
src/bridge.ts                                 ↓ webpack(ts-loader, target: ES3)
    │                                     dist/jsx/hostscript.js
    │  cs.evalScript("fn()")  ──────────→     全局函数（$.HostScript.*）
    │  callback(result)       ←──────────     return string
    ↓
Promise<PSResult<T>>
```

**关键约束**：两侧完全隔离，只能通过字符串传递数据。

## 代码规范

- **注释**：TS/JS 代码使用 JSDoc + 中文描述，函数、类、接口必须有注释
- **宿主脚本**：`src/jsx/hostscript.ts` 中避免使用三元运算符，改用 `if/else`（ExtendScript 兼容性）

## 宿主脚本约定（src/jsx/hostscript.ts）

所有通过 `$.HostScript` 暴露的函数必须是**全局函数**，返回值只能是**字符串**。

```typescript
// 标准模式
function getDocumentInfo(): string {
  try {
    if (app.documents.length === 0) return "__NO_DOCUMENT__";
    const doc = Document.activeDocument();
    return JSON.stringify({ name: doc.name(), width: size.width, height: size.height });
  } catch (e) {
    return "__ERROR__:" + e;
  }
}
```

全局注册：
```typescript
$ = $ || {};
$.HostScript = {
  getDocumentInfo,
  getSelectedLayerName,
  getSelectedLayersInfo,
  copyTextToClipboard,
  getDocumentPath,
  ensureDirectory,
  selectFolderDialog,
  saveHistoryState,
  restoreHistoryState,
  collectLayersForExport,
  collectAllLayersForExport,
  collectGroupLayersForExport,
  exportSingleLayer,
  exportLayerInfoXML,
  generateXMLTemplate
};
```

返回值约定：
- 正常结果 → JSON 字符串
- `"__OK__"` → 操作成功（无返回值）
- `"__NO_DOCUMENT__"` → 无打开文档
- `"__CANCEL__"` → 用户取消操作（如文件夹选择对话框）
- `"__ERROR__:<msg>"` → 运行时异常

**ES3 + shim 能力边界**（`target: ES3` + `extendscript-es5-shim`）：
- `const`/`let`、箭头函数、模板字符串等语法 → 由 TypeScript 编译降级，可使用
- 部分 ES5 API（如常见数组/对象辅助方法）→ 由 `extendscript-es5-shim` 在运行时补充，通常可用
- ExtendScript/Photoshop 宿主限制（DOM 能力、执行环境差异）→ 仍然存在，不会被 shim 消除
- 对兼容性敏感的逻辑建议优先使用保守写法，并加 `try/catch` 兜底

当前项目已在宿主入口文件 `src/jsx/hostscript.ts` 中引入：
- `import "extendscript-es5-shim";`
- `import { Document, Layer, History, Utils } from "./ps-api/src/index";`

**HostScript 已有函数：**

| 函数 | 用途 |
|------|------|
| `getDocumentInfo()` | 获取活动文档名和尺寸 |
| `getSelectedLayerName()` | 获取当前选中图层名 |
| `getSelectedLayersInfo()` | 获取所有选中图层的详细信息（坐标、尺寸、旋转、文字信息、路径） |
| `copyTextToClipboard(text)` | 复制文本到系统剪贴板 |
| `getDocumentPath()` | 获取当前文档的文件路径 |
| `ensureDirectory(dirPath)` | 确保目录存在，不存在则创建 |
| `selectFolderDialog()` | 打开原生文件夹选择对话框 |
| `saveHistoryState()` | 保存当前历史状态快照 |
| `restoreHistoryState()` | 恢复到之前保存的历史状态 |
| `collectLayersForExport(includeHidden)` | 收集选中图层的导出信息（不含组） |
| `collectAllLayersForExport(includeHidden)` | 收集文档全部图层的导出信息 |
| `collectGroupLayersForExport(includeHidden)` | 收集选中图层组内的所有子图层 |
| `exportSingleLayer(layerId, exportPath, format, groupPath, includeHidden)` | 导出单个图层为图片文件 |
| `exportLayerInfoXML(exportPath, layersJson)` | 导出图层信息 XML（manifest.xml） |
| `generateXMLTemplate(variableName, dataType, alignH, alignV, layersJson)` | 生成 XML 模板代码（百分比/温度/步数） |

## 面板通信约定（src/bridge.ts）

所有 PS 通信必须经过 `PSBridge`，禁止在 `index.ts` 中直接调用 `CSInterface`。

```typescript
async getDocumentInfo(): Promise<PSResult<DocumentInfo>> {
  return this.evalScript<DocumentInfo>("$.HostScript.getDocumentInfo()");
}
```

面板侧解析返回值时通过 `parseResult` 统一处理：`__ERROR__:` → error、`__NO_DOCUMENT__` → noDocument、`__OK__` → 空成功、JSON → data、其他 → string data。

**超时保护**：`evalScript` 内部有 10 秒超时，超时后返回 `{ success: false, error: 'timeout' }`。

**调试支持**：通过 `setLogCallback()` 注册回调，可将通信日志实时输出到面板内的调试面板。

## photoshop-script-api 子项目（src/jsx/ps-api/）

vendored 自 [photoshop-script-api](https://github.com/emptykid/photoshop-script-api) v1.0.4（Apache 2.0）。

提供面向对象的 PS ExtendScript API 封装：
- **核心**：`Application`、`Document`、`Layer`、`Selection`
- **工具**：`MoveTool`、`RulerTool`
- **颜色**：`SolidColor`、`GradientColor`
- **特效**：`FXDropShadow`、`FXColorOverlay`、`FXStroke`、`FXGradientFill`
- **文本**：`Text`（含字体、字号、颜色、对齐等子模块）
- **形状**：`Shape`（含 `Rectangle`、`Ellipse`、`Line` 等子类型）
- **辅助**：`Rect`、`Size`、`Utils`、`Guide`、`History`、`MetaData` 等

当前项目使用 `Document`、`Layer`、`History`、`Utils` 的部分方法。

## 预设系统

### 内置模板预设（src/lib/presets.txt）

7 条预设模板，每行一条，应用启动时加载到自定义下拉列表：

```
x="{x}" y="{y}"
x="{x}" y="{y}" w="{width}" h="{height}"
<Image src="{path}{name}.png" x="{x}" y="{y}" />
<Image src="{path}{name}.png" x="{x}" y="{y}" w="{width}" h="{height}" scaleType="fill"/>
<Image src="{path}{name}.png" x="{centerX}" y="{centerY}" w="{width}{scaleAnim}" h="{height}{scaleAnim}" align="center" alignV="center" scaleType="fill"/>
<Image src="{path}{name}.png" x="{x}" y="{y}" w="{width}" h="{height}" centerX="{centerX}-{x}" centerY="{centerY}-{y}" rotation="{rotateAnim}" />
<Text textExp="'{text}'" x="{x}" y="{y}" bold="false" color="{fontColor}" size="{fontSize}"/>
```

### 模板变量

| 变量 | 说明 |
|------|------|
| `{name}` | 图层名（去扩展名） |
| `{type}` | 图层类型（normal / smartObject / text） |
| `{x}`, `{y}` | 锚点坐标（由9点锚位和layer bounds计算） |
| `{width}`, `{height}` | 图层宽高 |
| `{centerX}`, `{centerY}` | 图层中心点坐标 |
| `{rotation}` | 旋转角度（度） |
| `{path}` | 图层组路径（如 "groupA/subGroup/"） |
| `{text}` | 文字图层内容 |
| `{fontSize}` | 文字图层字号 |
| `{fontColor}` | 文字颜色（#RRGGBB） |
| `{scaleAnim}` | 缩放动画表达式（用户自定义） |
| `{rotateAnim}` | 旋转动画表达式（用户自定义） |

### 动画表达式

在"缩放动画"/"旋转动画"输入框中可以编写数学表达式，支持：
- `#loop` — 循环索引（0, 1, 2, ...）
- 数学函数：`sin`, `cos`, `abs`, `round`
- 算术运算：`+`, `-`, `*`, `/`, `( )`

示例：`(1-0.1*sin((#loop-100*0)/300))` — 波形缩放；`(5*sin((#loop-100*0)/300))` — 波形旋转。

### 用户预设（localStorage）

用户保存的预设存储在 `localStorage` 中（key: `layerTool.presets.v1`），支持：
- 保存/加载/删除预设
- 拖拽排序（HTML5 Drag and Drop API）
- 预设卡片带 3×3 锚点网格微预览

## 面板 UI 功能

面板分为两个 Tab 页签：**图层信息** 和 **图层处理**。

### Tab 1：图层信息

#### 表单控件
- **预设名**：文本输入，用于保存用户预设
- **位置锚点**：3×3 网格可视化选择器 + 下拉选择器
- **排序方式**：按 X 升序 / 按 Y 升序 / 按PS图层顺序
- **缩放动画**：数学表达式输入（支持 `#loop` 变量和 `sin`/`cos` 函数）
- **旋转动画**：数学表达式输入
- **输出模板**：自定义下拉列表（7 条内置预设 + "自定义"选项）+ 文本域
- **模板变量提示**：显示所有可用模板变量及说明

#### 交互按钮
- **获取选中图层信息**：读取 PS 选中图层，按预设格式化并填入输出区域，自动复制到剪贴板
- **保存预设**：将当前配置保存到 localStorage
- **复制输出**：将输出区域内容复制到剪贴板（通过宿主脚本 `copyTextToClipboard`）

#### 预设列表
- 卡片式展示，带 3×3 锚点网格微预览和排序标签
- 点击卡片应用预设并获取图层信息
- 支持拖拽排序
- 悬停显示模板预览

### Tab 2：图层处理（导出）

#### 导出设置
- **导出路径**：文本输入 + 浏览按钮（调用 PS 原生文件夹选择对话框），默认为 PSD 所在目录/export
- **导出格式**：PNG / JPG / BMP
- **导出不可见图层**：复选框
- **导出图层信息 XML**：复选框，导出 manifest.xml
- **保留文件夹层级**：复选框，保持 PS 图层组目录结构

#### 导出操作
- **导出选中图层**：仅导出选中的非组图层
- **导出选中图层组**：递归导出选中图层组内的所有子图层
- **导出全部图层**：导出文档中所有可见图层

#### 导出结果
- 显示已导出文件列表（路径 + 尺寸）
- 进度条显示导出进度

### 其他
- **Toast 提示**：操作反馈提示框（2s 显示 + 0.3s 淡出动画）
- **状态栏**：底部状态提示（就绪/成功/错误）
- **文档信息**：顶部显示当前文档名和尺寸，每 60 秒自动刷新
- **调试面板**：可收起的调试面板，带开关和通信日志查看器（实时显示 send/receive/error 及耗时）

## 添加新功能的步骤

1. `src/jsx/hostscript.ts` 添加全局函数（遵守 ES3 + 返回字符串约定），在底部 `$.HostScript` 注册
2. `src/bridge.ts` 暴露对应异步方法
3. `src/index.ts` 添加 UI 交互逻辑
4. `src/index.html` 添加 HTML 元素
5. `npm run build` 重新构建

## CSInterface.js 管理

```
src/lib/CSInterface.js   ← 从 Adobe CEP-Resources 下载，v10.0.0，不要修改
dist/lib/CSInterface.js  ← webpack CopyWebpackPlugin 原样复制
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

# Windows — 目录联接（管理员 PowerShell）
New-Item -ItemType Junction -Path "$env:APPDATA\Adobe\CEP\extensions\com.layertool.panel" -Target (Get-Location)
```

开启 CEP 调试模式（macOS）：
```bash
defaults write com.adobe.CSXS.11 PlayerDebugMode 1   # PS 2022+
defaults write com.adobe.CSXS.10 PlayerDebugMode 1   # PS 2021
```

Windows 调试模式：编辑注册表 `HKCU\Software\Adobe\CSXS.11\PlayerDebugMode = "1"`，或使用 `doc/csxs.reg/` 目录中的注册表文件。

调试地址：`http://localhost:8088`（Chrome DevTools）

## 常见问题排查

| 现象 | 原因 | 解决 |
|------|------|------|
| `CSInterface is not defined` | `dist/lib/CSInterface.js` 不存在 | 放置 `src/lib/CSInterface.js` 后重新 build |
| `EvalScript error.` | 宿主脚本语法错误或未编译 | 运行 `npm run build:jsx`，检查 `dist/jsx/hostscript.js` |
| 宿主类型报错（找不到 `app`） | ps-extendscript-types 未引入 | 确认 `tsconfig.jsx.json` 中 `types: ["ps-extendscript-types"]` |
| 修改 JSX 后不生效 | PS 缓存旧脚本 | 重启 PS 或重新加载扩展 |
| 面板白屏 | HTML/JS 加载失败 | 打开 `http://localhost:8088` 检查控制台错误 |
