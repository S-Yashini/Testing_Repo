import { useState, type ReactNode, type CSSProperties } from 'react';
import { useLocation } from 'react-router-dom';
import { Layout } from 'antd';
import Sidebar from '../../pages/Sidebar/Sidebar';
import Header from '../../pages/Header/Header';

const { Content } = Layout;

interface AdminLayoutProps {
  children?: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const location = useLocation();

  const menuItems = [
    {
      name: 'Dashboard',
      icon: (
        <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      path: '/dashboard',
    },
    {
      name: 'Raw Materials',
      icon: (
        <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      path: '/raw-materials',
    },
    {
      name: 'Extenders/Sub-Phases',
      icon: (
        <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
        </svg>
      ),
      path: '/extenders-dg',
    },
    {
      name: 'Analytics',
      icon: (
        <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      path: '/analytics',
    },
  ];

  const getPageTitle = () => {
    const routeMap: Record<string, { title: string; subtitle?: string }> = {
      '/dashboard': { title: 'Dashboard', subtitle: 'Overview of GHS and DG compliance classifications, analytics, and insights.' },
      '/raw-materials': { title: 'Raw Materials', subtitle: 'Manage and view raw materials SDS records.' },
      '/analytics': { title: 'Analytics', subtitle: 'Detailed analytics and insights for GHS and DG compliance classifications.' },
      '/users': { title: 'Users', subtitle: 'Manage system users and their permissions.' },
      '/extenders-dg': { title: 'Extenders', subtitle: 'Manage and view raw materials SDS records.' },
    };
    return routeMap[location.pathname] || { title: 'Dashboard' };
  };

  const pageInfo = getPageTitle();

  const layoutOffset = isCollapsed ? 64 : 256;

  return (
    <Layout
      style={
        {
          minHeight: '100vh',
          background: '#f0f2f5',
          ['--layout-offset' as any]: `${layoutOffset}px`,
        } as CSSProperties
      }
    >
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 20 }}
          onClick={() => setSidebarOpen(false)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Escape' && setSidebarOpen(false)}
          aria-label="Close overlay"
        />
      )}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        menuItems={menuItems}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
      <Layout style={{ marginLeft: layoutOffset, transition: 'margin-left 0.3s' }}>
        <Header setSidebarOpen={setSidebarOpen} pageInfo={pageInfo} />
        <Content style={{ margin: '24px', minHeight: 280 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
