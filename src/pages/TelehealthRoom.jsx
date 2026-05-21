import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import {
  ArrowBack,
  CallEnd,
  Mic,
  MicOff,
  Videocam,
  VideocamOff,
  VideoCall
} from '@mui/icons-material';
import { bookingService } from '../services/api';
import { useSocket } from '../context/SocketContext';

const rtcConfig = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

const TelehealthRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerRef = useRef(null);

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('Preparing secure room');
  const [error, setError] = useState('');
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [remoteConnected, setRemoteConnected] = useState(false);

  const cleanupPeer = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    setRemoteConnected(false);
  }, []);

  const stopMedia = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  }, []);

  const createPeerConnection = useCallback(() => {
    if (peerRef.current) return peerRef.current;

    const peer = new RTCPeerConnection(rtcConfig);
    localStreamRef.current?.getTracks().forEach((track) => {
      peer.addTrack(track, localStreamRef.current);
    });

    peer.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      setRemoteConnected(true);
      setStatus('Connected');
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket?.emit('telehealth:signal', {
          roomId,
          signal: { type: 'candidate', candidate: event.candidate }
        });
      }
    };

    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'connected') {
        setRemoteConnected(true);
        setStatus('Connected');
      }
      if (['disconnected', 'failed', 'closed'].includes(peer.connectionState)) {
        setRemoteConnected(false);
        setStatus('Waiting for participant');
      }
    };

    peerRef.current = peer;
    return peer;
  }, [roomId, socket]);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        setLoading(true);
        const res = await bookingService.getTelehealthRoom(roomId);
        if (!active) return;
        setRoom(res.data);
        if (!res.data?.canJoin) {
          setError('This telehealth room is not ready because the booking is not confirmed.');
        }
      } catch (err) {
        if (active) setError(typeof err === 'string' ? err : 'Unable to open telehealth room.');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [roomId]);

  useEffect(() => {
    if (!room?.canJoin || !socket) return undefined;
    let cancelled = false;

    (async () => {
      try {
        setStatus('Requesting camera and microphone');
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        socket.emit('telehealth:join', { roomId });
        setStatus('Waiting for participant');
      } catch {
        setError('Camera or microphone permission is required to join the video session.');
      }
    })();

    return () => {
      cancelled = true;
      socket.emit('telehealth:leave', { roomId });
      cleanupPeer();
      stopMedia();
    };
  }, [cleanupPeer, room, roomId, socket, stopMedia]);

  useEffect(() => {
    if (!room?.canJoin || !socket) return undefined;

    const sendSignal = (signal) => {
      socket.emit('telehealth:signal', { roomId, signal });
    };

    const handlePeerJoined = async () => {
      try {
        const peer = createPeerConnection();
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        sendSignal({ type: offer.type, sdp: offer.sdp });
      } catch {
        setError('Unable to start video connection.');
      }
    };

    const handleSignal = async ({ signal }) => {
      try {
        const peer = createPeerConnection();

        if (signal.type === 'offer') {
          await peer.setRemoteDescription(new RTCSessionDescription(signal));
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          sendSignal({ type: answer.type, sdp: answer.sdp });
          return;
        }

        if (signal.type === 'answer') {
          await peer.setRemoteDescription(new RTCSessionDescription(signal));
          return;
        }

        if (signal.type === 'candidate' && signal.candidate) {
          await peer.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      } catch {
        setError('Video connection failed. Please refresh and try again.');
      }
    };

    const handlePeerLeft = () => {
      cleanupPeer();
      setStatus('Participant left');
    };

    socket.on('telehealth:peer-joined', handlePeerJoined);
    socket.on('telehealth:signal', handleSignal);
    socket.on('telehealth:peer-left', handlePeerLeft);

    return () => {
      socket.off('telehealth:peer-joined', handlePeerJoined);
      socket.off('telehealth:signal', handleSignal);
      socket.off('telehealth:peer-left', handlePeerLeft);
    };
  }, [cleanupPeer, createPeerConnection, room, roomId, socket]);

  const toggleMic = () => {
    const next = !micOn;
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = next;
    });
    setMicOn(next);
  };

  const toggleCamera = () => {
    const next = !cameraOn;
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = next;
    });
    setCameraOn(next);
  };

  const leaveRoom = () => {
    socket?.emit('telehealth:leave', { roomId });
    cleanupPeer();
    stopMedia();
    navigate('/dashboard');
  };

  const booking = room?.booking;
  const clientName = [booking?.clientId?.firstName, booking?.clientId?.lastName].filter(Boolean).join(' ');
  const practitionerName = [
    booking?.practitionerId?.userId?.firstName,
    booking?.practitionerId?.userId?.lastName
  ].filter(Boolean).join(' ');

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: '#07111f' }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress sx={{ color: '#fff' }} />
          <Typography color="#fff" fontWeight={800}>Opening telehealth room</Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#07111f', color: '#fff', py: { xs: 2, md: 3 } }}>
      <Container maxWidth="xl">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <IconButton onClick={() => navigate('/dashboard')} sx={{ color: '#fff', border: '1px solid rgba(255,255,255,0.16)' }}>
              <ArrowBack />
            </IconButton>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h5" fontWeight={900} noWrap>
                Beyond5 Telehealth
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.72)' }} noWrap>
                {practitionerName || 'Practitioner'} with {clientName || 'Client'}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" justifyContent={{ xs: 'space-between', md: 'flex-end' }}>
            <Chip
              icon={<VideoCall />}
              label={status}
              color={remoteConnected ? 'success' : 'default'}
              sx={{ fontWeight: 900, bgcolor: remoteConnected ? undefined : 'rgba(255,255,255,0.12)', color: '#fff' }}
            />
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.72)' }}>
              {booking ? `${new Date(booking.appointmentDate).toLocaleDateString()} at ${booking.startTime}` : ''}
            </Typography>
          </Stack>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 360px' },
            gap: 2,
            minHeight: { xs: 'auto', lg: 'calc(100vh - 148px)' }
          }}
        >
          <Paper
            elevation={0}
            sx={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 4,
              bgcolor: '#020617',
              border: '1px solid rgba(255,255,255,0.12)',
              minHeight: { xs: 420, md: 620 }
            }}
          >
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: remoteConnected ? 'block' : 'none' }}
            />

            {!remoteConnected && (
              <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center', p: 3 }}>
                <Stack spacing={2} alignItems="center">
                  <Avatar sx={{ width: 76, height: 76, bgcolor: 'primary.main' }}>
                    <VideoCall sx={{ fontSize: 42 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={900}>Waiting for the other participant</Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.68)', mt: 0.75 }}>
                      Keep this page open. The call connects automatically when both people join.
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            )}

            <Box
              sx={{
                position: 'absolute',
                right: { xs: 12, md: 20 },
                bottom: { xs: 88, md: 24 },
                width: { xs: 130, sm: 190, md: 240 },
                aspectRatio: '16 / 10',
                borderRadius: 3,
                overflow: 'hidden',
                border: '2px solid rgba(255,255,255,0.35)',
                bgcolor: '#111827'
              }}
            >
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
              />
              {!cameraOn && (
                <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', bgcolor: '#111827' }}>
                  <VideocamOff />
                </Box>
              )}
            </Box>

            <Stack
              direction="row"
              spacing={1.5}
              justifyContent="center"
              sx={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: { xs: 16, md: 24 }
              }}
            >
              <IconButton onClick={toggleMic} sx={{ width: 54, height: 54, color: '#fff', bgcolor: micOn ? 'rgba(255,255,255,0.14)' : 'warning.main', '&:hover': { bgcolor: micOn ? 'rgba(255,255,255,0.22)' : 'warning.dark' } }}>
                {micOn ? <Mic /> : <MicOff />}
              </IconButton>
              <IconButton onClick={toggleCamera} sx={{ width: 54, height: 54, color: '#fff', bgcolor: cameraOn ? 'rgba(255,255,255,0.14)' : 'warning.main', '&:hover': { bgcolor: cameraOn ? 'rgba(255,255,255,0.22)' : 'warning.dark' } }}>
                {cameraOn ? <Videocam /> : <VideocamOff />}
              </IconButton>
              <IconButton onClick={leaveRoom} sx={{ width: 62, height: 54, borderRadius: 4, color: '#fff', bgcolor: 'error.main', '&:hover': { bgcolor: 'error.dark' } }}>
                <CallEnd />
              </IconButton>
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              bgcolor: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff',
              alignSelf: 'stretch'
            }}
          >
            <Typography variant="h6" fontWeight={900}>Session Details</Typography>
            <Stack spacing={2.25} sx={{ mt: 3 }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.58)', fontWeight: 900 }}>CLIENT</Typography>
                <Typography fontWeight={800}>{clientName || 'Client'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.58)', fontWeight: 900 }}>PRACTITIONER</Typography>
                <Typography fontWeight={800}>{practitionerName || 'Practitioner'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.58)', fontWeight: 900 }}>PAYMENT</Typography>
                <Typography fontWeight={800}>{booking?.paymentStatus?.toUpperCase() || 'PAID'}</Typography>
              </Box>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                This is an in-app video room using Socket.IO signalling and browser WebRTC.
              </Alert>
              <Button fullWidth variant="outlined" onClick={() => navigate('/dashboard')} sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.35)', borderRadius: 2, fontWeight: 900 }}>
                Back to dashboard
              </Button>
            </Stack>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default TelehealthRoom;
