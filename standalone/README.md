# 工具箱独立子域名迁移

状态：五个独立 GitHub 仓库均已上传源码、开启 Pages，最新构建全部成功。五条 Cloudflare DNS-only CNAME 已通过原有 OAuth 连接创建。2026-10-07 的实测确认：五个子域名 DNS 正确，HTTP 首页和所有本地静态资源均返回 200，内容与准备好的源码一致。HTTPS 证书尚未签发，暂未启用 Enforce HTTPS，工具箱首页入口尚未切换。

拆分源码：https://github.com/nofeetbird0321/tools/tree/split-tool-subdomains/standalone

奶茶构建：https://github.com/nofeetbird0321/milktea/actions/runs/37504187471

JSON 仓库：https://github.com/nofeetbird0321/json-editor

JSON 构建：https://github.com/nofeetbird0321/json-editor/actions/runs/37505001979

已确认继续使用 `nofeetbird.tech`。

| 工具 | 原入口 | 新入口 | GitHub 仓库 |
| --- | --- | --- | --- |
| JSON 编辑器 | https://tools.nofeetbird.tech/json/ | https://json.nofeetbird.tech/ | nofeetbird0321/json-editor |
| 本地 SQL 格式化 | https://tools.nofeetbird.tech/sql/ | https://sql.nofeetbird.tech/ | nofeetbird0321/sql-formatter |
| AI SQL 格式化 | https://tools.nofeetbird.tech/sql-ai/ | https://sql-ai.nofeetbird.tech/ | nofeetbird0321/sql-ai-formatter |
| 网站收益计算器 | https://tools.nofeetbird.tech/site-math-lab/ | https://math.nofeetbird.tech/ | nofeetbird0321/site-math-lab |
| 少喝一杯 | https://tools.nofeetbird.tech/milktea/ | https://tea.nofeetbird.tech/ | nofeetbird0321/milktea |

各目录就是独立站点的根目录，包含 CNAME、.nojekyll、robots.txt 与 sitemap.xml。AI SQL 已带上自己的 tool.css，并修复指向本地 SQL 站点的导航；本地 SQL 的反向链接也已更新。表格中的 HTTPS 新入口需等待证书签发，目前仍应使用原有 HTTPS 地址。

每个仓库已配置 Settings → Pages → Deploy from a branch → main → /(root)，Custom domain 为对应的子域名。Cloudflare 的 nofeetbird.tech 区域已新增以下记录，原有 tools 记录保留：

| 类型 | 名称 | 目标 | 代理 | TTL |
| --- | --- | --- | --- | --- |
| CNAME | json | nofeetbird0321.github.io | DNS only | Auto |
| CNAME | sql | nofeetbird0321.github.io | DNS only | Auto |
| CNAME | sql-ai | nofeetbird0321.github.io | DNS only | Auto |
| CNAME | math | nofeetbird0321.github.io | DNS only | Auto |
| CNAME | tea | nofeetbird0321.github.io | DNS only | Auto |

待证书签发完成后启用 Enforce HTTPS，并分别验证 HTTPS 和实际功能，再将工具箱首页入口切换到新站点。旧页面保留，不强制跳转。奶茶和 JSON 的 Pages DNS 检查已成功；证书尚未签发。自动审批拒绝了移除后重新绑定奶茶域名的重试，理由是可能短暂中断新站点且缺少该步骤的明确授权；移除没有执行，确认仍待用户回应。

## 浏览器数据迁移

不同子域名使用独立的浏览器存储。奶茶账本应先在旧地址导出 JSON，再到新地址导入；旧记录不删除。新账本内已加入旧地址入口和说明。迁移测试使用模拟记录，已验证年度合计、导入后的持久化与旧记录保留。

AI SQL 的 DeepSeek API Key 和模型设置不会自动跨域迁移，需在新地址重新填写。源码不包含用户的 Key，本次没有读取或导出浏览器中的真实 Key。JSON 编辑器与收益计算器没有发现 localStorage 存储；收益计算器带参数的分享链接可保留查询参数并改用新域名。

## 验证

`verification.json` 记录五个页面的本地资源、canonical 与 JavaScript 错误检查；本地 SQL 的 Python WebAssembly 格式化已执行成功，AI SQL 只检查无 Key 时的提示，不调用付费 API。`live-verification.json` 记录真实域名的 DNS、HTTP 内容和资源一致性，以及当前 HTTPS 证书错误。`deployment.json` 记录五个仓库的提交与成功构建链接。截图用于预览。

原源码来源：nofeetbird0321/tools 的 gh-pages 提交 `0c64cfc52dd31c5623374338419e236479428d2e`。原工具箱保持不变。
