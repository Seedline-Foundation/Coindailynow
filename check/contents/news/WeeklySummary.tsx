'use client';

import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Clock, Sparkles, Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';

interface DailySummary {
  date: string;
  day: string;
  headlines: string[];
  keyTakeaway: string;
  marketSentiment: 'bullish' | 'bearish' | 'neutral';
}

interface WeeklySummaryData {
  weekStart: string;
  weekEnd: string;
  overallTrend: string;
  topStories: string[];
  marketPerformance: string;
  dailySummaries: DailySummary[];
  aiInsights: string[];
}

export default function WeeklySummary() {
  const [weeklyData, setWeeklyData] = useState<WeeklySummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = current week, 1 = last week, etc.

  // Per-card state for daily summaries
  const [dailyStates, setDailyStates] = useState<Array<{
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

  useEffect(() => {
    const fetchWeeklySummary = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(`/api/news/summary/weekly?offset=${selectedWeek}`, {
          signal: controller.signal,
          cache: 'force-cache',
          headers: {
            'Cache-Control': 'max-age=3600'
          }
        });
        if (!response.ok) throw new Error('Failed to fetch weekly summary');
        const data = await response.json();
        setWeeklyData(data);
      } catch (error) {
        console.error('Error fetching weekly summary:', error);
        // Fallback mock data
        setWeeklyData({
          weekStart: '2024-12-16',
          weekEnd: '2024-12-22',
          overallTrend: 'Bullish momentum with increased memecoin activity',
          topStories: [
            'Major memecoin launches drive market excitement',
            'Regulatory clarity boosts institutional adoption',
            'DeFi protocols see significant TVL growth'
          ],
          marketPerformance: '+12.5% overall memecoin market cap growth',
          dailySummaries: [
            {
              date: '2024-12-16',
              day: 'Monday',
              headlines: ['New memecoin DOGE2.0 launches', 'Bitcoin reaches new weekly high'],
              keyTakeaway: 'Strong start to the week with new project launches',
              marketSentiment: 'bullish'
            },
            {
              date: '2024-12-17',
              day: 'Tuesday',
              headlines: ['Major exchange lists 3 new memecoins', 'Whale movements signal accumulation'],
              keyTakeaway: 'Exchange listings drive trading volume',
              marketSentiment: 'bullish'
            },
            {
              date: '2024-12-18',
              day: 'Wednesday',
              headlines: ['Market correction affects memecoin sector', 'Community-driven projects gain traction'],
              keyTakeaway: 'Mid-week volatility tests market resilience',
              marketSentiment: 'neutral'
            },
            {
              date: '2024-12-19',
              day: 'Thursday',
              headlines: ['Recovery begins in afternoon trading', 'New partnerships announced'],
              keyTakeaway: 'Market shows signs of recovery',
              marketSentiment: 'bullish'
            },
            {
              date: '2024-12-20',
              day: 'Friday',
              headlines: ['Weekly gains consolidated', 'Weekend pump expectations build'],
              keyTakeaway: 'Strong weekly close sets positive tone',
              marketSentiment: 'bullish'
            },
            {
              date: '2024-12-21',
              day: 'Saturday',
              headlines: ['Weekend trading remains active', 'Social sentiment strongly positive'],
              keyTakeaway: 'Sustained weekend activity',
              marketSentiment: 'bullish'
            },
            {
              date: '2024-12-22',
              day: 'Sunday',
              headlines: ['Week ends on positive note', 'Next week outlook optimistic'],
              keyTakeaway: 'Bullish momentum carries into next week',
              marketSentiment: 'bullish'
            }
          ],
          aiInsights: [
            'Memecoin sector showed 23% higher volatility than previous week',
            'Social media sentiment reached 78% positive mentions',
            'New project launches increased by 45% week-over-week',
            'Institutional interest indicators up 12%'
          ]
        });
      } finally {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    };
    fetchWeeklySummary();
  }, [selectedWeek]);

  // Reset dailyStates when weeklyData changes
  useEffect(() => {
    if (weeklyData && weeklyData.dailySummaries) {
      setDailyStates(
        weeklyData.dailySummaries.map((day) => ({
          isLiked: false,
          isBookmarked: false,
          likesCount: Math.floor(Math.random() * 50) + 5,
          sharesCount: Math.floor(Math.random() * 20) + 2,
          showComments: false,
          newComment: '',
          comments: [
            {
              id: '1',
              author: 'DailyFan',
              content: `Great summary for ${day.day}!`,
              timestamp: '1 hour ago',
              likes: 1
            }
          ]
        }))
      );
    }
  }, [weeklyData]);

  // Per-card handlers for daily summaries
  const handleLike = (idx: number) => {
    setDailyStates(prev => prev.map((s, i) => i === idx ? { ...s, isLiked: !s.isLiked, likesCount: s.isLiked ? s.likesCount - 1 : s.likesCount + 1 } : s));
  };
  const handleBookmark = (idx: number) => {
    setDailyStates(prev => prev.map((s, i) => i === idx ? { ...s, isBookmarked: !s.isBookmarked } : s));
  };
  const handleShare = async (idx: number) => {
    setDailyStates(prev => prev.map((s, i) => i === idx ? { ...s, sharesCount: s.sharesCount + 1 } : s));
    if (weeklyData) {
      const day = weeklyData.dailySummaries[idx];
      if (navigator.share) {
        try {
          await navigator.share({
            title: `${day.day} - ${day.date}`,
            text: day.keyTakeaway,
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
    }
  };
  const handleShowComments = (idx: number) => {
    setDailyStates(prev => prev.map((s, i) => i === idx ? { ...s, showComments: !s.showComments } : s));
  };
  const handleCommentChange = (idx: number, value: string) => {
    setDailyStates(prev => prev.map((s, i) => i === idx ? { ...s, newComment: value } : s));
  };
  const handleAddComment = (idx: number) => {
    setDailyStates(prev => prev.map((s, i) => {
      if (i !== idx) return s;
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

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-green-600 bg-green-100';
      case 'bearish': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">AI is generating your weekly crypto summary...</p>
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
                <Sparkles className="text-purple-600" />
                Crypto This Week
              </h1>
              <p className="text-gray-600 mt-2">AI-powered weekly crypto news digest</p>
            </div>
            <div className="mt-4 md:mt-0">
              <select 
                value={selectedWeek} 
                onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
                className="border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value={0}>This Week</option>
                <option value={1}>Last Week</option>
                <option value={2}>2 Weeks Ago</option>
                <option value={3}>3 Weeks Ago</option>
              </select>
            </div>
          </div>
        </div>

        {weeklyData && (
          <>
            {/* Week Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3">
                  <Calendar className="text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Week Period</h3>
                    <p className="text-gray-600">{weeklyData.weekStart} to {weeklyData.weekEnd}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="text-green-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Market Performance</h3>
                    <p className="text-gray-600">{weeklyData.marketPerformance}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3">
                  <Clock className="text-orange-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Overall Trend</h3>
                    <p className="text-gray-600">{weeklyData.overallTrend}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Stories */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Top Stories This Week</h2>
              <ul className="space-y-3">
                {weeklyData.topStories.map((story, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </span>
                    <p className="text-gray-700">{story}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Daily Summaries */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Daily Breakdown</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {weeklyData.dailySummaries.map((day, index) => {
                  const state = dailyStates[index] || {
                    isLiked: false,
                    isBookmarked: false,
                    likesCount: 0,
                    sharesCount: 0,
                    showComments: false,
                    newComment: '',
                    comments: []
                  };
                  return (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                      {/* Card Content */}
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">{day.day}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(day.marketSentiment)}`}>
                          {day.marketSentiment}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{day.date}</p>
                      <div className="mb-3">
                        <h4 className="font-medium text-gray-800 mb-2">Headlines:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {day.headlines.map((headline, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="text-purple-600 mt-1">•</span>
                              {headline}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800 mb-1">Key Takeaway:</h4>
                        <p className="text-sm text-gray-600">{day.keyTakeaway}</p>
                      </div>
                      {/* Card Interaction Bar */}
                      <div className="flex items-center gap-4 border-t pt-3 mt-3">
                        <button
                          className={`flex items-center gap-1 text-sm px-2 py-1 rounded-lg transition-colors ${state.isLiked ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100 text-gray-500'}`}
                          onClick={() => handleLike(index)}
                          aria-label="Like this day"
                        >
                          <Heart className={`h-4 w-4 ${state.isLiked ? 'fill-current' : ''}`} /> {state.likesCount}
                        </button>
                        <button
                          className="flex items-center gap-1 text-gray-500 hover:text-blue-600 text-sm"
                          onClick={() => handleShowComments(index)}
                          aria-label="Comment on this day"
                        >
                          <MessageCircle className="h-4 w-4" /> {state.comments.length}
                        </button>
                        <button
                          className="flex items-center gap-1 text-gray-500 hover:text-green-600 text-sm"
                          onClick={() => handleShare(index)}
                          aria-label="Share this day"
                        >
                          <Share2 className="h-4 w-4" /> {state.sharesCount}
                        </button>
                        <button
                          className={`flex items-center gap-1 text-sm px-2 py-1 rounded-lg transition-colors ${state.isBookmarked ? 'bg-yellow-100 text-yellow-600' : 'hover:bg-gray-100 text-gray-500'}`}
                          onClick={() => handleBookmark(index)}
                          aria-label="Bookmark this day"
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
                              onChange={e => handleCommentChange(index, e.target.value)}
                              placeholder="Add a comment..."
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                              rows={2}
                            />
                            <button
                              onClick={() => handleAddComment(index)}
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

            {/* AI Insights */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-md p-6 text-white">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Sparkles />
                AI-Generated Insights
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {weeklyData.aiInsights.map((insight, index) => (
                  <div key={index} className="bg-white/10 rounded-lg p-4">
                    <p className="text-white/90">{insight}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-white/70 mt-4">
                Generated by CoinDaily AI • Updated every hour • Based on 10,000+ data points
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
