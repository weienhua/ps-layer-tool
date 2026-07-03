# 图层处理工具 — PS CEP 插件

Adobe Photoshop CEP 面板插件，兼容 PS 2019（v20.0）及以上版本。预设驱动的图层信息提取与格式化导出工具。

## 技术栈

- **面板侧**：Vue 3 SFC + TypeScript → webpack(vue-loader + ts-loader) → ES6 bundle
- **宿主脚本侧**：TypeScript → webpack(ts-loader, target: ES3) → ES3（ExtendScript，PS 进程内执行）
- **宿主运行时增强**：`extendscript-es5-shim`（ES5 API polyfill）/ `cep-shim`（面板侧 CEP 垫片）
- **宿主工具库**：`photoshop-script-api`（vendored in `src/jsx/ps-api/`，Apache 2.0）
- **类型**：`ps-extendscript-types`（宿主）/ 自定义 `cep-panel.d.ts`（面板）
- **CEP 版本**：9.0+，扩展 ID：`com.layertool.panel`

## 项目结构

```
├── CSXS/manifest.xml          # CEP 清单，宿主版本、面板尺寸、路径配置
├── src/
│   ├── main.ts                # Vue 入口：createApp(App).mount('#app')
│   ├── App.vue                # 根组件：Tab 状态、Toast Provider、调试面板
│   ├── components/            # Vue SFC 组件
│   │   ├── TabBar.vue         # Tab 导航栏
│   │   ├── LayerInfoTab.vue   # Tab1：图层信息
│   │   ├── TemplateOutputTab.vue # Tab2：模板输出
│   │   ├── LayerExportTab.vue # Tab3：图层处理
│   │   ├── XmlTemplateTab.vue # Tab4：XML 模板
│   │   ├── AnchorGrid.vue     # 3×3 锚点网格选择器（复用，v-model）
│   │   ├── CustomSelect.vue   # 自定义下拉选择器（复用，v-model）
│   │   ├── PresetList.vue     # 预设卡片列表 + 拖拽排序
│   │   ├── Modal.vue          # 通用 Modal 弹窗
│   │   ├── Toast.vue          # Toast 提示（provide/inject）
│   │   ├── DebugPanel.vue     # 调试面板（通信日志）
│   │   ├── StatusBar.vue      # 底部状态栏
│   │   ├── DocInfo.vue        # 文档信息 + 定时刷新
│   │   ├── HintCollapsible.vue # 可折叠提示区域
│   │   └── SectionCollapsible.vue # 可折叠 Section 区域
│   ├── composables/
│   │   ├── usePreset.ts       # 预设管理 composable（localStorage + 文件双写）
│   │   └── useToast.ts        # Toast composable（inject）
│   ├── types/
│   │   ├── index.ts           # 共享类型：AnchorType, SortType, TabId, PresetCardData
│   │   └── cep-panel.d.ts     # CSInterface 全局类型（最小化声明）
│   ├── utils.ts               # 共享工具函数：MathExpr、模板引擎、锚点计算
│   ├── vue-shims.d.ts         # Vue SFC 类型声明
│   ├── lib/
│   │   ├── CSInterface.js     # Adobe 官方 CEP 库 v9.4.0，不要修改，构建时原样复制
│   │   ├── presets.md         # 图层信息内置模板预设（7 条，markdown 代码块格式）
│   │   └── template.md        # 模板输出预定义模板（数组索引语法，含 name 标题）
│   ├── jsx/
│   │   ├── hostscript.ts      # 宿主脚本入口
│   │   └── ps-api/            # photoshop-script-api 子项目（vendored，ES3 兼容）
│   ├── bridge.ts              # evalScript 封装，Promise 化通信 + 日志回调
│   ├── index.html             # 精简版 HTML（挂载点 + CSInterface + bundle）
│   └── style.css              # 全局基础样式（reset、CSS 变量、按钮、表单）
├── dist/                      # 构建产物，不要手动编辑
│   ├── index.html / bundle.js # 面板产物（CSS 打包进 bundle.js）
│   ├── lib/
│   │   ├── CSInterface.js     # 从 src/lib/ 原样复制
│   │   ├── presets.md         # 从 src/lib/ 原样复制
│   │   └── template.md        # 从 src/lib/ 原样复制
│   └── jsx/hostscript.js      # webpack 构建产物（ES3）
├── doc/
│   ├── Windows.png            # Windows 安装示意图
│   └── csxs.reg/              # Windows 注册表文件（PlayerDebugMode，CSXS 6-11）
├── test.jsx                   # 遗留 ExtendScript 测试脚本（参考用）
├── tsconfig.json              # 面板侧：target ES6，jsx: preserve，排除 src/jsx/
├── tsconfig.jsx.json          # 宿主侧：target ES3，types: [ps-extendscript-types]
├── webpack.config.js          # 面板 webpack：vue-loader + ts-loader + css-loader
├── webpack.config.jsx.js      # 宿主 webpack：entry hostscript.ts → hostscript.js
└── package.json               # pnpm / npm
```

## 构建命令

```bash
npm install                # 安装依赖
npm run build              # 完整构建（开发模式，显示调试面板）
npm run build:jsx          # 仅构建宿主脚本（webpack --config webpack.config.jsx.js）
npm run build:panel        # 仅构建面板（开发模式）
npm run dev                # 同时启动面板 + 宿主 watch（concurrently）
npm run dev:panel          # 仅面板 webpack watch（开发模式）
npm run dev:jsx            # 仅宿主 webpack watch（开发模式）
npm run clean              # rimraf dist installer
npm run package            # 生产模式构建 + 打包发布文件（zip + 安装程序）到 installer/
```

### 打包产物

`npm run package` 生成：
- `com.layertool.panel-vX.X.X.zip` — 跨平台手动安装包
- `com.layertool.panel-installer.exe` — Windows 自动安装程序
- `com.layertool.panel-installer-macos` — macOS 自动安装程序
- `com.layertool.panel-uninstaller.exe` — Windows 卸载程序
- `com.layertool.panel-uninstaller-macos` — macOS 卸载程序

`pkg` 支持交叉编译，可在 macOS 上同时生成 Windows 和 macOS 安装程序。

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

- **上传github**：根据项目代码修改编写commit，不用包裹在@@中
- **注释**：TS 代码使用 JSDoc + 中文描述，函数、类、接口必须有注释
- **Vue 组件**：使用 `<script setup lang="ts">` 组合式 API，共享类型从 `src/types/index.ts` 导入
- **CSS**：全局基础样式在 `src/style.css`，组件样式用 `<style scoped>`
- **模板语法**：Vue 模板中避免使用反引号模板字符串（与 `{{ }}` 冲突），用字符串拼接代替
- **宿主脚本**：`src/jsx/hostscript.ts` 中避免使用三元运算符，改用 `if/else`（ExtendScript 兼容性）
- **ExtendScript hasKey 缓存**：`hasKey()` 等方法在 `if-else if` 结构中多次调用时可能产生不可预期的行为。必须将结果缓存到变量后再进行条件判断，避免重复调用。示例：
  ```typescript
  // ✗ 错误写法
  if (obj.hasKey(s2t("red"))) { ... }
  else if (obj.hasKey(s2t("redFloat"))) { ... }

  // ✓ 正确写法
  var hasRed = obj.hasKey(s2t("red"));
  var hasRedFloat = obj.hasKey(s2t("redFloat"));
  if (hasRed && !hasRedFloat) { ... }
  else if (!hasRed && hasRedFloat) { ... }
  ```

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
  generateXMLTemplate,
  readFile,
  writeFile,
  listFiles,
  getExtensionPath
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
| `readFile(filePath)` | 读取文件内容 |
| `writeFile(filePath, content)` | 写入文件内容 |
| `listFiles(dirPath)` | 列出目录下的文件 |
| `getExtensionPath()` | 获取插件扩展目录路径 |

## 面板通信约定（src/bridge.ts）

所有 PS 通信必须经过 `PSBridge`，禁止在 Vue 组件中直接调用 `CSInterface`。

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

### 内置模板预设（src/lib/presets.md）

7 条预设模板，markdown 代码块格式，应用启动时加载到图层信息 Tab 的下拉列表。首个 `example` 代码块为注解，解析时自动跳过。

### 模板输出预定义模板（src/lib/template.md）

模板输出 Tab 的下拉列表来源，每条模板有 `name:` 标题和代码块内容。使用数组索引语法（如 `{name[0]}`, `{x[1]}`）。

### 预设持久化存储

**统一预设管理**：Tab1（图层信息）和 Tab2（模板输出）的预设统一存储，支持筛选按钮（全部/图层信息/模板输出）。点击预设卡片自动切换到对应 Tab 并执行获取。

预设数据统一保存到本地文件和 localStorage，优先级：**本地文件 > localStorage > 默认值**。

| 数据 | 本地文件路径 | localStorage Key |
|------|-------------|------------------|
| 统一预设（Tab1+Tab2） | `dist/lib/presets/all/default.json` | `layerTool.presets.all.v1` |
| Tab4 XML 模板 | `dist/lib/presets/tab4/default.json` | `layerTool.xmlConfig.v1` |

首次启动时自动从旧存储迁移（合并去重，localStorage 优先）。安装/卸载脚本会自动备份和恢复 `dist/lib/presets/` 目录。

### 模板变量

| 变量 | 说明 |
|------|------|
| `{i}` | 图层序号（从0开始，按排序方式） |
| `{name}` | 图层名（去扩展名） |
| `{acname}` | 图层名（去`_数字`/`拷贝`后缀，如 `time_0 拷贝 2` → `time`，`dot 拷贝 11` → `dot`） |
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

### 数学表达式

模板中支持对数字类型的变量进行数学运算（`+` `-` `*` `/` `%` 和括号）。

**可用字段**（数字类型）：`i`, `x`, `y`, `width`, `height`, `rotation`, `centerX`, `centerY`, `fontSize`

示例：`{i+1}`（序号从1开始）、`{width*2}`（宽度翻倍）、`{x/2+5}`（x坐标一半加5）、`{(i+1)*100}`（序号+1再×100）

字符串字段（`name`, `acname`, `type`, `path`, `text`, `fontColor` 等）不可参与计算。表达式语法错误或包含非数字字段时保持原样不替换。

内部实现：`MathExpr` 递归下降解析器（`src/index.ts`），通过 `numericScope` 严格区分 number/string 类型。

### 支持的函数

| 函数 | 说明 | 示例 |
|------|------|------|
| `round(x)` | 四舍五入取整 | `{round(width/2)}` |
| `round(x, n)` | 保留 n 位小数 | `{round(x/3, 2)}` |
| `ceil(x)` | 向上取整 | `{ceil(height/10)}` |
| `floor(x)` | 向下取整 | `{floor(x/5)}` |
| `int(x)` | 取整数部分 | `{int(rand()*10)}` |
| `abs(x)` | 绝对值 | `{abs(x-100)}` |
| `min(a, b)` | 最小值 | `{min(width, height)}` |
| `max(a, b)` | 最大值 | `{max(x, y)}` |
| `rand()` | 随机数 (0-1) | `{int(rand()*100)}` |
| `pow(x, y)` | x 的 y 次方 | `{pow(2, 10)}` |
| `sqrt(x)` | 平方根 | `{sqrt(width*height)}` |

函数支持嵌套：`{int(rand()*10)}` — 生成 0-9 随机整数；`{round(pow(2, 0.5), 3)}` — √2 保留 3 位小数。

默认所有数值输出保留 2 位小数（整数除外）。

### 动画表达式

在"缩放动画"/"旋转动画"输入框中可以编写数学表达式，支持：
- `#loop` — 循环索引（0, 1, 2, ...）
- 数学函数：`sin`, `cos`, `abs`, `round`
- 算术运算：`+`, `-`, `*`, `/`, `( )`

示例：`(1-0.1*sin((#loop-100*0)/300))` — 波形缩放；`(5*sin((#loop-100*0)/300))` — 波形旋转。

### 用户预设（localStorage + 本地文件）

- **图层信息预设**：`localStorage` key `layerTool.presets.v1`，本地文件 `dist/lib/presets/tab1/default.json`
- **模板输出预设**：`localStorage` key `layerTool.templateOutputPresets.v1`，本地文件 `dist/lib/presets/tab2/default.json`
- **XML 模板配置**：`localStorage` key `layerTool.xmlConfig.v1`，本地文件 `dist/lib/presets/tab4/default.json`
- **折叠面板状态**：`localStorage` key `layerTool.hintStates.v1`（仅 localStorage，不持久化到文件）

支持保存/加载/删除预设、拖拽排序（HTML5 Drag and Drop API）、预设卡片带 3×3 锚点网格微预览。

## 面板 UI 功能

面板分为四个 Tab 页签：**图层信息**、**模板输出**、**图层处理** 和 **XML 模板**。

### Tab 1：图层信息

#### 表单控件
- **预设名**：文本输入，用于保存用户预设
- **位置锚点**：3×3 网格可视化选择器 + 下拉选择器
- **排序方式**：按 X 升序 / 按 Y 升序 / 按PS图层顺序
- **缩放动画**：数学表达式输入（支持 `#loop` 变量和 `sin`/`cos` 函数）
- **旋转动画**：数学表达式输入
- **输出模板**：自定义下拉列表（7 条内置预设 + "自定义"选项）+ 文本域
- **模板变量提示**：显示所有可用模板变量及说明，点击可复制变量名

#### 交互按钮
- **获取选中图层信息**：读取 PS 选中图层，按预设格式化并填入输出区域，自动复制到剪贴板
- **保存预设**：将当前配置保存到统一预设列表
- **复制输出**：将输出区域内容复制到剪贴板（通过宿主脚本 `copyTextToClipboard`）

### Tab 2：模板输出

#### 表单控件
- **预设名**：文本输入，用于保存用户预设
- **位置锚点**：3×3 网格可视化选择器 + 下拉选择器
- **排序方式**：按 X 升序 / 按 Y 升序 / 按PS图层顺序
- **输出模板**：下拉列表（从 template.md 加载 + "自定义"选项）+ 文本域
- **模板变量提示**：显示所有可用数组索引变量及说明，点击可复制变量名

#### 模板语法
使用数组索引语法引用每个图层：`{name[0]}`, `{x[1]}`, `{path[2]}` 等。

#### 可用变量（含数组索引）
`{name[i]}`, `{acname[i]}`, `{type[i]}`, `{x[i]}`, `{y[i]}`, `{width[i]}`, `{height[i]}`, `{centerX[i]}`, `{centerY[i]}`, `{rotation[i]}`, `{path[i]}`, `{text[i]}`, `{fontSize[i]}`, `{fontColor[i]}`, `{gapX[i]}`, `{gapY[i]}`

其中 `{gapX[i]}` / `{gapY[i]}` 为与前一图层的锚点坐标间距（首个图层为 0）。

### Tab 3：图层处理（导出）

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

### Tab 4：XML 模板

#### 模板设置
- **变量名**：文本输入，默认按数据类型自动填充（`#battery_level` / `#weatherTemp` / `#steps_value`）
- **数据类型**：三个按钮切换 — 百分比 / 温度 / 步数
- **位置锚点**：3×3 网格可视化选择器 + 下拉选择器（控制 XML 中 baseX/baseY 的计算）
- **排序方式**：按 X 升序 / 按 Y 升序 / 按 PS 图层顺序
- **对齐方式**：3×3 网格可视化选择器 + 下拉选择器（控制 `lt()`/`ge()` 表达式中的对齐系数）
- **输出 rotation 属性**：复选框，默认勾选，勾选后在每个 Image 标签上输出 `rotation` 属性（仅当 rotation ≠ 0 时）

#### 常用变量管理
- **变量列表**：显示所有可用的 XML 变量（内置 + 自定义），点击可选择变量名填入输入框
- **添加变量**：点击按钮弹出自定义 Modal 弹窗，输入变量名（必填）和描述说明（选填）
- **恢复默认**：弹出确认弹窗，重置为内置变量列表（保留自定义变量）
- **删除变量**：悬停变量标签显示删除按钮
- **弹窗交互**：支持 ESC 键关闭、点击遮罩层关闭、表单验证（变量名不能为空）

内置变量：`#battery_level`（电量）、`#weatherTemp`（当前温度）、`#dayTempgao2`（最高温度）、`#nightTempdi2`（最低温度）、`#humidityNum`（湿度）、`#steps_value`（步数）等。

#### 操作
- **生成 XML 模板**：读取选中图层信息，根据数据类型和对齐方式生成 XML 代码，自动复制到剪贴板

#### 数据类型说明
- **百分比**：最多 3 位数（百位、十位、个位），srcid 阈值 `[100, 10, 1]`，每对相邻数位独立计算偏移量
- **温度**：第 1 层为符号位（正/负），后续为数值位，符号位对齐系数自动反转（`1 - ahNum`），至少需要 2 个图层
- **步数**：动态位数（1-5 位），srcid 阈值从 `10^(n-1)` 到 `1`，每对相邻数位独立计算偏移量

### 统一预设列表（Tab1+Tab2 合并）

Tab1（图层信息）和 Tab2（模板输出）的预设统一显示在同一列表中，位于面板底部。

#### 功能特性
- **筛选按钮**：支持按来源筛选预设（全部/图层信息/模板输出）
- **标签区分**：预设卡片带彩色标签显示来源（蓝色=图层信息，绿色=模板输出）
- **数字标识**：折叠状态下显示数字标识（1=图层信息，2=模板输出）
- **点击执行**：点击预设卡片自动切换到对应 Tab，应用预设配置并获取图层信息
- **拖拽排序**：Tab1 和 Tab2 预设可交叉排序
- **预览显示**：悬停卡片显示模板预览（显示在卡片上方，避免抖动）

#### 卡片显示效果
```
折叠态：                    展开态：
┌─────────────────────┐    ┌─────────────────────┐
│ ▼ 按钮名      1 [×] │    │ ▼ 按钮名        [×] │
└─────────────────────┘    │   [图层信息]         │
                           │   ● ● ●  按X升序    │
                           │   x="{x}" y="{y}"   │
                           └─────────────────────┘
```

### 其他
- **Toast 提示**：操作反馈提示框（2s 显示 + 0.3s 淡出动画）
- **状态栏**：底部状态提示（就绪/成功/错误）
- **文档信息**：顶部显示当前文档名和尺寸，每 60 秒自动刷新
- **调试面板**：可收起的调试面板，带开关和通信日志查看器（实时显示 send/receive/error 及耗时）

## 添加新功能的步骤

1. `src/jsx/hostscript.ts` 添加全局函数（遵守 ES3 + 返回字符串约定），在底部 `$.HostScript` 注册
2. `src/bridge.ts` 暴露对应异步方法
3. `src/components/` 创建或修改 Vue 组件（`<script setup lang="ts">`）
4. 如需新的共享类型，添加到 `src/types/index.ts`
5. `npm run build` 重新构建

## CSInterface.js 管理

```
src/lib/CSInterface.js   ← 从 Adobe CEP-Resources 下载，v9.4.0，不要修改
dist/lib/CSInterface.js  ← webpack CopyWebpackPlugin 原样复制
src/style.css            ← 全局基础样式，通过 import 引入 main.ts，webpack css-loader 打包进 bundle.js
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

删除链接（仅移除链接，不影响源目录内容）：

```bash
# macOS
unlink ~/Library/Application\ Support/Adobe/CEP/extensions/com.layertool.panel

# Windows（PowerShell，用 cmd /c rmdir 避免误删源目录）
cmd /c rmdir "$env:APPDATA\Adobe\CEP\extensions\com.layertool.panel"
```

查看链接状态：

```bash
# macOS
ls -la ~/Library/Application\ Support/Adobe/CEP/extensions/ | grep layertool

# Windows（PowerShell）
Get-Item "$env:APPDATA\Adobe\CEP\extensions\com.layertool.panel" | Select-Object Attributes, LinkType, Target
```

开启 CEP 调试模式（macOS）：
```bash
defaults write com.adobe.CSXS.9 PlayerDebugMode 1    # PS 2019
defaults write com.adobe.CSXS.10 PlayerDebugMode 1   # PS 2020-2021
defaults write com.adobe.CSXS.11 PlayerDebugMode 1   # PS 2022+
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
