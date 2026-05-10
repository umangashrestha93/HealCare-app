import { io } from 'socket.io-client';

const configuredApiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
const SOCKET_URL = configuredApiUrl.replace('/api', '').replace('localhost', '127.0.0.1');

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
