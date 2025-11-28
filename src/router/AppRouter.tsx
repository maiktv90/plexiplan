// Clean Architecture - Simplified Router
import React from 'react';
import { createHashRouter, RouterProvider, Outlet } from 'react-router-dom';
import { AuthGuard, Dashboard } from '@/components/features';
import { Layout } from '@/components/layout';
import {
  LoginPage,
  RegisterPage,
  TimeTrackingPage,
  BookingsPage,
  BookingDetailPage,
  CreateBookingPage,
  SettingsPage,
  TasksPage,
} from '@/pages';
import { useUIStore } from '@/stores/useUIStore';

// Root layout component
const RootLayout: React.FC = () => {
  const { isPopup, currentTheme } = useUIStore();

  return (
    <div className={`min-h-screen bg-gray-50 ${currentTheme === 'dark' ? 'dark' : ''}`}
      style={isPopup ? { width: '400px', height: '600px' } : {}}>
      <div className="flex flex-col h-screen overflow-hidden dark:bg-gray-900 transition-colors duration-200">
        <Outlet />
      </div>
    </div>
  );
};

// Protected layout for authenticated routes
const ProtectedLayout: React.FC = () => {
  const { isPopup } = useUIStore();

  return (
    <AuthGuard>
      <Layout isPopup={isPopup}>
        <Outlet />
      </Layout>
    </AuthGuard>
  );
};

// Router configuration
const router = createHashRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      {
        path: '',
        element: <ProtectedLayout />,
        children: [
          {
            index: true,
            element: <Dashboard />,
          },
          {
            path: 'dashboard',
            element: <Dashboard />,
          },
          {
            path: 'time-tracking',
            element: <TimeTrackingPage />,
          },
          {
            path: 'bookings',
            element: <BookingsPage />,
          },
          {
            path: 'bookings/new',
            element: <CreateBookingPage />,
          },
          {
            path: 'bookings/:id',
            element: <BookingDetailPage />,
          },
          {
            path: 'bookings/:id/edit',
            element: <CreateBookingPage />,
          },
          {
            path: 'settings',
            element: <SettingsPage />,
          },
          {
            path: 'tasks',
            element: <TasksPage />,
          },
        ],
      },
    ],
  },
]);

export const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};