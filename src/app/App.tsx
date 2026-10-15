import { Navigate, Route, Routes } from 'react-router-dom';
import { NewProjectPage } from '../pages/NewProjectPage';
import { ProjectListPage } from '../pages/ProjectListPage';
import { ShootingPage } from '../pages/ShootingPage';

interface AppProps { startupError?: string | null }

export function App({ startupError = null }: AppProps) {
  return (
    <>
      {startupError && <div className="startup-error" role="alert">本机数据库初始化失败：{startupError}。请先保留已有备份，再检查浏览器站点存储权限。</div>}
      <Routes>
        <Route path="/" element={<ProjectListPage />} />
        <Route path="/projects/new" element={<NewProjectPage />} />
        <Route path="/projects/:projectId/shooting" element={<ShootingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
