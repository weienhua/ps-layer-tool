# AGENTS.md

## 构建命令

```bash
npm run build       # 完整构建 (webpack + tsc)
npm run build:jsx # 仅编译宿主脚本
npm run dev       # 面板 watch 模式
npm run clean     # 清理 dist/
```

## 项目架构

**面板(Chromium) 与 PS 宿主(ExtendScript) 完全隔离**，通过 `evalScript` 字符串通信。

- 面板侧: `src/index.ts` + `src/bridge.ts`
- 宿主侧: `src/jsx/hostscript.ts` → 编译为 `dist/jsx/hostscript.js`

## 宿主脚本约定 (关键)

所有函数必须是**全局函数**，返回值只能是**字符串**：

- 正常 → 返回 JSON 字符串
- 无文档 → `"__NO_DOCUMENT__"`
- 错误 → `"__ERROR__:<message>"` 或 `"__OK__"`

## 添加新功能步骤

1. `src/jsx/hostscript.ts` 添加全局函数 (ES3 兼容)
2. `src/bridge.ts` 暴露异步方法
3. `src/index.ts` 添加 UI 交互
4. `src/index.html` 添加元素
5. `npm run build`

## 调试

- 面板: `http://localhost:8088` → Chrome DevTools → console.log
- 宿主: `$.writeln()` → PS 脚本日志

## 常见问题

| 问题 | 原因 |
|------|------|
| `CSInterface is not defined` | `dist/lib/CSInterface.js` 缺失 |
| `EvalScript error` | 宿主脚本语法错误或未编译 |
| JSX 修改不生效 | PS 缓存旧脚本，需重启 PS |

## 更多信息

详细架构说明见 `CLAUDE.md`。