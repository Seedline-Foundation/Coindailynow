'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  HelpCircle,
  MessageSquare,
  Ticket,
  Mail,
  Search,
  ChevronDown,
  ChevronRight,
  Send,
  ArrowLeft,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  X,
  Bot,
  User,
  Sparkles,
  LifeBuoy,
  ThumbsUp,
  ThumbsDown,
  Globe,
  Loader2
} from 'lucide-react';

import {
  fetchTickets,
  createTicket,
  replyTicket,
  sendContactEmail,
  sendAIChatMessage,
  fetchProfile
} from '../../../lib/userApi';

import { HELP_CATEGORIES, getCategoriesByRegion, HelpCategory } from '../../../lib/helpData';

const DEPARTMENT_EMAILS = {
  technical: { name: 'Technical Support', email: 'support@sygn.live', icon: '🔧' },
  billing: { name: 'Billing & Payments', email: 'billing@sygn.live', icon: '💳' },
  partnerships: { name: 'Partnerships', email: 'partnerships@sygn.live', icon: '🤝' },
  editorial: { name: 'Editorial & Press', email: 'editorial@sygn.live', icon: '📰' },
  general: { name: 'General Inquiries', email: 'hello@sygn.live', icon: '💬' }
};

export default function HelpCenterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Tab controller (default: faq)
  const currentTab = searchParams?.get('tab') || 'faq';
  const setActiveTab = (tab: string) => {
    router.push(`/user/help?tab=${tab}`);
  };

  // User Profile / Regional detection state
  const [userCountry, setUserCountry] = useState<string>('NG');
  const [userLanguage, setUserLanguage] = useState<string>('en');
  const [profileLoading, setProfileLoading] = useState<boolean>(true);

  // Load profile
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetchProfile();
        if (res?.data) {
          setUserCountry(res.data.country || 'NG');
          setUserLanguage(res.data.preferredLanguage || 'en');
        }
      } catch (err) {
        console.warn('Failed to load profile for localization, using defaults.', err);
      } finally {
        setProfileLoading(false);
      }
    }
    loadProfile();
  }, []);

  // ==========================================
  // TAB 1: FAQ STATE
  // ==========================================
  const [faqSearch, setFaqSearch] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedArticles, setExpandedArticles] = useState<Record<string, boolean>>({});
  const [helpfulFeedback, setHelpfulFeedback] = useState<Record<string, 'up' | 'down'>>({});

  const regionalCategories = getCategoriesByRegion(userCountry);

  const toggleCategory = (catId: string) => {
    setExpandedCategory(expandedCategory === catId ? null : catId);
  };

  const toggleArticle = (artId: string) => {
    setExpandedArticles(prev => ({ ...prev, [artId]: !prev[artId] }));
  };

  const handleFAQFeedback = (artId: string, type: 'up' | 'down') => {
    setHelpfulFeedback(prev => ({ ...prev, [artId]: type }));
  };

  // FAQ search logic
  const filteredCategories = regionalCategories.map(cat => {
    const matchingArticles = cat.articles.filter(art =>
      art.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
      art.answer.toLowerCase().includes(faqSearch.toLowerCase())
    );
    return { ...cat, articles: matchingArticles };
  }).filter(cat => cat.articles.length > 0);


  // ==========================================
  // TAB 2: AI CONCIERGE STATE
  // ==========================================
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; sources?: string[] }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAITyping, setIsAITyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    { label: 'Why is SOL pumping?', desc: 'Market intelligence' },
    { label: 'Summarize today\'s AI news', desc: 'Content summary' },
    { label: 'Explain DeFi like I\'m new', desc: 'Education' },
    { label: 'How do stablecoins work in Africa?', desc: 'Regional insights' },
    { label: 'Best remittance options for LatAm', desc: 'Regional insights' }
  ];

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAITyping]);

  const handleSendAIChat = async (messageText: string) => {
    if (!messageText.trim()) return;

    // Add user message
    const newHistory = [...chatMessages, { role: 'user' as const, content: messageText }];
    setChatMessages(newHistory);
    setChatInput('');
    setIsAITyping(true);

    try {
      // Map history to the simplified role/content schema expected by endpoints
      const historyPayload = chatMessages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }));

      const res = await sendAIChatMessage(messageText, historyPayload);
      if (res?.data) {
        setChatMessages(prev => [
          ...prev,
          {
            role: 'assistant' as const,
            content: res.data.message,
            sources: res.data.sources
          }
        ]);
      }
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant' as const,
          content: 'Sorry, I encountered an issue sending your request. Please try again.'
        }
      ]);
    } finally {
      setIsAITyping(false);
    }
  };


  // ==========================================
  // TAB 3: TICKETS STATE
  // ==========================================
  const [ticketsList, setTicketsList] = useState<any[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketView, setTicketView] = useState<'list' | 'detail' | 'create'>('list');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  
  // Create ticket states
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketCategory, setTicketCategory] = useState('general');
  const [ticketPriority, setTicketPriority] = useState('normal');
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  
  // List filtering
  const [ticketFilterStatus, setTicketFilterStatus] = useState('all');
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketsPage, setTicketsPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Ticket reply states
  const [replyMessage, setReplyMessage] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  const loadTickets = async () => {
    try {
      setTicketsLoading(true);
      const res = await fetchTickets(ticketFilterStatus, ticketSearch, ticketsPage, 10);
      if (res?.data) {
        setTicketsList(res.data);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
        }
      }
    } catch (err) {
      console.error('Failed to load tickets', err);
    } finally {
      setTicketsLoading(false);
    }
  };

  // Reload tickets when tab is active and filters change
  useEffect(() => {
    if (currentTab === 'tickets' && ticketView === 'list') {
      loadTickets();
    }
  }, [currentTab, ticketView, ticketFilterStatus, ticketSearch, ticketsPage]);

  // Reload detail when replying
  const handleSelectTicket = (ticket: any) => {
    setSelectedTicket(ticket);
    setTicketView('detail');
  };

  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) return;

    try {
      setTicketSubmitting(true);
      const res = await createTicket({
        subject: ticketSubject,
        message: ticketMessage,
        category: ticketCategory,
        priority: ticketPriority
      });

      if (res?.data) {
        setTicketSubject('');
        setTicketMessage('');
        setTicketCategory('general');
        setTicketPriority('normal');
        setTicketView('list');
        loadTickets();
      }
    } catch (err) {
      console.error('Error creating ticket:', err);
    } finally {
      setTicketSubmitting(false);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;

    try {
      setReplySubmitting(true);
      const res = await replyTicket(selectedTicket.id, replyMessage);
      if (res?.data) {
        setReplyMessage('');
        // Reload detail
        setSelectedTicket(res.data);
        // Refresh ticket list in background
        loadTickets();
      }
    } catch (err) {
      console.error('Error replying to ticket:', err);
    } finally {
      setReplySubmitting(false);
    }
  };

  const getPriorityColor = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-red-500 text-red-50';
      case 'high':
        return 'bg-orange-500 text-orange-50';
      case 'medium':
      case 'normal':
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      case 'low':
        return 'bg-gray-700 text-gray-300';
      default:
        return 'bg-gray-800 text-gray-400';
    }
  };

  const getCategoryLabel = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'technical': return '🔧 Technical';
      case 'account': return '👤 Account';
      case 'billing': return '💳 Billing';
      case 'feature': return '💡 Feature Request';
      case 'content': return '📰 Content';
      case 'general': return '📋 General';
      case 'mobile_money': return '📱 Mobile Money';
      case 'payment_problem': return '💳 Local Payments';
      default: return category || 'General';
    }
  };


  // ==========================================
  // TAB 4: CONTACT / DEPT STATE
  // ==========================================
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDept || !contactSubject || contactMessage.length < 20) return;

    try {
      setContactSubmitting(true);
      const res = await sendContactEmail({
        department: selectedDept,
        subject: contactSubject,
        message: contactMessage
      });
      if (res?.data?.success) {
        setContactSuccess(true);
        setContactSubject('');
        setContactMessage('');
      }
    } catch (err) {
      console.error('Error sending contact message:', err);
    } finally {
      setContactSubmitting(false);
    }
  };

  // Dynamic Country Code Flag helper
  const getFlag = (code: string) => {
    const flags: Record<string, string> = {
      NG: '🇳🇬', KE: '🇰🇪', ZA: '🇿🇦', GH: '🇬🇭',
      BR: '🇧🇷', PY: '🇵🇾', CL: '🇨🇱',
      TT: '🇹🇹', BB: '🇧🇧', LC: '🇱🇨'
    };
    return flags[code.toUpperCase()] || '🌐';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4 md:p-8">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-8 border-b border-[#2a2a3e] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <LifeBuoy className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Help & Support Center</h1>
          </div>
          <p className="text-gray-400 text-sm mt-1.5 max-w-xl">
            Your intelligence companion. Find resources, chat with our AI Concierge, or open a support ticket.
          </p>
        </div>
        
        {/* Localization Info Badge */}
        {!profileLoading && (
          <div className="flex items-center gap-2 bg-[#12121a] border border-[#2a2a3e] px-4 py-2 rounded-xl text-xs md:text-sm self-start md:self-auto">
            <Globe className="h-4 w-4 text-amber-400" />
            <span>Region Context: <span className="font-semibold text-white">{getFlag(userCountry)} {userCountry}</span></span>
          </div>
        )}
      </header>

      {/* Tabs Navigator */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex border-b border-[#1f1f30] overflow-x-auto scrollbar-none gap-2">
          <button
            onClick={() => setActiveTab('faq')}
            className={`flex items-center gap-2 px-5 py-4 border-b-2 font-semibold text-sm whitespace-nowrap transition-all ${
              currentTab === 'faq'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#12121a]/50'
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            Knowledge Base
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-5 py-4 border-b-2 font-semibold text-sm whitespace-nowrap transition-all ${
              currentTab === 'chat'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#12121a]/50'
            }`}
          >
            <Bot className="h-4 w-4" />
            AI Concierge
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`flex items-center gap-2 px-5 py-4 border-b-2 font-semibold text-sm whitespace-nowrap transition-all ${
              currentTab === 'tickets'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#12121a]/50'
            }`}
          >
            <Ticket className="h-4 w-4" />
            Support Tickets
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`flex items-center gap-2 px-5 py-4 border-b-2 font-semibold text-sm whitespace-nowrap transition-all ${
              currentTab === 'contact'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#12121a]/50'
            }`}
          >
            <Mail className="h-4 w-4" />
            Contact Us
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <main className="max-w-6xl mx-auto">
        
        {/* ============================================================ */}
        {/* TAB 1: KNOWLEDGE BASE & FAQ                                */}
        {/* ============================================================ */}
        {currentTab === 'faq' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Search Input */}
            <div className="relative max-w-xl">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                <Search className="h-5 w-5" />
              </span>
              <input
                type="text"
                value={faqSearch}
                onChange={e => setFaqSearch(e.target.value)}
                placeholder="Search articles, guides, or questions..."
                className="w-full pl-11 pr-4 py-3 bg-[#12121a] border border-[#2a2a3e] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
              {faqSearch && (
                <button
                  onClick={() => setFaqSearch('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Category Deck */}
            {filteredCategories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCategories.map(cat => {
                  const isCurrent = expandedCategory === cat.id;
                  const isRegional = cat.region !== 'global';
                  return (
                    <div
                      key={cat.id}
                      className={`bg-[#12121a] border rounded-2xl p-6 transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                        isCurrent ? 'border-amber-500 ring-1 ring-amber-500/10' : 'border-[#2a2a3e] hover:border-gray-500'
                      }`}
                    >
                      {/* Regional badge */}
                      {isRegional && (
                        <div className="absolute top-3 right-3 text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                          <span>{getFlag(userCountry)}</span> Localized
                        </div>
                      )}

                      <div>
                        <span className="text-4xl block mb-4">{cat.icon}</span>
                        <h3 className="text-lg font-bold mb-2">{cat.title}</h3>
                        <p className="text-gray-400 text-xs mb-6 leading-relaxed">
                          {cat.articles.length} helpful articles for {cat.title.toLowerCase()}.
                        </p>
                      </div>

                      <button
                        onClick={() => toggleCategory(cat.id)}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                          isCurrent
                            ? 'bg-amber-500 text-black'
                            : 'bg-[#1a1a2e] text-amber-400 hover:bg-[#202038]'
                        }`}
                      >
                        {isCurrent ? 'Close Articles' : 'Browse Articles'}
                        {isCurrent ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-[#12121a] border border-[#2a2a3e] rounded-2xl">
                <AlertCircle className="h-10 w-10 text-gray-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold mb-1">No articles found</h3>
                <p className="text-gray-400 text-sm">We couldn't find any results matching "{faqSearch}"</p>
              </div>
            )}

            {/* Accordion List for Selected Category */}
            {expandedCategory && (
              <div className="border border-[#2a2a3e] bg-[#12121a] rounded-2xl p-6 space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-[#2a2a3e] pb-4 mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <span>
                      {regionalCategories.find(c => c.id === expandedCategory)?.icon}
                    </span>
                    {regionalCategories.find(c => c.id === expandedCategory)?.title} Articles
                  </h2>
                  <button
                    onClick={() => setExpandedCategory(null)}
                    className="text-gray-400 hover:text-white text-xs font-semibold"
                  >
                    Close Category
                  </button>
                </div>

                <div className="space-y-4">
                  {regionalCategories
                    .find(c => c.id === expandedCategory)
                    ?.articles.filter(art =>
                      art.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
                      art.answer.toLowerCase().includes(faqSearch.toLowerCase())
                    )
                    .map(art => {
                      const isArtOpen = expandedArticles[art.id];
                      const feedback = helpfulFeedback[art.id];
                      return (
                        <div
                          key={art.id}
                          className="border border-[#1f1f30] rounded-xl bg-[#0a0a0f] overflow-hidden"
                        >
                          <button
                            onClick={() => toggleArticle(art.id)}
                            className="w-full px-5 py-4 text-left font-bold text-sm flex items-center justify-between hover:bg-[#12121a]/50"
                          >
                            <span>{art.question}</span>
                            {isArtOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                          
                          {isArtOpen && (
                            <div className="px-5 pb-5 pt-2 border-t border-[#12121a] text-gray-300 text-sm leading-relaxed space-y-4">
                              <p className="whitespace-pre-wrap">{art.answer}</p>
                              
                              {/* FAQ Helpful Actions */}
                              <div className="flex items-center gap-4 border-t border-[#12121a] pt-4 text-xs text-gray-500">
                                <span>Was this helpful?</span>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleFAQFeedback(art.id, 'up')}
                                    className={`p-1.5 rounded-lg border hover:text-green-400 transition-colors ${
                                      feedback === 'up'
                                        ? 'bg-green-500/10 border-green-500 text-green-400'
                                        : 'border-[#2a2a3e] bg-[#12121a]'
                                    }`}
                                  >
                                    <ThumbsUp className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => handleFAQFeedback(art.id, 'down')}
                                    className={`p-1.5 rounded-lg border hover:text-red-400 transition-colors ${
                                      feedback === 'down'
                                        ? 'bg-red-500/10 border-red-500 text-red-400'
                                        : 'border-[#2a2a3e] bg-[#12121a]'
                                    }`}
                                  >
                                    <ThumbsDown className="h-3 w-3" />
                                  </button>
                                </div>
                                {feedback && (
                                  <span className="text-green-400 animate-fadeIn">Thank you for your feedback!</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: AI CONCIERGE CHAT                                    */}
        {/* ============================================================ */}
        {currentTab === 'chat' && (
          <div className="max-w-4xl mx-auto bg-[#12121a] border border-[#2a2a3e] rounded-3xl h-[65vh] flex flex-col justify-between overflow-hidden animate-fadeIn relative">
            {/* Context Badge in Header */}
            <div className="bg-[#1a1a2e] border-b border-[#2a2a3e] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm md:text-base flex items-center gap-1.5">
                    CoinDaily AI Concierge
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  </h3>
                  <p className="text-[10px] md:text-xs text-gray-400">Powered by Llama-3.1 8B Client</p>
                </div>
              </div>

              {/* Regional Context Badge */}
              <div className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1.5 rounded-full flex items-center gap-1.5 font-bold">
                <span>{getFlag(userCountry)}</span> {userCountry} Context Active
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {chatMessages.length === 0 ? (
                // Welcome screen
                <div className="h-full flex flex-col justify-center items-center text-center max-w-md mx-auto py-10">
                  <Sparkles className="h-10 w-10 text-amber-400 mb-4 animate-pulse" />
                  <h2 className="text-lg font-bold mb-2">Welcome to CoinDaily Intelligence!</h2>
                  <p className="text-gray-400 text-xs md:text-sm mb-8 leading-relaxed">
                    Ask me anything about market shifts, project metrics, or platform usage. I adapt my insights based on your region.
                  </p>
                  
                  {/* Prompt Suggestions */}
                  <div className="w-full space-y-2">
                    {suggestedPrompts.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendAIChat(p.label)}
                        className="w-full text-left p-3.5 bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl hover:border-amber-500/50 transition-all flex items-center justify-between group"
                      >
                        <div>
                          <span className="font-semibold text-xs md:text-sm text-gray-200 group-hover:text-amber-400 transition-colors">
                            {p.label}
                          </span>
                          <span className="block text-[10px] text-gray-500 mt-0.5">{p.desc}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-500 group-hover:text-amber-400" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                // Messages thread
                <div className="space-y-4">
                  {chatMessages.map((msg, index) => {
                    const isUser = msg.role === 'user';
                    return (
                      <div
                        key={index}
                        className={`flex items-start gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
                      >
                        {/* Avatar */}
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm shrink-0 border ${
                          isUser ? 'bg-amber-500 border-amber-600 text-black' : 'bg-[#1a1a2e] border-[#2a2a3e] text-amber-400'
                        }`}>
                          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </div>
                        
                        {/* Bubble */}
                        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          isUser ? 'bg-amber-500 text-black font-semibold' : 'bg-[#1a1a2e] border border-[#2a2a3e] text-gray-200'
                        }`}>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          
                          {/* Sources */}
                          {!isUser && msg.sources && msg.sources.length > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-[#2a2a3e] flex flex-wrap gap-1 text-[10px] text-gray-500 items-center">
                              <span className="font-semibold">Sources:</span>
                              {msg.sources.map((src, sIdx) => (
                                <span key={sIdx} className="bg-[#0a0a0f] border border-[#1f1f30] px-1.5 py-0.5 rounded text-[10px] text-gray-400">
                                  {src}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Typing Indicator */}
                  {isAITyping && (
                    <div className="flex items-start gap-3 max-w-[80%]">
                      <div className="h-8 w-8 rounded-lg bg-[#1a1a2e] border border-[#2a2a3e] flex items-center justify-center text-amber-400 shrink-0">
                        <Bot className="h-4 w-4 animate-spin" />
                      </div>
                      <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl px-5 py-3.5 flex items-center justify-center">
                        <div className="flex space-x-1.5">
                          <div className="h-1.5 w-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <div className="h-1.5 w-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <div className="h-1.5 w-1.5 bg-amber-500 rounded-full animate-bounce" />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>

            {/* Input form */}
            <div className="bg-[#1a1a2e] border-t border-[#2a2a3e] p-4 flex gap-2 items-center">
              <textarea
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendAIChat(chatInput);
                  }
                }}
                maxLength={500}
                placeholder="Ask about markets, token utility, or settings... (Enter to send)"
                className="flex-1 bg-[#0a0a0f] border border-[#2a2a3e] rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-amber-500 resize-none h-11 max-h-24 scrollbar-none"
              />
              <button
                onClick={() => handleSendAIChat(chatInput)}
                disabled={!chatInput.trim() || isAITyping}
                className="bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-black h-11 w-11 rounded-xl flex items-center justify-center transition-colors shrink-0 shadow-lg shadow-amber-500/10"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: SUPPORT TICKETS                                       */}
        {/* ============================================================ */}
        {currentTab === 'tickets' && (
          <div className="animate-fadeIn">
            
            {/* VIEW 3A: LIST VIEW */}
            {ticketView === 'list' && (
              <div className="space-y-6">
                
                {/* Search / Filters Bar */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#12121a] border border-[#2a2a3e] p-4 rounded-2xl">
                  <div className="flex flex-col sm:flex-row gap-3 items-center w-full md:w-auto">
                    <div className="relative w-full sm:w-64">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                        <Search className="h-4 w-4" />
                      </span>
                      <input
                        type="text"
                        value={ticketSearch}
                        onChange={e => setTicketSearch(e.target.value)}
                        placeholder="Search tickets by ID/subject..."
                        className="w-full pl-9 pr-4 py-2 bg-[#0a0a0f] border border-[#2a2a3e] rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    
                    <div className="relative w-full sm:w-44 flex items-center gap-1.5 bg-[#0a0a0f] border border-[#2a2a3e] rounded-xl px-3 py-2 text-sm text-gray-400">
                      <Filter className="h-3.5 w-3.5" />
                      <select
                        value={ticketFilterStatus}
                        onChange={e => setTicketFilterStatus(e.target.value)}
                        className="bg-transparent text-white border-none focus:outline-none w-full cursor-pointer text-xs md:text-sm font-semibold"
                      >
                        <option value="all" className="bg-[#12121a]">All Status</option>
                        <option value="open" className="bg-[#12121a]">Open</option>
                        <option value="resolved" className="bg-[#12121a]">Resolved</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={() => setTicketView('create')}
                    className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-black font-bold px-5 py-2.5 rounded-xl text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/5 transition-all transform hover:scale-[1.02]"
                  >
                    <Plus className="h-4 w-4 stroke-[3]" /> Create Ticket
                  </button>
                </div>

                {/* Tickets list deck */}
                {ticketsLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
                  </div>
                ) : ticketsList.length > 0 ? (
                  <div className="space-y-3.5">
                    {ticketsList.map(ticket => {
                      let parsedMeta = { subject: 'No Subject', responses: [] };
                      if (ticket.metadata) {
                        try { parsedMeta = JSON.parse(ticket.metadata); } catch {}
                      }
                      
                      return (
                        <div
                          key={ticket.id}
                          onClick={() => handleSelectTicket(ticket)}
                          className="bg-[#12121a] border border-[#2a2a3e] hover:border-amber-500/40 rounded-2xl p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-gray-500 font-mono text-xs font-bold">{ticket.ticketId}</span>
                              <span className="text-xs bg-[#1f1f30] px-2 py-0.5 border border-[#2a2a3e] text-gray-300 rounded-full font-bold">
                                {getCategoryLabel(ticket.feedbackCategory)}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getPriorityColor(ticket.severity)}`}>
                                {ticket.severity?.toUpperCase()}
                              </span>
                            </div>
                            <h3 className="font-extrabold text-base text-white">{parsedMeta.subject}</h3>
                            <p className="text-gray-400 text-xs truncate max-w-lg leading-relaxed">{ticket.comment}</p>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 border-t border-[#1f1f30] md:border-t-0 pt-3 md:pt-0">
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                            </div>
                            
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <MessageSquare className="h-3.5 w-3.5" />
                              <span>{parsedMeta.responses?.length || 0} replies</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                                ticket.isResolved
                                  ? 'bg-emerald-500/15 border border-emerald-500/20 text-emerald-400'
                                  : 'bg-amber-500/15 border border-amber-500/20 text-amber-400'
                              }`}>
                                {ticket.isResolved ? 'Resolved' : 'Open'}
                              </span>
                              <ChevronRight className="h-5 w-5 text-gray-500" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-[#12121a] border border-[#2a2a3e] rounded-3xl">
                    <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-1">No tickets created</h3>
                    <p className="text-gray-400 text-sm max-w-sm mx-auto mb-6">
                      You haven't submitted any support requests. If you are experiencing technical difficulties, open a ticket now.
                    </p>
                    <button
                      onClick={() => setTicketView('create')}
                      className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-6 py-3 rounded-xl text-sm"
                    >
                      Open Your First Ticket
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* VIEW 3B: DETAIL VIEW */}
            {ticketView === 'detail' && selectedTicket && (
              <div className="bg-[#12121a] border border-[#2a2a3e] rounded-3xl p-6 space-y-6 animate-fadeIn">
                {/* Back Button / Header */}
                <div className="flex items-center justify-between border-b border-[#2a2a3e] pb-5">
                  <button
                    onClick={() => {
                      setTicketView('list');
                      setSelectedTicket(null);
                    }}
                    className="flex items-center gap-2 text-gray-400 hover:text-white font-semibold transition-colors text-sm"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to List
                  </button>
                  
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      selectedTicket.isResolved
                        ? 'bg-emerald-500/15 border border-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/15 border border-amber-500/20 text-amber-400'
                    }`}>
                      {selectedTicket.isResolved ? 'Resolved' : 'Open'}
                    </span>
                  </div>
                </div>

                {/* Ticket Summary */}
                <div className="bg-[#0a0a0f] border border-[#1f1f30] rounded-2xl p-5 space-y-4">
                  <div className="flex flex-wrap gap-2 items-center text-xs text-gray-500 font-bold">
                    <span className="font-mono">{selectedTicket.ticketId}</span>
                    <span>•</span>
                    <span>Category: {getCategoryLabel(selectedTicket.feedbackCategory)}</span>
                    <span>•</span>
                    <span>Priority: {selectedTicket.severity?.toUpperCase()}</span>
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    {(() => {
                      try { return JSON.parse(selectedTicket.metadata).subject; } catch { return selectedTicket.comment; }
                    })()}
                  </h2>
                  <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{selectedTicket.comment}</p>
                  <p className="text-[10px] text-gray-500 font-bold pt-2 border-t border-[#12121a]">
                    Opened on: {new Date(selectedTicket.createdAt).toLocaleString()}
                  </p>
                </div>

                {/* Message Thread */}
                {(() => {
                  let replies: any[] = [];
                  try { replies = JSON.parse(selectedTicket.metadata).responses || []; } catch {}
                  
                  return (
                    <div className="space-y-4">
                      <h3 className="font-bold text-sm text-gray-400">Response Thread ({replies.length})</h3>
                      
                      <div className="space-y-4">
                        {replies.map((reply: any, rIdx: number) => {
                          const isStaff = reply.authorRole === 'ADMIN' || reply.authorRole === 'SYSTEM';
                          return (
                            <div
                              key={reply.id || rIdx}
                              className={`flex items-start gap-3 max-w-[85%] ${!isStaff ? 'ml-auto flex-row-reverse' : ''}`}
                            >
                              <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs shrink-0 border ${
                                !isStaff ? 'bg-amber-500 border-amber-600 text-black' : 'bg-[#1a1a2e] border-blue-500/20 text-blue-400'
                              }`}>
                                {!isStaff ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                              </div>
                              
                              <div className={`rounded-2xl px-4 py-3.5 text-sm leading-relaxed ${
                                !isStaff ? 'bg-amber-500 text-black font-semibold' : 'bg-[#1a1a2e] border border-[#2a2a3e] text-gray-200'
                              }`}>
                                <div className="flex items-center justify-between gap-8 mb-1.5 border-b border-[#2a2a3e]/10 pb-1">
                                  <span className="font-extrabold text-xs">{reply.author} {isStaff && ' (Staff)'}</span>
                                  <span className="text-[9px] opacity-60 font-bold">{new Date(reply.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="whitespace-pre-wrap">{reply.message}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Reply Form */}
                <form onSubmit={handleReplySubmit} className="space-y-3.5 pt-4 border-t border-[#2a2a3e]">
                  <textarea
                    value={replyMessage}
                    onChange={e => setReplyMessage(e.target.value)}
                    placeholder="Type your response to this ticket..."
                    rows={4}
                    required
                    className="w-full bg-[#0a0a0f] border border-[#2a2a3e] rounded-xl p-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-gray-500 font-semibold leading-relaxed">
                      💡 Replying will automatically open the ticket if it was resolved.
                    </p>
                    <button
                      type="submit"
                      disabled={replySubmitting || !replyMessage.trim()}
                      className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-bold px-6 py-2.5 rounded-xl text-sm flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-amber-500/5"
                    >
                      {replySubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Reply'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* VIEW 3C: CREATE TICKET VIEW */}
            {ticketView === 'create' && (
              <div className="max-w-xl mx-auto bg-[#12121a] border border-[#2a2a3e] rounded-3xl p-6 md:p-8 space-y-6 animate-fadeIn">
                <div className="flex items-center gap-2 border-b border-[#2a2a3e] pb-4 mb-4">
                  <button
                    onClick={() => setTicketView('list')}
                    className="p-1 rounded-lg text-gray-400 hover:text-white"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <h2 className="text-xl font-bold">Submit a Support Ticket</h2>
                </div>

                <form onSubmit={handleCreateTicketSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Subject</label>
                    <input
                      type="text"
                      value={ticketSubject}
                      onChange={e => setTicketSubject(e.target.value)}
                      placeholder="Summarize your issue (e.g., M-Pesa Payment Timeout)"
                      required
                      className="w-full bg-[#0a0a0f] border border-[#2a2a3e] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Category</label>
                      <select
                        value={ticketCategory}
                        onChange={e => setTicketCategory(e.target.value)}
                        className="w-full bg-[#0a0a0f] border border-[#2a2a3e] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option value="technical">Technical Support</option>
                        <option value="account">Account Access</option>
                        <option value="billing">Billing & Subscriptions</option>
                        <option value="mobile_money">Mobile Money Issues</option>
                        <option value="payment_problem">Local Payment Problems</option>
                        <option value="feature">Feature Request</option>
                        <option value="content">Editorial Content Feedback</option>
                        <option value="general">General Inquiry</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Priority</label>
                      <select
                        value={ticketPriority}
                        onChange={e => setTicketPriority(e.target.value)}
                        className="w-full bg-[#0a0a0f] border border-[#2a2a3e] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option value="low">Low (Standard Question)</option>
                        <option value="normal">Normal (General Issue)</option>
                        <option value="medium">Medium (Impeding workflow)</option>
                        <option value="high">High (Service interrupted)</option>
                        <option value="critical">Critical (Payment failure/Blocked)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Message Description</label>
                    <textarea
                      value={ticketMessage}
                      onChange={e => setTicketMessage(e.target.value)}
                      placeholder="Please provide full details, including transaction IDs or wallet addresses if applicable."
                      rows={5}
                      required
                      className="w-full bg-[#0a0a0f] border border-[#2a2a3e] rounded-xl p-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={ticketSubmitting || !ticketSubject || !ticketMessage}
                    className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-extrabold py-3.5 rounded-xl text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/10 transition-colors"
                  >
                    {ticketSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Submit Support Request'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: CONTACT & DEPT EMAIL                                 */}
        {/* ============================================================ */}
        {currentTab === 'contact' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Success State */}
            {contactSuccess ? (
              <div className="max-w-xl mx-auto bg-[#12121a] border border-[#2a2a3e] rounded-3xl p-10 text-center flex flex-col items-center justify-center animate-scaleIn">
                <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 mb-6">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h2 className="text-2xl font-extrabold mb-2">Message Sent Successfully!</h2>
                <p className="text-gray-400 text-sm max-w-sm mb-8 leading-relaxed">
                  Your inquiry has been logged. Our department coordinator will respond to your registered email address within 24 hours.
                </p>
                <button
                  onClick={() => {
                    setContactSuccess(false);
                    setSelectedDept(null);
                  }}
                  className="bg-[#1a1a2e] border border-[#2a2a3e] hover:border-gray-500 text-amber-400 font-bold px-6 py-2.5 rounded-xl text-sm transition-colors"
                >
                  Send another message
                </button>
              </div>
            ) : (
              // Selecting/Forms View
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Selector Deck */}
                <div className="lg:col-span-1 space-y-4">
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-gray-500 mb-2">Select a Department</h3>
                  
                  <div className="space-y-3">
                    {Object.entries(DEPARTMENT_EMAILS).map(([key, dept]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedDept(key)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-center gap-4 ${
                          selectedDept === key
                            ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg'
                            : 'bg-[#12121a] border-[#2a2a3e] text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        <span className="text-3xl shrink-0">{dept.icon}</span>
                        <div>
                          <h4 className="font-bold text-sm text-white">{dept.name}</h4>
                          <span className="block text-[10px] text-gray-500 font-mono mt-0.5">{dept.email}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form Module */}
                <div className="lg:col-span-2">
                  {selectedDept ? (
                    <div className="bg-[#12121a] border border-[#2a2a3e] rounded-3xl p-6 md:p-8 space-y-6">
                      <div className="border-b border-[#2a2a3e] pb-4 mb-4 flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-white">
                            Message to {DEPARTMENT_EMAILS[selectedDept as keyof typeof DEPARTMENT_EMAILS].name}
                          </h3>
                          <p className="text-gray-500 text-xs mt-0.5">
                            Submitting to: <span className="font-mono text-gray-400">{DEPARTMENT_EMAILS[selectedDept as keyof typeof DEPARTMENT_EMAILS].email}</span>
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedDept(null)}
                          className="text-gray-400 hover:text-white text-xs font-semibold"
                        >
                          Clear Selection
                        </button>
                      </div>

                      <form onSubmit={handleContactSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Subject</label>
                          <input
                            type="text"
                            value={contactSubject}
                            onChange={e => setContactSubject(e.target.value)}
                            placeholder="Brief summary of your inquiry..."
                            required
                            className="w-full bg-[#0a0a0f] border border-[#2a2a3e] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Message Content</label>
                          <textarea
                            value={contactMessage}
                            onChange={e => setContactMessage(e.target.value)}
                            placeholder="Write your detailed message here (minimum 20 characters)..."
                            rows={6}
                            required
                            className="w-full bg-[#0a0a0f] border border-[#2a2a3e] rounded-xl p-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                          />
                          {contactMessage && contactMessage.length < 20 && (
                            <span className="text-[10px] text-amber-500 font-semibold block mt-1 animate-fadeIn">
                              ⚠️ Message must be at least 20 characters. Current length: {contactMessage.length}
                            </span>
                          )}
                        </div>

                        <button
                          type="submit"
                          disabled={contactSubmitting || !contactSubject || contactMessage.length < 20}
                          className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-extrabold py-3.5 rounded-xl text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/10 transition-colors"
                        >
                          {contactSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send Message'}
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="h-full border border-dashed border-[#2a2a3e] rounded-3xl flex flex-col justify-center items-center text-center p-8 min-h-[40vh] bg-[#12121a]/20">
                      <Mail className="h-10 w-10 text-gray-600 mb-4" />
                      <h4 className="text-lg font-bold mb-1">Select a Department</h4>
                      <p className="text-gray-400 text-xs md:text-sm max-w-sm">
                        Please choose one of the departments in the sidebar to open the direct contact form.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}
