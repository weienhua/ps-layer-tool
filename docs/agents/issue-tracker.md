# Issue tracker: GitHub

本仓库的 issue 和 PRD 使用 GitHub Issues 管理。所有操作通过 `gh` CLI 完成。

## 常用命令

- **创建 issue**：`gh issue create --title "..." --body "..."`。多行正文使用 heredoc。
- **查看 issue**：`gh issue view <number> --comments`，可通过 `jq` 过滤评论和标签。
- **列出 issue**：`gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'`，配合 `--label` 和 `--state` 过滤。
- **评论 issue**：`gh issue comment <number> --body "..."`
- **添加/移除标签**：`gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **关闭 issue**：`gh issue close <number> --comment "..."`

仓库信息通过 `git remote -v` 推断 — `gh` 在 clone 仓库内自动识别。

## PR 作为分诊入口

**PR 作为需求入口：否。**（如果本仓库将外部 PR 视为功能需求，可改为"是"；`/triage` 会读取此标志。）

设为"是"时，PR 使用与 issue 相同的标签和状态流程，`gh pr` 对应命令：

- **查看 PR**：`gh pr view <number> --comments`，`gh pr diff <number>` 查看 diff。
- **列出待分诊的外部 PR**：`gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments`，仅保留 `authorAssociation` 为 `CONTRIBUTOR`、`FIRST_TIME_CONTRIBUTOR` 或 `NONE` 的 PR（排除 `OWNER`/`MEMBER`/`COLLABORATOR`）。
- **评论 / 标签 / 关闭**：`gh pr comment`、`gh pr edit --add-label`/`--remove-label`、`gh pr close`。

GitHub 中 issue 和 PR 共用编号空间，裸 `#42` 可能是 issue 也可能是 PR — 先用 `gh pr view 42` 尝试，失败则回退到 `gh issue view 42`。

## 当技能说"发布到 issue tracker"

创建 GitHub issue。

## 当技能说"获取相关工单"

执行 `gh issue view <number> --comments`。

## 寻路操作

供 `/wayfinder` 使用。**地图**是一个带有**子** issue 工单的 issue。

- **地图**：一个标记 `wayfinder:map` 的 issue，正文包含 Notes / Decisions-so-far / Fog。`gh issue create --label wayfinder:map`。
- **子工单**：通过 GitHub sub-issue 链接到地图的 issue（使用 `gh api` 操作 sub-issues 端点）。若 sub-issues 不可用，将子工单添加到地图正文的任务列表中，并在子工单正文顶部标注 `Part of #<map>`。标签：`wayfinder:<type>`（`research`/`prototype`/`grilling`/`task`）。领取后指派给负责开发者。
- **阻塞**：GitHub 原生 issue 依赖 — 规范且 UI 可见的表示方式。使用 `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>` 添加依赖边，其中 `<blocker-db-id>` 是阻塞 issue 的数字 **database id**（`gh api repos/<owner>/<repo>/issues/<n> --jq .id`，非 `#number` 或 `node_id`）。GitHub 报告 `issue_dependencies_summary.blocked_by`（仅开放阻塞项 — 实时检查）。若依赖不可用，回退到子工单正文顶部添加 `Blocked by: #<n>, #<n>`。所有阻塞项关闭后工单解除阻塞。
- **前沿查询**：列出地图的开放子工单（`gh issue list --state open`，限定到地图的 sub-issues / 任务列表），排除有开放阻塞项的（`issue_dependencies_summary.blocked_by > 0`，或 `Blocked by` 行中有开放 issue）或已有指派者的；按地图顺序取第一个。
- **领取**：`gh issue edit <n> --add-assignee @me` — 会话的首次写操作。
- **解决**：`gh issue comment <n> --body "<answer>"`，然后 `gh issue close <n>`，最后将上下文指针（gist + 链接）追加到地图的 Decisions-so-far。
