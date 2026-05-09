'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Pusher from 'pusher-js';
import { getAvatarUrl } from '@/lib/avatars';
import CreateGroupModal from '@/components/CreateGroupModal';
import './chat.css';

interface User {
  id: number;
  name: string;
  avatar_url?: string;
  gender?: string;
  role?: string;
  college?: string;
  city?: string;
  skills?: string;
  credits?: number;
  created_at?: string;
}


interface ChatMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  created_at: string;
  sender: User;
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


  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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

  const getRecipient = useCallback((conv: Conversation) => {
    const member = conv.users.find((member) => member.id !== user?.id);
    if (!member && !conv.is_group) {
      return { id: -1, name: 'Deleted User', role: 'Unknown', gender: 'Other' };
    }
    return member || conv.users[0];
  }, [user?.id]);

  const setActiveConversation = useCallback((conversation: Conversation, updateUrl = true) => {
    setActiveConv(conversation);
    setMessages([]);
    localStorage.setItem('take_one_last_conversation', String(conversation.id));

    // Clear unread for this conversation locally
    setConversations(prev => prev.map(c => c.id === conversation.id ? { ...c, unread: 0 } : c));

    if (updateUrl && typeof window !== 'undefined') {
      const url = `/chat?conversationId=${conversation.id}`;
      window.history.replaceState(null, '', url);
    }
  }, []);

  const fetchMessages = useCallback(async (convId: number) => {
    setMessageLoading(true);
    try {
      const res = await fetch(`/api/chat/messages/${convId}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        setState(res.status === 403 || res.status === 404 ? 'not-found' : 'error');
        setStatusText(json.message || 'Conversation could not be loaded.');
        return;
      }

      setMessages(json.data || []);
      setState('ready');
      requestAnimationFrame(() => inputRef.current?.focus());
    } catch (err) {
      console.error('Failed to fetch messages', err);
      setState('error');
      setStatusText('Conversation could not be loaded.');
    } finally {
      setMessageLoading(false);
    }
  }, []);

  const fetchConversations = useCallback(async () => {
    const res = await fetch('/api/chat/conversations');
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
  }, []);

  const openDirectConversation = useCallback(async (recipientId: number) => {
    setState('loading');
    setStatusText('Opening direct transmission...');

    const res = await fetch('/api/chat/conversations/direct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientId })
    });
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
      const res = await fetch(`/api/chat/conversations/${id}`, { method: 'DELETE' });
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
      const res = await fetch(`/api/chat/conversations/${id}/leave`, { method: 'POST' });
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
      const res = await fetch(`/api/chat/conversations/${id}/clear`, { method: 'POST' });
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
    fetch('/api/chat/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: activeConv.id, isTyping })
    }).catch(() => {});
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    handleTyping(true);
    
    if (typingTimeoutRef.current[activeConv?.id || 0]) {
      clearTimeout(typingTimeoutRef.current[activeConv?.id || 0]);
    }
    
    typingTimeoutRef.current[activeConv?.id || 0] = setTimeout(() => {
      handleTyping(false);
    }, 2000);
  };

  const createGroupConversation = useCallback(async (name: string, userIds: number[]) => {
    setState('loading');
    setStatusText('Creating group transmission...');

    const res = await fetch('/api/chat/conversations/group', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, userIds })
    });
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
          const res = await fetch('/api/users/me');
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
      } catch (err) {
        console.error('Failed to initialize chat', err);
        setState('error');
        setStatusText('Could not load conversations.');
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
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
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
    if (!newMessage.trim() || !activeConv || sending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConv.id,
          content
        })
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setStatusText(json.message || 'Message could not be sent.');
        setNewMessage(content);
        return;
      }

      setMessages((prev) => {
        if (prev.find((message) => message.id === json.data.id)) return prev;
        return [...prev, json.data];
      });
      setConversations((current) => current.map((conversation) => (
        conversation.id === json.data.conversation_id
          ? { ...conversation, messages: [json.data] }
          : conversation
      )));
      requestAnimationFrame(() => inputRef.current?.focus());
    } catch (err) {
      console.error('Failed to send message', err);
      setStatusText('Message could not be sent.');
      setNewMessage(content);
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
          <a href="/#explore">Explore</a>
          <a href="/crew.htm">Crew</a>
          <a href="/#upload">Upload</a>
          <a href="/profile">Profile</a>
          <button onClick={() => window.location.href = '/profile'} className="nav-cta" style={{ border: 'none', cursor: 'pointer', fontFamily: "'Bebas Neue', sans-serif" }}>
            My Signal
          </button>
        </nav>
      </header>

      <div className="chat-container">
        <aside className="chat-sidebar">
          <div className="sidebar-header">
            <div className="sidebar-title-row">
              <h2>Transmissions</h2>
              <button onClick={() => setIsGroupModalOpen(true)} className="nav-cta" style={{ border: 'none', cursor: 'pointer', padding: '6px 12px', height: 'auto' }} aria-label="Create Group">+</button>
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
                const name = c.is_group ? c.name : recipient?.name;
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
                    />
                    <div className="conv-info">
                      <div className="conv-name">{conv.is_group ? conv.name : (recipient?.name || 'Crew Member')}</div>
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
                    />
                    {!activeConv.is_group && <span className="presence-dot online"></span>}
                  </div>
                  <div className="header-info" onClick={() => setShowDetails(!showDetails)} style={{ cursor: 'pointer' }}>
                    <div className="header-primary-row">
                      <h3 className="header-display-name">
                        {activeConv?.is_group ? activeConv.name : (activeRecipient?.name || 'Crew Member')}
                      </h3>
                      {!activeConv.is_group && activeRecipient?.role && (
                        <span className="header-role-tag">{activeRecipient.role}</span>
                      )}
                    </div>
                    
                    <div className="header-secondary-row">
                      {activeConv.is_group ? (
                        <div className="group-meta">
                          <span className="member-count">{activeConv.users.length} members</span>

                          <div className="members-preview">
                            {activeConv.users.slice(0, 3).map((u, i) => (
                              <img 
                                key={u.id} 
                                src={getAvatarUrl(u.name, u.gender || 'Other', u.avatar_url)} 
                                alt="" 
                                className="mini-avatar"
                                style={{ zIndex: 10 - i, marginLeft: i > 0 ? '-8px' : '0' }}
                              />
                            ))}
                            {activeConv.users.length > 3 && <span className="more-members">+{activeConv.users.length - 3}</span>}
                          </div>
                        </div>
                      ) : (
                        <div className="presence-info">
                          <span className="status-text">Signal Live</span>
                          <span className="separator">•</span>
                          <span className="last-active">Last active: recently</span>
                        </div>
                      )}
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
                        <button onClick={() => { setShowDetails(true); setShowMenu(false); }}>View Profile</button>
                        <button onClick={() => toggleMute()}>{isMuted ? 'Unmute Signal' : 'Mute Signal'}</button>
                        <button onClick={() => handleClearChat(activeConv.id)}>Clear History</button>
                        <button className="danger" onClick={() => handleDeleteConversation(activeConv.id)}>Delete Transmission</button>
                      </>
                    )}
                  </div>
                )}

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
                  messages
                    .filter(msg => msg.content.toLowerCase().includes(chatSearchQuery.toLowerCase()))
                    .map((msg) => (
                      <div key={msg.id} className={`message-bubble ${msg.sender_id === user?.id ? 'sent' : 'received'}`}>
                        {activeConv?.is_group && msg.sender_id !== user?.id && <div className="msg-sender-name">{msg.sender ? msg.sender.name : 'Deleted User'}</div>}
                        <div className="msg-content">{msg.content}</div>
                        <small className="msg-time">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                      </div>
                    ))
                )}
                {Object.keys(typingUsers).length > 0 && (
                  <div className="typing-indicator">
                    {Object.values(typingUsers).join(', ')} {Object.keys(typingUsers).length > 1 ? 'are' : 'is'} typing...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {showDetails && (
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
                      />
                      <h4>{activeConv.is_group ? activeConv.name : (activeRecipient?.name || 'Crew Member')}</h4>
                      {!activeConv.is_group && <span className="details-role">{activeRecipient?.role || 'Crew Member'}</span>}
                    </div>

                    {activeConv.is_group ? (
                      <div className="details-section">
                        <div className="section-title">Members ({activeConv.users.length})</div>
                        <div className="details-members-list">
                          {activeConv.users.map(u => (
                            <div key={u.id} className="member-item">
                              <img src={getAvatarUrl(u.name, u.gender || 'Other', u.avatar_url)} alt="" className="mini-avatar" />
                              <div className="member-info">
                                <span className="member-name">{u.name}</span>
                                <span className="member-role">{u.role || 'Member'}</span>
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
                            <span>{activeRecipient?.created_at ? new Date(activeRecipient.created_at).toLocaleDateString() : 'Recently'}</span>
                          </div>
                        </div>
                        {activeRecipient?.skills && (
                          <div className="intel-skills">
                            <label>Skills</label>
                            <div className="skills-wrap">
                              {activeRecipient.skills.split(',').map(s => <span key={s} className="skill-tag">{s.trim()}</span>)}
                            </div>
                          </div>
                        )}
                        <div className="details-actions">
                          <button className="details-btn" onClick={() => window.location.href = `/profile/${activeRecipient?.id}`}>View Profile</button>
                          <button className="details-btn danger" onClick={() => handleDeleteConversation(activeConv.id)}>Delete History</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
    </div>
  );
}
