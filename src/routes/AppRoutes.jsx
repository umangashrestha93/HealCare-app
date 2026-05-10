import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import Marketplace from '../pages/Marketplace';
import Booking from '../pages/Booking';
import AdminLogin from '../pages/AdminLogin';
import AdminLayout from '../layouts/AdminLayout';
import AdminDashboard from '../pages/AdminDashboard';
import AdminVerification from '../pages/AdminVerification';
import AdminAnalytics from '../pages/AdminAnalytics';
import AdminManagement from '../pages/AdminManagement';
import UserManagement from '../pages/admin/UserManagement';
import ComplianceLogsPage from '../pages/admin/ComplianceLogsPage';
import SystemSettingsPage from '../pages/admin/SystemSettingsPage';
import ProtectedRoute from '../components/ProtectedRoute';
import Chat from '../pages/Chat';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Layout Routes */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        
        {/* Auth Routes with dynamic roles */}
        <Route path="login" element={<Login />} />
        <Route path="login/:role" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="register/:role" element={<Register />} />
        
        {/* Protected Dashboard Routes */}
        <Route path="dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="dashboard/:role" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        <Route path="marketplace" element={<Marketplace />} />
        <Route path="booking" element={
          <ProtectedRoute allowedRoles={['client']}>
            <Booking />
          </ProtectedRoute>
        } />
        <Route path="chat" element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        } />
        <Route path="chat/:userId" element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        } />
      </Route>

      {/* Isolated Admin Routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="verification" element={<AdminVerification />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="management" element={<AdminManagement />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="logs" element={<ComplianceLogsPage />} />
        <Route path="settings" element={<SystemSettingsPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
