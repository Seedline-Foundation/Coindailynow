/**
 * Artillery Load Test Processor
 * Custom functions for Artillery load testing scenarios
 */

module.exports = {
  // Generate random string for test data
  randomString,
  
  // Generate random article ID
  randomArticleId,
  
  // Generate random user credentials
  generateUserData,
  
  // Set authentication token
  setAuthToken,
  
  // Custom response validator
  validateResponse,
  
  // Performance metrics collector
  collectMetrics,
};

/**
 * Generate a random string
 */
function randomString(context, events, done) {
  const length = 10;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  context.vars.randomString = result;
  return done();
}

/**
 * Generate a random article ID
 */
function randomArticleId(context, events, done) {
  const articleIds = [
    'article-1',
    'article-2',
    'article-3',
    'article-4',
    'article-5',
  ];
  
  context.vars.articleId = articleIds[Math.floor(Math.random() * articleIds.length)];
  return done();
}

/**
 * Generate random user data
 */
function generateUserData(context, events, done) {
  const users = [
    { userId: 'user1', authToken: 'token1' },
    { userId: 'user2', authToken: 'token2' },
    { userId: 'user3', authToken: 'token3' },
    { userId: 'admin1', authToken: 'admin_token1' },
  ];
  
  const user = users[Math.floor(Math.random() * users.length)];
  context.vars.userId = user.userId;
  context.vars.authToken = user.authToken;
  
  return done();
}

/**
 * Set authentication token from response
 */
function setAuthToken(requestParams, response, context, ee, next) {
  if (response.body && response.body.token) {
    context.vars.authToken = response.body.token;
  }
  return next();
}

/**
 * Validate response contains expected data
 */
function validateResponse(requestParams, response, context, ee, next) {
  if (!response.body) {
    ee.emit('error', 'Empty response body');
    return next(new Error('Empty response body'));
  }
  
  // Check for error responses
  if (response.statusCode >= 400) {
    ee.emit('error', `HTTP ${response.statusCode}: ${response.body.error || 'Unknown error'}`);
  }
  
  return next();
}

/**
 * Collect custom performance metrics
 */
function collectMetrics(requestParams, response, context, ee, next) {
  const responseTime = response.timings.phases.total || 0;
  
  // Emit custom metrics
  ee.emit('customStat', {
    stat: 'response_time_ms',
    value: responseTime,
  });
  
  if (response.headers['x-cache'] === 'HIT') {
    ee.emit('customStat', {
      stat: 'cache_hit',
      value: 1,
    });
  } else {
    ee.emit('customStat', {
      stat: 'cache_miss',
      value: 1,
    });
  }
  
  return next();
}
