import React from 'react';
import { Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 relative selection:bg-black/10">
      <div className="fixed inset-0 z-0 pointer-events-none bg-gray-50">
      </div>
      <div className="relative z-10">
        <Outlet />
      </div>
    </div>
  );
}