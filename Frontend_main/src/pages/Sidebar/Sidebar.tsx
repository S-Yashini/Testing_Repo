import { Link, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Layout, Menu, Button } from 'antd';
import { useAuth } from '../../contexts/AuthContext';

const { Sider } = Layout;

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

const Sidebar = ({ setSidebarOpen, menuItems, isCollapsed, setIsCollapsed }: SidebarProps) => {
  const location = useLocation();
  const { user } = useAuth();

  const menuKeys = menuItems.map((i) => i.path);
  const selectedKey = menuKeys.filter((k) => location.pathname === k)[0] || menuKeys[0];

  return (
    <Sider
      collapsible
      collapsed={isCollapsed}
      onCollapse={setIsCollapsed}
      trigger={null}
      width={256}
      collapsedWidth={64}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 30,
      }}
    >
      <div style={{ height: 96, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        {!isCollapsed && (
          <div>
            <div style={{ fontWeight: 600, color: '#fff' }}>EHS Raw Material Classification</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>DG & GHS System</div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            type="ghost"
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{ color: 'rgba(255,255,255,0.65)' }}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isCollapsed ? (
                <>
                  <path d="M3 6h18" />
                  <path d="M3 12h12" />
                  <path d="M3 18h18" />
                  <path d="M14 9l4 3-4 3" />
                </>
              ) : (
                <>
                  <path d="M3 6h18" />
                  <path d="M3 12h12" />
                  <path d="M3 18h18" />
                  <path d="M18 9l-4 3 4 3" />
                </>
              )}
            </svg>
          </Button>
          <Button
            type="ghost"
            onClick={() => setSidebarOpen(false)}
            style={{ color: 'rgba(255,255,255,0.65)', display: 'none' }}
            className="sidebar-close-mobile"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 6l12 12" />
              <path d="M18 6l-12 12" />
            </svg>
          </Button>
        </div>
      </div>
      <Menu
        theme="dark"
        selectedKeys={[selectedKey]}
        mode="inline"
        style={{ marginTop: 16, border: 'none' }}
      >
        {menuItems.map((item) => (
          <Menu.Item key={item.path} title={item.name}>
            <Link
              to={item.path}
              onClick={() => { setSidebarOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <span style={{ marginRight: isCollapsed ? 0 : 12, display: 'inline-flex' }}>{typeof item.icon === 'string' ? item.icon : item.icon}</span>
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          </Menu.Item>
        ))}
      </Menu>
      {!isCollapsed && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👤</div>
            <div style={{ marginLeft: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>{user?.name || 'User'}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>{user?.email || 'No email'}</div>
            </div>
          </div>
        </div>
      )}
    </Sider>
  );
};

export default Sidebar;
