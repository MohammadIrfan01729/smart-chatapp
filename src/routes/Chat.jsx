import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  getSession, 
  findUserById, 
  getConversations, 
  getConvMembers, 
  getMessages, 
  saveMessage, 
  updateMessageStatus,
  clearSession,
  getContacts,
  getMessagesByConversation
} from '../lib/storage';
import { createMessage, replaceEmojis } from '../lib/models';

const Chat = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const navigate = useNavigate();
  const { conversationId } = useParams();

  useEffect(() => {
    const session = getSession();
    if (!session) {
      navigate('/');
      return;
    }

    const user = findUserById(session.userId);
    if (!user) {
      clearSession();
      navigate('/');
      return;
    }

    setCurrentUser(user);
    loadConversations(user.id);
  }, [navigate]);

  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
        setActiveConversation(conversation);
        loadMessages(conversation.id);
      }
    }
  }, [conversationId, conversations]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setNewMessage(prev => prev + ' ' + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const loadConversations = (userId) => {
    const allConversations = getConversations();
    const allConvMembers = getConvMembers();
    const contacts = getContacts();

    const userConversations = allConversations.filter(conv => {
      const members = allConvMembers.filter(m => m.conversationId === conv.id);
      return members.some(m => m.userId === userId);
    }).map(conv => {
      const members = allConvMembers.filter(m => m.conversationId === conv.id);
      const otherMemberId = members.find(m => m.userId !== userId)?.userId;
      const otherUser = findUserById(otherMemberId);
      
      // Get last message for preview
      const convMessages = getMessagesByConversation(conv.id);
      const lastMessage = convMessages[convMessages.length - 1];
      
      return {
        ...conv,
        otherUser,
        lastMessage,
        unreadCount: 0 // You can implement unread count logic
      };
    }).filter(conv => conv.otherUser) // Only show conversations with valid users
    .sort((a, b) => {
      // Sort by last message time or creation time
      const aTime = a.lastMessage?.time || a.createdAt;
      const bTime = b.lastMessage?.time || b.createdAt;
      return bTime - aTime;
    });

    setConversations(userConversations);
  };

  const loadMessages = (convId) => {
    const convMessages = getMessagesByConversation(convId);
    setMessages(convMessages);

    // Simulate message status updates for user's messages
    convMessages.forEach((message, index) => {
      if (message.senderId === currentUser.id && message.status === 'sent') {
        setTimeout(() => {
          updateMessageStatus(message.id, 'delivered');
          // Reload messages to show updated status
          const updatedMessages = getMessagesByConversation(convId);
          setMessages(updatedMessages);
        }, 1000 + index * 200);

        setTimeout(() => {
          updateMessageStatus(message.id, 'seen');
          const updatedMessages = getMessagesByConversation(convId);
          setMessages(updatedMessages);
        }, 3000 + index * 200);
      }
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeConversation || loading) return;
    
    setLoading(true);
    
    try {
      const messageText = replaceEmojis(newMessage.trim());
      const message = createMessage(activeConversation.id, currentUser.id, messageText);
      const savedMessage = saveMessage(message);
      
      if (savedMessage) {
        setNewMessage('');
        loadMessages(activeConversation.id);
        loadConversations(currentUser.id); // Update conversation list
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Try Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Speech recognition start failed:', error);
        alert('Cannot start speech recognition. Please check microphone permissions.');
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent': return '✓';
      case 'delivered': return '✓✓';
      case 'seen': return '✓✓';
      default: return '⋯';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return 'var(--text-muted)';
      case 'delivered': return 'var(--text-muted)';
      case 'seen': return 'var(--primary-color)';
      default: return 'var(--text-muted)';
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp) => {
    const messageDate = new Date(timestamp);
    const today = new Date();
    
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    return messageDate.toLocaleDateString();
  };

  const shouldShowDate = (message, index) => {
    if (index === 0) return true;
    
    const currentDate = new Date(message.time).toDateString();
    const prevDate = new Date(messages[index - 1].time).toDateString();
    
    return currentDate !== prevDate;
  };

  if (!currentUser) {
    return (
      <div className="container">
        <div className="card text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: '100px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="nav">
        <div className="nav-title">
          {activeConversation ? 
            ` ${activeConversation.otherUser?.name}` : 
            ' Messages'
          }
        </div>
        <div className="nav-actions">
          <button 
            className="secondary" 
            onClick={() => navigate('/contacts')}
            disabled={loading}
          >
            Contacts
          </button>
          <button 
            className="secondary" 
            onClick={() => {
              clearSession();
              navigate('/');
            }}
            disabled={loading}
          >
            Logout
          </button>
        </div>
      </div>

      {!activeConversation ? (
        // Conversation list view
        <div style={{ flex: 1, overflow: 'auto' }}>
          <div className="card">
            <h3 className="mb-1">Your Conversations</h3>
            {conversations.length === 0 ? (
              <div className="text-center text-muted">
                <p>No conversations yet.</p>
                <button 
                  onClick={() => navigate('/contacts')}
                  style={{ marginTop: '1rem' }}
                >
                  Go to Contacts to start chatting
                </button>
              </div>
            ) : (
              <div className="list">
                {conversations.map(conv => (
                  <div 
                    key={conv.id} 
                    className="list-item"
                    onClick={() => navigate(`/chat/${conv.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="list-item-avatar">
                      {conv.otherUser?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="list-item-content">
                      <div className="list-item-title">
                        {conv.otherUser?.name}
                      </div>
                      <div className="list-item-subtitle">
                        {conv.lastMessage ? (
                          <>
                            <span style={{ 
                              fontWeight: conv.lastMessage.senderId === currentUser.id ? '600' : '400',
                              color: conv.lastMessage.senderId === currentUser.id ? 'var(--primary-color)' : 'var(--text-muted)'
                            }}>
                              {conv.lastMessage.senderId === currentUser.id ? 'You: ' : ''}
                            </span>
                            {conv.lastMessage.text.length > 30 
                              ? conv.lastMessage.text.substring(0, 30) + '...' 
                              : conv.lastMessage.text
                            }
                          </>
                        ) : (
                          'No messages yet'
                        )}
                      </div>
                    </div>
                    {conv.lastMessage && (
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--text-muted)',
                        textAlign: 'right',
                        minWidth: '50px'
                      }}>
                        {formatTime(conv.lastMessage.time)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        // Active chat view
        <>
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '1rem',
            display: 'flex', 
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            {messages.length === 0 ? (
              <div className="text-center text-muted" style={{ marginTop: '2rem' }}>
                <p>No messages yet. Start the conversation!</p>
                <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  Try using voice input 🎙️ or type :haha for emojis
                </p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isOwn = message.senderId === currentUser.id;
                const sender = findUserById(message.senderId);
                const showDate = shouldShowDate(message, index);
                
                return (
                  <React.Fragment key={message.id}>
                    {showDate && (
                      <div style={{
                        textAlign: 'center',
                        margin: '1rem 0',
                        color: 'var(--text-muted)',
                        fontSize: '0.8rem'
                      }}>
                        {formatDate(message.time)}
                      </div>
                    )}
                    <div
                      className={`message ${isOwn ? 'own' : 'other'}`}
                    >
                      {!isOwn && sender && (
                        <div className="message-sender">
                          {sender.name}
                        </div>
                      )}
                      <div style={{ wordBreak: 'break-word' }}>{message.text}</div>
                      <div className="message-time">
                        {formatTime(message.time)}
                        {isOwn && (
                          <span 
                            className="message-status"
                            style={{ color: getStatusColor(message.status) }}
                          >
                            {getStatusIcon(message.status)}
                          </span>
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="chat-input-container">
            <div className="chat-input-wrapper">
              <textarea
                className="chat-input" 
                placeholder="Type a message"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                rows={1}
                style={{
                  minHeight: '44px',
                  maxHeight: '120px',
                  resize: 'none'
                }}
              />
              <button
                className={`voice-btn ${isListening ? 'listening' : ''}`}
                type="button"
                onClick={toggleSpeechRecognition}
                disabled={loading}
                title="Voice input"
              >
                🎙️
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || loading}
                style={{ width: 'auto', padding: '0.75rem 1.5rem' }}
              >
                {loading ? '...' : 'Send'}
              </button>
            </div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: 'var(--text-muted)', 
              marginTop: '0.5rem',
              textAlign: 'center'
            }}>
              
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Chat;