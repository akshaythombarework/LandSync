import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F6F8FA] text-slate-800 flex flex-col antialiased">
      <Navbar />
      <div className="flex flex-1 min-h-[calc(100vh-4rem)]">
        <Sidebar />
        <main className="flex-1 p-5 md:p-7 max-w-7xl mx-auto w-full overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
