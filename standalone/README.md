# 工具箱独立子域名迁移

状态：独立源码已准备并完成本地验证，GitHub Pages 设置及 Cloudflare DNS 尚未完成。

已确认继续使用 `nofeetbird.tech`。

| 工具 | 原入口 | 新入口 | 计划 GitHub 仓库 |
| --- | --- | --- | --- |
| JSON 编辑器 | https://tools.nofeetbird.tech/json/ | https://json.nofeetbird.tech/ | nofeetbird0321/json-editor |
| 本地 SQL 格式化 | https://tools.nofeetbird.tech/sql/ | https://sql.nofeetbird.tech/ | nofeetbird0321/sql-formatter |
| AI SQL 格式化 | https://tools.nofeetbird.tech/sql-ai/ | https://sql-ai.nofeetbird.tech/ | nofeetbird0321/sql-ai-formatter |
| 网站收益计算器 | https://tools.nofeetbird.tech/site-math-lab/ | https://math.nofeetbird.tech/ | nofeetbird0321/site-math-lab |
| 少喝一杯 | https://tools.nofeetbird.tech/milktea/ | https://tea.nofeetbird.tech/ | nofeetbird0321/milktea |

各目录就是独立站点的根目录，包含 CNAME、.nojekyll、robots.txt 与 sitemap.xml。AI SQL 已带上自己的 tool.css，并修复指向本地 SQL 站点的导航；本地 SQL 的反向链接也已更新。新入口尚未确认可访问，表格表示迁移目标。

每个仓库需要在 Settings → Pages 中选择 Deploy from a branch → main → /(root)，保存，并核对 Custom domain 为对应的子域名。Cloudflare 的 nofeetbird.tech 区域需新增以下记录，保留现有 tools 记录：

| 类型 | 名称 | 目标 | 代理 | TTL |
| --- | --- | --- | --- | --- |
| CNAME | json | nofeetbird0321.github.io | DNS only | Auto |
| CNAME | sql | nofeetbird0321.github.io | DNS only | Auto |
| CNAME | sql-ai | nofeetbird0321.github.io | DNS only | Auto |
| CNAME | math | nofeetbird0321.github.io | DNS only | Auto |
| CNAME | tea | nofeetbird0321.github.io | DNS only | Auto |

待 Pages DNS 检查与证书签发完成后启用 Enforce HTTPS，并分别验证 HTTPS、实际页面内容和资源响应。只有完成验证后才将工具箱首页入口切换到新站点。旧页面保留，不强制跳转。

## 浏览器数据迁移

不同子域名使用独立的浏览器存储。奶茶账本应先在旧地址导出 JSON，再到新地址导入；旧记录不删除。新账本内已加入旧地址入口和说明。迁移测试使用模拟记录，已验证年度合计、导入后的持久化与旧记录保留。

AI SQL 的 DeepSeek API Key 和模型设置不会自动跨域迁移，需在新地址重新填写。源码不包含用户的 Key，本次没有读取或导出浏览器中的真实 Key。JSON 编辑器与收益计算器没有发现 localStorage 存储；收益计算器带参数的分享链接可保留查询参数并改用新域名。

## 验证

`verification.json` 记录五个页面的本地资源、canonical 与 JavaScript 错误检查；本地 SQL 的 Python WebAssembly 格式化已执行成功，AI SQL 只检查无 Key 时的提示，不调用付费 API。截图用于预览，不能证明独立域名已上线。

原源码来源：nofeetbird0321/tools 的 gh-pages 提交 `0c64cfc52dd31c5623374338419e236479428d2e`。原工具箱保持不变。
