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
  created?: boolean;
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pusherRef = useRef<Pusher | null>(null);

  const activeRecipient = useMemo(() => {
    if (!activeConv || !user) return null;
    return activeConv.users.find((member) => member.id !== user.id) || null;
  }, [activeConv, user]);

  const getRecipient = useCallback((conv: Conversation) => {
    return conv.users.find((member) => member.id !== user?.id) || conv.users[0];
  }, [user?.id]);

  const setActiveConversation = useCallback((conversation: Conversation, updateUrl = true) => {
    setActiveConv(conversation);
    setMessages([]);
    localStorage.setItem('take_one_last_conversation', String(conversation.id));

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
      return [conversation, ...withoutDuplicate];
    });
    setActiveConversation(conversation);
    return conversation;
  }, [setActiveConversation]);

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
    if (!activeConv) return;

    if (!pusherRef.current) {
      const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
      const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

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
      setMessages((prev) => {
        if (prev.find((message) => message.id === data.message.id)) return prev;
        return [...prev, data.message];
      });
      setConversations((current) => current.map((conversation) => (
        conversation.id === data.message.conversation_id
          ? { ...conversation, messages: [data.message] }
          : conversation
      )));
    });

    return () => {
      channel.unbind_all();
      pusherRef.current?.unsubscribe(channelName);
    };
  }, [activeConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, messageLoading]);

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
          <div className="sidebar-header flex justify-between items-center px-4 py-2">
            <h2>Transmissions</h2>
            <button onClick={() => setIsGroupModalOpen(true)} className="text-xs bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded text-white font-bold" aria-label="Create Group">+</button>
          </div>
          <div className="conversation-list">
            {conversations.map((conv) => {
              const recipient = getRecipient(conv);
              const lastMsg = conv.messages[0]?.content || 'No messages yet';
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
                <div className="header-info">
                  <div className="header-name-row">
                    <h3>{activeConv?.is_group ? activeConv.name : (activeRecipient?.name || 'Crew Member')}</h3>
                    <div className="status-indicator">
                      <span className="status-dot online"></span>
                      <span>Signal Live</span>
                    </div>
                  </div>
                  <span className="header-role">{activeConv?.is_group ? `${activeConv.users.length} Members` : (activeRecipient?.role || 'Crew Member')}</span>
                </div>
              </header>

              <div className="messages-area">
                {messageLoading ? (
                  <div className="message-state">Loading message history...</div>
                ) : messages.length === 0 ? (
                  <div className="message-state">No messages yet. Start the conversation.</div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`message-bubble ${msg.sender_id === user?.id ? 'sent' : 'received'}`}>
                      {activeConv?.is_group && msg.sender_id !== user?.id && <div className="text-xs text-gray-400 mb-1 font-bold">{msg.sender.name}</div>}
                      <div className="msg-content">{msg.content}</div>
                      <small className="msg-time">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-input-wrap" onSubmit={sendMessage}>
                <div className="input-container">
                  <input
                    ref={inputRef}
                    type="text"
                    className="chat-input"
                    placeholder={`Message ${activeConv?.is_group ? activeConv.name : (activeRecipient?.name || 'crew member')}...`}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={sending}
                  />
                  <button type="submit" className="send-btn" disabled={!newMessage.trim() || sending} aria-label="Send message">
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
            </div>
          )}
        </main>
      </div>
      <CreateGroupModal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} onCreate={createGroupConversation} />
    </div>
  );
}
