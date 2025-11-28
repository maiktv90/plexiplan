// Clean Architecture - Register Page
import React from 'react';
import { RegisterForm } from '@/components/features';
import { Layers } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="mb-8 flex items-center space-x-2">
        <Layers className="h-10 w-10 text-primary-500" />
        <span className="text-2xl font-bold text-gray-900 dark:text-white">Plexify Planner</span>
      </div>
      <RegisterForm />
    </div>
  );
};
