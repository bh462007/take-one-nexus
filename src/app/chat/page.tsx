'use client';

import React, { useState, useEffect, useRef } from 'react';
import Pusher from 'pusher-js';
import { getAvatarUrl } from '@/lib/avatars';
import './chat.css';

export default function ChatPage() {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef(null);
  const pusherRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Get user from local storage (hybrid app pattern)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      window.location.href = '/?auth=login';
    }

    const params = new URLSearchParams(window.location.search);
    const targetUserId = params.get('user');

    fetchConversations(targetUserId);
  }, []);

  useEffect(() => {
    if (activeConv) {
      fetchMessages(activeConv.id);
      subscribeToConversation(activeConv.id);
    }
    return () => {
      if (activeConv) unsubscribeFromConversation(activeConv.id);
    };
  }, [activeConv]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async (targetUserId = null) => {
    try {
      const res = await fetch('/api/chat/conversations');
      const json = await res.json();
      if (json.success) {
        setConversations(json.data);
        
        if (targetUserId) {
          const existing = json.data.find(c => c.users.some(u => u.id === Number(targetUserId)));
          if (existing) {
            setActiveConv(existing);
          } else {
            // Initiate new conversation if not exists in list
            const userRes = await fetch(`/api/users/${targetUserId}`);
            const userJson = await userRes.json();
            if (userJson.success) {
               // Temporary mock conversation object until first message is sent
               setActiveConv({
                 id: null,
                 recipientId: Number(targetUserId),
                 users: [user, userJson.data],
                 messages: []
               });
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId) => {
    try {
      const res = await fetch(`/api/chat/messages/${convId}`);
      const json = await res.json();
      if (json.success) {
        setMessages(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
  };

  const subscribeToConversation = (convId) => {
    if (!pusherRef.current) {
      const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
      const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
      
      if (!pusherKey) return;
      
      pusherRef.current = new Pusher(pusherKey, {
        cluster: pusherCluster
      });
    }

    const channel = pusherRef.current.subscribe(`conversation-${convId}`);
    channel.bind('new-message', (data) => {
      setMessages((prev) => {
        // Prevent duplicate messages
        if (prev.find(m => m.id === data.message.id)) return prev;
        return [...prev, data.message];
      });
    });
  };

  const unsubscribeFromConversation = (convId) => {
    if (pusherRef.current) {
      pusherRef.current.unsubscribe(`conversation-${convId}`);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv) return;

    const content = newMessage;
    setNewMessage('');

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConv.id,
          recipientId: activeConv.id ? null : activeConv.recipientId,
          content
        })
      });
      
      const json = await res.json();
      if (json.success) {
        if (!activeConv.id) {
          // If it was a new conversation, we now have an ID
          const updatedConv = { ...activeConv, id: json.data.conversation_id };
          setActiveConv(updatedConv);
          fetchConversations(); // Refresh list to show the new conversation
        }
        
        setMessages((prev) => {
           if (prev.find(m => m.id === json.data.id)) return prev;
           return [...prev, json.data];
        });
      }
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const isPusherConfigured = typeof window !== 'undefined' && !!process.env.NEXT_PUBLIC_PUSHER_KEY;

  if (loading) return <div className="chat-loading">Synchronizing with Nexus...</div>;

  const getRecipient = (conv) => {
    return conv.users.find(u => u.id !== user?.id);
  };

  return (
    <div className="chat-page">
      <header className="chat-app-header">
        <a href="/" className="logo">TAKE <span>ONE</span></a>
        <nav>
          <a href="/profile">Back to Profile</a>
        </nav>
      </header>

      <div className="chat-container">
        {/* Sidebar */}
        <aside className="chat-sidebar">
          <div className="sidebar-header">
            <h2>Transmissions</h2>
          </div>
          <div className="conversation-list">
            {conversations.map((conv) => {
              const recipient = getRecipient(conv);
              const lastMsg = conv.messages[0]?.content || 'Start a conversation';
              return (
                <div 
                  key={conv.id} 
                  className={`conversation-item ${activeConv?.id === conv.id ? 'active' : ''}`}
                  onClick={() => setActiveConv(conv)}
                >
                  <img 
                    src={getAvatarUrl(recipient?.name, recipient?.gender, recipient?.avatar_url)} 
                    alt="" 
                    className="conv-avatar" 
                  />
                  <div className="conv-info">
                    <div className="conv-name">{recipient?.name}</div>
                    <div className="conv-last-msg">{lastMsg}</div>
                  </div>
                </div>
              );
            })}
            {conversations.length === 0 && (
              <div className="sidebar-empty">No active signals. Request a collaboration to start chatting.</div>
            )}
          </div>
        </aside>

        {/* Chat Window */}
        <main className="chat-window">
          {activeConv ? (
            <>
              <header className="chat-header">
                <div className="header-info">
                  <h3>{getRecipient(activeConv)?.name}</h3>
                  <span>{getRecipient(activeConv)?.role || 'Crew'}</span>
                </div>
              </header>

              <div className="messages-area">
                {messages.map((msg) => (
                  <div key={msg.id} className={`message-bubble ${msg.sender_id === user?.id ? 'sent' : 'received'}`}>
                    <div className="msg-content">{msg.content}</div>
                    <small className="msg-time">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-input-wrap" onSubmit={sendMessage}>
                <div className={`input-container ${!isPusherConfigured ? 'disabled' : ''}`}>
                  <input 
                    type="text" 
                    className="chat-input" 
                    placeholder={isPusherConfigured ? "Type your transmission..." : "Signal Offline - Configure Pusher to enable"}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={!isPusherConfigured}
                  />
                  <button type="submit" className="send-btn" disabled={!isPusherConfigured}>
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="chat-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              <h3>Secure Channel Idle</h3>
              <p>Select a transmission from the sidebar to begin.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
