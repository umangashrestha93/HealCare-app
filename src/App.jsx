import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';

import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Marketplace from './pages/Marketplace';
import Booking from './pages/Booking';
import AdminLogin from './pages/AdminLogin';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import AdminVerification from './pages/AdminVerification';
import AdminAnalytics from './pages/AdminAnalytics';

import { Provider } from 'react-redux';
import { store } from './store';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
          <Routes>
            {/* Public Layout Routes */}
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="login" element={<Login />} />
              <Route path="login/client" element={<Login role="client" />} />
              <Route path="login/practitioner" element={<Login role="practitioner" />} />
              <Route path="register" element={<Register />} />
              <Route path="register/client" element={<Register role="client" />} />
              <Route path="register/practitioner" element={<Register role="practitioner" />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="marketplace" element={<Marketplace />} />
              <Route path="booking" element={<Booking />} />
            </Route>

            {/* Isolated Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="verification" element={<AdminVerification />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              {/* Other admin routes like /admin/users can go here */}
            </Route>
            
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  </Provider>
  );
}

export default App;