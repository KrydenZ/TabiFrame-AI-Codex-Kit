# ChatGPT 计划接入决策

核对日期：2026-10-15。结论仅适用于当前 TabiFrame AI 私有托管 Site 原型。

## 已确认

- Sign in with ChatGPT 的身份登录和 ChatGPT 计划使用是两类不同权限；身份登录本身不授予推理权限。
- ChatGPT 计划使用需要单独授权符合条件的 Responses API scopes，且不提供用户的 API Key 或 ChatGPT 对话内容。
- 官方开源流程要求稳定 host ID、PKCE、ID token 校验、scope 校验和受保护的凭据存储。
- access token、refresh token 和 retained ID token 不得写入浏览器存储、源码、日志或导出文件。
- 官方概览说明当前 ChatGPT 计划使用流程面向开源、本地托管与自托管应用；付费或远程托管应用需要另外表达兴趣并取得对应资格。
- 官方“网站接入”文档明确写明：远程网站的 Sign in with ChatGPT 当前仅向选定商业合作伙伴有限试用，接入前需要获批的 OAuth client ID、精确回调地址和能安全保存短期状态/会话的后端。

官方依据：

- [Sign in with ChatGPT Quickstart](https://developers.openai.com/siwc/quickstart)
- [ChatGPT plan usage overview](https://developers.openai.com/siwc/token-sharing-open-source)
- [Accounts and credential security](https://developers.openai.com/siwc/token-sharing-open-source/profiles-and-sessions)
- [Sign in with ChatGPT on your website](https://developers.openai.com/siwc/website)

## 当前未验证

- TabiFrame AI 是否已获得远程托管 Site 使用 ChatGPT 计划推理的应用资格。
- Sites 环境中符合要求的 OAuth 回调、令牌加密存储与刷新机制。
- 当前账号在该远程应用中的具体模型列表、权益归属与额度限制。
- 一次真实的“目的地输入 → Responses API → 合法项目 JSON → Zod 校验通过”线上请求。

## 首版决策

当前不接入站内 ChatGPT 登录或模型调用，不显示不能工作的按钮，不要求复制 Cookie，不把 Codex 凭据放进浏览器，也不自动切换到开发者付费 API。

个人可用原型采用：

```text
填写旅行条件
→ 复制结构化生成指令
→ 用户在自己的 ChatGPT/Codex 中生成纯 JSON
→ 返回 Site 导入并严格校验
→ 保存为可勾选项目
```

只有在远程应用资格、托管安全实现、费用/权益边界和一次真实线上生成全部通过后，才进入正式账号与模型接入。

## Phase 6 执行结论

Phase 6 的资格核对和产品内降级路径已经完成，但站内模型接入本身没有冒充完成。当前缺少获批的远程网站 OAuth client、经验证的 ChatGPT 计划使用授权和一次真实线上推理结果；因此不能安全、诚实地实现登录、刷新令牌或模型调用。

本项目继续使用外部生成后导入，并明确禁止以下替代做法：

- 不使用 AWS 或其他自建云桥接服务。
- 不要求用户把 ChatGPT Cookie、Codex 凭据或访问令牌粘贴进网页。
- 不把令牌放进 IndexedDB、localStorage、源码、日志或项目备份。
- 不自动切换到需要开发者承担费用的 OpenAI API Key。
