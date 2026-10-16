import { Navigate, Route, Routes } from 'react-router-dom';
import { NewProjectPage } from '../pages/NewProjectPage';
import { EditProjectPage } from '../pages/EditProjectPage';
import { ProjectListPage } from '../pages/ProjectListPage';
import { ShootingPage } from '../pages/ShootingPage';

interface AppProps { startupError?: string | null }

export function App({ startupError = null }: AppProps) {
  return (
    <>
      {startupError && <div className="startup-error" role="alert">远程同步失败：{startupError}。当前只显示本机缓存；恢复网络并刷新后再修改数据。</div>}
      <Routes>
        <Route path="/" element={<ProjectListPage />} />
        <Route path="/projects/new" element={<NewProjectPage />} />
        <Route path="/projects/:projectId/edit" element={<EditProjectPage />} />
        <Route path="/projects/:projectId/shooting" element={<ShootingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
