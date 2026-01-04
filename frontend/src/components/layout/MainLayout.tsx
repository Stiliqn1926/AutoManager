import { type ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="flex h-screen bg-mainBg">
      {/* Sidebar - фиксиран вляво */}
      <Sidebar />
      
      {/* Дясна част - Header + Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        {/* Main Content - scrollable */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;