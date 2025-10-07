/**
 * AI Orchestrator Configuration
 * Production-ready configuration for the CoinDaily AI agent orchestration system
 */

import {
  OrchestratorConfig,
  AgentType,
  TaskPriority
} from '../types';

/**
 * Production orchestrator configuration optimized for African market
 */
export const productionConfig: OrchestratorConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0')
  },
  agents: {
    [AgentType.CONTENT_GENERATION]: {
      minInstances: 2,
      maxInstances: 8,
      autoScaling: true,
      config: {
        maxConcurrentTasks: 5,
        timeoutMs: 45000, // 45 seconds for content generation
        retryPolicy: {
          maxRetries: 3,
          backoffStrategy: 'exponential',
          baseDelayMs: 2000,
          maxDelayMs: 30000
        },
        healthCheckInterval: 30000
      }
    },
    [AgentType.MARKET_ANALYSIS]: {
      minInstances: 2,
      maxInstances: 6,
      autoScaling: true,
      config: {
        maxConcurrentTasks: 8,
        timeoutMs: 30000, // 30 seconds for market analysis
        retryPolicy: {
          maxRetries: 2,
          backoffStrategy: 'linear',
          baseDelayMs: 3000,
          maxDelayMs: 15000
        },
        healthCheckInterval: 20000
      }
    },
    [AgentType.QUALITY_REVIEW]: {
      minInstances: 1,
      maxInstances: 4,
      autoScaling: true,
      config: {
        maxConcurrentTasks: 6,
        timeoutMs: 25000, // 25 seconds for quality review
        retryPolicy: {
          maxRetries: 2,
          backoffStrategy: 'fixed',
          baseDelayMs: 2500,
          maxDelayMs: 2500
        },
        healthCheckInterval: 25000
      }
    },
    [AgentType.TRANSLATION]: {
      minInstances: 3,
      maxInstances: 12,
      autoScaling: true,
      config: {
        maxConcurrentTasks: 15,
        timeoutMs: 20000, // 20 seconds for translation
        retryPolicy: {
          maxRetries: 3,
          backoffStrategy: 'exponential',
          baseDelayMs: 1000,
          maxDelayMs: 10000
        },
        healthCheckInterval: 15000
      }
    },
    [AgentType.SENTIMENT_ANALYSIS]: {
      minInstances: 2,
      maxInstances: 6,
      autoScaling: true,
      config: {
        maxConcurrentTasks: 10,
        timeoutMs: 15000, // 15 seconds for sentiment analysis
        retryPolicy: {
          maxRetries: 2,
          backoffStrategy: 'linear',
          baseDelayMs: 1500,
          maxDelayMs: 8000
        },
        healthCheckInterval: 20000
      }
    },
    [AgentType.MODERATION]: {
      minInstances: 1,
      maxInstances: 4,
      autoScaling: true,
      config: {
        maxConcurrentTasks: 12,
        timeoutMs: 18000, // 18 seconds for content moderation
        retryPolicy: {
          maxRetries: 1,
          backoffStrategy: 'fixed',
          baseDelayMs: 3000,
          maxDelayMs: 3000
        },
        healthCheckInterval: 30000
      }
    }
  },
  queues: {
    [AgentType.CONTENT_GENERATION]: {
      name: 'content_generation_queue',
      maxSize: 2000,
      processTimeout: 600000, // 10 minutes
      retryPolicy: {
        maxRetries: 3,
        backoffStrategy: 'exponential',
        baseDelayMs: 2000,
        maxDelayMs: 30000
      },
      priorityLevels: [TaskPriority.LOW, TaskPriority.NORMAL, TaskPriority.HIGH, TaskPriority.URGENT],
      deadLetterQueue: true
    },
    [AgentType.MARKET_ANALYSIS]: {
      name: 'market_analysis_queue',
      maxSize: 1500,
      processTimeout: 300000, // 5 minutes
      retryPolicy: {
        maxRetries: 2,
        backoffStrategy: 'linear',
        baseDelayMs: 3000,
        maxDelayMs: 15000
      },
      priorityLevels: [TaskPriority.NORMAL, TaskPriority.HIGH, TaskPriority.URGENT],
      deadLetterQueue: true
    },
    [AgentType.QUALITY_REVIEW]: {
      name: 'quality_review_queue',
      maxSize: 1200,
      processTimeout: 240000, // 4 minutes
      retryPolicy: {
        maxRetries: 2,
        backoffStrategy: 'fixed',
        baseDelayMs: 2500,
        maxDelayMs: 2500
      },
      priorityLevels: [TaskPriority.NORMAL, TaskPriority.HIGH, TaskPriority.URGENT],
      deadLetterQueue: true
    },
    [AgentType.TRANSLATION]: {
      name: 'translation_queue',
      maxSize: 5000,
      processTimeout: 180000, // 3 minutes
      retryPolicy: {
        maxRetries: 3,
        backoffStrategy: 'exponential',
        baseDelayMs: 1000,
        maxDelayMs: 10000
      },
      priorityLevels: [TaskPriority.LOW, TaskPriority.NORMAL, TaskPriority.HIGH, TaskPriority.URGENT],
      deadLetterQueue: true
    },
    [AgentType.SENTIMENT_ANALYSIS]: {
      name: 'sentiment_analysis_queue',
      maxSize: 1000,
      processTimeout: 120000, // 2 minutes
      retryPolicy: {
        maxRetries: 2,
        backoffStrategy: 'linear',
        baseDelayMs: 1500,
        maxDelayMs: 8000
      },
      priorityLevels: [TaskPriority.NORMAL, TaskPriority.HIGH, TaskPriority.URGENT],
      deadLetterQueue: true
    },
    [AgentType.MODERATION]: {
      name: 'moderation_queue',
      maxSize: 2500,
      processTimeout: 150000, // 2.5 minutes
      retryPolicy: {
        maxRetries: 1,
        backoffStrategy: 'fixed',
        baseDelayMs: 3000,
        maxDelayMs: 3000
      },
      priorityLevels: [TaskPriority.HIGH, TaskPriority.URGENT],
      deadLetterQueue: true
    }
  },
  monitoring: {
    metricsInterval: 30000, // 30 seconds
    alertThresholds: {
      queueSize: 200,
      errorRate: 0.15,
      responseTime: 500 // Sub-500ms requirement
    }
  },
  performance: {
    maxResponseTimeMs: 500, // Critical requirement
    maxConcurrentTasks: 100,
    enableCircuitBreaker: true
  }
};

/**
 * Development orchestrator configuration
 */
export const developmentConfig: OrchestratorConfig = {
  redis: {
    host: 'localhost',
    port: 6379,
    db: 1 // Use different DB for development
  },
  agents: {
    [AgentType.CONTENT_GENERATION]: {
      minInstances: 1,
      maxInstances: 2,
      autoScaling: false,
      config: {
        maxConcurrentTasks: 2,
        timeoutMs: 30000,
        retryPolicy: {
          maxRetries: 2,
          backoffStrategy: 'exponential',
          baseDelayMs: 1000,
          maxDelayMs: 10000
        },
        healthCheckInterval: 15000
      }
    },
    [AgentType.MARKET_ANALYSIS]: {
      minInstances: 1,
      maxInstances: 2,
      autoScaling: false,
      config: {
        maxConcurrentTasks: 2,
        timeoutMs: 20000,
        retryPolicy: {
          maxRetries: 1,
          backoffStrategy: 'linear',
          baseDelayMs: 2000,
          maxDelayMs: 5000
        },
        healthCheckInterval: 15000
      }
    },
    [AgentType.QUALITY_REVIEW]: {
      minInstances: 1,
      maxInstances: 1,
      autoScaling: false,
      config: {
        maxConcurrentTasks: 1,
        timeoutMs: 15000,
        retryPolicy: {
          maxRetries: 1,
          backoffStrategy: 'fixed',
          baseDelayMs: 1000,
          maxDelayMs: 1000
        },
        healthCheckInterval: 20000
      }
    },
    [AgentType.TRANSLATION]: {
      minInstances: 1,
      maxInstances: 3,
      autoScaling: false,
      config: {
        maxConcurrentTasks: 3,
        timeoutMs: 10000,
        retryPolicy: {
          maxRetries: 2,
          backoffStrategy: 'exponential',
          baseDelayMs: 500,
          maxDelayMs: 3000
        },
        healthCheckInterval: 10000
      }
    },
    [AgentType.SENTIMENT_ANALYSIS]: {
      minInstances: 1,
      maxInstances: 2,
      autoScaling: false,
      config: {
        maxConcurrentTasks: 2,
        timeoutMs: 8000,
        retryPolicy: {
          maxRetries: 1,
          backoffStrategy: 'linear',
          baseDelayMs: 1000,
          maxDelayMs: 3000
        },
        healthCheckInterval: 15000
      }
    },
    [AgentType.MODERATION]: {
      minInstances: 1,
      maxInstances: 1,
      autoScaling: false,
      config: {
        maxConcurrentTasks: 2,
        timeoutMs: 10000,
        retryPolicy: {
          maxRetries: 1,
          backoffStrategy: 'fixed',
          baseDelayMs: 1500,
          maxDelayMs: 1500
        },
        healthCheckInterval: 20000
      }
    }
  },
  queues: {
    [AgentType.CONTENT_GENERATION]: {
      name: 'dev_content_generation_queue',
      maxSize: 100,
      processTimeout: 120000,
      retryPolicy: {
        maxRetries: 2,
        backoffStrategy: 'exponential',
        baseDelayMs: 1000,
        maxDelayMs: 10000
      },
      priorityLevels: [TaskPriority.LOW, TaskPriority.NORMAL, TaskPriority.HIGH, TaskPriority.URGENT],
      deadLetterQueue: true
    },
    [AgentType.MARKET_ANALYSIS]: {
      name: 'dev_market_analysis_queue',
      maxSize: 50,
      processTimeout: 90000,
      retryPolicy: {
        maxRetries: 1,
        backoffStrategy: 'linear',
        baseDelayMs: 2000,
        maxDelayMs: 5000
      },
      priorityLevels: [TaskPriority.NORMAL, TaskPriority.HIGH, TaskPriority.URGENT],
      deadLetterQueue: true
    },
    [AgentType.QUALITY_REVIEW]: {
      name: 'dev_quality_review_queue',
      maxSize: 30,
      processTimeout: 60000,
      retryPolicy: {
        maxRetries: 1,
        backoffStrategy: 'fixed',
        baseDelayMs: 1000,
        maxDelayMs: 1000
      },
      priorityLevels: [TaskPriority.NORMAL, TaskPriority.HIGH],
      deadLetterQueue: true
    },
    [AgentType.TRANSLATION]: {
      name: 'dev_translation_queue',
      maxSize: 200,
      processTimeout: 45000,
      retryPolicy: {
        maxRetries: 2,
        backoffStrategy: 'exponential',
        baseDelayMs: 500,
        maxDelayMs: 3000
      },
      priorityLevels: [TaskPriority.LOW, TaskPriority.NORMAL, TaskPriority.HIGH],
      deadLetterQueue: true
    },
    [AgentType.SENTIMENT_ANALYSIS]: {
      name: 'dev_sentiment_analysis_queue',
      maxSize: 40,
      processTimeout: 30000,
      retryPolicy: {
        maxRetries: 1,
        backoffStrategy: 'linear',
        baseDelayMs: 1000,
        maxDelayMs: 3000
      },
      priorityLevels: [TaskPriority.NORMAL, TaskPriority.HIGH],
      deadLetterQueue: true
    },
    [AgentType.MODERATION]: {
      name: 'dev_moderation_queue',
      maxSize: 60,
      processTimeout: 40000,
      retryPolicy: {
        maxRetries: 1,
        backoffStrategy: 'fixed',
        baseDelayMs: 1500,
        maxDelayMs: 1500
      },
      priorityLevels: [TaskPriority.HIGH, TaskPriority.URGENT],
      deadLetterQueue: true
    }
  },
  monitoring: {
    metricsInterval: 15000, // 15 seconds for development
    alertThresholds: {
      queueSize: 50,
      errorRate: 0.25,
      responseTime: 1000 // More lenient for development
    }
  },
  performance: {
    maxResponseTimeMs: 1000, // More lenient for development
    maxConcurrentTasks: 20,
    enableCircuitBreaker: false // Disabled for easier debugging
  }
};

/**
 * Test orchestrator configuration
 */
export const testConfig: OrchestratorConfig = {
  redis: {
    host: 'localhost',
    port: 6379,
    db: 2 // Use different DB for tests
  },
  agents: {
    [AgentType.CONTENT_GENERATION]: {
      minInstances: 1,
      maxInstances: 1,
      autoScaling: false,
      config: {
        maxConcurrentTasks: 1,
        timeoutMs: 5000,
        retryPolicy: {
          maxRetries: 1,
          backoffStrategy: 'fixed',
          baseDelayMs: 100,
          maxDelayMs: 100
        },
        healthCheckInterval: 5000
      }
    },
    [AgentType.MARKET_ANALYSIS]: {
      minInstances: 1,
      maxInstances: 1,
      autoScaling: false,
      config: {
        maxConcurrentTasks: 1,
        timeoutMs: 5000,
        retryPolicy: {
          maxRetries: 1,
          backoffStrategy: 'fixed',
          baseDelayMs: 100,
          maxDelayMs: 100
        },
        healthCheckInterval: 5000
      }
    },
    [AgentType.QUALITY_REVIEW]: {
      minInstances: 1,
      maxInstances: 1,
      autoScaling: false,
      config: {
        maxConcurrentTasks: 1,
        timeoutMs: 3000,
        retryPolicy: {
          maxRetries: 1,
          backoffStrategy: 'fixed',
          baseDelayMs: 50,
          maxDelayMs: 50
        },
        healthCheckInterval: 10000
      }
    },
    [AgentType.TRANSLATION]: {
      minInstances: 1,
      maxInstances: 1,
      autoScaling: false,
      config: {
        maxConcurrentTasks: 1,
        timeoutMs: 3000,
        retryPolicy: {
          maxRetries: 1,
          backoffStrategy: 'fixed',
          baseDelayMs: 50,
          maxDelayMs: 50
        },
        healthCheckInterval: 10000
      }
    },
    [AgentType.SENTIMENT_ANALYSIS]: {
      minInstances: 1,
      maxInstances: 1,
      autoScaling: false,
      config: {
        maxConcurrentTasks: 1,
        timeoutMs: 2000,
        retryPolicy: {
          maxRetries: 1,
          backoffStrategy: 'fixed',
          baseDelayMs: 50,
          maxDelayMs: 50
        },
        healthCheckInterval: 10000
      }
    },
    [AgentType.MODERATION]: {
      minInstances: 1,
      maxInstances: 1,
      autoScaling: false,
      config: {
        maxConcurrentTasks: 1,
        timeoutMs: 2000,
        retryPolicy: {
          maxRetries: 1,
          backoffStrategy: 'fixed',
          baseDelayMs: 50,
          maxDelayMs: 50
        },
        healthCheckInterval: 10000
      }
    }
  },
  queues: {
    [AgentType.CONTENT_GENERATION]: {
      name: 'test_content_generation_queue',
      maxSize: 10,
      processTimeout: 10000,
      retryPolicy: {
        maxRetries: 1,
        backoffStrategy: 'fixed',
        baseDelayMs: 100,
        maxDelayMs: 100
      },
      priorityLevels: [TaskPriority.NORMAL, TaskPriority.HIGH, TaskPriority.URGENT],
      deadLetterQueue: true
    },
    [AgentType.MARKET_ANALYSIS]: {
      name: 'test_market_analysis_queue',
      maxSize: 10,
      processTimeout: 10000,
      retryPolicy: {
        maxRetries: 1,
        backoffStrategy: 'fixed',
        baseDelayMs: 100,
        maxDelayMs: 100
      },
      priorityLevels: [TaskPriority.NORMAL, TaskPriority.HIGH],
      deadLetterQueue: true
    },
    [AgentType.QUALITY_REVIEW]: {
      name: 'test_quality_review_queue',
      maxSize: 5,
      processTimeout: 8000,
      retryPolicy: {
        maxRetries: 1,
        backoffStrategy: 'fixed',
        baseDelayMs: 50,
        maxDelayMs: 50
      },
      priorityLevels: [TaskPriority.NORMAL, TaskPriority.HIGH],
      deadLetterQueue: true
    },
    [AgentType.TRANSLATION]: {
      name: 'test_translation_queue',
      maxSize: 20,
      processTimeout: 8000,
      retryPolicy: {
        maxRetries: 1,
        backoffStrategy: 'fixed',
        baseDelayMs: 50,
        maxDelayMs: 50
      },
      priorityLevels: [TaskPriority.NORMAL, TaskPriority.HIGH],
      deadLetterQueue: true
    },
    [AgentType.SENTIMENT_ANALYSIS]: {
      name: 'test_sentiment_analysis_queue',
      maxSize: 5,
      processTimeout: 5000,
      retryPolicy: {
        maxRetries: 1,
        backoffStrategy: 'fixed',
        baseDelayMs: 50,
        maxDelayMs: 50
      },
      priorityLevels: [TaskPriority.NORMAL, TaskPriority.HIGH],
      deadLetterQueue: true
    },
    [AgentType.MODERATION]: {
      name: 'test_moderation_queue',
      maxSize: 8,
      processTimeout: 6000,
      retryPolicy: {
        maxRetries: 1,
        backoffStrategy: 'fixed',
        baseDelayMs: 50,
        maxDelayMs: 50
      },
      priorityLevels: [TaskPriority.HIGH, TaskPriority.URGENT],
      deadLetterQueue: true
    }
  },
  monitoring: {
    metricsInterval: 5000, // 5 seconds for tests
    alertThresholds: {
      queueSize: 5,
      errorRate: 0.5, // More lenient for tests
      responseTime: 2000
    }
  },
  performance: {
    maxResponseTimeMs: 2000, // More lenient for tests
    maxConcurrentTasks: 5,
    enableCircuitBreaker: false // Disabled for tests
  }
};

/**
 * Get configuration based on environment
 */
export function getOrchestratorConfig(): OrchestratorConfig {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return productionConfig;
    case 'test':
      return testConfig;
    case 'development':
    default:
      return developmentConfig;
  }
}