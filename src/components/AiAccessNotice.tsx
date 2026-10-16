import { Braces } from 'lucide-react';

export function AiAccessNotice() {
  return (
    <section className="ai-access-notice" aria-labelledby="ai-access-title">
      <Braces aria-hidden="true" />
      <div>
        <strong id="ai-access-title">Schema JSON 怎么生成？</strong>
        <p>
          填表后复制 App 生成的提示词，发给你正在使用的 ChatGPT 或 Codex；把它返回的纯 JSON 粘贴回来即可。App 不要求 API Key，也不用你手写字段。
        </p>
      </div>
    </section>
  );
}
