# AGENTS.md

## 构建命令

```bash
npm run build              # 完整构建 (build:jsx → build:panel)
npm run build:jsx          # 仅编译宿主脚本 (webpack --config webpack.config.jsx.js)
npm run build:panel        # 仅构建面板 (webpack --mode=production)
npm run dev                # 同时启动面板 + 宿主 watch（concurrently）
npm run dev:panel          # 仅面板 watch 模式
npm run dev:jsx            # 仅宿主 watch 模式
npm run clean              # rimraf dist
```

## 项目架构

**面板(Chromium) 与 PS 宿主(ExtendScript) 完全隔离**，通过 `evalScript` 字符串通信。

- 面板侧: `src/index.ts` + `src/bridge.ts`
- 宿主侧: `src/jsx/hostscript.ts` → webpack(ts-loader, target: ES3) → `dist/jsx/hostscript.js`
- 宿主工具库: `src/jsx/ps-api/`（photoshop-script-api，vendored），使用 `Document`、`Layer`、`History`、`Utils`
- 类型: `src/types/cep-panel.d.ts`（面板）/ `ps-extendscript-types`（宿主）
- 内置预设: `src/lib/presets.txt`（7 条模板）
- 样式: `src/style.css`（暗色主题）

## 宿主脚本约定 (关键)

所有函数必须是**全局函数**（挂在 `$.HostScript`），返回值只能是**字符串**：

- 正常 → 返回 JSON 字符串
- 无文档 → `"__NO_DOCUMENT__"`
- 操作成功 → `"__OK__"`
- 用户取消 → `"__CANCEL__"`
- 错误 → `"__ERROR__:<message>"`

```typescript
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

## 面板通信约定 (关键)

所有 PS 通信必须经过 `PSBridge`，禁止在 `index.ts` 中直接调用 `CSInterface`。

`parseResult` 自动处理返回值：`__ERROR__:` → 错误、`__NO_DOCUMENT__` → 无文档、`__OK__` → 空成功、`__CANCEL__` → 取消、JSON/其他 → 数据。`evalScript` 有 10 秒超时保护。

## 预设系统

模板变量: `{name}`, `{type}`, `{x}`, `{y}`, `{width}`, `{height}`, `{centerX}`, `{centerY}`, `{rotation}`, `{path}`, `{text}`, `{fontSize}`, `{fontColor}`, `{scaleAnim}`, `{rotateAnim}`

动画表达式支持: `#loop` 变量、`sin`/`cos`/`abs`/`round` 函数、基本算术运算。

用户预设存储在 `localStorage`（key: `layerTool.presets.v1`），支持拖拽排序。

## 面板 UI

面板分三个 Tab：**图层信息**（预设配置 + 图层信息提取）、**图层处理**（图层导出）、**XML 模板**（锁屏主题 XML 代码生成）。

导出功能支持：选中图层/选中图层组/全部图层，PNG/JPG/BMP 格式，可选保留文件夹层级和导出 XML。

XML 模板功能支持三种数据类型（百分比/温度/步数），根据图层位置自动计算偏移量生成 `lt()`/`ge()` 条件表达式。温度类型自动处理符号位对齐反转。

## 添加新功能步骤

1. `src/jsx/hostscript.ts` 添加全局函数并在 `$.HostScript` 注册 (ES3 兼容)
2. `src/bridge.ts` 暴露异步方法
3. `src/index.ts` 添加 UI 交互
4. `src/index.html` 添加元素
5. `npm run build`

## 调试

- 面板: `http://localhost:8088` → Chrome DevTools → console.log
- 宿主: `$.writeln()` → PS 脚本日志
- 面板内: 可收起的调试面板（通信日志实时查看器，含耗时显示）

## 常见问题

| 问题 | 原因 |
|------|------|
| `CSInterface is not defined` | `dist/lib/CSInterface.js` 缺失 |
| `EvalScript error` | 宿主脚本语法错误或未编译 |
| JSX 修改不生效 | PS 缓存旧脚本，需重启 PS |

## 更多信息

详细架构说明见 `CLAUDE.md`。