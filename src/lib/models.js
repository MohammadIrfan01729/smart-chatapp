// Data models and factories
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

export const createUser = (email, name, password) => ({
  id: generateId(),
  email: email.toLowerCase().trim(),
  name: name.trim(),
  password: password, // Simple storage for demo
  createdAt: Date.now()
});

export const createContact = (ownerId, contactId, status = 'pending') => ({
  id: generateId(),
  ownerId,
  contactId,
  status,
  createdAt: Date.now()
});

export const createConversation = () => ({
  id: generateId(),
  createdAt: Date.now()
});

export const createMessage = (conversationId, senderId, text) => ({
  id: generateId(),
  conversationId,
  senderId,
  text: text.trim(),
  time: Date.now(),
  status: 'sent'
});

// Enhanced emoji mapping
export const emojiMap = {
  ':)': '😊',
  ':-)': '😊',
  ':(': '😞',
  ':-(': '😞',
  ':D': '😃',
  ':-D': '😃',
  ';)': '😉',
  ';-)': '😉',
  ':P': '😛',
  ':-P': '😛',
  ':O': '😮',
  ':-O': '😮',
  ':*': '😘',
  ':-*': '😘',
  '<3': '❤️',
  '</3': '💔',
  ':/': '😕',
  ':-/': '😕',
  ':|': '😐',
  ':-|': '😐',
  ":'(": '😢',
  ':poop:': '💩',
  ':fire': '🔥',
  ':100': '💯',
  ':heart': '❤️',
  ':star': '⭐',
  ':clap': '👏',
  ':pray': '🙏',
  ':rocket': '🚀',
  ':thumbsup': '👍',
  ':thumbsdown': '👎',
  ':ok': '👌',
  ':wave': '👋'
};

export const replaceEmojis = (text) => {
  let result = text;
  // Sort by key length to match longer patterns first
  const sortedKeys = Object.keys(emojiMap).sort((a, b) => b.length - a.length);
  
  sortedKeys.forEach(key => {
    const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    result = result.replace(regex, emojiMap[key]);
  });
  return result;
};