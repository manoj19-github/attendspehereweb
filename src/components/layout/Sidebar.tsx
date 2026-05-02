import { NavLink, useNavigate } from 'react-router-dom';
import logo from "@/assets/logo.png";
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/auth.store';
import { useSocketStore } from '@/stores/socket.store';
import {
  LayoutDashboard,
  MapPin,
  ClipboardList,
  Navigation,
  Settings,
  LogOut,
} from 'lucide-react';
import Cookies from 'js-cookie';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: MapPin, label: 'Live Map', path: '/live-map' },
  { icon: ClipboardList, label: 'Attendance', path: '/attendance' },
  { icon: Navigation, label: 'Location Registry', path: '/location' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const destroySocket = useSocketStore((s) => s.destroySocket);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    destroySocket();
    Cookies.remove('attend_token');
    Cookies.remove('attend_refresh');
    navigate('/login', { replace: true });
  };

  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-gray-900 flex flex-col z-30">
      <div className="px-4 pt-6 pb-4 flex items-center gap-2.5">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
          <img src={logo} alt="logo" className="w-full h-full" />
        </div>
        <span className="text-white font-bold text-lg">AttendSphere</span>
      </div>

      <nav className="flex-1 mt-6 space-y-1 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-semibold flex items-center justify-center">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.fullName}</p>
            <p className="text-gray-400 text-xs truncate capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}