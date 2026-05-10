import { BrowserRouter as Router } from 'react-router-dom';
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

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <SocketProvider>
            <PresenceProvider>
              <Router>
                <ChatProvider>
                  <AppRoutes />
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