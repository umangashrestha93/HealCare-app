import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { chatService, authService } from '../services/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket, markMessagesSeen } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [activeUserId, setActiveUserId] = useState(null);

  // Refs to avoid dependency loops
  const conversationsRef = useRef([]);
  const selectedUserRef = useRef(null);
  const activeConversationIdRef = useRef(null);
  const activeUserIdRef = useRef(null);

  // Sync refs with state
  useEffect(() => { conversationsRef.current = conversations; }, [conversations]);
  useEffect(() => { selectedUserRef.current = selectedUser; }, [selectedUser]);
  useEffect(() => { activeConversationIdRef.current = activeConversationId; }, [activeConversationId]);
  useEffect(() => { activeUserIdRef.current = activeUserId; }, [activeUserId]);

  const sortConversations = useCallback((items) => (
    [...items].sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
  ), []);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await chatService.getConversations();
      setConversations(sortConversations(res.data || []));
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch conversations', err);
      setLoading(false);
    }
  }, [sortConversations]);

  const upsertConversationPreview = useCallback((message) => {
    const senderId = (message.senderId?._id || message.senderId)?.toString();
    const receiverId = (message.receiverId?._id || message.receiverId)?.toString();
    const currentUserId = (user?._id || user?.id)?.toString();
    const otherUserId = senderId === currentUserId ? receiverId : senderId;
    const hasConversation = conversationsRef.current.some((conversation) => (
      (conversation.user?._id || conversation.user?.id)?.toString() === otherUserId
    ));

    if (!hasConversation) {
      fetchConversations();
      return;
    }

    setConversations((prev) => {
      const next = prev.map((conversation) => {
        const conversationUserId = (conversation.user?._id || conversation.user?.id)?.toString();
        if (conversationUserId !== otherUserId) return conversation;

        return {
          ...conversation,
          lastMessage: message,
          unreadCount: activeUserIdRef.current === otherUserId ? 0 : (conversation.unreadCount || 0) + 1,
          updatedAt: message.createdAt,
        };
      });

      return sortConversations(next);
    });
  }, [fetchConversations, sortConversations, user]);

  const fetchMessages = useCallback(async (otherUserId) => {
    if (!otherUserId) return;
    const targetId = otherUserId.toString();
    try {
      setMessagesLoading(true);
      const res = await chatService.getMessages(targetId);
      const nextMessages = res.data || [];
      setMessages(nextMessages);
      setActiveUserId(targetId);
      
      if (nextMessages.length > 0) {
        const convId = nextMessages[0].conversationId;
        setActiveConversationId(convId);
      } else {
        setActiveConversationId(null);
      }
      
      setMessagesLoading(false);
      fetchConversations();
    } catch (err) {
      console.error('Failed to fetch messages', err);
      setMessagesLoading(false);
    }
  }, [fetchConversations]);

  // Initial load
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  const selectUserById = useCallback(async (id) => {
    if (!id) {
      setSelectedUser(null);
      return;
    }

    const targetId = id.toString();
    const currentSelected = selectedUserRef.current;
    if (currentSelected && ((currentSelected._id || currentSelected.id)?.toString() === targetId)) {
      return;
    }

    const existing = conversationsRef.current.find(c => (c.user?._id || c.user?.id)?.toString() === targetId);
    if (existing) {
      setSelectedUser(existing.user);
    } else {
      try {
        const res = await authService.getUserById(targetId);
        setSelectedUser(res.user);
      } catch (err) {
        console.error('User fetch failed', err);
      }
    }
  }, []); 

  // Fetch messages when user is selected
  useEffect(() => {
    const targetId = (selectedUser?._id || selectedUser?.id)?.toString();
    if (!targetId) {
      setMessages([]);
      setActiveConversationId(null);
      setActiveUserId(null);
      return;
    }

    if (targetId !== activeUserIdRef.current) {
      fetchMessages(targetId);
    }
  }, [selectedUser, fetchMessages]);

  // Socket listeners for messages
  useEffect(() => {
    if (socket) {
      const handleReceive = (msg) => {
        const targetId = (selectedUserRef.current?._id || selectedUserRef.current?.id)?.toString();
        const senderId = (msg.senderId?._id || msg.senderId)?.toString();
        
        if (targetId === senderId) {
          setMessages(prev => prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]);
          if (activeConversationIdRef.current) {
            markMessagesSeen([msg._id], activeConversationIdRef.current);
          }
        }
        upsertConversationPreview(msg);
      };

      const handleSeen = (messageIds) => {
        setMessages(prev => prev.map(m => 
          messageIds.includes(m._id) ? { ...m, seen: true, delivered: true } : m
        ));
      };

      const handleDelivered = (messageIds) => {
        setMessages(prev => prev.map(m =>
          messageIds.includes(m._id) ? { ...m, delivered: true } : m
        ));
      };

      socket.on('receiveMessage', handleReceive);
      socket.on('messages_seen', handleSeen);
      socket.on('messages_delivered', handleDelivered);
      
      return () => {
        socket.off('receiveMessage', handleReceive);
        socket.off('messages_seen', handleSeen);
        socket.off('messages_delivered', handleDelivered);
      };
    }
  }, [socket, markMessagesSeen, upsertConversationPreview]); 

  const sendMessage = useCallback(async (content) => {
    const targetId = selectedUserRef.current?._id || selectedUserRef.current?.id;
    if (!targetId || !content.trim()) return;

    const tempId = `temp-${Date.now()}`;
    const tempMsg = {
      _id: tempId,
      content,
      senderId: { _id: user._id || user.id, firstName: user.firstName, lastName: user.lastName, avatar: user.avatar },
      createdAt: new Date().toISOString(),
      status: 'sending'
    };

    setMessages(prev => [...prev, tempMsg]);

    try {
      const res = await chatService.sendMessage(targetId, content);
      setMessages(prev => prev.map(m => m._id === tempId ? { ...res.data, status: 'sent' } : m));
      if (!activeConversationIdRef.current) setActiveConversationId(res.data.conversationId);
      setActiveUserId(targetId);
      fetchConversations();
    } catch (err) {
      console.error('Failed to send message', err);
      setMessages(prev => prev.map(m => m._id === tempId ? { ...m, status: 'error' } : m));
    }
  }, [fetchConversations, user]);

  const value = useMemo(() => ({
    conversations,
    selectedUser,
    messages,
    loading,
    messagesLoading,
    activeConversationId,
    sendMessage,
    setSelectedUser,
    fetchConversations,
    selectUserById
  }), [
    activeConversationId,
    conversations,
    fetchConversations,
    loading,
    messages,
    messagesLoading,
    selectUserById,
    selectedUser,
    sendMessage,
  ]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within ChatProvider');
  return context;
};
