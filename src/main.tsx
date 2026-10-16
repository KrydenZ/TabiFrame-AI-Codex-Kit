import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { App } from './app/App';
import { AppErrorBoundary } from './app/AppErrorBoundary';
import { syncRemoteProjects } from './db/projects';
import './styles/index.css';

async function bootstrap() {
  let startupError: string | null = null;
  try {
    await syncRemoteProjects();
  } catch (error) {
    console.error('TabiFrame 远程项目同步失败', error);
    startupError = error instanceof Error ? error.message : '未知存储错误';
  }
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AppErrorBoundary><HashRouter><App startupError={startupError} /></HashRouter></AppErrorBoundary>
    </StrictMode>,
  );
}

void bootstrap();
