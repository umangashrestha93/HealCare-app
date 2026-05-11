import { io } from 'socket.io-client';

const DEFAULT_API_URL = 'http://127.0.0.1:5001/api';
const configuredApiUrl = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/+$/, '');
const SOCKET_URL = configuredApiUrl.replace(/\/api$/, '');

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ['websocket', 'polling']
});

export const connectSocket = (token) => {
  if (socket.connected) return;
  socket.auth = { token };
  socket.connect();
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};
