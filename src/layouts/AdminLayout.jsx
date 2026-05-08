import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, Drawer, AppBar, Toolbar, List, Typography, 
  Divider, IconButton, ListItem, ListItemButton, 
  ListItemIcon, ListItemText, Avatar, Badge, Stack
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Assessment, 
  VerifiedUser, 
  People, 
  Notifications, 
  Settings, 
  Logout, 
  Dashboard as DashboardIcon,
  Shield,
  Gavel,
  Security
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 280;

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { text: 'Overview', icon: <DashboardIcon />, path: '/admin/dashboard' },
    { text: 'Verification Queue', icon: <VerifiedUser />, path: '/admin/verification', badge: 12 },
    { text: 'User Management', icon: <People />, path: '/admin/users' },
    { text: 'Analytics', icon: <Assessment />, path: '/admin/analytics' },
    { text: 'Admin Management', icon: <Security />, path: '/admin/management' },
    { text: 'Compliance Logs', icon: <Gavel />, path: '/admin/logs' },
    { text: 'System Settings', icon: <Settings />, path: '/admin/settings' },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0f172a', color: '#fff' }}>
      <Toolbar sx={{ px: 3, py: 4 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ bgcolor: 'secondary.main', width: 40, height: 40 }}>
            <Shield />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={900} sx={{ lineHeight: 1 }}>
              BEYOND5
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.5, letterSpacing: 1 }}>
              ADMIN PORTAL
            </Typography>
          </Box>
        </Stack>
      </Toolbar>
      
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />
      
      <List sx={{ px: 2, py: 4, flexGrow: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton 
                onClick={() => navigate(item.path)}
                sx={{ 
                  borderRadius: 3,
                  bgcolor: isActive ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                  color: isActive ? '#38bdf8' : '#94a3b8',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 45 }}>
                  <Badge badgeContent={item.badge} color="error" overlap="circular">
                    {item.icon}
                  </Badge>
                </ListItemIcon>
                <ListItemText primary={<Typography fontWeight={isActive ? 700 : 500}>{item.text}</Typography>} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ p: 3 }}>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)', mb: 2 }} />
        <ListItemButton onClick={handleLogout} sx={{ borderRadius: 3, color: '#f87171' }}>
          <ListItemIcon sx={{ color: 'inherit', minWidth: 45 }}><Logout /></ListItemIcon>
          <ListItemText primary={<Typography fontWeight={600}>Logout</Typography>} />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          color: 'text.primary'
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" fontWeight={700} noWrap component="div">
            {menuItems.find(i => i.path === location.pathname)?.text || 'Dashboard'}
          </Typography>

          <Stack direction="row" spacing={2} alignItems="center">
            <IconButton><Notifications /></IconButton>
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="subtitle2" fontWeight={700}>{user?.firstName}</Typography>
                <Typography variant="caption" color="text.secondary">Super Admin</Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'secondary.main' }}>{user?.firstName?.[0]}</Avatar>
            </Stack>
          </Stack>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, border: 'none' },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, border: 'none' },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: 8
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminLayout;
