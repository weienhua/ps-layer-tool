---
name: handoff
description: 将当前会话压缩为交接文档，供下一个 agent 继续工作。
argument-hint: "下一个 session 要做什么？"
disable-model-invocation: true
---

在 `handoffs/` 目录中写入交接文档，命名格式 `YYYY-MM-DD-<简短描述>.md`。

新 session 开始时，先从 `handoffs/` 目录按日期排序读取最新交接文档，了解上次会话的上下文。

文档结构遵循 `handoffs/TEMPLATE.md` 模板，在此基础上增加：
- "建议技能"节 — 建议下一个 agent 应加载的 skill
- 引用已有产物（spec、plan、ADR、issue）时使用路径或 URL，不重复内容

脱敏处理：移除 API key、密码等敏感信息。

如果用户传入了参数，将其作为下一个 session 的工作重点描述。
