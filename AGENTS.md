# AGENTS.md

## 兼容性

- **Photoshop 版本**: 2019 (v20.0) 及以上
- **CEP 版本**: 9.0+
- **CSInterface.js**: v9.4.0

## 构建命令

```bash
npm run build              # 完整构建（开发模式，显示调试面板）
npm run build:jsx          # 仅编译宿主脚本 (webpack --config webpack.config.jsx.js)
npm run build:panel        # 仅构建面板（开发模式）
npm run dev                # 同时启动面板 + 宿主 watch（concurrently）
npm run dev:panel          # 仅面板 watch 模式
npm run dev:jsx            # 仅宿主 watch 模式
npm run clean              # rimraf dist installer
npm run package            # 生产模式构建 + 打包发布文件（zip + 安装程序）到 installer/
```

## 项目架构

**面板(Chromium) 与 PS 宿主(ExtendScript) 完全隔离**，通过 `evalScript` 字符串通信。

- 面板侧: Vue 3 SFC 组件化架构
  - 入口: `src/main.ts` → `src/App.vue`
  - 组件: `src/components/*.vue`（15 个 SFC 组件，`<script setup lang="ts">`）
  - 组合式函数: `src/composables/*.ts`（usePreset, useToast）
  - 共享类型: `src/types/index.ts`（AnchorType, SortType, TabId, PresetCardData）
  - 工具函数: `src/utils.ts`（MathExpr, 模板引擎, 锚点计算）
- 宿主侧: `src/jsx/hostscript.ts` → webpack(ts-loader, target: ES3) → `dist/jsx/hostscript.js`
- 宿主工具库: `src/jsx/ps-api/`（photoshop-script-api，vendored），使用 `Document`、`Layer`、`History`、`Utils`
- 类型: `src/types/cep-panel.d.ts`（面板）/ `ps-extendscript-types`（宿主）
- 内置预设: `src/lib/presets.md`（7 条模板，图层信息 Tab）
- 模板输出预设: `src/lib/template.md`（数组索引语法模板，模板输出 Tab）
- 样式: `src/style.css`（全局基础样式）+ 各 `.vue` 组件 `<style scoped>`

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
  generateXMLTemplate,
  readFile,
  writeFile,
  listFiles,
  getExtensionPath
};
```

## 面板通信约定 (关键)

所有 PS 通信必须经过 `PSBridge`，禁止在 `index.ts` 中直接调用 `CSInterface`。

`parseResult` 自动处理返回值：`__ERROR__:` → 错误、`__NO_DOCUMENT__` → 无文档、`__OK__` → 空成功、`__CANCEL__` → 取消、JSON/其他 → 数据。`evalScript` 有 10 秒超时保护。

## Vue 组件约定

- 使用 `<script setup lang="ts">` 组合式 API
- 共享类型从 `src/types/index.ts` 导入，不从 `.vue` 文件导出类型
- 组件样式使用 `<style scoped>`，全局基础样式在 `style.css`
- 通过 `provide/inject` 传递 Toast 方法
- 预设管理使用 `usePreset` composable
- 模板中避免使用反引号模板字符串（与 Vue 模板 `{{ }}` 冲突），用字符串拼接代替

## 预设系统

**图层信息 Tab 模板变量**: `{i}`, `{name}`, `{acname}`, `{type}`, `{x}`, `{y}`, `{width}`, `{height}`, `{centerX}`, `{centerY}`, `{rotation}`, `{path}`, `{text}`, `{fontSize}`, `{fontColor}`, `{scaleAnim}`, `{rotateAnim}`

**模板输出 Tab 模板变量**（数组索引语法 `{name[i]}`）: `{name[i]}`, `{acname[i]}`, `{type[i]}`, `{x[i]}`, `{y[i]}`, `{width[i]}`, `{height[i]}`, `{centerX[i]}`, `{centerY[i]}`, `{rotation[i]}`, `{path[i]}`, `{text[i]}`, `{fontSize[i]}`, `{fontColor[i]}`, `{gapX[i]}`, `{gapY[i]}`

**数学表达式**: 模板中支持对数字类型变量进行数学运算（`+` `-` `*` `/` `%` 和括号）。可用字段：`i`, `x`, `y`, `width`, `height`, `rotation`, `centerX`, `centerY`, `fontSize`。示例：`{i+1}`, `{width*2}`, `{(i+1)*100}`。字符串字段不可参与计算。内部实现：`MathExpr` 递归下降解析器。

**支持的函数**: `round(x)`, `round(x,n)`, `ceil(x)`, `floor(x)`, `int(x)`, `abs(x)`, `min(a,b)`, `max(a,b)`, `rand()`, `pow(x,y)`, `sqrt(x)`。支持嵌套，如 `{int(rand()*10)}`。默认数值输出保留 2 位小数。

动画表达式支持: `#loop` 变量、`sin`/`cos`/`abs`/`round` 函数、基本算术运算。

**预设持久化存储**（本地文件 + localStorage 双重备份）:
- 图层信息: `dist/lib/presets/tab1/default.json` + `layerTool.presets.v1`
- 模板输出: `dist/lib/presets/tab2/default.json` + `layerTool.templateOutputPresets.v1`
- XML 模板配置: `dist/lib/presets/tab4/default.json` + `layerTool.xmlConfig.v1`
- 折叠面板状态: `layerTool.hintStates.v1`（仅 localStorage）

加载优先级：本地文件 > localStorage > 默认值。安装/卸载脚本自动备份和恢复 `dist/lib/presets/` 目录。

均支持拖拽排序。

## 面板 UI

面板分四个 Tab：**图层信息**（预设配置 + 图层信息提取）、**模板输出**（数组索引语法模板 + 图层信息格式化）、**图层处理**（图层导出）、**XML 模板**（锁屏主题 XML 代码生成）。

导出功能支持：选中图层/选中图层组/全部图层，PNG/JPG/BMP 格式，可选保留文件夹层级和导出 XML。

XML 模板功能支持三种数据类型（百分比/温度/步数），根据图层位置自动计算偏移量生成 `lt()`/`ge()` 条件表达式。温度类型自动处理符号位对齐反转。支持输出 rotation 属性（默认勾选，仅 rotation ≠ 0 时输出）。内置常用变量管理，支持自定义变量（自定义 Modal 弹窗，支持 ESC/遮罩关闭和表单验证）。

## 添加新功能步骤

1. `src/jsx/hostscript.ts` 添加全局函数并在 `$.HostScript` 注册 (ES3 兼容)
2. `src/bridge.ts` 暴露异步方法
3. `src/components/` 创建或修改 Vue 组件
4. 如需新的共享类型，添加到 `src/types/index.ts`
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