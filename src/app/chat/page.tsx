'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Pusher from 'pusher-js';
import { getAvatarUrl } from '@/lib/avatars';
import { format } from 'date-fns';
import CreateGroupModal from '@/components/CreateGroupModal';
import TaskModal from '@/components/TaskModal';
import { fetchWithCSRF } from '@/utils/fetchWithCSRF';
import './chat.css';


interface User {
  id: number;
  name: string;
  screen_name?: string;
  display_preference?: string;
  avatar_url?: string;
  gender?: string;
  role?: string;
  college?: string;
  city?: string;
  skills?: string;
  credits?: number;
  created_at?: string;
  role_in_group?: 'Director' | 'Admin' | 'Member';
}


interface ChatMessage {
  id: number | string; // Support temporary string IDs for optimistic updates
  conversation_id: number;
  sender_id: number;
  content: string;
  created_at: string;
  sender: User;
  status?: 'sending' | 'error' | 'sent';
}

interface Conversation {
  id: number;
  name?: string;
  is_group?: boolean;
  avatar_url?: string;
  users: User[];
  messages: ChatMessage[];
  unread?: number;
  updated_at?: string;
  my_role?: 'Director' | 'Admin' | 'Member';
}

interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'Todo' | 'In Progress' | 'Review' | 'Done';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assignee_id?: number;
  creator_id: number;
  due_date?: string;
  reward_credits: number;
  approval_status: 'Pending' | 'Approved';
  completed_at?: string;
  approved_at?: string;
  created_at: string;
}

type ChatState = 'loading' | 'ready' | 'error' | 'not-found';

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [state, setState] = useState<ChatState>('loading');
  const [statusText, setStatusText] = useState('Synchronizing with Nexus...');
  const [messageLoading, setMessageLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typingUsers, setTypingUsers] = useState<{[key: number]: string}>({});
  
  // New interaction states
  const [showSearch, setShowSearch] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Task states
  const [activeTab, setActiveTab] = useState<'chat' | 'tasks'>('chat');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Group messages by date
  const groupMessagesByDate = (msgs: ChatMessage[]) => {
    const groups: { [key: string]: ChatMessage[] } = {};
    msgs.forEach(msg => {
      const date = format(new Date(msg.created_at), 'yyyy-MM-dd');
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    return groups;
  };

  const getFriendlyDate = (dateStr: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
    if (dateStr === today) return 'TODAY';
    if (dateStr === yesterday) return 'YESTERDAY';
    return format(new Date(dateStr), 'MMMM d, yyyy').toUpperCase();
  };


  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (activeTab === 'chat' && !messageLoading) {
      scrollToBottom('auto');
    }
  }, [messages, activeTab, messageLoading]);
  const pusherRef = useRef<Pusher | null>(null);
  const pusherConfigRef = useRef<{key: string, cluster: string} | null>(null);
  const typingTimeoutRef = useRef<{[key: number]: NodeJS.Timeout}>({});

  const activeRecipient = useMemo(() => {
    if (!activeConv || !user) return null;
    const member = activeConv.users.find((member) => member.id !== user.id);
    if (!member && !activeConv.is_group) {
      return { id: -1, name: 'Deleted User', role: 'Unknown', gender: 'Other' };
    }
    return member || null;
  }, [activeConv, user]);

  const getDisplayName = useCallback((u: User | null) => {
    if (!u) return 'Unnamed Creator';
    const name = u.name || 'Anonymous Creator';
    const screenName = u.screen_name || '';
    const preference = u.display_preference || 'Real Name Only';
    
    if (preference === 'Screen Name Only' && screenName) return screenName;
    if (preference === 'Both' && screenName) return `${name} • ${screenName}`;
    return name;
  }, []);

  const getRecipient = useCallback((conv: Conversation) => {
    const member = conv.users.find((member) => member.id !== user?.id);
    if (!member && !conv.is_group) {
      return { id: -1, name: 'Deleted User', role: 'Unknown', gender: 'Other' } as User;
    }
    return member || conv.users[0];
  }, [user?.id]);

  const setActiveConversation = useCallback((conversation: Conversation, updateUrl = true) => {
    setActiveConv(conversation);
    setMessages([]);
    setTasks([]);
    setActiveTab('chat');
    localStorage.setItem('take_one_last_conversation', String(conversation.id));

    // Clear unread for this conversation locally
    setConversations(prev => prev.map(c => c.id === conversation.id ? { ...c, unread: 0 } : c));

    if (updateUrl && typeof window !== 'undefined') {
      const url = `/chat?conversationId=${conversation.id}`;
      window.history.replaceState(null, '', url);
    }
  }, []);

  const fetchMessages = useCallback(async (convId: number, beforeId: number | null = null) => {
    if (beforeId) setIsLoadingMore(true);
    else setMessageLoading(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('take_one_token') : null;
      const url = `/api/chat/messages/${convId}${beforeId ? `?before=${beforeId}` : ''}`;
      const res = await fetch(url, {
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (res.status === 401) {
        window.location.href = '/?auth=login';
        return;
      }

      const json = await res.json();

      if (!res.ok || !json.success) {
        setState(res.status === 403 || res.status === 404 ? 'not-found' : 'error');
        setStatusText(json.message || 'Signal lost. Could not load message history.');
        return;
      }

      if (beforeId) {
        setMessages(prev => [...(json.data || []), ...prev]);
      } else {
        setMessages(json.data || []);
      }

      setHasMore(json.hasMore ?? false);
      setState('ready');
      if (!beforeId) setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err: any) {
      console.error('Failed to fetch messages', err);
      setState('error');
      setStatusText(err.message || 'The Nexus connection was interrupted.');
    } finally {
      setMessageLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  const fetchTasks = useCallback(async (convId: number) => {
    setTasksLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('take_one_token') : null;
      const res = await fetch(`/api/tasks/${convId}`, {
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const json = await res.json();
      if (json.success) {
        setTasks(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    } finally {
      setTasksLoading(false);
    }
  }, []);

  const createTask = useCallback(async (taskData: any) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('take_one_token') : null;
      const res = await fetchWithCSRF('/api/tasks', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: JSON.stringify(taskData)
      });
      const json = await res.json();
      if (!json.success) {
        alert(json.message || 'Mission failed: Could not assign task.');
      }
    } catch (err) {
      console.error('Failed to create task', err);
    }
  }, []);

  const updateTaskStatus = useCallback(async (taskId: number, status: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('take_one_token') : null;
      await fetchWithCSRF(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: JSON.stringify({ status })
      });
    } catch (err) {
      console.error('Failed to update task status', err);
    }
  }, []);

  const deleteTask = useCallback(async (taskId: number) => {
    if (!confirm('Are you sure you want to abort this mission?')) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('take_one_token') : null;
      await fetchWithCSRF(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
    } catch (err) {
      console.error('Failed to delete task', err);
    }
  }, []);

  const approveTask = useCallback(async (taskId: number) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('take_one_token') : null;
      const res = await fetchWithCSRF(`/api/tasks/${taskId}/approve`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const json = await res.json();
      if (!json.success) {
        alert(json.message || 'Mission failed: Could not approve task.');
      }
    } catch (err) {
      console.error('Failed to approve task', err);
    }
  }, []);

  const loadMoreMessages = useCallback(() => {
    if (hasMore && !isLoadingMore && activeConv && messages.length > 0) {
      const oldestId = typeof messages[0].id === 'number' ? messages[0].id : null;
      if (oldestId) fetchMessages(activeConv.id, oldestId);
    }
  }, [hasMore, isLoadingMore, activeConv, messages, fetchMessages]);


  const fetchConversations = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('take_one_token') : null;
      const res = await fetch('/api/chat/conversations', {
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (res.status === 401) {
        window.location.href = '/?auth=login';
        return [];
      }

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Could not load conversations');
      }

      if (json.pusherKey && json.pusherCluster) {
        pusherConfigRef.current = { key: json.pusherKey, cluster: json.pusherCluster };
      }

      const loaded = json.data || [];
      setConversations(loaded);
      return loaded as Conversation[];
    } catch (err: any) {
      console.error('Fetch conversations failed:', err);
      throw new Error(err.message || 'The Nexus frequency is unstable. Please retry.');
    }
  }, []);

  const openDirectConversation = useCallback(async (recipientId: number) => {
    setState('loading');
    setStatusText('Opening direct transmission...');

    const token = typeof window !== 'undefined' ? localStorage.getItem('take_one_token') : null;
    const res = await fetchWithCSRF('/api/chat/conversations/direct', {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: JSON.stringify({ recipientId })
    });

    if (res.status === 401) {
      window.location.href = '/?auth=login';
      return;
    }

    const json = await res.json();

    if (!res.ok || !json.success) {
      setState(res.status === 404 ? 'not-found' : 'error');
      setStatusText(json.message || 'Could not open that crew member.');
      return null;
    }

    const conversation = json.data as Conversation;
    setConversations((current) => {
      const withoutDuplicate = current.filter((item) => item.id !== conversation.id);
      return [{ ...conversation, unread: 0 }, ...withoutDuplicate];
    });
    setActiveConversation(conversation);
    return conversation;
  }, [setActiveConversation]);

  const handleDeleteConversation = async (id: number) => {
    if (!confirm('Are you sure you want to delete this conversation? This will remove it from your signal desk.')) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('take_one_token') : null;
      const res = await fetchWithCSRF(`/api/chat/conversations/${id}`, { 
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.status === 401) { window.location.href = '/?auth=login'; return; }
      if (res.ok) {
        setConversations(prev => prev.filter(c => c.id !== id));
        if (activeConv?.id === id) setActiveConv(null);
      }
    } catch (err) {
      console.error('Failed to delete conversation', err);
    }
  };

  const handleLeaveGroup = async (id: number) => {
    if (!confirm('Are you sure you want to leave this group?')) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('take_one_token') : null;
      const res = await fetchWithCSRF(`/api/chat/conversations/${id}/leave`, { 
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.status === 401) { window.location.href = '/?auth=login'; return; }
      if (res.ok) {
        setConversations(prev => prev.filter(c => c.id !== id));
        if (activeConv?.id === id) setActiveConv(null);
        setShowDetails(false);
        setShowMenu(false);
      }
    } catch (err) {
      console.error('Failed to leave group', err);
    }
  };

  const handleClearChat = async (id: number) => {
    if (!confirm('Are you sure you want to clear all messages in this conversation? This cannot be undone.')) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('take_one_token') : null;
      const res = await fetchWithCSRF(`/api/chat/conversations/${id}/clear`, { 
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.status === 401) { window.location.href = '/?auth=login'; return; }
      if (res.ok) {
        setMessages([]);
        setShowMenu(false);
      }
    } catch (err) {
      console.error('Failed to clear chat', err);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    setShowMenu(false);
    // In a real app, this would call an API
  };


  const handleTyping = (isTyping: boolean) => {
    if (!activeConv) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('take_one_token') : null;
    fetchWithCSRF('/api/chat/typing', {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: JSON.stringify({ conversationId: activeConv.id, isTyping })
    }).catch(() => {});
  };

  const isTypingRef = useRef<{[key: number]: boolean}>({});

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!activeConv) return;
    const convId = activeConv.id;

    // Throttle typing events: only send 'true' if we weren't already typing
    if (!isTypingRef.current[convId]) {
      isTypingRef.current[convId] = true;
      handleTyping(true);
    }
    
    if (typingTimeoutRef.current[convId]) {
      clearTimeout(typingTimeoutRef.current[convId]);
    }
    
    typingTimeoutRef.current[convId] = setTimeout(() => {
      handleTyping(false);
      isTypingRef.current[convId] = false;
    }, 2000);
  };

  const createGroupConversation = useCallback(async (name: string, userIds: number[]) => {
    setState('loading');
    setStatusText('Creating group transmission...');

    const token = typeof window !== 'undefined' ? localStorage.getItem('take_one_token') : null;
    const res = await fetchWithCSRF('/api/chat/conversations/group', {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: JSON.stringify({ name, userIds })
    });
    
    if (res.status === 401) { window.location.href = '/?auth=login'; return; }
    const json = await res.json();

    if (!res.ok || !json.success) {
      setState('error');
      setStatusText(json.message || 'Could not create group.');
      return;
    }

    const conversation = json.data as Conversation;
    setConversations((current) => [conversation, ...current]);
    setActiveConversation(conversation);
    setState('ready');
  }, [setActiveConversation]);

  useEffect(() => {
    const initialize = async () => {
      let currentUser: User | null = null;
      const storedUser = localStorage.getItem('take_one_user');

      if (storedUser) {
        try {
          currentUser = JSON.parse(storedUser);
          setUser(currentUser);
        } catch (err) {
          console.error('Failed to parse stored user', err);
        }
      }

      if (!currentUser) {
        try {
          const token = typeof window !== 'undefined' ? localStorage.getItem('take_one_token') : null;
          const res = await fetch('/api/users/me', { 
            credentials: 'include',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          });
          const json = await res.json();

          if (json.success && json.user) {
            currentUser = json.user;
            setUser(currentUser);
            localStorage.setItem('take_one_user', JSON.stringify(json.user));
          } else {
            window.location.href = '/?auth=login';
            return;
          }
        } catch (err) {
          console.error('Failed to fetch session user', err);
          window.location.href = '/?auth=login';
          return;
        }
      }

      try {
        const params = new URLSearchParams(window.location.search);
        const targetUserId = Number(params.get('userId') || params.get('user') || 0);
        const targetConversationId = Number(params.get('conversationId') || 0);
        const loadedConversations = await fetchConversations();

        if (targetUserId) {
          const conversation = await openDirectConversation(targetUserId);
          if (conversation) await fetchMessages(conversation.id);
          return;
        }

        if (targetConversationId) {
          const selected = loadedConversations.find((conversation) => conversation.id === targetConversationId);
          if (!selected) {
            setState('not-found');
            setStatusText('Conversation not found or you do not have access.');
            return;
          }

          setActiveConversation(selected, false);
          await fetchMessages(selected.id);
          return;
        }

        if (loadedConversations.length > 0) {
          setActiveConversation(loadedConversations[0]);
          await fetchMessages(loadedConversations[0].id);
          return;
        }

        setState('ready');
      } catch (err: any) {
        console.error('Failed to initialize chat', err);
        setState('error');
        setStatusText(err.message || 'Signal Error: Could not synchronize with Nexus.');
      }
    };

    initialize();
  }, [fetchConversations, fetchMessages, openDirectConversation, setActiveConversation]);

  useEffect(() => {
    if (!user) return;

    if (!pusherRef.current) {
      const pusherKey = pusherConfigRef.current?.key || process.env.NEXT_PUBLIC_PUSHER_KEY;
      const pusherCluster = pusherConfigRef.current?.cluster || process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

      if (pusherKey && pusherCluster) {
        pusherRef.current = new Pusher(pusherKey, {
          cluster: pusherCluster
        });
      }
    }

    if (!pusherRef.current) return;

    const userChannelName = `user-${user.id}`;
    const userChannel = pusherRef.current.subscribe(userChannelName);

    userChannel.bind('credit-update', (data: { credits: number, change: number, reason: string }) => {
      setUser(prev => prev ? { ...prev, credits: data.credits } : null);

    });

    userChannel.bind('message-notification', (data: { conversationId: number, message: ChatMessage }) => {
      setConversations((current) => {
        const convIndex = current.findIndex((c) => c.id === data.conversationId);
        if (convIndex > -1) {
          const conv = current[convIndex];
          const isCurrentActive = activeConv?.id === data.conversationId;
          const updatedConv = { 
            ...conv, 
            messages: [data.message], 
            unread: isCurrentActive ? 0 : (conv.unread || 0) + 1 
          };
          const newConvs = [...current];
          newConvs.splice(convIndex, 1);
          return [updatedConv, ...newConvs];
        } else {
          fetchConversations();
          return current;
        }
      });
    });

    return () => {
      userChannel.unbind_all();
      pusherRef.current?.unsubscribe(userChannelName);
    };
  }, [user, activeConv?.id, fetchConversations]);

  useEffect(() => {
    if (!activeConv) return;

    if (!pusherRef.current) {
      const pusherKey = pusherConfigRef.current?.key || process.env.NEXT_PUBLIC_PUSHER_KEY;
      const pusherCluster = pusherConfigRef.current?.cluster || process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

      if (pusherKey && pusherCluster) {
        pusherRef.current = new Pusher(pusherKey, {
          cluster: pusherCluster
        });
      }
    }

    if (!pusherRef.current) return;

    const channelName = `conversation-${activeConv.id}`;
    const channel = pusherRef.current.subscribe(channelName);
    channel.bind('new-message', (data: { message: ChatMessage }) => {
      if (activeConv.id === data.message.conversation_id) {
        setMessages((prev) => {
          if (prev.find((message) => message.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      }
      
      setConversations((current) => {
        const convIndex = current.findIndex((c) => c.id === data.message.conversation_id);
        if (convIndex > -1) {
          const conv = current[convIndex];
          const updatedConv = { 
            ...conv, 
            messages: [data.message],
            unread: activeConv.id === conv.id ? 0 : (conv.unread || 0) + 1
          };
          const newConvs = [...current];
          newConvs.splice(convIndex, 1);
          return [updatedConv, ...newConvs];
        }
        return current;
      });
    });

    channel.bind('user-typing', (data: { userId: number, userName: string, isTyping: boolean }) => {
      if (data.userId === user?.id) return;
      setTypingUsers(prev => {
        const next = { ...prev };
        if (data.isTyping) next[data.userId] = data.userName;
        else delete next[data.userId];
        return next;
      });
    });

    channel.bind('task-update', (data: { type: string, task: Task, taskId?: number }) => {
      if (data.type === 'TASK_CREATED') {
        setTasks(prev => [data.task, ...prev]);
      } else if (data.type === 'TASK_UPDATED' || data.type === 'TASK_APPROVED') {
        setTasks(prev => prev.map(t => t.id === data.task.id ? data.task : t));
      } else if (data.type === 'TASK_DELETED') {
        setTasks(prev => prev.filter(t => t.id !== data.taskId));
      }
    });

    return () => {
      channel.unbind_all();
      pusherRef.current?.unsubscribe(channelName);
    };
  }, [activeConv, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, messageLoading]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSearch(false);
        setShowMenu(false);
        setShowDetails(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    const timeouts = typingTimeoutRef.current;
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // Clean up all typing timeouts
      Object.values(timeouts).forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = () => {
      if (showMenu) setShowMenu(false);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [showMenu]);

  useEffect(() => {
    if (state === 'ready' && activeConv) {

      inputRef.current?.focus();
    }
  }, [activeConv, state]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv || sending || !user) return;

    const content = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    
    const optimisticMessage: ChatMessage = {
      id: tempId,
      conversation_id: activeConv.id,
      sender_id: user.id,
      content,
      created_at: new Date().toISOString(),
      sender: user,
      status: 'sending'
    };

    setNewMessage('');
    setMessages(prev => [...prev, optimisticMessage]);
    setSending(true);
    
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('take_one_token') : null;
      const res = await fetchWithCSRF('/api/chat/messages', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: JSON.stringify({
          conversationId: activeConv.id,
          content
        })
      });

      if (res.status === 401) {
        window.location.href = '/?auth=login';
        return;
      }

      const json = await res.json();

      if (!res.ok || !json.success) {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
        setStatusText(json.message || 'Message could not be sent.');
        return;
      }

      // Replace optimistic message with actual message from server
      setMessages(prev => prev.map(m => m.id === tempId ? { ...json.data, status: 'sent' } : m));
      
      setConversations((current) => {
        const index = current.findIndex(c => c.id === json.data.conversation_id);
        if (index === -1) return current;
        const updated = { ...current[index], messages: [json.data] };
        const next = [...current];
        next.splice(index, 1);
        return [updated, ...next];
      });
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err) {
      console.error('Failed to send message', err);
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
      setStatusText('Connection lost. Message failed to send.');
    } finally {
      setSending(false);
    }
  };

  if (state === 'loading') return <div className="chat-loading">{statusText}</div>;

  return (
    <div className="chat-page">
      <header>
        <a href="/" className="logo">TAKE <span>ONE</span></a>
        <nav>
          <a href="/#explore">Discover Projects</a>
          <a href="/crew">Find Crew</a>
          <a href="/leaderboard">Leaderboard</a>
          <a href="/#upload">Share Your Script</a>
          <a href="/profile">Profile</a>
          {user?.role && ['admin', 'developer', 'moderator'].includes(user.role.toLowerCase()) && (
            <a href="/admin" style={{ color: 'var(--neon)', fontWeight: 'bold' }}>Admin Panel</a>
          )}
          <button onClick={() => window.location.href = '/profile'} className="nav-cta">
            My Signal
          </button>
        </nav>
      </header>

      <div className="chat-container">
        <aside className="chat-sidebar">
          <div className="sidebar-header">
            <div className="sidebar-title-row">
              <h2>Transmissions</h2>
              <button onClick={() => setIsGroupModalOpen(true)} className="nav-cta group-add-btn" aria-label="Create Group">+</button>
            </div>
            <div className="sidebar-search-wrap">
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input 
                type="text" 
                className="sidebar-search-input" 
                placeholder="Search Nexus..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="conversation-list">
            {conversations
              .filter(c => {
                const recipient = getRecipient(c);
                const name = c.is_group ? c.name : getDisplayName(recipient);
                return name?.toLowerCase().includes(searchQuery.toLowerCase());
              })
              .map((conv) => {
                const recipient = getRecipient(conv);
                const lastMsg = conv.messages[0]?.content || 'No messages yet';
                const lastTime = conv.messages[0] ? new Date(conv.messages[0].created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                
                return (
                  <button
                    key={conv.id}
                    type="button"
                    className={`conversation-item ${activeConv?.id === conv.id ? 'active' : ''}`}
                    onClick={() => {
                      setActiveConversation(conv);
                      fetchMessages(conv.id);
                    }}
                    aria-pressed={activeConv?.id === conv.id}
                  >
                    <img
                      src={conv.is_group ? (conv.avatar_url || '/assets/default-group.png') : getAvatarUrl(recipient?.name || 'User', recipient?.gender || 'Other', recipient?.avatar_url)}
                      alt=""
                      className="conv-avatar"
                      loading="lazy" decoding="async"
                    />
                    <div className="conv-info">
                      <div className="conv-name">{conv.is_group ? conv.name : getDisplayName(recipient)}</div>
                      <div className="conv-role">{conv.is_group ? `${conv.users.length} Members` : (recipient?.role || 'Crew Member')}</div>
                      <div className="conv-last-msg">{lastMsg}</div>
                    </div>
                    <div className="conv-meta">
                      {lastTime && <div className="conv-time">{lastTime}</div>}
                      {conv.unread ? <div className="unread-badge">{conv.unread > 9 ? '9+' : conv.unread}</div> : null}
                    </div>
                  </button>
                );
              })}
            {conversations.length === 0 && (
              <div className="sidebar-empty">No active transmissions yet. Open a crew profile and send the first message.</div>
            )}
          </div>
        </aside>

        <main className="chat-window">
          {state === 'error' || state === 'not-found' ? (
            <div className="chat-empty">
              <div className="empty-kicker">{state === 'not-found' ? 'Conversation Not Found' : 'Signal Error'}</div>
              <h3>Channel Unavailable</h3>
              <p>{statusText}</p>
              <a href="/crew.htm" className="chat-empty-action">Browse Crew</a>
            </div>
          ) : activeConv ? (
            <>
              <header className="chat-header">
                <div className="header-left">
                  <div className="header-avatar-container" onClick={() => setShowDetails(!showDetails)} style={{ cursor: 'pointer' }}>
                    <img
                      src={activeConv.is_group ? (activeConv.avatar_url || '/assets/default-group.png') : getAvatarUrl(activeRecipient?.name || 'User', activeRecipient?.gender || 'Other', activeRecipient?.avatar_url)}
                      alt=""
                      className="header-avatar"
                      loading="lazy" decoding="async"
                    />
                    {!activeConv.is_group && <span className="presence-dot online"></span>}
                  </div>
                  <div className="header-info">
                    <div className="header-primary-row">
                      <h3 className="header-display-name" onClick={() => setShowDetails(!showDetails)} style={{ cursor: 'pointer' }}>
                        {activeConv?.is_group ? activeConv.name : getDisplayName(activeRecipient)}
                      </h3>
                      {!activeConv.is_group && activeRecipient?.role && (
                        <span className="header-role-tag">{activeRecipient.role}</span>
                      )}
                    </div>
                    
                    <div className="header-secondary-row">
                      <div className="chat-tabs">
                        <button 
                          className={`chat-tab ${activeTab === 'chat' ? 'active' : ''}`}
                          onClick={() => setActiveTab('chat')}
                        >
                          Transmission
                        </button>
                        <button 
                          className={`chat-tab ${activeTab === 'tasks' ? 'active' : ''}`}
                          onClick={() => {
                            setActiveTab('tasks');
                            if (tasks.length === 0) fetchTasks(activeConv.id);
                          }}
                        >
                          Tasks
                          {tasks.filter(t => t.status !== 'Done').length > 0 && (
                            <span className="tab-badge">{tasks.filter(t => t.status !== 'Done').length}</span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>


                <div className="header-actions">
                  <button 
                    className={`header-action-btn ${showSearch ? 'active' : ''}`} 
                    title="Search Transmission"
                    onClick={() => {
                      setShowSearch(!showSearch);
                      setShowMenu(false);
                      setShowDetails(false);
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  </button>
                  {activeConv.is_group ? (
                    <>
                      <button 
                        className={`header-action-btn ${showDetails ? 'active' : ''}`} 
                        title="Group Settings"
                        onClick={() => {
                          setShowDetails(!showDetails);
                          setShowSearch(false);
                          setShowMenu(false);
                        }}
                      >
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                      </button>
                      <button 
                        className="header-action-btn" 
                        title="More Options"
                        onClick={() => setShowMenu(!showMenu)}
                      >
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        className={`header-action-btn ${showMenu ? 'active' : ''}`} 
                        title="More Options"
                        onClick={() => setShowMenu(!showMenu)}
                      >
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                      </button>
                    </>
                  )}
                </div>

              </header>

              <div className="messages-area">
                {showSearch && (
                  <div className="chat-message-search">
                    <div className="search-bar-inner">
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                      <input 
                        type="text" 
                        placeholder="Search messages..." 
                        value={chatSearchQuery}
                        onChange={(e) => setChatSearchQuery(e.target.value)}
                        autoFocus
                      />
                      <button onClick={() => { setShowSearch(false); setChatSearchQuery(''); }} className="close-search">
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    </div>
                  </div>
                )}

                {showMenu && (
                  <div className="chat-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                    {activeConv.is_group ? (
                      <>
                        <button onClick={() => { setShowDetails(true); setShowMenu(false); }}>Group Info</button>
                        <button onClick={() => toggleMute()}>{isMuted ? 'Unmute Group' : 'Mute Group'}</button>
                        <button onClick={() => handleClearChat(activeConv.id)}>Clear Chat</button>
                        <button className="danger" onClick={() => handleLeaveGroup(activeConv.id)}>Leave Group</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { 
                          if (activeRecipient?.id) window.location.href = `/profile?id=${activeRecipient.id}`;
                          else setShowDetails(true); 
                          setShowMenu(false); 
                        }}>View Profile</button>
                        <button onClick={() => toggleMute()}>{isMuted ? 'Unmute Signal' : 'Mute Signal'}</button>
                        <button onClick={() => handleClearChat(activeConv.id)}>Clear History</button>
                        <button className="danger" onClick={() => handleDeleteConversation(activeConv.id)}>Delete Transmission</button>
                      </>
                    )}
                  </div>
                )}

                {activeTab === 'chat' ? (
                  <>
                    {messageLoading ? (
                      <div className="message-state">
                        <div className="skeleton-loader">
                          <div className="skeleton-item sent"></div>
                          <div className="skeleton-item received"></div>
                          <div className="skeleton-item sent"></div>
                        </div>
                        <span>Synchronizing Message History...</span>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="message-state">No messages yet. Start the conversation.</div>
                    ) : (
                      <>
                        {hasMore && (
                          <div style={{ textAlign: 'center', padding: '12px 0' }}>
                            <button
                              onClick={loadMoreMessages}
                              disabled={isLoadingMore}
                              style={{
                                background: 'transparent',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.5)',
                                fontFamily: "'Space Mono', monospace",
                                fontSize: '10px',
                                letterSpacing: '0.2em',
                                padding: '8px 20px',
                                cursor: isLoadingMore ? 'not-allowed' : 'pointer',
                                textTransform: 'uppercase',
                                transition: 'all 0.3s ease'
                              }}
                            >
                              {isLoadingMore ? 'Loading...' : '↑ Load Earlier Messages'}
                            </button>
                          </div>
                        )}
                        {Object.entries(groupMessagesByDate(
                          messages.filter(msg => (msg.content || '').toLowerCase().includes(chatSearchQuery.toLowerCase()))
                        )).map(([dateStr, dateMsgs]) => (
                          <div key={dateStr} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="date-separator-wrap">
                              <span>
                                {getFriendlyDate(dateStr)}
                              </span>
                            </div>
                            {dateMsgs.map((msg) => (
                              <div key={msg.id} className={`message-bubble ${msg.sender_id === user?.id ? 'sent' : 'received'} ${msg.status || ''}`}>
                                {activeConv?.is_group && msg.sender_id !== user?.id && (
                                  <div className="msg-sender-row" style={{ display: 'flex', alignItems: 'center' }}>
                                    <span className="msg-sender-name">{getDisplayName(msg.sender)}</span>
                                    {msg.sender?.role && <span className="msg-role-badge">{msg.sender.role}</span>}
                                    {['admin', 'developer'].includes(String(msg.sender?.role || '').toLowerCase()) && (
                                      <span className="msg-director-badge" style={{
                                        background: 'rgba(255, 77, 26, 0.15)',
                                        border: '1px solid var(--neon)',
                                        color: 'var(--neon)',
                                        boxShadow: '0 0 5px rgba(255, 77, 26, 0.3)',
                                        borderRadius: '4px',
                                        padding: '1px 5px',
                                        fontSize: '9px',
                                        fontWeight: 'bold',
                                        letterSpacing: '1px',
                                        marginLeft: '6px',
                                        textTransform: 'uppercase'
                                      }}>Director</span>
                                    )}
                                  </div>
                                )}
                                <div className="msg-content">
                                  {msg.content}
                                  {msg.status === 'sending' && <span className="msg-status-icon sending">...</span>}
                                  {msg.status === 'error' && (
                                    <span className="msg-status-icon error" title="Failed to send. Click to retry." onClick={() => {
                                      setNewMessage(msg.content);
                                      setMessages(prev => prev.filter(m => m.id !== msg.id));
                                    }}>!</span>
                                  )}
                                </div>
                                <small className="msg-time">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                              </div>
                            ))}
                          </div>
                        ))}
                      </>
                    )}
                  </>
                ) : (
                  <div className="tasks-area">
                    <div className="tasks-header">
                      <h3>Active Missions</h3>
                      {activeConv && (
                        (!activeConv.is_group || 
                        ['admin', 'developer'].includes(user?.role?.toLowerCase() || '') || 
                        ['Director', 'Admin'].includes(activeConv.my_role || '')) && (
                          <button onClick={() => setIsTaskModalOpen(true)} className="add-task-btn">Assign Task +</button>
                        )
                      )}
                    </div>
                    {tasksLoading ? (
                      <div className="message-state">Accessing mission records...</div>
                    ) : tasks.length === 0 ? (
                      <div className="message-state">No missions assigned yet.</div>
                    ) : (
                      <div className="tasks-list">
                        {tasks.map(task => {
                          const assignee = activeConv?.users.find(u => u.id === task.assignee_id);
                          const isCreator = task.creator_id === user?.id;
                          const isAdmin = ['admin', 'developer'].includes(user?.role?.toLowerCase() || '');
                          const isManageable = isCreator || isAdmin;
                          const isAssignee = task.assignee_id === user?.id;

                          return (
                            <div key={task.id} className={`task-card priority-${task.priority.toLowerCase()}`}>
                              <div className="task-main">
                                <div className="task-top-row">
                                  <div className="task-title">{task.title}</div>
                                  {isManageable && (
                                    <button onClick={() => deleteTask(task.id)} className="task-delete-btn" title="Abort Mission">
                                      <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                  )}
                                </div>
                                
                                {task.description && <div className="task-desc">{task.description}</div>}
                                
                                <div className="task-assignee">
                                  <label>Assigned Operative</label>
                                  <div className="assignee-val">
                                    {assignee ? (
                                      <>
                                        <img src={getAvatarUrl(assignee.name, assignee.gender || 'Other', assignee.avatar_url)} alt="" className="mini-avatar" />
                                        <span>{assignee.name}</span>
                                      </>
                                    ) : (
                                      <span className="unassigned">Field Operative Required</span>
                                    )}
                                  </div>
                                </div>

                                <div className="task-footer">
                                  <div className="task-status-wrap">
                                    {isManageable || isAssignee ? (
                                      <select 
                                        value={task.status} 
                                        onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                                        className={`status-select status-${task.status.toLowerCase().replace(' ', '')}`}
                                        disabled={task.approval_status === 'Approved'}
                                      >
                                        <option value="Todo">Todo</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Review">Review</option>
                                        <option value="Done">Done</option>
                                      </select>
                                    ) : (
                                      <span className={`task-status status-${task.status.toLowerCase().replace(' ', '')}`}>{task.status}</span>
                                    )}

                                    {task.status === 'Done' && (
                                      <div className="approval-status">
                                        {task.approval_status === 'Approved' ? (
                                          <span className="badge approved">✓ Approved</span>
                                        ) : (
                                          <span className="badge pending">⌛ Pending Approval</span>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  <div className="task-tags">
                                    {task.reward_credits > 0 && (
                                      <span className="task-reward-tag">✦ {task.reward_credits} Credits</span>
                                    )}
                                    <span className="task-priority-tag">{task.priority}</span>
                                    {task.due_date && <span className="task-due-tag">Deadline: {new Date(task.due_date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>}
                                  </div>
                                </div>

                                {task.status === 'Done' && task.approval_status !== 'Approved' && isManageable && (
                                  <button 
                                    className="task-approve-btn"
                                    onClick={() => approveTask(task.id)}
                                  >
                                    Grant Rewards & Close Mission
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                {Object.keys(typingUsers).length > 0 && activeTab === 'chat' && (
                  <div className="typing-indicator">
                    {Object.values(typingUsers).join(', ')} {Object.keys(typingUsers).length > 1 ? 'are' : 'is'} typing...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {showDetails && activeConv && (
                <div className="chat-details-panel">
                  <header className="details-header">
                    <h3>{activeConv.is_group ? 'Group Details' : 'Crew Member'}</h3>
                    <button onClick={() => setShowDetails(false)} className="close-details">
                      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </header>
                  <div className="details-content">
                    <div className="details-main-info">
                      <img 
                        src={activeConv.is_group ? (activeConv.avatar_url || '/assets/default-group.png') : getAvatarUrl(activeRecipient?.name || 'User', activeRecipient?.gender || 'Other', activeRecipient?.avatar_url)} 
                        alt="" 
                        className="details-avatar" 
                        loading="lazy" decoding="async"
                      />
                      <h4>{activeConv.is_group ? activeConv.name : (activeRecipient?.name || 'Crew Member')}</h4>
                      {!activeConv.is_group && <span className="details-role">{activeRecipient?.role || 'Crew Member'}</span>}
                      
                      {activeConv.is_group && (
                        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', alignItems: 'flex-start' }}>
                          <label style={{ fontSize: '11px', color: 'rgba(232,232,224,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Group Avatar URL</label>
                          <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                            <input 
                              type="text" 
                              placeholder="https://example.com/avatar.png"
                              defaultValue={activeConv.avatar_url || ''}
                              id="group-avatar-input"
                              style={{
                                flex: 1,
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid rgba(232,232,224,0.1)',
                                borderRadius: '4px',
                                padding: '6px 8px',
                                fontSize: '12px',
                                color: '#e8e8e0',
                                outline: 'none'
                              }}
                            />
                            <button 
                              onClick={async () => {
                                const input = document.getElementById('group-avatar-input') as HTMLInputElement;
                                if (!input) return;
                                const newUrl = input.value.trim();
                                
                                try {
                                  const token = typeof window !== 'undefined' ? localStorage.getItem('take_one_token') : null;
                                  const res = await fetchWithCSRF(`/api/chat/conversations/${activeConv.id}/avatar`, {
                                    method: 'PATCH',
                                    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                                    body: JSON.stringify({ avatarUrl: newUrl })
                                  });
                                  const data = await res.json();
                                  if (data.success) {
                                    // Update state
                                    setActiveConv(prev => prev ? { ...prev, avatar_url: newUrl } : null);
                                    setConversations(prev => prev.map(c => c.id === activeConv.id ? { ...c, avatar_url: newUrl } : c));
                                    alert('Group avatar updated successfully!');
                                  } else {
                                    alert(data.message || 'Failed to update group avatar');
                                  }
                                } catch (err) {
                                  console.error('Avatar update failed:', err);
                                  alert('Failed to update group avatar');
                                }
                              }}
                              style={{
                                background: 'var(--neon)',
                                color: '#000',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '6px 12px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                              }}
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {activeConv.is_group ? (
                      <div className="details-section">
                        <div className="section-title">Members ({activeConv.users.length})</div>
                        <div className="details-members-list">
                          {activeConv.users.map(u => (
                            <div key={u.id} className="member-item">
                              <img src={getAvatarUrl(u.name, u.gender || 'Other', u.avatar_url)} alt="" className="mini-avatar" loading="lazy" decoding="async" />
                              <div className="member-info">
                                <span className="member-name">{u.name}</span>
                                <span className="member-role">{u.role_in_group || 'Member'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="details-actions">
                          <button className="details-btn danger" onClick={() => handleLeaveGroup(activeConv.id)}>Leave Group</button>
                        </div>
                      </div>
                    ) : (
                      <div className="details-section">
                        <div className="section-title">Field Intel</div>
                        <div className="intel-grid">
                          <div className="intel-cell">
                            <label>Credits</label>
                            <span>{activeRecipient?.credits || 0}</span>
                          </div>
                          <div className="intel-cell">
                            <label>College</label>
                            <span>{activeRecipient?.college || 'N/A'}</span>
                          </div>
                          <div className="intel-cell">
                            <label>City</label>
                            <span>{activeRecipient?.city || 'N/A'}</span>
                          </div>
                          <div className="intel-cell">
                            <label>Joined</label>
                            <span>{activeRecipient?.created_at ? new Date(activeRecipient.created_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Recently'}</span>
                          </div>
                        </div>
                        {activeRecipient?.skills && (
                          <div className="intel-skills">
                            <label>Skills</label>
                            <div className="skills-wrap">
                              {(activeRecipient.skills || '').split(',').map((s: string) => <span key={s} className="skill-tag">{s.trim()}</span>)}
                            </div>
                          </div>
                        )}
                        <div className="details-actions">
                          <button className="details-btn" onClick={() => window.location.href = `/profile?id=${activeRecipient?.id}`}>View Profile</button>
                          <button className="details-btn danger" onClick={() => handleDeleteConversation(activeConv.id)}>Delete History</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'chat' && (
                <form className="chat-input-wrap" onSubmit={sendMessage}>
                  <div className="input-container">
                    <input
                      ref={inputRef}
                      type="text"
                      className="chat-input"
                      placeholder={(!activeConv?.is_group && activeRecipient?.id === -1) ? 'This user is no longer available.' : `Message ${activeConv?.is_group ? activeConv.name : (activeRecipient?.name || 'crew member')}...`}
                      value={newMessage}
                      onChange={onInputChange}
                      disabled={sending || (!activeConv?.is_group && activeRecipient?.id === -1)}
                    />
                    <button type="submit" className="send-btn" disabled={!newMessage.trim() || sending || (!activeConv?.is_group && activeRecipient?.id === -1)} aria-label="Send message">
                      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : (
            <div className="chat-empty">
              <div className="empty-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                <div className="pulse-ring"></div>
              </div>
              <div className="empty-kicker">Secure Signal Desk</div>
              <h3>Channel Idle</h3>
              <p>Select a transmission from the sidebar or message someone from the Crew page.</p>
              <div className="empty-status-grid">
                <div className="status-cell">
                  <span className="cell-label">Encrypted</span>
                  <span className="cell-value">AES-256</span>
                </div>
                <div className="status-cell">
                  <span className="cell-label">Uptime</span>
                  <span className="cell-value">99.9%</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      <CreateGroupModal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} onCreate={createGroupConversation} />
      <TaskModal 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)} 
        conversationId={activeConv?.id || 0} 
        members={activeConv?.users || []} 
        onCreate={createTask} 
        myRole={activeConv?.my_role || 'Member'}
        isGroup={activeConv?.is_group || false}
        globalRole={user?.role || 'Member'}
      />
    </div>
  );
}
