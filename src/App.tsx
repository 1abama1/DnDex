import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { HomePage } from '@/pages/HomePage';
import { CampaignPage } from '@/pages/CampaignPage';
import { CreateCampaignPage } from '@/pages/CreateCampaignPage';
import { EditCampaignPage } from '@/pages/EditCampaignPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ProfilePage } from '@/pages/ProfilePage';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/campaign/:id" element={<CampaignPage />} />
        <Route
          path="/create"
          element={
            <AuthGuard>
              <CreateCampaignPage />
            </AuthGuard>
          }
        />
        <Route
          path="/campaign/:id/edit"
          element={
            <AuthGuard>
              <EditCampaignPage />
            </AuthGuard>
          }
        />
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <DashboardPage />
            </AuthGuard>
          }
        />
        <Route
          path="/profile"
          element={
            <AuthGuard>
              <ProfilePage />
            </AuthGuard>
          }
        />
      </Route>
    </Routes>
  );
}
