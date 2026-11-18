import { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { LoadingIndicator } from '@/components/ui/Feedback';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ErrorFallback } from '@/components/ui/ErrorBoundary';
const CampaignPage = lazy(() =>
  import('@/pages/CampaignPage').then((m) => ({ default: m.CampaignPage })),
);
const CreateCampaignPage = lazy(() =>
  import('@/pages/CreateCampaignPage').then((m) => ({ default: m.CreateCampaignPage })),
);
const EditCampaignPage = lazy(() =>
  import('@/pages/EditCampaignPage').then((m) => ({ default: m.EditCampaignPage })),
);
const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const ProfilePage = lazy(() =>
  import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Layout />} errorElement={<ErrorFallback />}>
      <Route index element={<HomePage />} />
      <Route path="campaign/:id" element={<CampaignPage />} />
      <Route
        path="create"
        element={
          <AuthGuard>
            <CreateCampaignPage />
          </AuthGuard>
        }
      />
      <Route
        path="campaign/:id/edit"
        element={
          <AuthGuard>
            <EditCampaignPage />
          </AuthGuard>
        }
      />
      <Route
        path="dashboard"
        element={
          <AuthGuard>
            <DashboardPage />
          </AuthGuard>
        }
      />
      <Route
        path="profile"
        element={
          <AuthGuard>
            <ProfilePage />
          </AuthGuard>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Route>,
  ),
);
export function App() {
  return (
    <Suspense fallback={<LoadingIndicator />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
