// localStorage abstraction layer
const STORAGE_KEYS = {
  USERS: 'chatapp_users',
  CONTACTS: 'chatapp_contacts',
  CONVERSATIONS: 'chatapp_conversations',
  CONV_MEMBERS: 'chatapp_conv_members',
  MESSAGES: 'chatapp_messages',
  SESSION: 'chatapp_session'
};

// Initialize with demo data if empty
export const initializeStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    const demoUsers = [
      {
        id: 'user-alice-123',
        email: 'alice@example.com',
        name: 'Alice Johnson',
        password: '123',
        createdAt: Date.now()
      },
      {
        id: 'user-bob-456',
        email: 'bob@example.com',
        name: 'Bob Smith',
        password: '123',
        createdAt: Date.now()
      },
      {
        id: 'user-charlie-789',
        email: 'charlie@example.com',
        name: 'Charlie Brown',
        password: '123',
        createdAt: Date.now()
      }
    ];

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(demoUsers));
  }

  // Initialize other storage with empty arrays if not exists
  const keys = [STORAGE_KEYS.CONTACTS, STORAGE_KEYS.CONVERSATIONS, STORAGE_KEYS.CONV_MEMBERS, STORAGE_KEYS.MESSAGES];
  keys.forEach(key => {
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify([]));
    }
  });
};

// Generic storage functions
export const getItem = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : [];
  } catch (error) {
    console.error(`Error reading ${key}:`, error);
    return [];
  }
};

export const setItem = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error writing ${key}:`, error);
    return false;
  }
};

// User operations
export const getUsers = () => getItem(STORAGE_KEYS.USERS);
export const saveUser = (user) => {
  const users = getUsers();
  // Check if user already exists
  const existingUser = users.find(u => u.email === user.email);
  if (existingUser) {
    return { error: 'User already exists' };
  }
  
  users.push(user);
  const success = setItem(STORAGE_KEYS.USERS, users);
  return success ? { user } : { error: 'Failed to save user' };
};

export const findUserByEmail = (email) => {
  const users = getUsers();
  return users.find(user => user.email === email.toLowerCase().trim());
};

export const findUserById = (id) => {
  const users = getUsers();
  return users.find(user => user.id === id);
};

// Contact operations
export const getContacts = () => getItem(STORAGE_KEYS.CONTACTS);
export const saveContact = (contact) => {
  const contacts = getContacts();
  
  // Check if contact already exists
  const existingContact = contacts.find(c => 
    (c.ownerId === contact.ownerId && c.contactId === contact.contactId) ||
    (c.ownerId === contact.contactId && c.contactId === contact.ownerId)
  );
  
  if (existingContact) {
    return { error: 'Contact already exists' };
  }
  
  contacts.push(contact);
  const success = setItem(STORAGE_KEYS.CONTACTS, contacts);
  return success ? { contact } : { error: 'Failed to save contact' };
};

export const updateContact = (contactId, updates) => {
  const contacts = getContacts();
  const index = contacts.findIndex(c => c.id === contactId);
  if (index !== -1) {
    contacts[index] = { ...contacts[index], ...updates };
    return setItem(STORAGE_KEYS.CONTACTS, contacts);
  }
  return false;
};

export const getContactBetweenUsers = (user1Id, user2Id) => {
  const contacts = getContacts();
  return contacts.find(contact => 
    (contact.ownerId === user1Id && contact.contactId === user2Id) ||
    (contact.ownerId === user2Id && contact.contactId === user1Id)
  );
};

// Conversation operations
export const getConversations = () => getItem(STORAGE_KEYS.CONVERSATIONS);
export const saveConversation = (conversation) => {
  const conversations = getConversations();
  conversations.push(conversation);
  const success = setItem(STORAGE_KEYS.CONVERSATIONS, conversations);
  return success ? conversation : null;
};

export const getConvMembers = () => getItem(STORAGE_KEYS.CONV_MEMBERS);
export const saveConvMember = (member) => {
  const members = getConvMembers();
  members.push(member);
  return setItem(STORAGE_KEYS.CONV_MEMBERS, members);
};

export const getConversationBetweenUsers = (user1Id, user2Id) => {
  const conversations = getConversations();
  const convMembers = getConvMembers();
  
  return conversations.find(conv => {
    const members = convMembers.filter(m => m.conversationId === conv.id);
    const userIds = members.map(m => m.userId);
    return userIds.includes(user1Id) && userIds.includes(user2Id);
  });
};

// Message operations
export const getMessages = () => getItem(STORAGE_KEYS.MESSAGES);
export const saveMessage = (message) => {
  const messages = getMessages();
  messages.push(message);
  const success = setItem(STORAGE_KEYS.MESSAGES, messages);
  return success ? message : null;
};

export const updateMessageStatus = (messageId, status) => {
  const messages = getMessages();
  const index = messages.findIndex(m => m.id === messageId);
  if (index !== -1) {
    messages[index].status = status;
    return setItem(STORAGE_KEYS.MESSAGES, messages);
  }
  return false;
};

export const getMessagesByConversation = (conversationId) => {
  const messages = getMessages();
  return messages
    .filter(m => m.conversationId === conversationId)
    .sort((a, b) => a.time - b.time);
};

// Session management
export const getSession = () => {
  const session = getItem(STORAGE_KEYS.SESSION);
  return session[0] || null;
};

export const setSession = (userId) => {
  return setItem(STORAGE_KEYS.SESSION, [{ userId, timestamp: Date.now() }]);
};

export const clearSession = () => {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
};

// Export/Import functionality
export const exportData = () => {
  const data = {};
  Object.values(STORAGE_KEYS).forEach(key => {
    data[key] = getItem(key);
  });
  return data;
};

export const importData = (data) => {
  Object.entries(data).forEach(([key, value]) => {
    setItem(key, value);
  });
};

export const resetToDemo = () => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  initializeStorage();
  clearSession();
};