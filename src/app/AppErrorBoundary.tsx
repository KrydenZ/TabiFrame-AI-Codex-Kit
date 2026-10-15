import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { failed: boolean }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('TabiFrame 页面发生错误', error, info);
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="state-shell">
          <h1>页面数据无法读取</h1>
          <p>请刷新重试。如果问题持续，请保留已导出的项目 JSON，再清理本站浏览器数据并重新导入。</p>
          <button className="primary-link" type="button" onClick={() => window.location.reload()}>重新加载</button>
        </main>
      );
    }
    return this.props.children;
  }
}
