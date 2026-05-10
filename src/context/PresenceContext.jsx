import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const PresenceContext = createContext(null);

export const PresenceProvider = ({ children }) => {
  const [onlineStatusMap, setOnlineStatusMap] = useState({}); // { [userId]: { isOnline, lastSeen } }
  const { user } = useAuth();
  const { socket, onlineStatusMap: socketOnlineStatusMap } = useSocket();
  const userId = user?._id || user?.id;

  useEffect(() => {
    if (!userId || !socket) {
      setOnlineStatusMap({});
      return;
    }

    const handleInitial = (userIds) => {
      const map = {};
      userIds.forEach(id => {
        map[id] = { isOnline: true, lastSeen: null };
      });
      setOnlineStatusMap(map);
    };

    const handleOnline = (uid) => {
      setOnlineStatusMap(prev => ({
        ...prev,
        [uid]: { isOnline: true, lastSeen: null }
      }));
    };

    const handleOffline = ({ userId: uid, lastSeen }) => {
      setOnlineStatusMap(prev => ({
        ...prev,
        [uid]: { isOnline: false, lastSeen }
      }));
    };

    socket.on('initialOnlineUsers', handleInitial);
    socket.on('user_online', handleOnline);
    socket.on('user_offline', handleOffline);

    return () => {
      socket.off('initialOnlineUsers', handleInitial);
      socket.off('user_online', handleOnline);
      socket.off('user_offline', handleOffline);
    };
  }, [socket, userId]);

  useEffect(() => {
    setOnlineStatusMap(socketOnlineStatusMap || {});
  }, [socketOnlineStatusMap]);

  const isUserOnline = useCallback((uid) => onlineStatusMap[uid]?.isOnline || false, [onlineStatusMap]);
  const getUserLastSeen = useCallback((uid) => onlineStatusMap[uid]?.lastSeen || null, [onlineStatusMap]);

  return (
    <PresenceContext.Provider value={{ onlineStatusMap, isUserOnline, getUserLastSeen }}>
      {children}
    </PresenceContext.Provider>
  );
};

export const usePresence = () => {
  const context = useContext(PresenceContext);
  if (!context) throw new Error('usePresence must be used within a PresenceProvider');
  return context;
};
