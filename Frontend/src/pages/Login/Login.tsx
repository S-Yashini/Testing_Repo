import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
//import usersData from '../../data/users.json';

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
  const navigate = useNavigate();

  const handleLogin = () => {
    setIsLoading(true);
    
    // Show loading screen for 3 seconds
    setTimeout(() => {
      setShowLoader(true);
      
      // Show loader for 2 seconds, then navigate
      setTimeout(() => {
        navigate('/dashboard');
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-200">
        <div className=" rounded-lg shadow-2xl p-8 w-96 text-center text-white" style={{ backgroundColor: 'rgb(116 116 116)' }}>
          <h2 className="text-2xl text-left font-normal mb-4">Authentication</h2>
          <p className="text-sm text-left text-gray-200 mb-8">Select the number displayed in your PingID mobile app</p>
          
          {/* Mobile Phone Icon */}
          <div className="flex justify-center mb-8">
            <div className="relative w-32 h-48 border-4 border-white rounded-2xl flex items-center justify-center">
              {/* Phone top bar */}
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-10 h-1 bg-white rounded-full"></div>
              <div className="absolute top-5 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-white rounded-full"></div>
              {/* Phone number display */}
              <div className="text-6xl  text-white">13</div>
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-white rounded-full"></div>

              {/* Phone button */}
              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-5 h-5 border-4 border-white rounded-full"></div>
            </div>
          </div>
          
          <h3 className="text-lg font-semibold mb-2">Login to ELC</h3>
          <p className="text-sm text-gray-200">Authenticating on</p>
          <p className="text-base font-medium">OnePlus CPH2423</p>
        </div>
        
        <div className="mt-8 text-gray-700 font-medium">ELC - PROD</div>
        
        {/* PingID Logo */}
        <div className="absolute bottom-8 text-center">
          <div className="flex items-center justify-center mb-2">
            <span className="text-2xl font-bold text-gray-800">Ping</span>
            <span className="text-2xl font-bold text-white bg-red-600 px-1 ml-0.5">iD</span>
          </div>
          <p className="text-xs text-gray-500">Copyright © 2003-2025 Ping Identity Corporation. All rights reserved.</p>
        </div>

        {showLoader && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
              <p className="text-white text-lg mt-4">Loading your dashboard...</p>
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
     <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
         <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">EHS Raw Material Classification</h1>
          <p className="text-gray-600">DG & GHS Compliance System</p>
        </div>

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium text-lg"
        >
          Login to Dashboard
        </button>
      </div>
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

