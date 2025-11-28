// Clean Architecture - Layout Component
import React, { type ReactNode } from 'react';
import { Header } from './Header';

interface LayoutProps {
  children: ReactNode;
  isPopup: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, isPopup }) => {
  return (
    <div className="flex flex-col h-full">
      <Header isPopup={isPopup} />
      
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};