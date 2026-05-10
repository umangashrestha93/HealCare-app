import { memo } from 'react';
import { Typography } from '@mui/material';
import { usePresence } from '../../context/PresenceContext';

const PresenceIndicator = memo(({ userId, initialPresence }) => {
  const { onlineStatusMap } = usePresence();
  
  const status = onlineStatusMap[userId];
  const isOnline = status?.isOnline || initialPresence?.isOnline;
  const lastSeen = status?.lastSeen || initialPresence?.lastSeen;

  const formatLastSeen = (date) => {
    if (!date) return 'Offline';
    const last = new Date(date);
    const now = new Date();
    const diffMs = now - last;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Last seen just now';
    if (diffMins < 60) return `Last seen ${diffMins}m ago`;
    if (diffHours < 24) return `Last seen ${diffHours}h ago`;
    if (diffDays === 1) return `Last seen yesterday at ${last.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    return `Last seen on ${last.toLocaleDateString()}`;
  };

  if (isOnline) {
    return <Typography variant="caption" sx={{ color: '#44b700', fontWeight: 600 }}>Online</Typography>;
  }

  return (
    <Typography variant="caption" color="text.secondary">
      {formatLastSeen(lastSeen)}
    </Typography>
  );
});

export default PresenceIndicator;
