import { Navigate, Route, Routes } from 'react-router-dom';
import { ShootingPage } from '../pages/ShootingPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/projects/narita-2026-10-10/shooting" replace />} />
      <Route path="/projects/:projectId/shooting" element={<ShootingPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
