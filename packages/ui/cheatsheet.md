## 安装与覆盖

```bash

# 更新覆盖已经安装的组件
ls ./src/components | sed 's/.tsx//' | xargs npx shadcn@latest add -o
```