# 图层处理工具 - Photoshop CEP 插件

基于 [photoshop-script-api](https://github.com/emptykid/photoshop-script-api) 的 Photoshop CEP 面板插件，提供预设驱动的图层信息提取与格式化导出功能。

## 功能特性

### 图层信息提取
- **图层信息提取**：获取选中图层的坐标、尺寸、中心点、旋转角度、文字内容、字体大小、颜色等
- **预设模板系统**：7 条内置输出模板（坐标、XML、动画等），支持用户自定义和保存预设
- **格式化输出**：基于模板变量（`{x}`, `{y}`, `{width}`, `{name}` 等）将图层信息格式化为文本
- **排序方式**：按 X 升序 / Y 升序 / PS 图层顺序
- **锚点选择**：3×3 网格可视化锚点选择器（左上、中上、右上、左中、中心、右中、左下、中下、右下）
- **动画表达式**：支持 `#loop`、`sin`、`cos` 等数学函数的动态表达式输入
- **预设管理**：localStorage 持久化存储，支持拖拽排序和删除
- **一键复制**：格式化结果一键复制到系统剪贴板

### 图层导出
- **多种导出模式**：导出选中图层 / 选中图层组 / 全部图层
- **多格式支持**：PNG、JPG、BMP
- **文件夹层级**：可选保留 PS 图层组目录结构
- **XML 导出**：可选导出图层信息 XML（manifest.xml）
- **非破坏性导出**：自动保存/恢复历史状态，不影响文档
- **进度显示**：实时导出进度和结果列表

### 其他
- **Toast 提示**：操作反馈动画提示
- **调试面板**：内置可收起的通信日志查看器（含耗时显示）

## 技术栈

- **面板侧**: TypeScript + webpack → ES6
- **宿主侧**: TypeScript + photoshop-script-api + webpack → ES3 (ExtendScript)
- **通信**: CEP `evalScript` 桥接
- **CEP 版本**: 10.0+
- **兼容 Photoshop**: 2021 (v22.0) 及以上

## 项目结构

```
├── CSXS/
│   └── manifest.xml          # CEP 扩展清单
├── src/
│   ├── jsx/
│   │   ├── hostscript.ts     # 宿主脚本入口
│   │   └── ps-api/           # photoshop-script-api 源代码（vendored）
│   ├── lib/
│   │   ├── CSInterface.js    # Adobe 官方 CEP 库（v10.0.0）
│   │   └── presets.txt       # 内置模板预设（7 条）
│   ├── types/
│   │   └── cep-panel.d.ts    # CEP 面板类型声明
│   ├── bridge.ts             # PS 通信桥接层
│   ├── index.ts              # 面板 UI 控制器
│   ├── index.html            # 面板 HTML 模板
│   └── style.css             # 面板样式（暗色主题）
├── doc/
│   ├── Windows.png           # Windows 安装示意图
│   └── csxs.reg/             # Windows 注册表文件（调试模式）
├── test.jsx                  # 遗留 ExtendScript 测试脚本
├── dist/                     # 构建产物
├── webpack.config.js         # 面板 webpack 配置
├── webpack.config.jsx.js     # 宿主脚本 webpack 配置
└── package.json
```

## 安装

### 1. 构建项目

```bash
npm install
npm run build
```

### 2. 安装到 Photoshop

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

### 3. 启用调试模式

**Windows (注册表)**:
```powershell
# CEP 10 (PS 2021)
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
defaults write com.adobe.CSXS.10 PlayerDebugMode 1   # PS 2021
defaults write com.adobe.CSXS.11 PlayerDebugMode 1   # PS 2022+
```

### 4. 重启 Photoshop

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

## 开发

### 构建命令

```bash
npm run build              # 完整构建（宿主脚本 + 面板）
npm run build:jsx          # 仅构建宿主脚本
npm run build:jsx:debug    # 宿主脚本开发模式（带 source-map）
npm run build:panel        # 仅构建面板
npm run build:panel:debug  # 面板开发模式（带 source-map）
npm run dev                # 同时启动面板 + 宿主 watch
npm run dev:panel          # 仅面板 watch
npm run dev:jsx            # 仅宿主 watch
npm run clean              # 清理 dist
```

### 模板变量参考

| 变量 | 说明 |
|------|------|
| `{name}` | 图层名（去扩展名） |
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

### 添加新功能

1. **宿主脚本** (`src/jsx/hostscript.ts`):
   ```typescript
   // 添加全局函数
   function myNewFunction(param: string): string {
     try {
       // PS ExtendScript 逻辑
       return JSON.stringify(result);
     } catch (e) {
       return "__ERROR__:" + e;
     }
   }
   // 在底部注册
   $.HostScript.myNewFunction = myNewFunction;
   ```

2. **桥接层** (`src/bridge.ts`):
   ```typescript
   async myNewFunction(param: string): Promise<PSResult<SomeType>> {
     const safe = this.escapeForSingleQuotedString(param);
     return this.evalScript<SomeType>(`$.HostScript.myNewFunction('${safe}')`);
   }
   ```

3. **UI 层** (`src/index.ts`):
   ```typescript
   const result = await psBridge.myNewFunction('test');
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
| `exportSingleLayer(id, path, format, groupPath, includeHidden)` | 导出单个图层 | `{ name, x, y, w, h, filePath }` |
| `exportLayerInfoXML(path, json)` | 导出图层信息 XML | `__OK__` |

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
| `exportSingleLayer(id, path, format, groupPath, includeHidden)` | `$.HostScript.exportSingleLayer(...)` |
| `exportLayerInfoXML(path, json)` | `$.HostScript.exportLayerInfoXML(...)` |

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

## 许可证

MIT
