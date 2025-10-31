// Clean Architecture - Login Page
import React from 'react';
import { LoginForm } from '@/components/features';

export const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Sign in to Plexify Planner
          </h2>
        </div>
        <LoginForm />
      </div>
    </div>
  );
};