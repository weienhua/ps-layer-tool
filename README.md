# 图层处理工具 - Photoshop CEP 插件

基于 [photoshop-script-api](https://github.com/emptykid/photoshop-script-api) 的 Photoshop CEP 面板插件，提供预设驱动的图层信息提取与格式化导出功能。

## 功能特性

### 图层信息提取
- **图层信息提取**：获取选中图层的坐标、尺寸、中心点、旋转角度、文字内容、字体大小、颜色等
- **预设模板系统**：7 条内置输出模板（坐标、XML、动画等），支持用户自定义和保存预设
- **格式化输出**：基于模板变量（`{x}`, `{y}`, `{width}`, `{name}` 等）将图层信息格式化为文本
- **数学表达式**：模板中支持对数字变量进行数学运算，如 `{i+1}`、`{width*2}`、`{(i+1)*100}`
- **函数支持**：`round`、`ceil`、`floor`、`int`、`abs`、`min`、`max`、`rand`、`pow`、`sqrt`，支持嵌套
- **排序方式**：按 X 升序 / Y 升序 / PS 图层顺序
- **锚点选择**：3×3 网格可视化锚点选择器（左上、中上、右上、左中、中心、右中、左下、中下、右下）
- **动画表达式**：支持 `#loop`、`sin`、`cos` 等数学函数的动态表达式输入
- **统一预设管理**：Tab1/Tab2 预设统一存储，支持筛选按钮（全部/图层信息/模板输出），点击预设自动切换 Tab 并执行
- **一键复制**：格式化结果一键复制到系统剪贴板
- **变量提示点击复制**：点击模板变量提示项即可复制变量名到剪贴板

### 模板输出
- **数组索引语法**：使用 `{name[0]}`, `{x[1]}` 等语法精确控制每个图层的输出位置
- **15 个模板变量**：包含图层信息全部字段 + gapX/gapY 间距字段
- **间距计算**：基于锚点坐标计算相邻图层间距
- **预定义模板**：从 template.md 加载，支持自定义模板

### XML 模板生成
- **三种数据类型**：百分比、温度、步数
- **对齐方式**：9 宫格可视化锚点选择器 + 水平/垂直对齐下拉列表
- **自动生成偏移公式**：根据图层实际位置计算相邻数位间距，生成 `lt()`/`ge()` 条件表达式
- **温度特殊处理**：符号位自动反转对齐系数，支持正负温度显示
- **输出 rotation 属性**：可选在 Image 标签上输出 rotation 属性（默认勾选，仅 rotation ≠ 0 时输出）
- **常用变量管理**：内置变量列表 + 自定义变量支持，点击选择变量名
- **自定义弹窗**：添加变量和确认操作使用自定义 Modal 弹窗，支持 ESC 键关闭、点击遮罩层关闭、表单验证
- **变量配置持久化**：变量列表和 rotation 设置保存到本地文件
- **一键复制**：生成的 XML 代码自动复制到剪贴板

### 图层导出
- **多种导出模式**：导出选中图层 / 选中图层组 / 全部图层
- **多格式支持**：PNG、JPG、BMP
- **文件夹层级**：可选保留 PS 图层组目录结构
- **XML 导出**：可选导出图层信息 XML（manifest.xml）
- **非破坏性导出**：自动保存/恢复历史状态，不影响文档
- **进度显示**：实时导出进度和结果列表

### 曲线拟合
- **手绘模式**：Canvas 自由手绘曲线，自动拟合为数学解析式
- **表达式模式**：输入表达式生成曲线，拖拽变形后重新拟合
- **组合拟合**：多项式 + 三角函数 + 指数可自由组合
- **形态分类**：自动推荐最佳基函数组合
- **精度控制**：可调节表达式小数位数
- **纯面板侧**：不依赖 PS 宿主交互

### 其他
- **Toast 提示**：操作反馈动画提示
- **调试面板**：内置可收起的通信日志查看器（含耗时显示）

## 技术栈

- **面板侧**: Vue 3 SFC + TypeScript + webpack(vue-loader) → ES6
- **宿主侧**: TypeScript + photoshop-script-api + webpack → ES3 (ExtendScript)
- **通信**: CEP `evalScript` 桥接
- **CEP 版本**: 9.0+
- **兼容 Photoshop**: 2019 (v20.0) 及以上

## 项目结构

```
├── CSXS/
│   └── manifest.xml              # CEP 扩展清单
├── src/
│   ├── main.ts                   # Vue 入口
│   ├── App.vue                   # 根组件
│   ├── components/               # Vue SFC 组件（17 个）
│   │   ├── TabBar.vue            # Tab 导航栏
│   │   ├── LayerInfoTab.vue      # Tab1：图层信息
│   │   ├── TemplateOutputTab.vue # Tab2：模板输出
│   │   ├── LayerExportTab.vue    # Tab3：图层处理
│   │   ├── XmlTemplateTab.vue    # Tab4：XML 模板
│   │   ├── CurveFitTab.vue       # Tab5：曲线拟合
│   │   ├── FunctionCanvas.vue    # Canvas 画布（手绘 + 变形）
│   │   ├── AnchorGrid.vue        # 锚点网格选择器
│   │   ├── CustomSelect.vue      # 自定义下拉
│   │   ├── UnifiedPresetList.vue # 统一预设列表（Tab1+Tab2合并）
│   │   ├── Modal.vue             # 通用弹窗
│   │   ├── Toast.vue             # Toast 提示
│   │   ├── DebugPanel.vue        # 调试面板
│   │   ├── StatusBar.vue         # 状态栏
│   │   ├── DocInfo.vue           # 文档信息
│   │   ├── HintCollapsible.vue   # 可折叠提示
│   │   └── SectionCollapsible.vue # 可折叠区域
│   ├── composables/              # Vue 组合式函数
│   │   ├── usePreset.ts          # 预设管理
│   │   ├── useToast.ts           # Toast
│   │   └── useCurveFit.ts        # 曲线拟合状态管理
│   ├── algo/                     # 曲线拟合算法
│   │   ├── curveFit.ts           # 多项式/三角/指数拟合
│   │   └── functionClassify.ts   # 形态分类器
│   ├── types/
│   │   ├── index.ts              # 共享类型
│   │   └── cep-panel.d.ts        # CEP 面板类型声明
│   ├── utils.ts                  # MathExpr、模板引擎、工具函数
│   ├── vue-shims.d.ts            # Vue SFC 类型声明
│   ├── jsx/
│   │   ├── hostscript.ts         # 宿主脚本入口（import + $.HostScript 注册）
│   │   ├── modules/              # 宿主脚本模块
│   │   │   ├── types.d.ts        # 共享类型声明（ActionManager API）
│   │   │   ├── utils.ts          # 通用工具（log、rgbToHex、roundValue、copyTextToClipboard）
│   │   │   ├── document.ts       # 文档/图层基础查询
│   │   │   ├── layerInfo.ts      # 图层详细信息提取
│   │   │   ├── export.ts         # 图层收集与导出
│   │   │   ├── xml.ts            # XML 模板生成
│   │   │   └── fileOps.ts        # 文件系统操作
│   │   └── ps-api/               # photoshop-script-api（vendored）
│   ├── lib/
│   │   ├── CSInterface.js        # Adobe 官方 CEP 库（v9.4.0）
│   │   ├── presets.md            # 图层信息内置模板预设（7 条）
│   │   └── template.md           # 模板输出预定义模板
│   ├── bridge.ts                 # PS 通信桥接层
│   ├── index.html                # 面板 HTML 模板
│   └── style.css                 # 全局基础样式（暗色主题）
├── doc/
│   ├── Windows.png               # Windows 安装示意图
│   └── csxs.reg/                 # Windows 注册表文件（调试模式）
├── test.jsx                      # 遗留 ExtendScript 测试脚本
├── dist/                         # 构建产物
├── webpack.config.js             # 面板 webpack 配置（vue-loader）
├── webpack.config.jsx.js         # 宿主脚本 webpack 配置
└── package.json
```

## 安装

### 方式一：自动安装（推荐）

下载安装程序，运行即可自动完成安装：

- **Windows**: 下载 `com.layertool.panel-installer.exe`，双击运行
- **macOS**: 下载 `com.layertool.panel-installer-macos`，右键选择"打开"或使用终端运行：
  ```bash
  chmod +x com.layertool.panel-installer-macos
  ./com.layertool.panel-installer-macos
  ```

安装程序会自动：
1. 检测已安装的 Photoshop 版本
2. 复制插件文件到 CEP 扩展目录
3. 开启调试模式
4. 保留用户自定义的 `presets.md`、`template.md` 文件和 `presets/` 目录（如果存在）

**卸载方法**：
- **Windows**: 双击运行 `com.layertool.panel-uninstaller.exe`
- **macOS**: 右键选择"打开"或使用终端运行：
  ```bash
  chmod +x com.layertool.panel-uninstaller-macos
  ./com.layertool.panel-uninstaller-macos
  ```

卸载时会自动备份用户自定义的 `presets.md`、`template.md` 文件和 `presets/` 目录到 `com.layertool.panel_user_files` 目录，下次安装时会自动恢复。

### 方式二：手动安装

#### 1. 构建项目

```bash
npm install
npm run build
```

#### 2. 安装到 Photoshop

**Windows (PowerShell 管理员)**:
```powershell
New-Item -ItemType Junction `
  -Path "$env:APPDATA\Adobe\CEP\extensions\com.layertool.panel" `
  -Target (Get-Location)
```

**macOS**:
```bash
ln -s $(pwd) ~/Library/Application\ Support/Adobe/CEP/extensions/com.layertool.panel
```

**删除链接**（仅移除链接，不影响源目录内容）：

```powershell
# Windows（PowerShell）
cmd /c rmdir "$env:APPDATA\Adobe\CEP\extensions\com.layertool.panel"
```
```bash
# macOS
unlink ~/Library/Application\ Support/Adobe/CEP/extensions/com.layertool.panel
```

**查看链接状态**：

```powershell
# Windows（PowerShell）
Get-Item "$env:APPDATA\Adobe\CEP\extensions\com.layertool.panel" | Select-Object Attributes, LinkType, Target
```
```bash
# macOS
ls -la ~/Library/Application\ Support/Adobe/CEP/extensions/ | grep layertool
```

#### 3. 启用调试模式

**Windows (注册表)**:
```powershell
# CEP 9 (PS 2019)
New-Item -Path "HKCU:\Software\Adobe\CSXS.9" -Force
Set-ItemProperty -Path "HKCU:\Software\Adobe\CSXS.9" `
  -Name "PlayerDebugMode" -Value "1" -Type DWord

# CEP 10 (PS 2020-2021)
New-Item -Path "HKCU:\Software\Adobe\CSXS.10" -Force
Set-ItemProperty -Path "HKCU:\Software\Adobe\CSXS.10" `
  -Name "PlayerDebugMode" -Value "1" -Type DWord

# CEP 11 (PS 2022+)
New-Item -Path "HKCU:\Software\Adobe\CSXS.11" -Force
Set-ItemProperty -Path "HKCU:\Software\Adobe\CSXS.11" `
  -Name "PlayerDebugMode" -Value "1" -Type DWord
```

也可使用 `doc/csxs.reg/` 目录中的注册表文件直接导入。

**macOS**:
```bash
defaults write com.adobe.CSXS.9 PlayerDebugMode 1    # PS 2019
defaults write com.adobe.CSXS.10 PlayerDebugMode 1   # PS 2020-2021
defaults write com.adobe.CSXS.11 PlayerDebugMode 1   # PS 2022+
```

#### 4. 重启 Photoshop

在菜单中找到: **窗口 > 扩展功能 > 图层处理工具**

## 调试指南

### 面板侧调试 (Chromium DevTools)

1. **打开调试页面**：在 Chrome 浏览器中访问 `http://localhost:8088`
2. **查看控制台日志**：使用 `console.log` / `console.error`
3. **调试面板代码**：Chrome DevTools 中可看到 `bundle.js`，配合 Source Map 调试原始 TypeScript

### 宿主脚本调试

1. 使用 `$.writeln()` 输出日志（面板内置的调试面板也可查看通信日志）
2. 日志位置: `~/Library/Logs/Adobe/Photoshop/ScriptingListener.log` (macOS)

### 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| `CSInterface is not defined` | CSInterface.js 未加载 | 检查 `dist/lib/CSInterface.js` 是否存在 |
| `EvalScript error` | 宿主脚本语法错误 | 检查 `dist/jsx/hostscript.js` 语法 |
| 面板白屏 | HTML/JS 加载失败 | 检查浏览器控制台错误信息 |
| 宿主脚本不生效 | PS 缓存旧脚本 | 重启 Photoshop 或重新加载扩展 |
| 修改代码后不更新 | 未重新构建 | 运行 `npm run build` 后重启 PS |

## 新版本发布

### 方式一：GitHub Actions 自动发布（推荐）

```bash
# 1. 更新 package.json 版本号
npm version 1.0.2    # 自动修改 package.json 并创建 git tag

# 2. 推送代码和 tag
git push origin master --tags

# 3. 等待 GitHub Actions 自动构建并发布
# 查看构建状态：https://github.com/weienhua/ps-layer-tool/actions
```

GitHub Actions 会自动：
- 构建 Windows 和 macOS 安装程序
- 生成 zip 安装包
- 创建 GitHub Release 并上传所有文件

发布后记得编辑 Release 页面，添加更新说明：
```bash
gh release edit v1.0.2 --notes "更新内容说明"
```

### 方式二：手动发布

```bash
# 1. 更新版本号
npm version 1.0.2

# 2. 本地打包
npm run package

# 3. 推送代码和 tag
git push origin master --tags

# 4. 手动上传 installer/ 目录中的文件到 GitHub Release
```

### 版本号规范

遵循 [语义化版本](https://semver.org/lang/zh-CN/)：
- `1.0.0` → `1.0.1`：Bug 修复
- `1.0.0` → `1.1.0`：新功能
- `1.0.0` → `2.0.0`：重大更新

## 开发

### 构建命令

```bash
npm run build              # 完整构建（开发模式，显示调试面板）
npm run build:jsx          # 仅构建宿主脚本
npm run build:panel        # 仅构建面板（开发模式）
npm run build:panel:prod   # 面板生产模式构建
npm run dev                # 同时启动面板 + 宿主 watch
npm run dev:panel          # 仅面板 watch
npm run dev:jsx            # 仅宿主 watch
npm run clean              # 清理 dist 和 installer
npm run package            # 生产模式构建 + 打包发布文件（zip + 安装程序）到 installer/
```

### 打包说明

`npm run package` 会生成以下文件：

| 文件 | 说明 | 平台 |
|------|------|------|
| `com.layertool.panel-vX.X.X.zip` | 手动安装包 | 跨平台 |
| `com.layertool.panel-installer.exe` | Windows 自动安装程序 | Windows |
| `com.layertool.panel-installer-macos` | macOS 自动安装程序 | macOS |
| `com.layertool.panel-uninstaller.exe` | Windows 卸载程序 | Windows |
| `com.layertool.panel-uninstaller-macos` | macOS 卸载程序 | macOS |

**跨平台打包**：`pkg` 支持交叉编译，可在 macOS 上同时生成 Windows 和 macOS 安装程序。

### 模板变量参考

#### 图层信息 Tab（单图层模板）

| 变量 | 说明 |
|------|------|
| `{i}` | 图层序号（从0开始，按排序方式） |
| `{name}` | 图层名（去扩展名） |
| `{acname}` | 图层名（去`_数字`/`拷贝`后缀，如 `time_0 拷贝 2` → `time`，`dot 拷贝 11` → `dot`） |
| `{type}` | 图层类型（normal / smartObject / text） |
| `{x}`, `{y}` | 锚点坐标 |
| `{width}`, `{height}` | 图层宽高 |
| `{centerX}`, `{centerY}` | 图层中心点坐标 |
| `{rotation}` | 旋转角度（度） |
| `{path}` | 图层组路径 |
| `{text}` | 文字图层内容 |
| `{fontSize}` | 文字图层字号 |
| `{fontColor}` | 文字颜色 (#RRGGBB) |
| `{scaleAnim}` | 缩放动画表达式 |
| `{rotateAnim}` | 旋转动画表达式 |

**数学表达式**：支持对数字类型变量（`i`, `x`, `y`, `width`, `height`, `rotation`, `centerX`, `centerY`, `fontSize`）进行运算（`+` `-` `*` `/` `%` 和括号）。示例：`{i+1}`, `{width*2}`, `{(i+1)*100}`。字符串字段不可参与计算。

**支持的函数**：`round(x)`、`round(x,n)`、`ceil(x)`、`floor(x)`、`int(x)`、`abs(x)`、`min(a,b)`、`max(a,b)`、`rand()`、`pow(x,y)`、`sqrt(x)`。支持嵌套，如 `{int(rand()*10)}`、`{round(pow(2,0.5),3)}`。默认所有数值输出保留 2 位小数。

#### 模板输出 Tab（数组索引模板）

使用 `{变量名[索引]}` 语法，如 `{name[0]}`, `{x[1]}`。

| 变量 | 说明 |
|------|------|
| `{name[i]}` | 图层名 |
| `{acname[i]}` | 图层名（去`_数字`后缀） |
| `{type[i]}` | 图层类型 |
| `{x[i]}`, `{y[i]}` | 锚点坐标 |
| `{width[i]}`, `{height[i]}` | 图层宽高 |
| `{centerX[i]}`, `{centerY[i]}` | 中心点坐标 |
| `{rotation[i]}` | 旋转角度 |
| `{path[i]}` | 图层组路径 |
| `{text[i]}` | 文字内容 |
| `{fontSize[i]}` | 字体大小 |
| `{fontColor[i]}` | 字体颜色 |
| `{gapX[i]}`, `{gapY[i]}` | 与前一图层的锚点坐标间距（首个为 0） |

### 添加新功能

1. **宿主脚本** (`src/jsx/modules/`):
   ```typescript
   // 在对应模块文件中添加函数（如 modules/document.ts）
   export function myNewFunction(param: string): string {
     try {
       // PS ExtendScript 逻辑
       return JSON.stringify(result);
     } catch (e) {
       return "__ERROR__:" + e;
     }
   }
   // 在 hostscript.ts 中导入并注册
   import { myNewFunction } from "./modules/document";
   $.HostScript.myNewFunction = myNewFunction;
   ```

2. **桥接层** (`src/bridge.ts`):
   ```typescript
   async myNewFunction(param: string): Promise<PSResult<SomeType>> {
     const safe = this.escapeForSingleQuotedString(param);
     return this.evalScript<SomeType>(`$.HostScript.myNewFunction('${safe}')`);
   }
   ```

3. **Vue 组件** (`src/components/`):
   ```vue
   <script setup lang="ts">
   import { psBridge } from "../bridge";
   const result = await psBridge.myNewFunction('test');
   </script>
   ```

4. 重新构建: `npm run build`

## API 参考

### HostScript 函数

| 函数 | 说明 | 返回 |
|------|------|------|
| `getDocumentInfo()` | 获取文档名和尺寸 | `{ name, width, height }` |
| `getSelectedLayerName()` | 获取选中图层名 | `{ name }` |
| `getSelectedLayersInfo()` | 获取选中图层详细信息 | `{ document, layers[], skipped[] }` |
| `copyTextToClipboard(text)` | 复制文本到剪贴板 | `__OK__` |
| `getDocumentPath()` | 获取当前文档路径 | `{ path }` |
| `ensureDirectory(dirPath)` | 确保目录存在 | `__OK__` |
| `selectFolderDialog()` | 打开文件夹选择对话框 | `{ path }` 或 `__CANCEL__` |
| `saveHistoryState()` | 保存历史状态快照 | `{ name, index }` |
| `restoreHistoryState()` | 恢复历史状态 | `__OK__` |
| `collectLayersForExport(includeHidden)` | 收集选中图层导出信息 | `{ layers[], selectedGroupPaths[] }` |
| `collectAllLayersForExport(includeHidden)` | 收集全部图层导出信息 | `{ layers[] }` |
| `collectGroupLayersForExport(includeHidden)` | 收集组内子图层 | `{ layers[], selectedGroupPaths[] }` |
| `exportSingleLayer(id, path, format, groupPath, includeHidden, trimTransparent)` | 导出单个图层 | `{ name, x, y, w, h, filePath }` |
| `exportLayerInfoXML(path, json)` | 导出图层信息 XML | `__OK__` |
| `generateXMLTemplate(variableName, dataType, alignH, alignV, layersJson)` | 生成 XML 模板代码 | XML 字符串 |
| `readFile(filePath)` | 读取文件内容 | `{ content }` |
| `writeFile(filePath, content)` | 写入文件内容 | `__OK__` |
| `listFiles(dirPath)` | 列出目录下的文件 | `{ files[] }` |
| `getExtensionPath()` | 获取插件扩展目录路径 | `{ path }` |

### PSBridge 方法

| 方法 | 对应 HostScript 函数 |
|------|---------------------|
| `getDocumentInfo()` | `$.HostScript.getDocumentInfo()` |
| `getSelectedLayerName()` | `$.HostScript.getSelectedLayerName()` |
| `getSelectedLayersInfo()` | `$.HostScript.getSelectedLayersInfo()` |
| `copyText(text)` | `$.HostScript.copyTextToClipboard('...')` |
| `getDocumentPath()` | `$.HostScript.getDocumentPath()` |
| `ensureDirectory(dirPath)` | `$.HostScript.ensureDirectory('...')` |
| `selectFolderDialog()` | `$.HostScript.selectFolderDialog()` |
| `saveHistoryState()` | `$.HostScript.saveHistoryState()` |
| `restoreHistoryState()` | `$.HostScript.restoreHistoryState()` |
| `collectLayersForExport(includeHidden)` | `$.HostScript.collectLayersForExport(...)` |
| `collectAllLayersForExport(includeHidden)` | `$.HostScript.collectAllLayersForExport(...)` |
| `collectGroupLayersForExport(includeHidden)` | `$.HostScript.collectGroupLayersForExport(...)` |
| `exportSingleLayer(id, path, format, groupPath, includeHidden, trimTransparent)` | `$.HostScript.exportSingleLayer(...)` |
| `exportLayerInfoXML(path, json)` | `$.HostScript.exportLayerInfoXML(...)` |
| `generateXMLTemplate(variableName, dataType, alignH, alignV, layersJson)` | `$.HostScript.generateXMLTemplate(...)` |
| `readFile(filePath)` | `$.HostScript.readFile(...)` |
| `writeFile(filePath, content)` | `$.HostScript.writeFile(...)` |
| `listFiles(dirPath)` | `$.HostScript.listFiles(...)` |
| `getExtensionPath()` | `$.HostScript.getExtensionPath()` |

### LayerInfo 结构

```typescript
interface SelectedLayerInfo {
  id: number;           // 图层 ID
  name: string;         // 图层名称
  layerType: "normal" | "smartObject" | "text";
  order: number;        // 选择顺序
  x: number;            // 锚点 X 坐标
  y: number;            // 锚点 Y 坐标
  width: number;        // 宽度
  height: number;       // 高度
  centerX: number;      // 中心点 X
  centerY: number;      // 中心点 Y
  rotation: number;     // 旋转角度
  text: TextLayerInfo | null;  // 文字信息
  path: string;         // 图层组路径
}
```

## 发布新版本

使用 `npm run release` 自动管理版本号：

```bash
npm run release patch   # 1.0.1 → 1.0.2（bug 修复）
npm run release minor   # 1.0.1 → 1.1.0（新功能）
npm run release major   # 1.0.1 → 2.0.0（破坏性变更）
npm run release 1.2.3   # 直接指定版本号
```

命令会自动：
1. 更新 `package.json` 和使用文档中的版本号
2. 构建项目并生成安装包（zip + exe）
3. 提交代码并创建 git tag
4. 推送到 GitHub，触发 Actions 自动发布

## 许可证

MIT
