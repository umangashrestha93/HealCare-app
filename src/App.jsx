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
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="login" element={<Login />} />
              <Route path="login/client" element={<Login role="client" />} />
              <Route path="login/practitioner" element={<Login role="practitioner" />} />
              <Route path="login/admin" element={<Login role="admin" />} />
              <Route path="register" element={<Register />} />
              <Route path="register/client" element={<Register role="client" />} />
              <Route path="register/practitioner" element={<Register role="practitioner" />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="marketplace" element={<Marketplace />} />
              <Route path="booking" element={<Booking />} />
              {/* Additional routes will go here */}
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  </Provider>
  );
}

export default App;