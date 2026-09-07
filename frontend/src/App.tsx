import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Pengisian from './pages/Pengisian';
import DataRhk from './pages/DataRhk';
import LaporanRhk from './pages/LaporanRhk';
import Layout from './components/Layout';
import { FullScreenLoader } from './components/ui';

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="pengisian-rhk" element={<Pengisian />} />
        <Route path="data-rhk" element={<DataRhk />} />
        <Route path="laporan-rhk" element={<LaporanRhk />} />
        <Route path="laporan-rhk/:nomor" element={<LaporanRhk />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
