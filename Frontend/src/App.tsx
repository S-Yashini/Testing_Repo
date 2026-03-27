import { Routes, Route } from 'react-router-dom'
import AdminLayout from './components/AdminLayout/AdminLayout'
import Login from './pages/Login/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import RawMaterialsGHS from './pages/RawMaterialsGHS/RawMaterials'
import RawMaterialsDG from './pages/RawMaterialsDG/RawMaterials'
import Extenders from './pages/Extenders/Extenders'
import Analytics from './pages/Analytics/Analytics'
import Users from './pages/Users/Users'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="dashboard" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
      </Route>
      <Route path="raw-materials" element={<AdminLayout />}>
        <Route index element={<RawMaterialsGHS />} />
      </Route>
      <Route path="raw-materials-dg" element={<AdminLayout />}>
        <Route index element={<RawMaterialsDG />} />
      </Route>
      <Route path="extenders-dg" element={<AdminLayout />}>
        <Route index element={<Extenders />} />
      </Route>
      <Route path="analytics" element={<AdminLayout />}>
        <Route index element={<Analytics />} />
      </Route>
      <Route path="users" element={<AdminLayout />}>
        <Route index element={<Users />} />
      </Route>
    </Routes>
  )
}

export default App
