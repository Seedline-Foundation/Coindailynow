'use client';

import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Play, 
  Award, 
  Clock, 
  Users, 
  TrendingUp,
  Coins,
  CheckCircle,
  Star,
  ChevronRight
} from 'lucide-react';
import { EarningsService } from '@/lib/payments/earnings-service';
import { LearnAndEarnCourse, UserProgress } from '@/types/monetization';

interface CourseCardProps {
  course: LearnAndEarnCourse;
  progress?: UserProgress;
  onEnroll: (courseId: string) => void;
  onContinue: (courseId: string) => void;
}

function CourseCard({ course, progress, onEnroll, onContinue }: CourseCardProps) {
  const isEnrolled = !!progress;
  const completionPercentage = progress ? (progress.completedLessons / course.totalLessons) * 100 : 0;
  const isCompleted = progress?.completed || false;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      {/* Course Image */}
      <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-4 left-4">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            course.difficulty === 'beginner' 
              ? 'bg-green-100 text-green-800' 
              : course.difficulty === 'intermediate'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {course.difficulty}
          </span>
        </div>
        <div className="absolute top-4 right-4">
          <div className="flex items-center space-x-1 bg-white/90 rounded-full px-2 py-1">
            <Coins className="w-3 h-3 text-yellow-600" />
            <span className="text-xs font-medium text-gray-900">
              {course.rewards.completion.amount} {course.rewards.completion.type}
            </span>
          </div>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-xl font-bold text-white mb-2">{course.title}</h3>
          <p className="text-gray-200 text-sm line-clamp-2">{course.description}</p>
        </div>
      </div>

      {/* Course Info */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{course.estimatedDuration}</span>
            </div>
            <div className="flex items-center space-x-1">
              <BookOpen className="w-4 h-4" />
              <span>{course.totalLessons} lessons</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{course.enrolledCount}</span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{course.rating}</span>
          </div>
        </div>

        {/* Progress Bar */}
        {isEnrolled && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Progress
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {Math.round(completionPercentage)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Rewards */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Earn Rewards
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Per lesson:</span>
              <div className="flex items-center space-x-1">
                <Coins className="w-3 h-3 text-yellow-600" />
                <span className="font-medium">
                  {course.rewards.perLesson.amount} {course.rewards.perLesson.type}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Completion bonus:</span>
              <div className="flex items-center space-x-1">
                <Award className="w-3 h-3 text-yellow-600" />
                <span className="font-medium">
                  {course.rewards.completion.amount} {course.rewards.completion.type}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center space-x-3">
          {!isEnrolled ? (
            <button
              onClick={() => onEnroll(course.id)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>Enroll Now</span>
            </button>
          ) : isCompleted ? (
            <div className="flex-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 font-medium py-2 px-4 rounded-lg flex items-center justify-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>Completed</span>
            </div>
          ) : (
            <button
              onClick={() => onContinue(course.id)}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>Continue</span>
            </button>
          )}
          
          <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LearnAndEarnPage() {
  const [courses, setCourses] = useState<LearnAndEarnCourse[]>([]);
  const [userProgress, setUserProgress] = useState<Record<string, UserProgress>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'enrolled' | 'completed'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');

  const earningsService = EarningsService.getInstance();

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const allCourses = await earningsService.getAvailableCourses();
        setCourses(allCourses);

        const userId = localStorage.getItem('userId');
        if (userId) {
          const progress = await earningsService.getUserProgress(userId);
          const progressMap: Record<string, UserProgress> = {};
          progress.forEach((p: UserProgress) => {
            progressMap[p.courseId] = p;
          });
          setUserProgress(progressMap);
        }
      } catch (error) {
        console.error('Error loading courses:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, [earningsService]);

  const handleEnroll = async (courseId: string) => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert('Please log in to enroll in courses');
      return;
    }

    try {
      const result = await earningsService.enrollInCourse(userId, courseId);
      if (result.success && result.progress) {
        setUserProgress(prev => ({
          ...prev,
          [courseId]: result.progress!
        }));
      } else {
        alert(result.error || 'Failed to enroll in course');
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      alert('Failed to enroll in course');
    }
  };

  const handleContinue = (courseId: string) => {
    // Navigate to course content
    window.location.href = `/learn/course/${courseId}`;
  };

  const filteredCourses = courses.filter(course => {
    const progress = userProgress[course.id];
    
    if (filter === 'enrolled' && !progress) return false;
    if (filter === 'completed' && (!progress || !progress.completed)) return false;
    
    if (difficultyFilter !== 'all' && course.difficulty !== difficultyFilter) return false;
    
    return true;
  });

  const totalEarnings = Object.values(userProgress).reduce((total, progress) => {
    return total + (progress.totalEarned || 0);
  }, 0);

  const completedCourses = Object.values(userProgress).filter(p => p.completed).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Learn & Earn
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Master crypto trading and earn rewards for your progress
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {totalEarnings.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Earned (USDT)
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg mx-auto mb-4">
                <Award className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {completedCourses}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Courses Completed
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg mx-auto mb-4">
                <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {Object.keys(userProgress).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Enrolled Courses
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Show:
              </span>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'enrolled' | 'completed')}
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Courses</option>
                <option value="enrolled">Enrolled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Difficulty:
              </span>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value as 'all' | 'beginner' | 'intermediate' | 'advanced')}
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {filteredCourses.length} courses found
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              progress={userProgress[course.id]}
              onEnroll={handleEnroll}
              onContinue={handleContinue}
            />
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No courses found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your filters to see more courses.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
