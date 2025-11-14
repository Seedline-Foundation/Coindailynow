/**
 * Enhanced Content Sections - New Sections with Reward Points
 * Task 53 Enhancement: Reward Points & SEO Optimization
 * 
 * Includes: Prediction, Survey, Learn, Advertisement, AI Content, and more
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Brain, 
  Coins, 
  Clock, 
  Users, 
  Star,
  CheckCircle,
  AlertTriangle,
  Play,
  BookOpen,
  Award,
  Filter,
  Sparkles,
  Target,
  BarChart3,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Eye,
  Zap
} from 'lucide-react';
import { ContentCard } from './ContentCard';
import { 
  CommunityPrediction, 
  CommunitySurvey, 
  LearnAndEarnCourse,
  Advertisement,
  PersonalizedContent,
  GlossaryTerm,
  SocialPost,
  BreakingNewsAlert
} from '../../types/content-sections';

// ========== Prediction Section with Reward Points ==========

interface PredictionSectionProps {
  isLoading?: boolean;
}

export const PredictionSection: React.FC<PredictionSectionProps> = ({ isLoading = false }) => {
  const [predictions, setPredictions] = useState<CommunityPrediction[]>([]);

  useEffect(() => {
    // Mock data with reward points
    setPredictions([
      {
        id: '1',
        question: 'Will Bitcoin reach $100,000 by end of 2024?',
        description: 'Community prediction on Bitcoin price target',
        predictionType: 'YES_NO',
        options: ['YES', 'NO'],
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        totalParticipants: 1247,
        currentResults: { 'YES': 65, 'NO': 35 },
        rewardPoints: 50,
        category: 'Price Prediction',
        relatedAssets: ['BTC'],
        createdBy: 'CoinDaily Team',
        status: 'active'
      },
      {
        id: '2',
        question: 'Next memecoin to reach $1B market cap?',
        description: 'Predict which memecoin will hit the milestone next',
        predictionType: 'MULTIPLE_CHOICE',
        options: ['DOGE', 'SHIB', 'PEPE', 'FLOKI', 'Other'],
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        totalParticipants: 892,
        currentResults: { 'DOGE': 30, 'SHIB': 25, 'PEPE': 20, 'FLOKI': 15, 'Other': 10 },
        rewardPoints: 75,
        category: 'Memecoin',
        relatedAssets: ['DOGE', 'SHIB', 'PEPE', 'FLOKI'],
        createdBy: 'Memecoin Analysis',
        status: 'active'
      }
    ]);
  }, []);

  if (isLoading) {
    return (
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-muted animate-pulse rounded w-48"></div>
          <div className="h-8 bg-muted animate-pulse rounded w-24"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Community Predictions</h2>
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Coins className="w-3 h-3 mr-1" />
            Earn Points
          </Badge>
        </div>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {predictions.map((prediction) => (
          <Card key={prediction.id} className="group hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{prediction.question}</CardTitle>
                  <p className="text-sm text-muted-foreground mb-3">{prediction.description}</p>
                </div>
                <Badge variant="outline" className="ml-2">
                  <Coins className="w-3 h-3 mr-1" />
                  {prediction.rewardPoints} pts
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {/* Prediction Options */}
                <div className="space-y-2">
                  {prediction.options.map((option) => {
                    const percentage = prediction.currentResults[option] || 0;
                    return (
                      <div key={option} className="flex items-center justify-between">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 mr-3"
                        >
                          {option}
                        </Button>
                        <div className="flex items-center gap-2 min-w-[80px]">
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{percentage}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-muted-foreground pt-3 border-t">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {prediction.totalParticipants} participants
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {Math.ceil((prediction.deadline.getTime() - Date.now()) / (24 * 60 * 60 * 1000))} days left
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

// ========== Survey Section with Reward Points ==========

interface SurveySectionProps {
  isLoading?: boolean;
}

export const SurveySection: React.FC<SurveySectionProps> = ({ isLoading = false }) => {
  const [surveys, setSurveys] = useState<CommunitySurvey[]>([]);

  useEffect(() => {
    setSurveys([
      {
        id: '1',
        title: 'African Crypto Adoption Survey 2024',
        description: 'Help us understand crypto adoption across African countries',
        questions: [
          {
            id: '1',
            question: 'Which African country has the highest crypto adoption?',
            type: 'multiple_choice',
            options: ['Nigeria', 'Kenya', 'South Africa', 'Ghana'],
            required: true
          }
        ],
        totalResponses: 856,
        rewardPoints: 100,
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        targetAudience: ['Africa', 'Crypto Enthusiasts'],
        status: 'active'
      }
    ]);
  }, []);

  if (isLoading) {
    return (
      <section className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded w-48"></div>
        <div className="h-32 bg-muted animate-pulse rounded-lg"></div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Community Surveys</h2>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Coins className="w-3 h-3 mr-1" />
            Earn Rewards
          </Badge>
        </div>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </div>

      <div className="space-y-4">
        {surveys.map((survey) => (
          <Card key={survey.id} className="group hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">{survey.title}</h3>
                  <p className="text-muted-foreground mb-4">{survey.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {survey.totalResponses} responses
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {Math.ceil((survey.deadline.getTime() - Date.now()) / (24 * 60 * 60 * 1000))} days left
                    </div>
                    <Badge variant="outline">
                      <Coins className="w-3 h-3 mr-1" />
                      {survey.rewardPoints} points
                    </Badge>
                  </div>
                </div>
                
                <Button className="ml-4">
                  Take Survey
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

// ========== Learn Section with Reward Points ==========

interface LearnSectionProps {
  isLoading?: boolean;
}

export const LearnSection: React.FC<LearnSectionProps> = ({ isLoading = false }) => {
  const [courses, setCourses] = useState<LearnAndEarnCourse[]>([]);

  useEffect(() => {
    setCourses([
      {
        id: '1',
        title: 'Introduction to Cryptocurrency',
        description: 'Learn the basics of Bitcoin, Ethereum, and blockchain technology',
        difficulty: 'beginner',
        estimatedDuration: '2 hours',
        totalLessons: 8,
        enrolledCount: 2456,
        rating: 4.8,
        rewards: {
          completion: { amount: 500, type: 'points' },
          lessonCompletion: { amount: 50, type: 'points' }
        },
        lessons: [],
        quiz: {
          id: '1',
          questions: [],
          passingScore: 80,
          rewardPoints: 200
        }
      },
      {
        id: '2',
        title: 'African Crypto Market Analysis',
        description: 'Deep dive into cryptocurrency adoption and trends across Africa',
        difficulty: 'intermediate',
        estimatedDuration: '3 hours',
        totalLessons: 12,
        enrolledCount: 1834,
        rating: 4.9,
        rewards: {
          completion: { amount: 750, type: 'points' },
          lessonCompletion: { amount: 75, type: 'points' }
        },
        lessons: [],
        quiz: {
          id: '2',
          questions: [],
          passingScore: 80,
          rewardPoints: 300
        }
      }
    ]);
  }, []);

  if (isLoading) {
    return (
      <section className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded w-48"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-80 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Learn & Earn</h2>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Award className="w-3 h-3 mr-1" />
            Earn While Learning
          </Badge>
        </div>
        <Button variant="outline" size="sm">
          Browse Courses
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="group hover:shadow-lg transition-shadow overflow-hidden">
            <div className="relative h-32 bg-gradient-to-br from-blue-500 to-purple-600">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="absolute top-4 left-4">
                <Badge className={`${
                  course.difficulty === 'beginner' 
                    ? 'bg-green-100 text-green-800' 
                    : course.difficulty === 'intermediate'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {course.difficulty}
                </Badge>
              </div>
              <div className="absolute top-4 right-4">
                <Badge className="bg-white/90 text-gray-900">
                  <Coins className="w-3 h-3 mr-1" />
                  {course.rewards.completion.amount} pts
                </Badge>
              </div>
            </div>
            
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">{course.title}</h3>
              <p className="text-muted-foreground text-sm mb-4">{course.description}</p>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {course.estimatedDuration}
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {course.totalLessons} lessons
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  {course.rating}
                </div>
              </div>
              
              <Button className="w-full">
                <Play className="w-4 h-4 mr-2" />
                Start Learning
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

// ========== Advertisement Section with Reward Points ==========

interface AdvertisementSectionProps {
  isLoading?: boolean;
}

export const AdvertisementSection: React.FC<AdvertisementSectionProps> = ({ isLoading = false }) => {
  const [ads, setAds] = useState<Advertisement[]>([]);

  useEffect(() => {
    setAds([
      {
        id: '1',
        title: 'Trade on Africa\'s Leading Crypto Exchange',
        description: 'Join millions of users trading Bitcoin, Ethereum, and 200+ cryptocurrencies',
        imageUrl: '/images/exchange-ad.jpg',
        targetUrl: '/partners/exchange',
        advertiser: 'CryptoAfrica Exchange',
        adType: 'sponsored_content',
        placement: 'inline',
        targetAudience: ['Nigeria', 'Kenya', 'South Africa'],
        rewardPointsForView: 5,
        rewardPointsForClick: 25,
        isActive: true,
        impressions: 15420,
        clicks: 1240
      }
    ]);
  }, []);

  if (isLoading) {
    return (
      <section className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded w-48"></div>
        <div className="h-64 bg-muted animate-pulse rounded-lg"></div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Sponsored Content</h2>
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            <Eye className="w-3 h-3 mr-1" />
            Earn by Viewing
          </Badge>
        </div>
      </div>

      <div className="space-y-4">
        {ads.map((ad) => (
          <Card key={ad.id} className="group hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-purple-500 to-blue-600 p-6 text-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                        Sponsored
                      </Badge>
                      <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                        <Coins className="w-3 h-3 mr-1" />
                        +{ad.rewardPointsForView} pts to view
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold mb-2">{ad.title}</h3>
                    <p className="text-white/90 mb-4">{ad.description}</p>
                    <Button variant="secondary" className="bg-white text-gray-900 hover:bg-white/90">
                      Learn More
                      <Zap className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

// ========== AI Content Widget ==========

interface AIContentWidgetSectionProps {
  isLoading?: boolean;
}

export const AIContentWidgetSection: React.FC<AIContentWidgetSectionProps> = ({ isLoading = false }) => {
  const [personalizedContent, setPersonalizedContent] = useState<PersonalizedContent[]>([]);

  useEffect(() => {
    setPersonalizedContent([
      {
        id: '1',
        title: 'Bitcoin Mining in Nigeria: A Complete Guide',
        category: 'Education',
        relevanceScore: 95,
        readTime: 8,
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        trending: true,
        tags: ['Bitcoin', 'Mining', 'Nigeria'],
        contentType: 'article'
      },
      {
        id: '2',
        title: 'Understanding Ethereum 2.0 Staking',
        category: 'Technology',
        relevanceScore: 88,
        readTime: 12,
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        trending: false,
        tags: ['Ethereum', 'Staking', 'ETH2'],
        contentType: 'article'
      }
    ]);
  }, []);

  if (isLoading) {
    return (
      <section className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded w-48"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">AI Personalized Content</h2>
          <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800">
            <Sparkles className="w-3 h-3 mr-1" />
            Just for You
          </Badge>
        </div>
        <Button variant="outline" size="sm">
          <Filter className="w-4 h-4 mr-2" />
          Customize
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {personalizedContent.map((content) => (
          <ContentCard
            key={content.id}
            id={content.id}
            title={content.title}
            excerpt={`Personalized for you based on your reading history. Relevance: ${content.relevanceScore}%`}
            imageUrl="/images/ai-content.jpg"
            publishedAt={content.publishedAt}
            readingTimeMinutes={content.readTime}
            category={{ name: content.category, slug: content.category.toLowerCase().replace(/\s+/g, '-') }}
            href={`/articles/${content.id}`}
          />
        ))}
      </div>
    </section>
  );
};

export default {
  PredictionSection,
  SurveySection,
  LearnSection,
  AdvertisementSection,
  AIContentWidgetSection
};
