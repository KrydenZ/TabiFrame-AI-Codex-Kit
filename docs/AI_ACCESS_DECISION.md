# ChatGPT 计划接入决策

核对日期：2026-10-15。结论仅适用于当前 TabiFrame AI 私有托管 Site 原型。

## 已确认

- Sign in with ChatGPT 的身份登录和 ChatGPT 计划使用是两类不同权限；身份登录本身不授予推理权限。
- ChatGPT 计划使用需要单独授权符合条件的 Responses API scopes，且不提供用户的 API Key 或 ChatGPT 对话内容。
- 官方开源流程要求稳定 host ID、PKCE、ID token 校验、scope 校验和受保护的凭据存储。
- access token、refresh token 和 retained ID token 不得写入浏览器存储、源码、日志或导出文件。
- 官方概览说明当前开源流程面向本地托管/自托管应用；付费或远程托管应用需要另外表达兴趣或取得对应资格。

官方依据：

- [Sign in with ChatGPT Quickstart](https://developers.openai.com/siwc/quickstart)
- [ChatGPT plan usage overview](https://developers.openai.com/siwc/token-sharing-open-source)
- [Accounts and credential security](https://developers.openai.com/siwc/token-sharing-open-source/profiles-and-sessions)

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
