import { Switch, Route, Redirect } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AdminLayout from './components/AdminLayout/AdminLayout';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import RawMaterialsGHS from './pages/RawMaterialsGHS/RawMaterials';
import Extenders from './pages/Extenders/Extenders';
import Analytics from './pages/Analytics/Analytics';
import Users from './pages/Users/Users';
import './App.css';


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      refetchOnWindowFocus: true,
      retry: 1,
      refetchOnMount: true,
    },
  },
});

const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Switch>
      <Route exact path="/" render={() => <Redirect to="/login" />} />
      <Route path="/login" component={Login} />
      <Route
        path="/dashboard"
        render={() => (
          <ProtectedRoute>
            <AdminLayout>
              <Dashboard />
            </AdminLayout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/raw-materials"
        render={() => (
          <ProtectedRoute>
            <AdminLayout>
              <RawMaterialsGHS />
            </AdminLayout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/raw-materials-dg"
        render={() => (
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/extenders-dg"
        render={() => (
          <ProtectedRoute>
            <AdminLayout>
              <Extenders />
            </AdminLayout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/analytics"
        render={() => (
          <ProtectedRoute>
            <AdminLayout>
              <Analytics />
            </AdminLayout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/users"
        render={() => (
          <ProtectedRoute>
            <AdminLayout>
              <Users />
            </AdminLayout>
          </ProtectedRoute>
        )}
      />
      <Route render={() => <Redirect to="/login" />} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
