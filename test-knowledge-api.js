#!/usr/bin/env node
/**
 * Task 73: Knowledge API Test Script
 * Quick verification that all endpoints are accessible
 */

const API_BASE = 'http://localhost:3001';

async function testEndpoint(method, path, description, requiresAuth = false) {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (requiresAuth) {
      headers['X-API-Key'] = 'test_key'; // This will fail but confirms auth is required
    }

    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
    });

    const status = response.status;
    const statusText = response.statusText;

    console.log(`${status === 200 || status === 401 ? '✓' : '✗'} ${method} ${path}`);
    console.log(`  Description: ${description}`);
    console.log(`  Status: ${status} ${statusText}`);
    console.log('');

    return response;
  } catch (error) {
    console.log(`✗ ${method} ${path}`);
    console.log(`  Error: ${error.message}`);
    console.log('');
    return null;
  }
}

async function runTests() {
  console.log('================================================');
  console.log('Task 73: Knowledge API Endpoint Tests');
  console.log('================================================');
  console.log('');
  console.log('Note: Server must be running on http://localhost:3001');
  console.log('');

  // Public endpoints (should return 200)
  console.log('PUBLIC ENDPOINTS (No Authentication)');
  console.log('-------------------------------------');
  await testEndpoint('GET', '/api/knowledge-api/manifest', 'AI Manifest for LLM discovery');
  await testEndpoint('GET', '/api/knowledge-api/feeds/rss/test-feed', 'RAG-friendly RSS feed');
  await testEndpoint('GET', '/api/knowledge-api/feeds/json/test-feed', 'RAG-friendly JSON feed');
  
  // Authenticated endpoints (should return 401 without valid key)
  console.log('AUTHENTICATED ENDPOINTS (API Key Required)');
  console.log('------------------------------------------');
  await testEndpoint('GET', '/api/knowledge-api/search?query=bitcoin', 'Search knowledge base', true);
  await testEndpoint('GET', '/api/knowledge-api/test-article-id', 'Get article knowledge', true);
  await testEndpoint('GET', '/api/knowledge-api/crypto-data/latest', 'Latest crypto data', true);

  // Admin endpoints (should return 401 without auth)
  console.log('ADMIN ENDPOINTS (Super Admin Access)');
  console.log('------------------------------------');
  await testEndpoint('GET', '/api/knowledge-api/admin/statistics', 'API statistics');
  await testEndpoint('GET', '/api/knowledge-api/admin/feeds', 'List feeds');

  console.log('================================================');
  console.log('Test Complete');
  console.log('================================================');
  console.log('');
  console.log('Expected Results:');
  console.log('- Public endpoints: 200 OK or 404 (feed not found)');
  console.log('- Authenticated endpoints: 401 Unauthorized');
  console.log('- Admin endpoints: 401 or 200 (if admin auth added)');
  console.log('');
  console.log('If server is not running, start it with:');
  console.log('  cd backend && npm run dev');
}

runTests().catch(console.error);
