import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getSession, 
  findUserById, 
  getUsers, 
  getContacts, 
  saveContact, 
  updateContact,
  getConversations,
  getConvMembers,
  saveConversation,
  saveConvMember,
  clearSession,
  getContactBetweenUsers,
  getConversationBetweenUsers
} from '../lib/storage';
import { createContact, createConversation } from '../lib/models';

const Contacts = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
    loadData(user.id);
  }, [navigate]);

  const loadData = (userId) => {
    const allUsers = getUsers().filter(user => user.id !== userId);
    const userContacts = getContacts().filter(contact => 
      contact.ownerId === userId || contact.contactId === userId
    );

    setUsers(allUsers);
    setContacts(userContacts);
  };

  const getContactUser = (contact) => {
    if (contact.ownerId === currentUser.id) {
      return findUserById(contact.contactId);
    }
    return findUserById(contact.ownerId);
  };

  const getContactStatus = (contact) => {
    if (contact.ownerId === currentUser.id) {
      return contact.status === 'pending' ? 'pending' : 'accepted';
    }
    return contact.status === 'pending' ? 'request' : 'accepted';
  };

  const handleAddContact = async (userEmail) => {
    if (loading) return;
    
    setLoading(true);
    const targetUser = users.find(user => user.email === userEmail);
    if (!targetUser) {
      setLoading(false);
      return;
    }

    // Check if contact already exists
    const existingContact = getContactBetweenUsers(currentUser.id, targetUser.id);
    if (existingContact) {
      setLoading(false);
      return;
    }

    const newContact = createContact(currentUser.id, targetUser.id, 'pending');
    const result = saveContact(newContact);
    
    if (!result.error) {
      loadData(currentUser.id);
      setSearchTerm('');
    }
    setLoading(false);
  };

  const handleAcceptContact = async (contactId) => {
    if (loading) return;
    
    setLoading(true);
    const success = updateContact(contactId, { status: 'accepted' });
    if (success) {
      loadData(currentUser.id);
    }
    setLoading(false);
  };

  const handleStartChat = (contactUser) => {
    // Find existing conversation
    const existingConv = getConversationBetweenUsers(currentUser.id, contactUser.id);

    if (existingConv) {
      navigate(`/chat/${existingConv.id}`);
      return;
    }

    // Create new conversation
    const newConversation = createConversation();
    const savedConv = saveConversation(newConversation);
    
    if (savedConv) {
      // Add both users to conversation
      saveConvMember({ conversationId: savedConv.id, userId: currentUser.id });
      saveConvMember({ conversationId: savedConv.id, userId: contactUser.id });
      navigate(`/chat/${savedConv.id}`);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingRequests = contacts.filter(contact => 
    getContactStatus(contact) === 'request'
  );

  const acceptedContacts = contacts.filter(contact => 
    getContactStatus(contact) === 'accepted'
  );

  const sentRequests = contacts.filter(contact => 
    getContactStatus(contact) === 'pending'
  );

  if (!currentUser) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <div className="nav">
        <div className="nav-title">Contacts</div>
        <div className="nav-actions">
          <button 
            className="secondary" 
            onClick={() => navigate('/chat')}
            disabled={loading}
          >
            Chats
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

      {/* Search and Add Contacts */}
      <div className="card">
        <h3 className="mb-1">Add New Contact</h3>
        <div className="form-group">
          <input
            type="text"
            placeholder="Search users by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={loading}
          />
        </div>

        {searchTerm && filteredUsers.length > 0 && (
          <div className="list">
            {filteredUsers.map(user => {
              const existingContact = getContactBetweenUsers(currentUser.id, user.id);
              
              return (
                <div key={user.id} className="list-item">
                  <div className="list-item-avatar">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="list-item-content">
                    <div className="list-item-title">{user.name}</div>
                    <div className="list-item-subtitle">{user.email}</div>
                  </div>
                  {!existingContact ? (
                    <button 
                      onClick={() => handleAddContact(user.email)}
                      disabled={loading}
                      style={{ width: 'auto', padding: '0.5rem 1rem' }}
                    >
                      {loading ? '...' : 'Add'}
                    </button>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      Already connected
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {searchTerm && filteredUsers.length === 0 && (
          <p className="text-muted">No users found matching "{searchTerm}"</p>
        )}
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="card">
          <h3 className="mb-1">Contact Requests</h3>
          <div className="list">
            {pendingRequests.map(contact => {
              const contactUser = getContactUser(contact);
              if (!contactUser) return null;

              return (
                <div key={contact.id} className="list-item">
                  <div className="list-item-avatar">
                    {contactUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="list-item-content">
                    <div className="list-item-title">{contactUser.name}</div>
                    <div className="list-item-subtitle">{contactUser.email}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => handleAcceptContact(contact.id)}
                      disabled={loading}
                      style={{ width: 'auto', padding: '0.5rem 1rem' }}
                    >
                      {loading ? '...' : 'Accept'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Your Contacts */}
      <div className="card">
        <h3 className="mb-1">Your Contacts ({acceptedContacts.length})</h3>
        {acceptedContacts.length === 0 ? (
          <p className="text-muted">
            No contacts yet. Search for users above to add them, or accept pending requests.
          </p>
        ) : (
          <div className="list">
            {acceptedContacts.map(contact => {
              const contactUser = getContactUser(contact);
              if (!contactUser) return null;

              return (
                <div key={contact.id} className="list-item">
                  <div className="list-item-avatar">
                    {contactUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="list-item-content">
                    <div className="list-item-title">{contactUser.name}</div>
                    <div className="list-item-subtitle">{contactUser.email}</div>
                  </div>
                  <button 
                    onClick={() => handleStartChat(contactUser)}
                    disabled={loading}
                    style={{ width: 'auto', padding: '0.5rem 1rem' }}
                  >
                    Chat
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sent Requests */}
      {sentRequests.length > 0 && (
        <div className="card">
          <h3 className="mb-1">Sent Requests ({sentRequests.length})</h3>
          <div className="list">
            {sentRequests.map(contact => {
              const contactUser = getContactUser(contact);
              if (!contactUser) return null;

              return (
                <div key={contact.id} className="list-item">
                  <div className="list-item-avatar">
                    {contactUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="list-item-content">
                    <div className="list-item-title">{contactUser.name}</div>
                    <div className="list-item-subtitle">{contactUser.email}</div>
                  </div>
                  <span style={{ color: 'var(--warning-color)', fontSize: '0.9rem' }}>
                    Pending
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Contacts;