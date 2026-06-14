import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider
} from '@mui/material';
import { Person, Logout } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = () => {
    handleClose();
    logout();
    navigate('/');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: '#ffffff',
          borderBottom: '1px solid',
          borderColor: 'divider',
          zIndex: (theme) => theme.zIndex.drawer + 1
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between', height: 80 }}>
            {/* Logo */}
            <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
              <Box
                component="img"
                src="/logo.png"
                alt="Beyond5 Logo"
                sx={{ height: 40, width: 'auto', display: 'block' }}
              />
            </Box>

            {/* Nav Links */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
              {[
                { label: 'Home', path: '/' },
                { label: 'Find a Practitioner', path: '/marketplace', roles: ['client', null] },
                { label: 'Dashboard', path: user ? `/dashboard/${user.role}` : '/dashboard' },
              ].filter(link => !link.roles || link.roles.includes(user?.role || null)).map((link) => (
                <Button
                  key={link.label}
                  sx={{
                    color: location.pathname === link.path ? 'primary.main' : 'text.secondary',
                    fontWeight: 600,
                    px: 2,
                    '&:hover': { color: 'primary.main', bgcolor: 'transparent' }
                  }}
                  onClick={() => navigate(link.path)}
                >
                  {link.label}
                </Button>
              ))}
            </Box>

            {/* Auth Actions */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {!user ? (
                <>
                  <Button
                    variant="text"
                    color="inherit"
                    onClick={() => navigate('/login')}
                    sx={{ color: 'text.primary', fontWeight: 700 }}
                  >
                    Log In
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => navigate('/register')}
                    sx={{ borderRadius: '50px', px: 3, fontWeight: 700, color: 'white' }}
                  >
                    Get Started
                  </Button>
                </>
              ) : (
                <>
                  <IconButton onClick={handleMenu} color="primary">
                    <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                      {user.firstName ? user.firstName[0] : <Person />}
                    </Avatar>
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                    sx={{ mt: 1 }}
                  >
                    <MenuItem onClick={() => { handleClose(); navigate(`/dashboard/${user.role}`); }}>
                      <Person fontSize="small" sx={{ mr: 1 }} /> Dashboard
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleLogout}>
                      <Logout fontSize="small" sx={{ mr: 1 }} /> Logout
                    </MenuItem>
                  </Menu>
                </>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </Box>

      <Box
        component="footer"
        sx={{
          py: 4,
          textAlign: 'center',
          borderTop: '1px solid',
          borderColor: 'divider',
          mt: 'auto'
        }}
      >
        <Typography variant="body2" color="text.secondary">
          © 2026 Beyond5. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default MainLayout;
