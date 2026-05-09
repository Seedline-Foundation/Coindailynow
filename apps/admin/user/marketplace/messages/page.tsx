'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Send,
  User,
  Clock,
  CheckCircle,
  Package,
  Star,
  Paperclip,
  ChevronLeft,
  MoreVertical,
  Circle,
  Image as ImageIcon,
  File,
  ShoppingCart,
} from 'lucide-react';

// ===========================================================================
// TYPES
// ===========================================================================

interface Message {
  id: string;
  text: string;
  senderId: 'seller' | 'buyer';
  timestamp: string;
  isRead: boolean;
  attachment?: { name: string; type: 'image' | 'file' };
}

interface Conversation {
  id: string;
  buyer: {
    name: string;
    avatar: string;
    country: string;
    countryFlag: string;
    isOnline: boolean;
  };
  product: {
    name: string;
    type: string;
  };
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
  orderStatus?: 'completed' | 'processing' | 'pending';
}

// ===========================================================================
// MOCK DATA
// ===========================================================================

const mockConversations: Conversation[] = [
  {
    id: 'conv1',
    buyer: { name: 'Fatima Bello', avatar: 'FB', country: 'Nigeria', countryFlag: '🇳🇬', isOnline: true },
    product: { name: 'P2P Trading Blueprint', type: 'ebook' },
    lastMessage: 'Can I get the bonus chapter too?',
    lastMessageTime: '2026-03-02T11:30:00',
    unreadCount: 2,
    orderStatus: 'processing',
    messages: [
      { id: 'm1', text: 'Hi! I just purchased your P2P Trading Blueprint. Excited to start reading!', senderId: 'buyer', timestamp: '2026-03-01T22:45:00', isRead: true },
      { id: 'm2', text: 'Thank you Fatima! I hope you find it valuable. Let me know if you have any questions.', senderId: 'seller', timestamp: '2026-03-01T23:00:00', isRead: true },
      { id: 'm3', text: 'I noticed the PDF mentions a bonus chapter on arbitrage across Luno and Quidax. Is that included?', senderId: 'buyer', timestamp: '2026-03-02T10:15:00', isRead: true },
      { id: 'm4', text: 'Can I get the bonus chapter too?', senderId: 'buyer', timestamp: '2026-03-02T11:30:00', isRead: false },
    ],
  },
  {
    id: 'conv2',
    buyer: { name: 'Tendai Moyo', avatar: 'TM', country: 'Zimbabwe', countryFlag: '🇿🇼', isOnline: false },
    product: { name: 'P2P Trading Blueprint', type: 'ebook' },
    lastMessage: 'The file seems corrupted, can you resend?',
    lastMessageTime: '2026-03-01T15:30:00',
    unreadCount: 1,
    orderStatus: 'completed',
    messages: [
      { id: 'm5', text: 'Hello, I purchased your ebook but I\'m having trouble opening the file.', senderId: 'buyer', timestamp: '2026-02-27T15:00:00', isRead: true },
      { id: 'm6', text: 'I\'m sorry to hear that. What error are you getting?', senderId: 'seller', timestamp: '2026-02-27T16:00:00', isRead: true },
      { id: 'm7', text: 'The file seems corrupted, can you resend?', senderId: 'buyer', timestamp: '2026-03-01T15:30:00', isRead: false },
    ],
  },
  {
    id: 'conv3',
    buyer: { name: 'Grace Mwangi', avatar: 'GM', country: 'Kenya', countryFlag: '🇰🇪', isOnline: true },
    product: { name: 'DeFi Masterclass for Africa', type: 'course' },
    lastMessage: 'Thank you! The course is amazing 🔥',
    lastMessageTime: '2026-03-02T09:00:00',
    unreadCount: 0,
    orderStatus: 'completed',
    messages: [
      { id: 'm8', text: 'Quick question - when will Module 7 on yield farming be available?', senderId: 'buyer', timestamp: '2026-03-01T14:10:00', isRead: true },
      { id: 'm9', text: 'Module 7 is now live! You should see it in your course dashboard. It covers PancakeSwap and Uniswap strategies.', senderId: 'seller', timestamp: '2026-03-01T18:00:00', isRead: true },
      { id: 'm10', text: 'Thank you! The course is amazing 🔥', senderId: 'buyer', timestamp: '2026-03-02T09:00:00', isRead: true },
    ],
  },
  {
    id: 'conv4',
    buyer: { name: 'Samuel Tetteh', avatar: 'ST', country: 'Ghana', countryFlag: '🇬🇭', isOnline: false },
    product: { name: 'Nigeria Market Report Q1', type: 'report' },
    lastMessage: 'Very insightful report. Will you cover Ghana in Q2?',
    lastMessageTime: '2026-03-01T18:20:00',
    unreadCount: 0,
    orderStatus: 'completed',
    messages: [
      { id: 'm11', text: 'Just finished reading the Q1 report. Very insightful!', senderId: 'buyer', timestamp: '2026-03-01T17:00:00', isRead: true },
      { id: 'm12', text: 'Thank you Samuel! Glad you found it useful.', senderId: 'seller', timestamp: '2026-03-01T17:30:00', isRead: true },
      { id: 'm13', text: 'Very insightful report. Will you cover Ghana in Q2?', senderId: 'buyer', timestamp: '2026-03-01T18:20:00', isRead: true },
    ],
  },
  {
    id: 'conv5',
    buyer: { name: 'Amara Konte', avatar: 'AK', country: 'Senegal', countryFlag: '🇸🇳', isOnline: true },
    product: { name: 'DeFi Masterclass for Africa', type: 'course' },
    lastMessage: 'Welcome aboard! Here is your access link.',
    lastMessageTime: '2026-03-02T10:30:00',
    unreadCount: 0,
    orderStatus: 'completed',
    messages: [
      { id: 'm14', text: 'Hi, I just enrolled in your DeFi Masterclass. How do I access the materials?', senderId: 'buyer', timestamp: '2026-03-02T10:00:00', isRead: true },
      { id: 'm15', text: 'Welcome aboard! Here is your access link.', senderId: 'seller', timestamp: '2026-03-02T10:30:00', isRead: true },
    ],
  },
];

// ===========================================================================
// COMPONENT
// ===========================================================================

export default function SellerMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [search, setSearch] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [showMobileList, setShowMobileList] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const filteredConversations = useMemo(() => {
    if (!search) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(c => c.buyer.name.toLowerCase().includes(q) || c.product.name.toLowerCase().includes(q));
  }, [conversations, search]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConv?.messages.length]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConv) return;
    const msg: Message = {
      id: `msg-${Date.now()}`,
      text: newMessage.trim(),
      senderId: 'seller',
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    setConversations(prev => prev.map(c =>
      c.id === selectedConv.id
        ? { ...c, messages: [...c.messages, msg], lastMessage: msg.text, lastMessageTime: msg.timestamp }
        : c
    ));
    setSelectedConv(prev => prev ? { ...prev, messages: [...prev.messages, msg], lastMessage: msg.text, lastMessageTime: msg.timestamp } : null);
    setNewMessage('');
  };

  const selectConversation = (conv: Conversation) => {
    setSelectedConv(conv);
    setShowMobileList(false);
    // Mark as read
    if (conv.unreadCount > 0) {
      setConversations(prev => prev.map(c =>
        c.id === conv.id
          ? { ...c, unreadCount: 0, messages: c.messages.map(m => ({ ...m, isRead: true })) }
          : c
      ));
    }
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-7 h-7 text-primary-500" /> Messages
          {totalUnread > 0 && <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">{totalUnread}</span>}
        </h1>
      </div>

      <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden flex" style={{ height: 'calc(100vh - 180px)', minHeight: '500px' }}>
        {/* Conversation List */}
        <div className={`w-full md:w-80 border-r border-dark-700 flex flex-col ${!showMobileList && selectedConv ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-3 border-b border-dark-700">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
              <input type="text" placeholder="Search conversations..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-dark-700">
            {filteredConversations.map(conv => (
              <button key={conv.id} onClick={() => selectConversation(conv)}
                className={`w-full p-3 text-left hover:bg-dark-800/50 transition-colors ${selectedConv?.id === conv.id ? 'bg-dark-800' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-xs font-bold text-primary-400">
                      {conv.buyer.avatar}
                    </div>
                    {conv.buyer.isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-dark-900" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white truncate">{conv.buyer.name} {conv.buyer.countryFlag}</p>
                      <span className="text-xs text-dark-500 flex-shrink-0">{formatTime(conv.lastMessageTime)}</span>
                    </div>
                    <p className="text-xs text-dark-400 truncate mt-0.5">{conv.product.name}</p>
                    <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? 'text-white font-medium' : 'text-dark-500'}`}>{conv.lastMessage}</p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="w-5 h-5 bg-primary-500 text-dark-950 text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </button>
            ))}
            {filteredConversations.length === 0 && (
              <div className="p-6 text-center text-dark-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No conversations found</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        {selectedConv ? (
          <div className={`flex-1 flex flex-col ${showMobileList ? 'hidden md:flex' : 'flex'}`}>
            {/* Chat Header */}
            <div className="p-4 border-b border-dark-700 flex items-center gap-3">
              <button onClick={() => setShowMobileList(true)} className="md:hidden p-1 text-dark-400 hover:text-white">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-xs font-bold text-primary-400">
                  {selectedConv.buyer.avatar}
                </div>
                {selectedConv.buyer.isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-dark-900" />}
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">{selectedConv.buyer.name} {selectedConv.buyer.countryFlag}</p>
                <p className="text-xs text-dark-400 flex items-center gap-1.5">
                  <Package className="w-3 h-3" /> {selectedConv.product.name}
                  {selectedConv.buyer.isOnline && <span className="text-green-400">· Online</span>}
                </p>
              </div>
              {selectedConv.orderStatus && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  selectedConv.orderStatus === 'completed' ? 'bg-green-500/10 text-green-400' :
                  selectedConv.orderStatus === 'processing' ? 'bg-blue-500/10 text-blue-400' :
                  'bg-yellow-500/10 text-yellow-400'
                }`}>
                  <ShoppingCart className="w-3 h-3 inline mr-1" />{selectedConv.orderStatus}
                </span>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selectedConv.messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.senderId === 'seller' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    msg.senderId === 'seller'
                      ? 'bg-primary-500 text-dark-950'
                      : 'bg-dark-800 text-white'
                  }`}>
                    <p className="text-sm">{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.senderId === 'seller' ? 'text-dark-950/50' : 'text-dark-500'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-3 border-t border-dark-700">
              <div className="flex items-center gap-2">
                <button className="p-2 text-dark-400 hover:text-white rounded-lg hover:bg-dark-800">
                  <Paperclip className="w-5 h-5" />
                </button>
                <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-xl text-white text-sm" />
                <button onClick={handleSendMessage} disabled={!newMessage.trim()}
                  className="p-2.5 bg-primary-500 text-dark-950 rounded-xl hover:bg-primary-600 disabled:opacity-30 disabled:cursor-not-allowed">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-6 hidden md:flex">
            <div>
              <MessageSquare className="w-16 h-16 text-dark-600 mx-auto mb-4" />
              <p className="text-dark-400 font-medium">Select a conversation</p>
              <p className="text-dark-500 text-sm mt-1">Chat with your buyers and provide support</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
