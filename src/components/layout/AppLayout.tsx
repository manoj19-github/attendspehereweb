import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { cn } from '@/utils/cn';

export function AppLayout() {
  const location = useLocation();
  const isFullscreen = location.pathname === '/live-map';

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Topbar />
      <main
        className={cn(
          'ml-60 min-h-screen bg-gray-50',
          isFullscreen ? 'mt-0 p-0' : 'mt-14 p-6'
        )}
        style={isFullscreen ? { marginLeft: '15rem', minHeight: '100vh' } : undefined}
      >
        <Outlet />
      </main>
    </div>
  );
}