# 领域文档

工程技能在探索代码库时，应如何消费本仓库的领域文档。

## 探索前先阅读

- **仓库根目录的 `CONTEXT.md`**，或者
- **仓库根目录的 `CONTEXT-MAP.md`**（如果存在）— 它指向每个上下文的 `CONTEXT.md`。阅读与当前主题相关的每一个。
- **`docs/adr/`** — 阅读与当前工作领域相关的 ADR。多上下文仓库中，还需检查 `src/<context>/docs/adr/` 中上下文级别的决策。

如果这些文件都不存在，**静默继续**。不要标记它们的缺失，也不要建议提前创建。`/domain-modeling` 技能（通过 `/grill-with-docs` 和 `/improve-codebase-architecture` 触发）会在概念或决策实际明确时延迟创建这些文件。

## 文件结构

单上下文仓库（大多数仓库）：

```
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-event-sourced-orders.md
│   └── 0002-postgres-for-write-model.md
└── src/
```

多上下文仓库（根目录存在 `CONTEXT-MAP.md`）：

```
/
├── CONTEXT-MAP.md
├── docs/adr/                          ← 系统级决策
└── src/
    ├── ordering/
    │   ├── CONTEXT.md
    │   └── docs/adr/                  ← 上下文级决策
    └── billing/
        ├── CONTEXT.md
        └── docs/adr/
```

## 使用术语表词汇

当你的输出涉及领域概念时（issue 标题、重构建议、假设、测试名称等），使用 `CONTEXT.md` 中定义的术语。不要偏离到术语表明确避免的同义词。

如果你需要的概念尚不在术语表中，这是一个信号 — 要么你在发明项目不使用的语言（重新考虑），要么确实存在空白（记录下来供 `/domain-modeling` 使用）。

## 标记 ADR 冲突

如果你的输出与现有 ADR 矛盾，请明确指出，而非默默覆盖：

> _与 ADR-0007（事件溯源订单）矛盾 — 但值得重新讨论，因为…_
