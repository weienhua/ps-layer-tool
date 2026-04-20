# 图层处理工具 - Photoshop CEP 插件

基于 [photoshop-script-api](https://github.com/emptykid/photoshop-script-api) 的 Photoshop CEP 面板插件，提供图层管理功能。

## 功能特性

- 查看当前文档信息和图层列表
- 选中、创建、删除、重命名图层
- 切换图层可见性
- 导出文档为 Web 格式
- 调整画布大小

## 技术栈

- **面板侧**: TypeScript + webpack → ES6
- **宿主侧**: TypeScript + photoshop-script-api + webpack → ES3 (ExtendScript) + `extendscript-es5-shim` (部分 ES5 API 兼容)
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
│   │   └── ps-api/           # photoshop-script-api 源代码
│   ├── types/
│   │   └── cep-panel.d.ts    # CEP 面板类型声明
│   ├── bridge.ts             # PS 通信桥接层
│   ├── index.ts              # 面板 UI 控制器
│   ├── index.html            # 面板 HTML 模板
│   └── style.css             # 面板样式
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

**macOS**:
```bash
defaults write com.adobe.CSXS.10 PlayerDebugMode 1   # PS 2021
defaults write com.adobe.CSXS.11 PlayerDebugMode 1   # PS 2022+
```

### 4. 重启 Photoshop

在菜单中找到: **窗口 > 扩展功能 > 图层处理工具**

## 调试指南

### 面板侧调试 (Chromium DevTools)

1. **打开调试页面**
   - 在 Chrome 浏览器中访问: `http://localhost:8088`
   - 或使用 CEFClient 工具

2. **查看控制台日志**
   ```typescript
   // 在 index.ts 中使用
   console.log('调试信息', data);
   console.error('错误信息', err);
   ```

3. **调试面板代码**
   - Chrome DevTools 中可以看到 `bundle.js`
   - 使用 Source Map 调试原始 TypeScript 代码

### 宿主脚本调试

1. **ExtendScript Toolkit** (已废弃，但仍可用)
   - 打开 ESTK，连接 Photoshop
   - 选择 `dist/jsx/hostscript.js` 进行调试

2. **日志输出**
   ```typescript
   // 在 hostscript.ts 中使用
   $.writeln('日志信息: ' + JSON.stringify(data));
   ```
   - 查看位置: `~/Library/Logs/Adobe/Photoshop/ScriptingListener.log` (macOS)
   - 或 Photoshop 的 `window.console`

3. **错误处理**
   ```typescript
   try {
     // 操作代码
   } catch (e) {
     return "__ERROR__:" + e.toString();
   }
   ```

### 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| `CSInterface is not defined` | CSInterface.js 未加载 | 检查 `dist/lib/CSInterface.js` 是否存在 |
| `EvalScript error` | 宿主脚本语法错误 | 检查 `dist/jsx/hostscript.js` 语法 |
| 面板白屏 | HTML/JS 加载失败 | 检查浏览器控制台错误信息 |
| 宿主脚本不生效 | PS 缓存旧脚本 | 重启 Photoshop 或重新加载扩展 |
| 修改代码后不更新 | 未重新构建 | 运行 `npm run build` 后重启 PS |

## 开发

### 宿主脚本兼容性（ES3 + shim）

- 宿主构建目标仍是 ES3（见 `tsconfig.jsx.json` 与 `webpack.config.jsx.js`）。
- `src/jsx/hostscript.ts` 已引入 `extendscript-es5-shim`，可放宽部分 ES5 API 限制。
- 这不等于完整 ES5+ 运行时，Photoshop ExtendScript 的宿主限制仍然存在。
- 建议优先使用保守写法，并对不确定 API 增加 `try/catch` 与兜底返回。

### 构建命令

```bash
npm run build              # 完整构建
npm run build:jsx          # 仅编译宿主脚本
npm run build:panel        # 仅构建面板
npm run dev                # 面板开发模式 (watch)
npm run clean              # 清理 dist
```

### 添加新功能

1. **宿主脚本** (`src/jsx/hostscript.ts`):
   ```typescript
   export default {
     // 添加新方法
     myNewFunction(arg: string): string {
       try {
         // 使用 photoshop-script-api
         const doc = Document.activeDocument();
         // ... 操作
         return JSON.stringify(result);
       } catch (e) {
         return "__ERROR__:" + e;
       }
     }
   }
   ```

2. **桥接层** (`src/bridge.ts`):
   ```typescript
   async myNewFunction(arg: string): Promise<PSResult<SomeType>> {
     return this.evalScript<SomeType>(`HostScript.myNewFunction("${arg}")`);
   }
   ```

3. **UI 层** (`src/index.ts`):
   ```typescript
   // 调用新方法
   const result = await psBridge.myNewFunction('test');
   ```

4. 重新构建: `npm run build`

## API 参考

### Document API

- `getDocumentInfo()` - 获取文档信息 (名称、尺寸、分辨率)
- `saveDocument()` - 保存文档
- `resizeCanvas(width, height)` - 调整画布大小
- `exportToWeb(path, filename)` - 导出为 Web 格式

### Layer API

- `getAllLayers()` - 获取所有图层
- `getSelectedLayers()` - 获取选中的图层
- `selectLayerById(id)` - 通过 ID 选中图层
- `selectLayerByName(name)` - 通过名称选中图层
- `createNewLayer()` - 创建新图层
- `deleteLayerById(id)` - 删除图层
- `setLayerName(id, name)` - 设置图层名称
- `toggleLayerVisibility(id, show)` - 切换图层可见性

## 许可证

MIT
