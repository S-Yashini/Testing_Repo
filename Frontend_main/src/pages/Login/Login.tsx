import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Card, Button, Typography, Spin } from 'antd';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

// interface User {
//   name: string;
//   email: string;
//   password: string;
//   role: string;
//   status: boolean;
//   last_login: string | null;
//   created_at: string;
//   updated_at: string;
// }

const Login = () => {
  // const [email, setEmail] = useState('');
  // const [password, setPassword] = useState('');
  // const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const history = useHistory();
  const { login, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      history.push('/dashboard');
    }
  }, [isAuthenticated, history]);

  const handleLogin = async () => {
    setIsLoading(true);
    
    // Show loading screen for 3 seconds (Ping ID simulation)
    setTimeout(() => {
      setShowLoader(true);
      
      // Show loader for 2 seconds, then authenticate and navigate
      setTimeout(async () => {
        await login();
        history.push('/dashboard');
      }, 2000);
    }, 3000);
  };

  // const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  //   e.preventDefault();
  //   setError('');

  //   // Validate inputs
  //   if (!email || !password) {
  //     setError('Please enter  email and password');
  //     return;
  //   }

  //   // Find user in users.json
  //   const users = usersData as User[];
  //   const user = users.find(
  //     (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  //   );

  //   if (!user) {
  //     setError('Invalid email or password');
  //     return;
  //   }

  //   // Check if user is active
  //   if (!user.status) {
  //     setError('Your account has been deactivated. Please contact administrator.');
  //     return;
  //   }

  //   // Store user info in localStorage
  //   const userInfo = {
  //     name: user.name,
  //     email: user.email,
  //     role: user.role,
  //     last_login: new Date().toISOString(),
  //   };
  //   localStorage.setItem('user', JSON.stringify(userInfo));

  //   // Update last_login in users.json (in a real app, this would be an API call)
  //   // For now, we'll just proceed with authentication

  //   // Trigger the existing login flow
  //   handleLogin();
  // };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f0f0f0' }}>
        <Card style={{ width: 384, borderRadius: 8, textAlign: 'center', background: 'rgb(116 116 116)', border: 'none' }} bodyStyle={{ padding: 32 }}>
          <Title level={3} style={{ color: '#fff', textAlign: 'left', marginBottom: 16 }}>Authentication</Title>
          <Text style={{ color: 'rgba(255,255,255,0.8)', textAlign: 'left', display: 'block', marginBottom: 32 }}>
            Select the number displayed in your PingID mobile app
          </Text>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
            <div style={{ position: 'relative', width: 128, height: 192, border: '4px solid #fff', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 40, height: 4, background: '#fff', borderRadius: 4 }} />
              <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', width: 128, height: 4, background: '#fff', borderRadius: 4 }} />
              <Text style={{ fontSize: 48, color: '#fff' }}>13</Text>
              <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', width: 128, height: 4, background: '#fff', borderRadius: 4 }} />
              <div style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', width: 20, height: 20, border: '4px solid #fff', borderRadius: '50%' }} />
            </div>
          </div>
          <Title level={4} style={{ color: '#fff', marginBottom: 8 }}>Login to ELC</Title>
          <Text style={{ color: 'rgba(255,255,255,0.8)', display: 'block' }}>Authenticating on</Text>
          <Text strong style={{ color: '#fff', fontSize: 16 }}>OnePlus CPH2423</Text>
        </Card>
        <Text strong style={{ marginTop: 32, color: 'rgba(0,0,0,0.65)' }}>ELC - PROD</Text>
        <div style={{ position: 'absolute', bottom: 32, textAlign: 'center' }}>
          <div style={{ marginBottom: 8 }}>
            <Text strong style={{ fontSize: 24, color: 'rgba(0,0,0,0.85)' }}>Ping</Text>
            <Text strong style={{ fontSize: 24, color: '#fff', background: '#f5222d', padding: '0 4px', marginLeft: 4 }}>iD</Text>
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>Copyright © 2003-2025 Ping Identity Corporation. All rights reserved.</Text>
        </div>
        {showLoader && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ textAlign: 'center' }}>
              <Spin size="large" />
              <p style={{ color: '#fff', fontSize: 18, marginTop: 16 }}>Loading your dashboard...</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
    {/* <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">EHS Raw Material Classification</h1>
          <p className="text-gray-600">DG & GHS Compliance System</p>
        </div>


        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-left text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="admin@example.com"
              
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-left text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="Enter your password"
              
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="ml-2 text-sm text-gray-600">Remember me</span>
            </label>
            <a href="#" className="text-sm text-blue-600 hover:text-blue-800">
              Forgot password?
            </a>
          </div>

          <button
            type="submit" 
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
          >
            Sign In
          </button>
        </form>

        {/* Test Credentials *
        <div className="mt-6 p-4 text-left bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs font-semibold text-gray-700 mb-3">Test Credentials:</p>
          <div className="space-y-2 text-xs">
            <div className="flex flex-col">
              <span className="font-medium text-gray-700">Super Admin:</span>
              <span className="text-gray-600">superadmin@elc.com / admin@123</span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-700">User 1:</span>
              <span className="text-gray-600">user1@elc.com / user@123</span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-700">User 2:</span>
              <span className="text-gray-600">user2@elc.com / user@123</span>
            </div>
          </div>
        </div>

        {/* <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <a href="#" className="text-blue-600 hover:text-blue-800 font-medium">
              Contact Administrator
            </a>
          </p>
        </div> *
      </div>
    </div> */}
     <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <Card style={{ maxWidth: 448, width: '100%' }} bodyStyle={{ padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ marginBottom: 8 }}>EHS Raw Material Classification</Title>
          <Text type="secondary">DG & GHS Compliance System</Text>
        </div>
        <Button type="primary" size="large" block onClick={handleLogin}>
          Login to Dashboard
        </Button>
      </Card>
    </div>
    </>
   
  );
};

export default Login;


/* ========== ORIGINAL LOGIN FORM (For later use) ==========
const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your admin account</p>
        </div>

        <form className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="Enter your password"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="ml-2 text-sm text-gray-600">Remember me</span>
            </label>
            <a href="#" className="text-sm text-blue-600 hover:text-blue-800">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
          >
            Sign In
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <a href="#" className="text-blue-600 hover:text-blue-800 font-medium">
              Contact Administrator
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
========================================================== */

