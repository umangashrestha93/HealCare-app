import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Fab,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add,
  AutoAwesome,
  Close,
  CloseFullscreen,
  HealthAndSafety,
  OpenInFull,
  Send,
  SmartToy,
} from '@mui/icons-material';
import { aiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const starterQuestions = [
  'How do I book a session?',
  'Find a psychologist for anxiety',
  'Can I chat with my practitioner?',
];

const chipSx = {
  maxWidth: '100%',
  '& .MuiChip-label': {
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
};

const welcomeMessage = {
  _id: 'welcome-ai-message',
  role: 'assistant',
  content: 'Hi, I am your Beyond5 healthcare assistant. I can help you find verified practitioners, understand bookings, and use the app. I cannot diagnose symptoms or replace professional medical advice.',
  recommendations: [],
};

const readStorage = (key) => {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const writeStorage = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable in private browsing modes.
  }
};

const getMessageTime = (message) => {
  if (!message.createdAt) return '';
  return new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const AIAppAssistant = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const userId = user?._id || user?.id;
  const storageKey = userId ? `beyond5_ai_assistant_${userId}` : null;

  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([welcomeMessage]);
  const [unreadCount, setUnreadCount] = useState(0);
  const bottomRef = useRef(null);
  const tempMessageCounterRef = useRef(0);
  const hasHydratedRef = useRef(false);

  const latestAssistantMessage = useMemo(() => (
    [...messages].reverse().find((message) => message.role === 'assistant')
  ), [messages]);

  useEffect(() => {
    if (!storageKey || hasHydratedRef.current) return;
    const timer = setTimeout(() => {
      const savedState = readStorage(storageKey);

      if (savedState) {
        setOpen(Boolean(savedState.open));
        setExpanded(Boolean(savedState.expanded));
        setConversationId(savedState.conversationId || null);
        setInput(savedState.draft || '');
      }

      hasHydratedRef.current = true;
    }, 0);

    return () => clearTimeout(timer);
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey || !hasHydratedRef.current) return;
    writeStorage(storageKey, {
      open,
      expanded,
      conversationId,
      draft: input,
      updatedAt: new Date().toISOString(),
    });
  }, [conversationId, expanded, input, open, storageKey]);

  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, aiTyping, open]);

  useEffect(() => {
    if (!user || !open) return;

    let ignore = false;

    const loadConversation = async () => {
      try {
        const res = await aiService.getConversation(conversationId);
        if (ignore) return;
        setConversationId(res.data.conversation._id);
        setMessages(res.data.messages.length > 0 ? res.data.messages : [welcomeMessage]);
      } catch (err) {
        console.error('Failed to load AI conversation', err);
      }
    };

    loadConversation();

    return () => {
      ignore = true;
    };
  }, [conversationId, open, user]);

  useEffect(() => {
    if (!socket) return undefined;

    const handleTypingStart = ({ conversationId: incomingConversationId }) => {
      if (!conversationId || incomingConversationId === conversationId) setAiTyping(true);
    };

    const handleTypingStop = ({ conversationId: incomingConversationId }) => {
      if (!conversationId || incomingConversationId === conversationId) setAiTyping(false);
    };

    const handleAiMessage = ({ conversation, assistantMessage }) => {
      if (!conversation?._id || (conversationId && conversation._id !== conversationId)) return;
      setConversationId(conversation._id);
      setMessages((prev) => (
        prev.some((message) => message._id === assistantMessage._id)
          ? prev
          : [...prev, assistantMessage]
      ));
      setAiTyping(false);
      if (!open) setUnreadCount((count) => count + 1);
    };

    socket.on('ai_typing_start', handleTypingStart);
    socket.on('ai_typing_stop', handleTypingStop);
    socket.on('ai_message', handleAiMessage);

    return () => {
      socket.off('ai_typing_start', handleTypingStart);
      socket.off('ai_typing_stop', handleTypingStop);
      socket.off('ai_message', handleAiMessage);
    };
  }, [conversationId, open, socket]);

  if (!user || user.role !== 'client') return null;

  const openAssistant = () => {
    setUnreadCount(0);
    setOpen(true);
  };

  const askAssistant = async (text) => {
    const question = text.trim();
    if (!question || loading) return;
    tempMessageCounterRef.current += 1;

    const tempUserMessage = {
      _id: `temp-user-${tempMessageCounterRef.current}`,
      role: 'user',
      content: question,
      createdAt: new Date().toISOString(),
    };

    openAssistant();
    setMessages((prev) => [...prev, tempUserMessage]);
    setInput('');
    setLoading(true);
    setAiTyping(true);

    try {
      const res = await aiService.chat({ message: question, conversationId });
      const { conversation, userMessage, assistantMessage } = res.data;
      setConversationId(conversation._id);
      setMessages((prev) => {
        const withoutTemp = prev.map((message) => (
          message._id === tempUserMessage._id ? userMessage : message
        ));
        return withoutTemp.some((message) => message._id === assistantMessage._id)
          ? withoutTemp
          : [...withoutTemp, assistantMessage];
      });
    } catch (err) {
      console.error('AI assistant failed', err);
      tempMessageCounterRef.current += 1;
      setMessages((prev) => [...prev, {
        _id: `error-ai-${tempMessageCounterRef.current}`,
        role: 'assistant',
        content: 'I could not reach the AI service right now. Please try again, or use Marketplace to find a verified practitioner.',
        recommendations: [],
        createdAt: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
      setAiTyping(false);
    }
  };

  const startNewChat = async () => {
    if (loading) return;

    try {
      setLoading(true);
      const res = await aiService.createConversation();
      setConversationId(res.data.conversation._id);
      setMessages([welcomeMessage]);
      setInput('');
      setUnreadCount(0);
      openAssistant();
    } catch (err) {
      console.error('Failed to start new AI conversation', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    askAssistant(input);
  };

  const goTo = (path) => {
    setOpen(false);
    navigate(path);
  };

  const renderRecommendations = (recommendations = []) => {
    if (recommendations.length === 0) return null;

    return (
      <Stack spacing={1} sx={{ mt: 1, minWidth: 0 }}>
        <Typography variant="caption" fontWeight={800}>Relevant verified practitioners</Typography>
        {recommendations.map((item) => (
          <Paper key={item.practitionerId} variant="outlined" sx={{ p: 1, borderRadius: 1.5, minWidth: 0, overflow: 'hidden' }}>
            <Typography variant="body2" fontWeight={800} sx={{ overflowWrap: 'anywhere' }}>{item.name}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', overflowWrap: 'anywhere', lineHeight: 1.4 }}>
              {item.discipline} · {item.rating || '0.0'} stars · ${item.fee}
            </Typography>
            <Stack direction="row" flexWrap="wrap" sx={{ my: 0.75, gap: 0.5, minWidth: 0 }}>
              {(item.reasons || []).map((reason) => (
                <Chip key={reason} label={reason} size="small" variant="outlined" sx={chipSx} />
              ))}
            </Stack>
            <Button size="small" variant="contained" onClick={() => goTo(`/booking?practitioner=${item.practitionerId}`)}>
              Book
            </Button>
          </Paper>
        ))}
      </Stack>
    );
  };

  return (
    <>
      {!open && (
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ position: 'fixed', right: { xs: 16, md: 24 }, bottom: { xs: 16, md: 24 }, zIndex: 1300 }}
        >
          <Paper
            elevation={4}
            sx={{
              display: { xs: 'none', md: 'block' },
              width: 260,
              maxWidth: 'calc(100vw - 112px)',
              minWidth: 0,
              px: 1.5,
              py: 1,
              borderRadius: 2,
              cursor: 'pointer',
              overflow: 'hidden',
            }}
            onClick={openAssistant}
          >
            <Typography variant="caption" fontWeight={900} sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              AI assistant
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                overflowWrap: 'anywhere',
                lineHeight: 1.35,
              }}
            >
              {latestAssistantMessage?.content || 'Continue your healthcare chat'}
            </Typography>
          </Paper>
          <Badge badgeContent={unreadCount} color="error" overlap="circular">
            <Fab color="secondary" onClick={openAssistant} aria-label="Open AI healthcare assistant">
              <SmartToy />
            </Fab>
          </Badge>
        </Stack>
      )}

      {open && (
        <Paper
          elevation={10}
          sx={{
            position: 'fixed',
            right: { xs: 0, md: expanded ? 32 : 24 },
            bottom: { xs: 0, md: expanded ? 32 : 24 },
            width: {
              xs: '100vw',
              sm: expanded ? 760 : 430,
            },
            height: {
              xs: '100dvh',
              sm: expanded ? 'min(760px, calc(100vh - 64px))' : 640,
            },
            borderRadius: { xs: 0, sm: 2 },
            overflow: 'hidden',
            zIndex: 1300,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ p: 2, bgcolor: 'primary.main', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: '#fff' }}>
                <HealthAndSafety />
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography fontWeight={900} noWrap>AI Healthcare Assistant</Typography>
                <Typography variant="caption" sx={{ opacity: 0.85 }} noWrap>
                  Persistent session · Memory enabled · {aiTyping || loading ? 'AI is typing' : 'Ready'}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="New chat">
                <span>
                  <IconButton onClick={startNewChat} disabled={loading} size="small" sx={{ color: '#fff' }} aria-label="Start new AI chat">
                    <Add />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title={expanded ? 'Compact view' : 'Expanded view'}>
                <IconButton onClick={() => setExpanded((value) => !value)} size="small" sx={{ color: '#fff' }} aria-label="Toggle AI assistant size">
                  {expanded ? <CloseFullscreen /> : <OpenInFull />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Minimize">
                <IconButton onClick={() => setOpen(false)} size="small" sx={{ color: '#fff' }} aria-label="Minimize AI assistant">
                  <Close />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>

          <Alert severity="info" sx={{ borderRadius: 0 }}>
            No diagnosis. For medical decisions, consult a verified practitioner.
          </Alert>

          <Stack
            direction="row"
            flexWrap="wrap"
            sx={{ px: 2, py: 1, bgcolor: '#fff', gap: 0.75, maxHeight: 92, overflowY: 'auto' }}
          >
            <Chip size="small" label="Find care" onClick={() => askAssistant('Help me find the right practitioner')} sx={chipSx} />
            <Chip size="small" label="Book session" onClick={() => goTo('/marketplace')} sx={chipSx} />
            <Chip size="small" label="My bookings" onClick={() => goTo('/dashboard')} sx={chipSx} />
            <Chip size="small" label="Human chat" onClick={() => goTo('/chat')} sx={chipSx} />
          </Stack>

          <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: '#efeae2' }}>
            <Stack spacing={1.5}>
              {messages.map((message) => {
                const isUser = message.role === 'user';
                return (
                  <Box key={message._id} sx={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                    <Box
                      sx={{
                        maxWidth: { xs: '94%', sm: expanded ? '72%' : '86%' },
                        minWidth: 0,
                        p: 1.5,
                        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        bgcolor: isUser ? '#d9fdd3' : '#fff',
                        color: 'text.primary',
                        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.12)',
                      }}
                    >
                      {!isUser && (
                        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.5 }}>
                          <AutoAwesome sx={{ fontSize: 16, color: 'secondary.main' }} />
                          <Typography variant="caption" fontWeight={900}>Beyond5 AI</Typography>
                        </Stack>
                      )}
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.55, overflowWrap: 'anywhere' }}>
                        {message.content}
                      </Typography>
                      {!isUser && renderRecommendations(message.recommendations)}
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}>
                        {getMessageTime(message)}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
              {(loading || aiTyping) && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <Box sx={{ px: 1.5, py: 1, borderRadius: '16px 16px 16px 4px', bgcolor: '#fff', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.12)' }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CircularProgress size={14} />
                      <Typography variant="body2" color="text.secondary">AI is typing...</Typography>
                    </Stack>
                  </Box>
                </Box>
              )}
              <div ref={bottomRef} />
            </Stack>
          </Box>

          <Divider />

          <Box sx={{ p: 1.5, bgcolor: '#fff' }}>
            <Stack direction="row" flexWrap="wrap" sx={{ mb: 1, gap: 0.75 }}>
              {starterQuestions.map((question) => (
                <Button
                  key={question}
                  size="small"
                  variant="outlined"
                  onClick={() => askAssistant(question)}
                  sx={{
                    maxWidth: { xs: '100%', sm: 190 },
                    minHeight: 30,
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    overflow: 'hidden',
                  }}
                >
                  <Typography variant="caption" noWrap sx={{ minWidth: 0 }}>
                    {question}
                  </Typography>
                </Button>
              ))}
            </Stack>
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Ask about care or the app..."
                value={input}
                onChange={(event) => setInput(event.target.value)}
                disabled={loading}
              />
              <IconButton type="submit" color="primary" disabled={!input.trim() || loading} aria-label="Send AI message">
                <Send />
              </IconButton>
            </Box>
          </Box>
        </Paper>
      )}
    </>
  );
};

export default AIAppAssistant;
