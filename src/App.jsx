import { useEffect } from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import { Provider } from 'react-redux';
import { store } from './store';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { PresenceProvider } from './context/PresenceContext';
import { ChatProvider } from './context/ChatContext';
import AppRoutes from './routes/AppRoutes';
import AIAppAssistant from './components/assistant/AIAppAssistant';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <SocketProvider>
            <PresenceProvider>
              <Router>
                <ScrollToTop />
                <ChatProvider>
                  <AppRoutes />
                  <AIAppAssistant />
                </ChatProvider>
              </Router>
            </PresenceProvider>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
