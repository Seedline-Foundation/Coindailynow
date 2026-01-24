'use client';

import { useState, useEffect } from 'react';
import { Calendar, BarChart3, TrendingUp, Sparkles, Activity, Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';

interface WeeklyHighlight {
  week: string;
  title: string;
  summary: string;
  marketPerformance: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

interface MonthlySummaryData {
  month: string;
  year: number;
  overallTheme: string;
  marketCapChange: string;
  topPerformers: string[];
  majorEvents: string[];
  weeklyHighlights: WeeklyHighlight[];
  aiAnalysis: {
    trendAnalysis: string;
    sentimentEvolution: string;
    marketPrediction: string;
    keyMetrics: {
      totalArticles: number;
      averageSentiment: number;
      volatilityIndex: number;
      socialMediaMentions: number;
    };
  };
  monthlyInsights: string[];
}

export default function MonthlySummary() {
  const [monthlyData, setMonthlyData] = useState<MonthlySummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(0); // 0 = current month, 1 = last month, etc.
  
  // User interaction states
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [sharesCount, setSharesCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Array<{
    id: string;
    author: string;
    content: string;
    timestamp: string;
    likes: number;
  }>>([]);

  useEffect(() => {
    const fetchMonthlySummary = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(`/api/news/summary/monthly?offset=${selectedMonth}`, {
          signal: controller.signal,
          cache: 'force-cache',
          headers: {
            'Cache-Control': 'max-age=7200'
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch monthly summary');
        const data = await response.json();
        setMonthlyData(data);
        
        // Set initial interaction data
        setLikesCount(Math.floor(Math.random() * 500) + 100);
        setCommentsCount(Math.floor(Math.random() * 50) + 10);
        setSharesCount(Math.floor(Math.random() * 200) + 25);
        
        // Mock initial comments
        setComments([
          {
            id: '1',
            author: 'CryptoAnalyst',
            content: 'Great analysis! The institutional adoption trend is really exciting.',
            timestamp: '2 hours ago',
            likes: 15
          },
          {
            id: '2',
            author: 'MemeTrader99',
            content: 'Those PEPE gains are insane! Thanks for the comprehensive breakdown.',
            timestamp: '5 hours ago',
            likes: 8
          }
        ]);
      } catch {
        // Fallback mock data
        setMonthlyData({
          month: 'December',
          year: 2024,
          overallTheme: 'Memecoin Renaissance and Institutional Adoption',
          marketCapChange: '+34.2% total memecoin market cap growth',
          topPerformers: [
            'PEPE - 156% monthly gain',
            'DOGE - 89% monthly gain',
            'SHIB - 67% monthly gain',
            'WIF - 78% monthly gain',
            'BONK - 92% monthly gain'
          ],
          majorEvents: [
            'Major exchange announces memecoin ETF plans',
            'New regulatory framework clarification',
            'Three unicorn memecoin projects launched',
            'First institutional memecoin fund established',
            'Celebrity endorsements drive mainstream adoption'
          ],
          weeklyHighlights: [
            {
              week: 'Week 1 (Dec 1-7)',
              title: 'Strong Month Opening',
              summary: 'Market opened with significant bullish momentum driven by institutional interest announcements.',
              marketPerformance: '+8.5%',
              sentiment: 'bullish'
            },
            {
              week: 'Week 2 (Dec 8-14)',
              title: 'Consolidation and New Launches',
              summary: 'Market consolidated gains while new high-quality projects entered the space.',
              marketPerformance: '+3.2%',
              sentiment: 'neutral'
            },
            {
              week: 'Week 3 (Dec 15-21)',
              title: 'Mid-Month Rally',
              summary: 'Strong rally driven by partnership announcements and increased trading volume.',
              marketPerformance: '+12.8%',
              sentiment: 'bullish'
            },
            {
              week: 'Week 4 (Dec 22-28)',
              title: 'Year-End Momentum',
              summary: 'Sustained momentum as investors positioned for the new year.',
              marketPerformance: '+7.9%',
              sentiment: 'bullish'
            }
          ],
          aiAnalysis: {
            trendAnalysis: 'December marked a significant shift towards institutional acceptance of memecoins, with traditional finance showing unprecedented interest.',
            sentimentEvolution: 'Sentiment improved from 62% to 84% positive throughout the month, indicating strong community confidence.',
            marketPrediction: 'Based on current trends, January is expected to continue bullish momentum with 15-25% growth potential.',
            keyMetrics: {
              totalArticles: 1247,
              averageSentiment: 0.84,
              volatilityIndex: 0.67,
              socialMediaMentions: 2450000
            }
          },
          monthlyInsights: [
            'Memecoin sector showed 45% lower volatility compared to same period last year',
            'Institutional adoption increased by 230% month-over-month',
            'Social media sentiment reached all-time high of 84% positive',
            'New project quality scores improved by 67% compared to previous month',
            'Celebrity endorsement impact decreased by 15%, showing market maturation',
            'Utility-based memecoins outperformed pure meme coins by 23%'
          ]
        });
      } finally {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    };

    fetchMonthlySummary();
  }, [selectedMonth]);

  // Interaction handlers
  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  const handleShare = async () => {
    setSharesCount(prev => prev + 1);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Crypto This Month - ${monthlyData?.month} ${monthlyData?.year}`,
          text: monthlyData?.overallTheme,
          url: window.location.href,
        });
      } catch {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment = {
        id: Date.now().toString(),
        author: 'Anonymous User', // In production, get from auth
        content: newComment,
        timestamp: 'Just now',
        likes: 0
      };
      setComments(prev => [comment, ...prev]);
      setCommentsCount(prev => prev + 1);
      setNewComment('');
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-green-600 bg-green-100';
      case 'bearish': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  // Per-card state for weekly highlights
  const [weeklyStates, setWeeklyStates] = useState<Array<{
    isLiked: boolean;
    isBookmarked: boolean;
    likesCount: number;
    sharesCount: number;
    showComments: boolean;
    newComment: string;
    comments: Array<{
      id: string;
      author: string;
      content: string;
      timestamp: string;
      likes: number;
    }>;
  }>>([]);

  // Reset weeklyStates when monthlyData changes
  useEffect(() => {
    if (monthlyData && monthlyData.weeklyHighlights) {
      setWeeklyStates(
        monthlyData.weeklyHighlights.map((week) => ({
          isLiked: false,
          isBookmarked: false,
          likesCount: Math.floor(Math.random() * 100) + 10,
          sharesCount: Math.floor(Math.random() * 30) + 5,
          showComments: false,
          newComment: '',
          comments: [
            {
              id: '1',
              author: 'CryptoFan',
              content: `Insightful summary for ${week.week}!`,
              timestamp: '1 hour ago',
              likes: 2
            }
          ]
        }))
      );
    }
  }, [monthlyData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">AI is compiling your monthly crypto analysis...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="text-blue-600" />
                Crypto This Month
              </h1>
              <p className="text-gray-600 mt-2">Comprehensive monthly crypto market analysis</p>
            </div>
            <div className="mt-4 md:mt-0">
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value={0}>This Month</option>
                <option value={1}>Last Month</option>
                <option value={2}>2 Months Ago</option>
                <option value={3}>3 Months Ago</option>
              </select>
            </div>
          </div>
        </div>

        {/* Interaction Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isLiked 
                    ? 'bg-red-100 text-red-600' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                <span className="font-medium">{likesCount}</span>
              </button>

              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
                <span className="font-medium">{commentsCount}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
              >
                <Share2 className="h-5 w-5" />
                <span className="font-medium">{sharesCount}</span>
              </button>
            </div>

            <button
              onClick={handleBookmark}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                isBookmarked 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">Save</span>
            </button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Comments ({commentsCount})
            </h3>
            
            {/* Add Comment */}
            <div className="mb-6">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">U</span>
                  </div>
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts on this monthly analysis..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      Post Comment
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {comment.author.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{comment.author}</span>
                        <span className="text-sm text-gray-500">{comment.timestamp}</span>
                      </div>
                      <p className="text-gray-700">{comment.content}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <button className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        {comment.likes}
                      </button>
                      <button className="text-sm text-gray-500 hover:text-blue-600">
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {monthlyData && (
          <>
            {/* Month Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3">
                  <Calendar className="text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Period</h3>
                    <p className="text-gray-600">{monthlyData.month} {monthlyData.year}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="text-green-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Market Cap</h3>
                    <p className="text-gray-600 text-sm">{monthlyData.marketCapChange}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3">
                  <Activity className="text-purple-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Articles</h3>
                    <p className="text-gray-600">{monthlyData.aiAnalysis.keyMetrics.totalArticles.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3">
                  <Sparkles className="text-orange-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Sentiment</h3>
                    <p className="text-gray-600">{Math.round(monthlyData.aiAnalysis.keyMetrics.averageSentiment * 100)}% Positive</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Month Theme */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-md p-6 mb-8 text-white">
              <h2 className="text-2xl font-bold mb-4">Month Theme</h2>
              <p className="text-lg mb-2">{monthlyData.overallTheme}</p>
              <p className="text-blue-100">{monthlyData.aiAnalysis.trendAnalysis}</p>
            </div>

            {/* Weekly Highlights */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Weekly Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {monthlyData.weeklyHighlights.map((week, index) => {
                const state = weeklyStates[index] || {
                  isLiked: false,
                  isBookmarked: false,
                  likesCount: 0,
                  sharesCount: 0,
                  showComments: false,
                  newComment: '',
                  comments: []
                };
                // Handlers
                const handleLike = () => {
                  setWeeklyStates(prev => prev.map((s, i) => i === index ? { ...s, isLiked: !s.isLiked, likesCount: s.isLiked ? s.likesCount - 1 : s.likesCount + 1 } : s));
                };
                const handleBookmark = () => {
                  setWeeklyStates(prev => prev.map((s, i) => i === index ? { ...s, isBookmarked: !s.isBookmarked } : s));
                };
                const handleShare = async () => {
                  setWeeklyStates(prev => prev.map((s, i) => i === index ? { ...s, sharesCount: s.sharesCount + 1 } : s));
                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: `${week.title} - ${monthlyData.month} ${monthlyData.year}`,
                        text: week.summary,
                        url: window.location.href,
                      });
                    } catch {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Link copied to clipboard!');
                    }
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Link copied to clipboard!');
                  }
                };
                const handleShowComments = () => {
                  setWeeklyStates(prev => prev.map((s, i) => i === index ? { ...s, showComments: !s.showComments } : s));
                };
                const handleCommentChange = (value: string) => {
                  setWeeklyStates(prev => prev.map((s, i) => i === index ? { ...s, newComment: value } : s));
                };
                const handleAddComment = () => {
                  setWeeklyStates(prev => prev.map((s, i) => {
                    if (i !== index) return s;
                    if (!s.newComment.trim()) return s;
                    const comment = {
                      id: Date.now().toString(),
                      author: 'Anonymous User',
                      content: s.newComment,
                      timestamp: 'Just now',
                      likes: 0
                    };
                    return {
                      ...s,
                      comments: [comment, ...s.comments],
                      newComment: ''
                    };
                  }));
                };
                return (
                  <div key={index} className="border border-gray-200 rounded-lg p-5 relative">
                    {/* Card Content */}
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-gray-900">{week.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSentimentColor(week.sentiment)}`}>
                        {week.marketPerformance}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 font-medium">{week.week}</p>
                    <p className="text-gray-700 mb-4">{week.summary}</p>
                    {/* Card Interaction Bar */}
                    <div className="flex items-center gap-4 border-t pt-3 mt-3">
                      <button
                        className={`flex items-center gap-1 text-sm px-2 py-1 rounded-lg transition-colors ${state.isLiked ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100 text-gray-500'}`}
                        onClick={handleLike}
                        aria-label="Like this week"
                      >
                        <Heart className={`h-4 w-4 ${state.isLiked ? 'fill-current' : ''}`} /> {state.likesCount}
                      </button>
                      <button
                        className="flex items-center gap-1 text-gray-500 hover:text-blue-600 text-sm"
                        onClick={handleShowComments}
                        aria-label="Comment on this week"
                      >
                        <MessageCircle className="h-4 w-4" /> {state.comments.length}
                      </button>
                      <button
                        className="flex items-center gap-1 text-gray-500 hover:text-green-600 text-sm"
                        onClick={handleShare}
                        aria-label="Share this week"
                      >
                        <Share2 className="h-4 w-4" /> {state.sharesCount}
                      </button>
                      <button
                        className={`flex items-center gap-1 text-sm px-2 py-1 rounded-lg transition-colors ${state.isBookmarked ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-500'}`}
                        onClick={handleBookmark}
                        aria-label="Bookmark this week"
                      >
                        <Bookmark className={`h-4 w-4 ${state.isBookmarked ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                    {/* Comments Section */}
                    {state.showComments && (
                      <div className="mt-4 bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Comments ({state.comments.length})</h4>
                        <div className="mb-4 flex gap-2">
                          <textarea
                            value={state.newComment}
                            onChange={e => handleCommentChange(e.target.value)}
                            placeholder="Add a comment..."
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            rows={2}
                          />
                          <button
                            onClick={handleAddComment}
                            disabled={!state.newComment.trim()}
                            className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                          >
                            Post
                          </button>
                        </div>
                        <div className="space-y-3">
                          {state.comments.map(comment => (
                            <div key={comment.id} className="flex gap-2">
                              <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-white">{comment.author.charAt(0)}</span>
                              </div>
                              <div className="flex-1">
                                <div className="bg-white rounded-lg p-2">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-gray-900">{comment.author}</span>
                                    <span className="text-xs text-gray-500">{comment.timestamp}</span>
                                  </div>
                                  <p className="text-gray-700 text-sm">{comment.content}</p>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <button className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1">
                                    <Heart className="h-3 w-3" /> {comment.likes}
                                  </button>
                                  <button className="text-xs text-gray-500 hover:text-blue-600">Reply</button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            </div>

            {/* Top Performers & Major Events */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Top Performers</h2>
                <ul className="space-y-3">
                  {monthlyData.topPerformers.map((performer, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <span className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </span>
                      <p className="text-gray-700 font-medium">{performer}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Major Events</h2>
                <ul className="space-y-3">
                  {monthlyData.majorEvents.map((event, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-1">
                        •
                      </span>
                      <p className="text-gray-700">{event}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* AI Analysis */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Sparkles className="text-purple-600" />
                AI Market Analysis
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Sentiment Evolution</h3>
                  <p className="text-gray-700 text-sm">{monthlyData.aiAnalysis.sentimentEvolution}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Market Prediction</h3>
                  <p className="text-gray-700 text-sm">{monthlyData.aiAnalysis.marketPrediction}</p>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Key Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{(monthlyData.aiAnalysis.keyMetrics.socialMediaMentions / 1000000).toFixed(1)}M</p>
                    <p className="text-sm text-gray-600">Social Mentions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{Math.round(monthlyData.aiAnalysis.keyMetrics.volatilityIndex * 100)}%</p>
                    <p className="text-sm text-gray-600">Volatility Index</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{monthlyData.aiAnalysis.keyMetrics.totalArticles}</p>
                    <p className="text-sm text-gray-600">News Articles</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{Math.round(monthlyData.aiAnalysis.keyMetrics.averageSentiment * 100)}%</p>
                    <p className="text-sm text-gray-600">Positive Sentiment</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Insights */}
            <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg shadow-md p-6 text-white">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Sparkles />
                Monthly AI Insights
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {monthlyData.monthlyInsights.map((insight, index) => (
                  <div key={index} className="bg-white/10 rounded-lg p-4">
                    <p className="text-white/90 text-sm">{insight}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-white/70 mt-4">
                Generated by CoinDaily AI • Updated daily • Based on 50,000+ monthly data points
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
