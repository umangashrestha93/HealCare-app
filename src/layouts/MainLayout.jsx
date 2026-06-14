import { useState, useEffect } from 'react';
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
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close,
  HomeOutlined,
  InfoOutlined,
  Search,
  Dashboard as DashboardIcon,
  Person,
  Logout,
  Message,
  Settings,
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

/* ─────────────────────────────────────────────
   Constants
───────────────────────────────────────────── */
const HEADER_HEIGHT = 64;
const DRAWER_WIDTH = 280;
const BORDER_COLOR = '#E2E8F0';

const NAV_LINKS = (user) => [
  { label: 'Home',               path: '/',           icon: <HomeOutlined /> },
  { label: 'About Us',           path: '/about-us',   icon: <InfoOutlined /> },
  { label: 'Find a Practitioner', path: '/marketplace', icon: <Search />,       roles: ['client', null] },
  { label: 'Dashboard',           path: user ? `/dashboard/${user.role}` : '/dashboard', icon: <DashboardIcon /> },
];

/* ─────────────────────────────────────────────
   NavLink — desktop pill-hover + active indicator
───────────────────────────────────────────── */
const NavLink = ({ label, path, active, onClick }) => (
  <Box
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === 'Enter' && onClick()}
    aria-current={active ? 'page' : undefined}
    sx={{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      cursor: 'pointer',
      px: 1.5,
      py: 0.5,
      borderRadius: '8px',
      transition: 'background 0.2s ease',
      '&:hover': {
        bgcolor: 'rgba(0,128,128,0.06)',
      },
      '&:focus-visible': {
        outline: '2px solid',
        outlineColor: 'primary.main',
        outlineOffset: 2,
      },
    }}
  >
    <Typography
      component="span"
      sx={{
        fontWeight: 600,
        fontSize: '0.9rem',
        color: active ? 'primary.main' : 'text.secondary',
        transition: 'color 0.2s ease',
        whiteSpace: 'nowrap',
        lineHeight: 1.5,
        '&:hover': { color: 'primary.main' },
      }}
    >
      {label}
    </Typography>

    {/* Active dot indicator */}
    <Box
      sx={{
        mt: '3px',
        height: '3px',
        borderRadius: '2px',
        bgcolor: 'primary.main',
        transition: 'width 0.25s ease, opacity 0.25s ease',
        width: active ? '20px' : '0px',
        opacity: active ? 1 : 0,
      }}
    />
  </Box>
);

/* ─────────────────────────────────────────────
   UserAvatarMenu — desktop avatar + dropdown
───────────────────────────────────────────── */
const UserAvatarMenu = ({ user, onLogout, onNavigate }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const initials = [user.firstName?.[0], user.lastName?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || <Person fontSize="small" />;

  const menuItems = [
    { label: 'Dashboard', icon: <DashboardIcon fontSize="small" />, action: () => { handleClose(); onNavigate(`/dashboard/${user.role}`); } },
    { label: 'Messages',  icon: <Message fontSize="small" />,       action: () => { handleClose(); onNavigate('/chat'); } },
    {
      label: 'Settings',
      icon: <Settings fontSize="small" />,
      action: () => {
        handleClose();
        if (user?.role === 'practitioner') {
          onNavigate(`/dashboard/${user.role}`, { state: { activeTab: 3 } });
        } else if (user?.role === 'client') {
          onNavigate(`/dashboard/${user.role}`, { state: { openProfile: true } });
        } else if (user?.role === 'admin') {
          onNavigate('/admin/settings');
        } else {
          onNavigate('/settings');
        }
      }
    },
  ];

  return (
    <>
      <Tooltip title="Account menu" arrow>
        <IconButton
          onClick={handleOpen}
          aria-label="Open account menu"
          aria-controls={open ? 'user-account-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          sx={{ p: 0.5 }}
        >
          <Avatar
            src={user.avatar || undefined}
            sx={{
              bgcolor: 'primary.main',
              width: 36,
              height: 36,
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'box-shadow 0.2s ease, transform 0.2s ease',
              border: user.avatar ? '2px solid rgba(65,198,198,0.4)' : 'none',
              '&:hover': { boxShadow: '0 0 0 3px rgba(0,128,128,0.25)', transform: 'scale(1.05)' },
            }}
          >
            {!user.avatar && initials}
          </Avatar>
        </IconButton>
      </Tooltip>

      <Menu
        id="user-account-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              mt: 1.5,
              minWidth: 200,
              borderRadius: '12px',
              boxShadow: '0 8px 30px rgba(11,29,43,0.12)',
              border: `1px solid ${BORDER_COLOR}`,
              overflow: 'visible',
              '&::before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: -6,
                right: 16,
                width: 12,
                height: 12,
                bgcolor: 'background.paper',
                border: `1px solid ${BORDER_COLOR}`,
                borderBottom: 'none',
                borderRight: 'none',
                transform: 'rotate(45deg)',
                zIndex: 0,
              },
            },
          },
        }}
      >
        {/* User info header with avatar */}
        <Box sx={{ px: 2, py: 1.5, pb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            src={user.avatar || undefined}
            sx={{
              width: 38,
              height: 38,
              bgcolor: 'primary.main',
              fontSize: '0.85rem',
              fontWeight: 700,
              border: user.avatar ? '2px solid rgba(65,198,198,0.3)' : 'none',
              flexShrink: 0,
            }}
          >
            {!user.avatar && initials}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700} color="text.primary" noWrap>
              {user.firstName} {user.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user.email}
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ mb: 0.5 }} />

        {menuItems.map(({ label, icon, action }) => (
          <MenuItem
            key={label}
            onClick={action}
            sx={{
              mx: 0.5,
              borderRadius: '8px',
              gap: 1.5,
              py: 1,
              '&:hover': { bgcolor: 'rgba(0,128,128,0.06)' },
            }}
          >
            <Box sx={{ color: 'text.secondary', display: 'flex' }}>{icon}</Box>
            <Typography variant="body2" fontWeight={500}>{label}</Typography>
          </MenuItem>
        ))}

        <Divider sx={{ my: 0.5 }} />

        <MenuItem
          onClick={() => { handleClose(); onLogout(); }}
          sx={{
            mx: 0.5,
            borderRadius: '8px',
            gap: 1.5,
            py: 1,
            color: 'error.main',
            '&:hover': { bgcolor: 'rgba(211,47,47,0.06)' },
          }}
        >
          <Logout fontSize="small" />
          <Typography variant="body2" fontWeight={500}>Logout</Typography>
        </MenuItem>
      </Menu>
    </>
  );
};

/* ─────────────────────────────────────────────
   MobileDrawer
───────────────────────────────────────────── */
const MobileDrawer = ({ open, onClose, user, navLinks, activePathname, onNavigate, onLogout }) => {
  const handleNav = (path) => { onClose(); onNavigate(path); };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      aria-label="Mobile navigation menu"
      ModalProps={{ keepMounted: true }}
      PaperProps={{
        sx: {
          width: DRAWER_WIDTH,
          borderLeft: `1px solid ${BORDER_COLOR}`,
          boxShadow: '-8px 0 30px rgba(11,29,43,0.10)',
        },
      }}
    >
      {/* Drawer header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          height: HEADER_HEIGHT,
          borderBottom: `1px solid ${BORDER_COLOR}`,
          flexShrink: 0,
        }}
      >
        <Box
          component="img"
          src="/logo.png"
          alt="Beyond5 Logo"
          sx={{ height: 36, width: 'auto', cursor: 'pointer' }}
          onClick={() => handleNav('/')}
        />
        <IconButton
          onClick={onClose}
          aria-label="Close navigation menu"
          size="small"
          sx={{
            border: `1px solid ${BORDER_COLOR}`,
            borderRadius: '8px',
            '&:hover': { bgcolor: 'rgba(0,128,128,0.06)' },
          }}
        >
          <Close fontSize="small" />
        </IconButton>
      </Box>

      {/* Nav links */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', pt: 2 }}>
        <AnimatePresence>
          <List disablePadding>
            {navLinks.map((link, index) => {
              const isActive = activePathname === link.path;
              return (
                <motion.div
                  key={link.label}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.06, duration: 0.22, ease: 'easeOut' }}
                >
                  <ListItem disablePadding sx={{ px: 1.5, mb: 0.5 }}>
                    <ListItemButton
                      onClick={() => handleNav(link.path)}
                      aria-current={isActive ? 'page' : undefined}
                      sx={{
                        borderRadius: '10px',
                        py: 1.25,
                        bgcolor: isActive ? 'rgba(0,128,128,0.08)' : 'transparent',
                        '&:hover': { bgcolor: 'rgba(0,128,128,0.06)' },
                        '&:focus-visible': {
                          outline: '2px solid',
                          outlineColor: 'primary.main',
                          outlineOffset: 2,
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          color: isActive ? 'primary.main' : 'text.secondary',
                          minWidth: 36,
                        }}
                      >
                        {link.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={link.label}
                        primaryTypographyProps={{
                          fontWeight: isActive ? 700 : 500,
                          fontSize: '0.95rem',
                          color: isActive ? 'primary.main' : 'text.primary',
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                </motion.div>
              );
            })}
          </List>
        </AnimatePresence>
      </Box>

      {/* Bottom auth section */}
      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${BORDER_COLOR}`,
          flexShrink: 0,
        }}
      >
        {user ? (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Avatar
                src={user.avatar || undefined}
                sx={{
                  bgcolor: 'primary.main',
                  width: 42,
                  height: 42,
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  border: user.avatar ? '2px solid rgba(65,198,198,0.4)' : 'none',
                }}
              >
                {!user.avatar && ([user.firstName?.[0], user.lastName?.[0]].filter(Boolean).join('').toUpperCase() || <Person />)}
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight={700} color="text.primary" noWrap>
                  {user.firstName} {user.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {user.email}
                </Typography>
              </Box>
            </Box>
            <Button
              fullWidth
              variant="outlined"
              color="error"
              startIcon={<Logout />}
              onClick={() => { onClose(); onLogout(); }}
              aria-label="Logout of your account"
              sx={{ borderRadius: '10px', fontWeight: 600, textTransform: 'none' }}
            >
              Logout
            </Button>
          </Box>
        ) : (
          <Stack spacing={1.5}>
            <Button
              fullWidth
              variant="outlined"
              color="primary"
              onClick={() => handleNav('/login')}
              aria-label="Go to login page"
              sx={{ borderRadius: '10px', fontWeight: 600, textTransform: 'none' }}
            >
              Log In
            </Button>
            <Button
              fullWidth
              variant="contained"
              color="secondary"
              onClick={() => handleNav('/register')}
              aria-label="Go to registration page"
              sx={{ borderRadius: '50px', fontWeight: 700, textTransform: 'none', color: 'white' }}
            >
              Get Started
            </Button>
          </Stack>
        )}
      </Box>
    </Drawer>
  );
};

/* ─────────────────────────────────────────────
   Footer
───────────────────────────────────────────── */
const Footer = ({ onNavigate }) => {
  const quickLinks = [
    { label: 'Home',        path: '/' },
    { label: 'About Us',    path: '/about-us' },
    { label: 'Marketplace', path: '/marketplace' },
    { label: 'Dashboard',   path: '/dashboard' },
    { label: 'Login',       path: '/login' },
  ];

  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: '#ffffff',
        borderTop: `1px solid ${BORDER_COLOR}`,
        py: 6,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        {/* Main footer grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: { xs: 4, md: 6 },
            mb: 4,
          }}
        >
          {/* Brand column */}
          <Box>
            <Box
              component="img"
              src="/logo.png"
              alt="Beyond5 Logo"
              sx={{ height: 36, width: 'auto', mb: 2, cursor: 'pointer' }}
              onClick={() => onNavigate('/')}
            />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ maxWidth: 340, lineHeight: 1.7 }}
            >
              Connecting people with allied health practitioners who offer therapy that fits real life.
            </Typography>
          </Box>

          {/* Quick links column */}
          <Box>
            <Typography
              variant="overline"
              fontWeight={700}
              color="text.primary"
              sx={{ letterSpacing: '0.08em', display: 'block', mb: 1.5 }}
            >
              Quick Links
            </Typography>
            <Stack spacing={1}>
              {quickLinks.map(({ label, path }) => (
                <Box
                  key={label}
                  onClick={() => onNavigate(path)}
                  role="link"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && onNavigate(path)}
                  aria-label={`Go to ${label}`}
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    width: 'fit-content',
                    transition: 'color 0.18s ease',
                    '&:hover': { color: 'primary.main' },
                    '&:focus-visible': {
                      outline: '2px solid',
                      outlineColor: 'primary.main',
                      outlineOffset: 2,
                      borderRadius: '2px',
                    },
                  }}
                >
                  {label}
                </Box>
              ))}
            </Stack>
          </Box>
        </Box>

        {/* Bottom bar */}
        <Divider sx={{ mb: 3 }} />
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            © {currentYear} Beyond5. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box
              component="span"
              aria-label="WCAG AA accessibility badge"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1,
                py: 0.25,
                bgcolor: 'rgba(0,128,128,0.08)',
                borderRadius: '4px',
                border: '1px solid rgba(0,128,128,0.2)',
              }}
            >
              <Typography variant="caption" fontWeight={700} color="primary.main" sx={{ fontSize: '0.7rem' }}>
                WCAG AA
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                accessible
              </Typography>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

/* ─────────────────────────────────────────────
   MainLayout
───────────────────────────────────────────── */
const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Close drawer on desktop resize
  useEffect(() => {
    if (!isMobile && drawerOpen) setDrawerOpen(false);
  }, [isMobile, drawerOpen]);

  // Shadow on scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const visibleNavLinks = NAV_LINKS(user).filter(
    (link) => !link.roles || link.roles.includes(user?.role ?? null)
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* ── Header ── */}
      <AppBar
        component="header"
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${BORDER_COLOR}`,
          boxShadow: scrolled ? '0 2px 12px rgba(11,29,43,0.08)' : 'none',
          transition: 'box-shadow 0.25s ease',
          zIndex: (t) => t.zIndex.drawer + 1,
        }}
      >
        <Container maxWidth="lg">
          <Toolbar
            disableGutters
            sx={{
              justifyContent: 'space-between',
              height: HEADER_HEIGHT,
              gap: 2,
            }}
          >
            {/* Logo */}
            <Box
              onClick={() => navigate('/')}
              role="link"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate('/')}
              aria-label="Go to homepage"
              sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                '&:focus-visible': {
                  outline: '2px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: 3,
                  borderRadius: '4px',
                },
              }}
            >
              <Box
                component="img"
                src="/logo.png"
                alt="Beyond5 Logo"
                sx={{ height: 38, width: 'auto', display: 'block' }}
              />
            </Box>

            {/* Desktop nav */}
            <Box
              component="nav"
              aria-label="Primary navigation"
              sx={{
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                gap: 0.5,
                flexGrow: 1,
                justifyContent: 'center',
              }}
            >
              {visibleNavLinks.map((link) => (
                <NavLink
                  key={link.label}
                  label={link.label}
                  path={link.path}
                  active={location.pathname === link.path}
                  onClick={() => navigate(link.path)}
                />
              ))}
            </Box>

            {/* Desktop right — auth */}
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                gap: 1.5,
                flexShrink: 0,
              }}
            >
              {!user ? (
                <>
                  <Button
                    variant="text"
                    onClick={() => navigate('/login')}
                    aria-label="Go to login page"
                    sx={{
                      color: 'text.primary',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      textTransform: 'none',
                      '&:hover': { color: 'primary.main', bgcolor: 'rgba(0,128,128,0.05)' },
                    }}
                  >
                    Log In
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => navigate('/register')}
                    aria-label="Go to registration page"
                    sx={{
                      borderRadius: '50px',
                      px: 2.5,
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      textTransform: 'none',
                      color: 'white',
                      boxShadow: 'none',
                      '&:hover': { boxShadow: '0 4px 14px rgba(0,128,128,0.3)' },
                      transition: 'box-shadow 0.2s ease',
                    }}
                  >
                    Get Started
                  </Button>
                </>
              ) : (
                <UserAvatarMenu
                  user={user}
                  onLogout={handleLogout}
                  onNavigate={navigate}
                />
              )}
            </Box>

            {/* Mobile hamburger */}
            <IconButton
              aria-label="Open navigation menu"
              aria-expanded={drawerOpen}
              aria-controls="mobile-nav-drawer"
              onClick={() => setDrawerOpen(true)}
              sx={{
                display: { xs: 'flex', md: 'none' },
                ml: 'auto',
                color: 'text.primary',
                border: `1px solid ${BORDER_COLOR}`,
                borderRadius: '8px',
                '&:hover': { bgcolor: 'rgba(0,128,128,0.06)' },
              }}
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      {/* ── Mobile Drawer ── */}
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user}
        navLinks={visibleNavLinks}
        activePathname={location.pathname}
        onNavigate={navigate}
        onLogout={handleLogout}
      />

      {/* ── Main content ── */}
      <Box
        component="main"
        sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}
      >
        <Outlet />
      </Box>

      {/* ── Footer ── */}
      <Footer onNavigate={navigate} />
    </Box>
  );
};

export default MainLayout;
