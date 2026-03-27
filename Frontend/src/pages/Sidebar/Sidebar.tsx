import { Link, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

interface MenuItem {
  name: string;
  icon: string | ReactNode;
  path: string;
}

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  menuItems: MenuItem[];
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const Sidebar = ({ sidebarOpen, setSidebarOpen, menuItems, isCollapsed, setIsCollapsed }: SidebarProps) => {
  const location = useLocation();

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen bg-gray-900 text-white transform transition-all duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } ${isCollapsed ? 'w-16' : 'w-64'}`}
    >
      <div className={`flex items-center justify-between h-24 border-b border-gray-800 transition-all duration-300 ${
        isCollapsed ? 'px-2' : 'px-6'
      }`}>
        {!isCollapsed && (
          <div className="flex flex-col">
            <h1 className="text-md font-bold">EHS Raw Material Classification</h1>
            <p className="text-sm text-gray-400">DG & GHS System</p>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleCollapse}
            className="text-gray-400 hover:text-white transition-colors p-1"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isCollapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              )}
            </svg>
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      </div>

      <nav className="mt-6">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            onClick={() => {
              setSidebarOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex items-center transition-colors ${
              isCollapsed ? 'justify-center px-2 py-3' : 'px-3 py-3'
            } ${
              location.pathname === item.path
                ? 'bg-gray-800 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
            title={isCollapsed ? item.name : ''}
          >
            <span className={`flex items-center justify-center w-5 h-5 ${
              isCollapsed ? '' : 'mr-3'
            }`}>
              {typeof item.icon === 'string' ? item.icon : item.icon}
            </span>
            {!isCollapsed && <span>{item.name}</span>}
          </Link>
        ))}
      </nav>

      {!isCollapsed && (
        <div className="absolute bottom-0 w-full p-6 border-t border-gray-800">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
              <span className="text-lg">👤</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">Admin User</p>
              <p className="text-xs text-gray-400">admin@example.com</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;

