import { ExternalLink, ShieldAlert } from 'lucide-react';

export function AiAccessNotice() {
  return (
    <section className="ai-access-notice" aria-labelledby="ai-access-title">
      <ShieldAlert aria-hidden="true" />
      <div>
        <strong id="ai-access-title">站内 AI：资格未验证，因此保持关闭</strong>
        <p>
          OpenAI 当前把远程网站的 Sign in with ChatGPT 列为有限试用，需要获批的 OAuth 客户端和安全后端。
          本 Site 尚无这些资格，也没有完成一次真实线上生成，所以不会显示假登录或偷偷改用开发者付费 API。
        </p>
        <a href="https://developers.openai.com/siwc/website" target="_blank" rel="noopener noreferrer">
          查看官方适用范围<ExternalLink aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
