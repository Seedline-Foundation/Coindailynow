/**
 * Translation Feedback Modal
 * 
 * Allows users to report translation errors and suggest improvements
 * 
 * @module TranslationFeedbackModal
 */

'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, Send } from 'lucide-react';
import axios from 'axios';

// ============================================================================
// Type Definitions
// ============================================================================

interface TranslationFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  articleId: string;
  translationId: string;
  language: string;
  languageName: string;
  selectedText?: string;
  onFeedbackSubmitted?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export default function TranslationFeedbackModal({
  isOpen,
  onClose,
  articleId,
  translationId,
  language,
  languageName,
  selectedText = '',
  onFeedbackSubmitted,
}: TranslationFeedbackModalProps) {
  const [issueType, setIssueType] = useState<string>('');
  const [originalText, setOriginalText] = useState<string>(selectedText);
  const [suggestedText, setSuggestedText] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [severity, setSeverity] = useState<string>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const issueTypes = [
    { value: 'inaccurate', label: '❌ Inaccurate Translation', description: 'Meaning is wrong or incorrect' },
    { value: 'grammar', label: '📝 Grammar Error', description: 'Grammatical mistakes in translation' },
    { value: 'context_lost', label: '🔄 Context Lost', description: 'Original meaning not preserved' },
    { value: 'formatting', label: '📄 Formatting Issue', description: 'Layout or formatting problems' },
    { value: 'offensive', label: '⚠️ Offensive Content', description: 'Contains offensive or inappropriate language' },
    { value: 'other', label: '❓ Other Issue', description: 'Other translation problems' },
  ];

  const severityLevels = [
    { value: 'low', label: 'Low', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', description: 'Minor issue, doesn\'t affect understanding' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', description: 'Noticeable issue, may cause confusion' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300', description: 'Significant issue, affects comprehension' },
    { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', description: 'Critical issue, completely wrong or offensive' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!issueType) {
      setError('Please select an issue type');
      return;
    }

    if (!originalText.trim()) {
      setError('Please provide the problematic text');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await axios.post(
        '/api/user/feedback/translation',
        {
          articleId,
          translationId,
          language,
          issueType,
          originalText,
          suggestedText,
          comment,
          severity,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.data.success) {
        setSubmitted(true);
        
        // Notify parent
        if (onFeedbackSubmitted) {
          onFeedbackSubmitted();
        }

        // Close modal after 2 seconds
        setTimeout(() => {
          onClose();
          resetForm();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit translation feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setIssueType('');
    setOriginalText('');
    setSuggestedText('');
    setComment('');
    setSeverity('medium');
    setSubmitted(false);
    setError('');
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      resetForm();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Report Translation Issue
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Language: <span className="font-medium">{languageName}</span>
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Issue Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    What's the issue? *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {issueTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setIssueType(type.value)}
                        className={`p-3 text-left rounded-lg border transition-all ${
                          issueType === type.value
                            ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/30 dark:border-blue-500'
                            : 'bg-white border-gray-300 hover:border-gray-400 dark:bg-gray-700 dark:border-gray-600'
                        }`}
                      >
                        <div className="font-medium text-sm text-gray-900 dark:text-white mb-1">
                          {type.label}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {type.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Severity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    How severe is this issue? *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {severityLevels.map((level) => (
                      <button
                        key={level.value}
                        type="button"
                        onClick={() => setSeverity(level.value)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all ${
                          severity === level.value
                            ? `${level.color} border-current`
                            : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                        }`}
                        title={level.description}
                      >
                        {level.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Problematic Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Problematic text *
                  </label>
                  <textarea
                    value={originalText}
                    onChange={(e) => setOriginalText(e.target.value)}
                    rows={3}
                    required
                    placeholder="Paste or type the text that has translation issues..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                {/* Suggested Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your suggested correction (optional)
                  </label>
                  <textarea
                    value={suggestedText}
                    onChange={(e) => setSuggestedText(e.target.value)}
                    rows={3}
                    placeholder="How would you translate this correctly?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                {/* Additional Comments */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Additional context (optional)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={2}
                    placeholder="Any additional information that might help us fix this..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <span className="text-sm text-red-800 dark:text-red-300">{error}</span>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    {isSubmitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>

                {/* Helper Text */}
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <p>* Required fields</p>
                  <p className="mt-1">
                    Your report will be reviewed by our team and help improve translation quality.
                  </p>
                </div>
              </form>
            ) : (
              <div className="py-8 text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Report Submitted Successfully!
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Thank you for helping us improve our translations. Our team will review your report shortly.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

