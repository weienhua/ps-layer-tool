---
name: git-push
description: "Git 提交推送工具。自动分析代码变化，生成 commit 消息，提交并推送到 GitHub。"
---

# Git Push Skill

自动分析代码变化并推送到 GitHub。

## 使用方法

当用户请求上传代码到 GitHub 时，执行以下步骤：

### 步骤 1: 检查 Git 状态

```bash
git status
git diff --stat
```

### 步骤 2: 分析变化

根据变更文件判断 commit 类型：
- `src/jsx/` 下的 TypeScript 文件 → feat 或 fix
- `src/index.ts` → feat/fix/refactor
- `src/style.css` → style
- `src/index.html` → feat/fix
- `*.md` → docs
- `package.json` / `webpack.config.*` → chore

### 步骤 3: 生成 Commit 消息

使用 Conventional Commits 格式：
- `<type>: <中文描述>`
- 描述简洁明了，概括主要变化

### 步骤 4: 执行提交

```bash
git add -A
git commit -m "<生成的commit消息>"
git push origin <当前分支>
```

### 步骤 5: 输出结果

显示：
- Commit hash
- 推送的分支
- GitHub 链接

## 注意事项

- 如果用户提供了自定义消息，使用用户的消息
- 推送前检查是否有未解决的冲突
- 如果推送失败，提示用户检查网络或权限
