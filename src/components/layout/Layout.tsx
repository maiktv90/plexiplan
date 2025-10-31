// Clean Architecture - Layout Component
import React, { type ReactNode } from 'react';
import { Header } from './Header';
import { Navbar } from './Navbar';

interface LayoutProps {
  children: ReactNode;
  isPopup: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, isPopup }) => {
  return (
    <div className="flex flex-col h-full">
      <Header isPopup={isPopup} />
      
      <div className="flex flex-1 overflow-hidden">
        {!isPopup && (
          <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            <Navbar />
          </aside>
        )}
        
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};