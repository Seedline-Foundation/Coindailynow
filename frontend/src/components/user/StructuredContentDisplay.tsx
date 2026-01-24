/**
 * Structured Content Display Component
 * Task 71: User-facing display of RAO-optimized content
 */

'use client';

import React, { useState, useEffect } from 'react';

interface StructuredContentDisplayProps {
  articleId: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  questionType: string;
}

interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  category: string;
  complexity: string;
}

interface CanonicalAnswer {
  question: string;
  answer: string;
  answerType: string;
}

const StructuredContentDisplay: React.FC<StructuredContentDisplayProps> = ({ articleId }) => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [glossary, setGlossary] = useState<GlossaryTerm[]>([]);
  const [canonicalAnswers, setCanonicalAnswers] = useState<CanonicalAnswer[]>([]);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [showGlossary, setShowGlossary] = useState(false);

  useEffect(() => {
    loadStructuredContent();
  }, [articleId]);

  const loadStructuredContent = async (): Promise<void> => {
    try {
      const [faqsRes, glossaryRes, answersRes] = await Promise.all([
        fetch(`/api/content-structuring/faqs/${articleId}`),
        fetch(`/api/content-structuring/glossary/${articleId}`),
        fetch(`/api/content-structuring/canonical-answers/${articleId}`)
      ]);

      if (faqsRes.ok) setFaqs(await faqsRes.json());
      if (glossaryRes.ok) setGlossary(await glossaryRes.json());
      if (answersRes.ok) setCanonicalAnswers(await answersRes.json());
    } catch (error) {
      console.error('Load structured content error:', error);
    }
  };

  const getCategoryColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      crypto: 'bg-blue-100 text-blue-800',
      blockchain: 'bg-purple-100 text-purple-800',
      defi: 'bg-green-100 text-green-800',
      trading: 'bg-yellow-100 text-yellow-800',
      technical: 'bg-red-100 text-red-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getComplexityIcon = (complexity: string): string => {
    switch (complexity) {
      case 'beginner': return '🟢';
      case 'intermediate': return '🟡';
      case 'advanced': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div className="space-y-8">
      {/* Canonical Answers Section */}
      {canonicalAnswers.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Key Takeaways</h2>
          <div className="space-y-4">
            {canonicalAnswers.slice(0, 3).map((answer, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">{answer.question}</h3>
                <p className="text-gray-700">{answer.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQ Section */}
      {faqs.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <div key={faq.id} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900 pr-4">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      expandedFaq === faq.id ? 'transform rotate-180' : ''
                    }`}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedFaq === faq.id && (
                  <div className="px-4 pb-4">
                    <p className="text-gray-700">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Glossary Section */}
      {glossary.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Crypto Glossary</h2>
            <button
              onClick={() => setShowGlossary(!showGlossary)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              {showGlossary ? 'Hide' : 'Show'} Glossary
            </button>
          </div>
          
          {showGlossary && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {glossary.map((term) => (
                <div key={term.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-gray-900">{term.term}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getComplexityIcon(term.complexity)}</span>
                      <span className={`px-2 py-1 text-xs rounded ${getCategoryColor(term.category)}`}>
                        {term.category}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm">{term.definition}</p>
                </div>
              ))}
            </div>
          )}

          {!showGlossary && (
            <div className="flex flex-wrap gap-2">
              {glossary.slice(0, 10).map((term) => (
                <button
                  key={term.id}
                  onClick={() => setShowGlossary(true)}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                  title={term.definition}
                >
                  {term.term}
                </button>
              ))}
              {glossary.length > 10 && (
                <button
                  onClick={() => setShowGlossary(true)}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
                >
                  +{glossary.length - 10} more
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quick Links */}
      {(faqs.length > 0 || glossary.length > 0) && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Quick Navigation</h3>
          <div className="flex flex-wrap gap-2">
            {faqs.length > 0 && (
              <a
                href="#faq"
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                📋 FAQs ({faqs.length})
              </a>
            )}
            {glossary.length > 0 && (
              <button
                onClick={() => setShowGlossary(true)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                📚 Glossary ({glossary.length})
              </button>
            )}
            {canonicalAnswers.length > 0 && (
              <a
                href="#key-takeaways"
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                💡 Key Takeaways ({canonicalAnswers.length})
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StructuredContentDisplay;

