/**
 * Task 76 Verification Script
 * Tests Content Strategy System Integration
 */

const API_BASE = 'http://localhost:5000/api/content-strategy';

console.log('🧪 Task 76: Content Strategy System Verification\n');
console.log('================================================\n');

// Test 1: Keyword Research
async function testKeywordResearch() {
  console.log('1️⃣  Testing Keyword Research...');
  try {
    const response = await fetch(`${API_BASE}/keywords/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seedKeywords: ['bitcoin nigeria', 'crypto trading', 'ethereum africa'],
        region: 'NIGERIA',
        category: 'CRYPTO',
        includeGlobal: true,
      }),
    });
    
    const data = await response.json();
    
    if (data.success && data.count > 0) {
      console.log('   ✅ Keyword Research: PASSED');
      console.log(`   📊 Generated ${data.count} keywords in ${(data.processingTime / 1000).toFixed(1)}s`);
    } else {
      console.log('   ❌ Keyword Research: FAILED');
      console.log('   Error:', data.error);
    }
  } catch (error) {
    console.log('   ❌ Keyword Research: ERROR');
    console.log('   Error:', error.message);
  }
  console.log('');
}

// Test 2: Get Keywords
async function testGetKeywords() {
  console.log('2️⃣  Testing Get Keywords...');
  try {
    const response = await fetch(`${API_BASE}/keywords?region=NIGERIA&limit=10`);
    const data = await response.json();
    
    if (data.success && data.keywords.length > 0) {
      console.log('   ✅ Get Keywords: PASSED');
      console.log(`   📊 Retrieved ${data.keywords.length} keywords`);
      console.log(`   🔍 Sample: ${data.keywords[0].keyword}`);
    } else {
      console.log('   ❌ Get Keywords: FAILED');
      console.log('   Error:', data.error || 'No keywords found');
    }
  } catch (error) {
    console.log('   ❌ Get Keywords: ERROR');
    console.log('   Error:', error.message);
  }
  console.log('');
}

// Test 3: Content Calendar Generation
async function testCalendarGeneration() {
  console.log('3️⃣  Testing Content Calendar Generation...');
  try {
    const response = await fetch(`${API_BASE}/calendar/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        duration: 30, // 30 days for testing
        region: 'GLOBAL',
        category: 'CRYPTO',
        articlesPerWeek: 3,
      }),
    });
    
    const data = await response.json();
    
    if (data.success && data.count > 0) {
      console.log('   ✅ Calendar Generation: PASSED');
      console.log(`   📊 Generated ${data.count} calendar items in ${(data.processingTime / 1000).toFixed(1)}s`);
    } else {
      console.log('   ❌ Calendar Generation: FAILED');
      console.log('   Error:', data.error);
    }
  } catch (error) {
    console.log('   ❌ Calendar Generation: ERROR');
    console.log('   Error:', error.message);
  }
  console.log('');
}

// Test 4: Topic Cluster Creation
async function testTopicCluster() {
  console.log('4️⃣  Testing Topic Cluster Creation...');
  try {
    const response = await fetch(`${API_BASE}/clusters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pillarTopic: 'Bitcoin Trading Strategies',
        region: 'GLOBAL',
        category: 'CRYPTO',
        keywords: ['bitcoin trading', 'btc strategy', 'crypto investment'],
      }),
    });
    
    const data = await response.json();
    
    if (data.success && data.cluster) {
      console.log('   ✅ Topic Cluster: PASSED');
      console.log(`   📊 Created cluster: ${data.cluster.name}`);
    } else {
      console.log('   ❌ Topic Cluster: FAILED');
      console.log('   Error:', data.error);
    }
  } catch (error) {
    console.log('   ❌ Topic Cluster: ERROR');
    console.log('   Error:', error.message);
  }
  console.log('');
}

// Test 5: Competitor Analysis
async function testCompetitorAnalysis() {
  console.log('5️⃣  Testing Competitor Analysis...');
  try {
    const response = await fetch(`${API_BASE}/competitors/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain: 'cointelegraph.com',
        region: 'GLOBAL',
        category: 'NEWS',
      }),
    });
    
    const data = await response.json();
    
    if (data.success && data.competitor) {
      console.log('   ✅ Competitor Analysis: PASSED');
      console.log(`   📊 Analyzed: ${data.competitor.competitorName}`);
      console.log(`   ⏱️  Processing time: ${(data.processingTime / 1000).toFixed(1)}s`);
    } else {
      console.log('   ❌ Competitor Analysis: FAILED');
      console.log('   Error:', data.error);
    }
  } catch (error) {
    console.log('   ❌ Competitor Analysis: ERROR');
    console.log('   Error:', error.message);
  }
  console.log('');
}

// Test 6: Trend Monitoring
async function testTrendMonitoring() {
  console.log('6️⃣  Testing Trend Monitoring...');
  try {
    const response = await fetch(`${API_BASE}/trends/monitor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        region: 'GLOBAL',
        category: 'CRYPTO',
        sources: ['AI_DETECTION'],
      }),
    });
    
    const data = await response.json();
    
    if (data.success && data.count > 0) {
      console.log('   ✅ Trend Monitoring: PASSED');
      console.log(`   📊 Detected ${data.count} trends in ${(data.processingTime / 1000).toFixed(1)}s`);
    } else {
      console.log('   ❌ Trend Monitoring: FAILED');
      console.log('   Error:', data.error);
    }
  } catch (error) {
    console.log('   ❌ Trend Monitoring: ERROR');
    console.log('   Error:', error.message);
  }
  console.log('');
}

// Test 7: Statistics
async function testStatistics() {
  console.log('7️⃣  Testing Strategy Statistics...');
  try {
    const response = await fetch(`${API_BASE}/statistics`);
    const data = await response.json();
    
    if (data.success) {
      console.log('   ✅ Statistics: PASSED');
      console.log(`   📊 Keywords: ${data.keywords.active}`);
      console.log(`   📊 Clusters: ${data.topicClusters.active}`);
      console.log(`   📊 Calendar: ${data.contentCalendar.planned} planned`);
      console.log(`   📊 Competitors: ${data.competitors.tracked}`);
      console.log(`   📊 Trends: ${data.trends.active}`);
    } else {
      console.log('   ❌ Statistics: FAILED');
      console.log('   Error:', data.error);
    }
  } catch (error) {
    console.log('   ❌ Statistics: ERROR');
    console.log('   Error:', error.message);
  }
  console.log('');
}

// Run all tests
async function runTests() {
  console.log('⚠️  Note: Make sure backend server is running on http://localhost:5000\n');
  console.log('Starting tests...\n');
  
  await testKeywordResearch();
  await testGetKeywords();
  await testCalendarGeneration();
  await testTopicCluster();
  await testCompetitorAnalysis();
  await testTrendMonitoring();
  await testStatistics();
  
  console.log('================================================\n');
  console.log('✅ Task 76 Verification Complete!\n');
  console.log('📝 Check the results above for any failures.\n');
  console.log('🚀 If all tests passed, Task 76 is production ready!\n');
}

// Execute tests
runTests().catch(console.error);
