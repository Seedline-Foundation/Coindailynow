// Quick agent test script - submits tasks and checks results
const API = 'http://localhost:4000/api/ai/registry';
const AUTH = 'Bearer mock_super_admin_token_dev';

async function apiCall(method, path, body) {
  const opts = {
    method,
    headers: { 'Authorization': AUTH, 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}${path}`, opts);
  return res.json();
}

async function main() {
  // Detect if Ollama has models (real mode) or not (mock mode)
  let mode = 'MOCK';
  try {
    const tags = await fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(3000) }).then(r => r.json());
    if (tags.models?.length > 0) {
      mode = 'LIVE';
      console.log(`\n  Ollama models detected: ${tags.models.map(m => m.name).join(', ')}`);
    }
  } catch {}

  console.log('\n========================================');
  console.log(`  CoinDaily AI Agent Test Suite [${mode}]`);
  console.log(mode === 'LIVE' ? '  Using REAL models via Ollama' : '  Mock mode (no Ollama required)');
  console.log('========================================\n');

  // Step 1: Stats
  console.log('--- Step 1: Registry Stats ---');
  const stats = await apiCall('GET', '/stats');
  console.log(`  Agents: ${stats.data?.totalAgents}, Active: ${stats.data?.activeAgents}, Health: ${stats.data?.overallHealth}`);

  // Step 2: Health check
  console.log('\n--- Step 2: Health Check ---');
  const health = await apiCall('GET', '/health');
  const agentHealthMap = health.data?.agents || {};
  const agentHealthList = Object.entries(agentHealthMap);
  if (agentHealthList.length > 0) {
    const healthy = agentHealthList.filter(([,a]) => a.status === 'healthy' || a.status === 'degraded').length;
    console.log(`  Overall: ${health.data?.overallHealth} | Healthy/Degraded: ${healthy}/${agentHealthList.length}`);
    agentHealthList.forEach(([id, a]) => {
      const icon = a.status === 'healthy' ? '✓' : a.status === 'degraded' ? '~' : '✗';
      const issues = a.issues?.join(', ') || 'no issues';
      console.log(`    ${icon} ${id} - ${a.status} (score: ${a.score?.toFixed(2)}) ${issues}`);
    });
  } else {
    console.log(`  Overall health: ${health.data?.overallHealth || 'unknown'}`);
    console.log('  No per-agent health details returned');
  }

  // Step 3: Submit test tasks to 8 agents (one per category)
  console.log('\n--- Step 3: Submit Test Tasks ---');
  const tests = [
    {
      agent: 'sentiment-analysis-agent',
      label: 'Sentiment Analysis (DeepSeek)',
      body: { input: { analysisType: 'news_sentiment', data: [{ title: 'Bitcoin surges past 100K as African adoption grows', source: 'CoinDesk' }] }, priority: 'high' }
    },
    {
      agent: 'data-scrape-agent',
      label: 'Data Scraping (Llama)',
      body: { input: { taskType: 'extract_data', data: { sources: ['binance_africa', 'luno'], dataType: 'market_overview' } }, priority: 'normal' }
    },
    {
      agent: 'news-aggregation-agent',
      label: 'News Aggregation (Llama)',
      body: { input: { taskType: 'aggregate', data: { topics: ['bitcoin', 'african_crypto'], sources: ['coindesk'], maxArticles: 5 } }, priority: 'normal' }
    },
    {
      agent: 'news-curator-agent',
      label: 'News Curator (Llama)',
      body: { input: { taskType: 'curate', data: { articles: [{ title: 'Luno sees record volume in Nigeria', content: 'Luno exchange reported record numbers...' }], audience: 'african_crypto_enthusiasts' } }, priority: 'normal' }
    },
    {
      agent: 'code-review-agent',
      label: 'Code Review (DeepSeek)',
      body: { input: { taskType: 'review', data: { code: 'async function getPrice(token) { return fetch(`/api/${token}`).then(r => r.json()); }', language: 'typescript' } }, priority: 'normal' }
    },
    {
      agent: 'support-agent',
      label: 'Customer Support (Llama)',
      body: { input: { taskType: 'respond', data: { query: 'How do I buy Bitcoin using M-Pesa on CoinDaily?', userRegion: 'kenya' } }, priority: 'high' }
    },
    {
      agent: 'trade-bot-agent',
      label: 'Trade Bot (DeepSeek)',
      body: { input: { taskType: 'analyze_trade', data: { pair: 'BTC/USDT', currentPrice: 98500, indicators: { rsi: 65 } } }, priority: 'high' }
    },
    {
      agent: 'compliance-agent',
      label: 'Compliance (DeepSeek)',
      body: { input: { taskType: 'check_compliance', data: { content: 'New token: moonAfrica with 1000% guaranteed returns!', contentType: 'article', region: 'nigeria' } }, priority: 'urgent' }
    }
  ];

  const taskIds = [];

  if (mode === 'LIVE') {
    // LIVE mode: submit one at a time, wait for each to complete
    console.log('  (Running sequentially — CPU inference takes 10-60s per task)\n');
    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      const result = await apiCall('POST', `/agents/${test.agent}/tasks`, test.body);
      if (result.success && result.data) {
        const taskId = result.data.id || result.data.taskId || 'unknown';
        process.stdout.write(`  [${i+1}/${tests.length}] ${test.label}: `);
        taskIds.push(taskId);

        // Wait for this task to finish (up to 5 min)
        const start = Date.now();
        const maxMs = 300000;
        let done = false;
        while (Date.now() - start < maxMs) {
          await new Promise(r => setTimeout(r, 3000));
          const running = await apiCall('GET', '/tasks/running');
          const stillRunning = (running.data || []).some(t => (t.task?.id || t.id) === taskId);
          if (!stillRunning) { done = true; break; }
          process.stdout.write('.');
        }
        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        console.log(done ? ` ✓ (${elapsed}s)` : ` ✗ TIMEOUT (${elapsed}s)`);
      } else {
        console.log(`  [${i+1}/${tests.length}] ✗ ${test.label}: ${JSON.stringify(result.error || result.message)}`);
      }
    }
  } else {
    // MOCK mode: submit all at once
    for (const test of tests) {
      const result = await apiCall('POST', `/agents/${test.agent}/tasks`, test.body);
      if (result.success && result.data) {
        const taskId = result.data.id || result.data.taskId || 'unknown';
        console.log(`  ✓ ${test.label}: Task ${taskId.substring(0, 40)}... [${result.data.status}]`);
        taskIds.push(taskId);
      } else {
        console.log(`  ✗ ${test.label}: ${JSON.stringify(result.error || result.message || 'Unknown error')}`);
      }
    }
  }

  // Step 4: Wait for processing (mock mode only; live mode already waited)
  if (mode !== 'LIVE') {
    console.log('\n--- Step 4: Waiting for tasks to complete ---');
    let waited = 0;
    const maxWait = 30;
    while (waited < maxWait) {
      await new Promise(r => setTimeout(r, 2000));
      waited += 2;
      const running = await apiCall('GET', '/tasks/running');
      const runCount = running.data?.length || 0;
      process.stdout.write(`  ${waited}s: ${runCount} running...`);
      if (runCount === 0 && waited > 4) {
        console.log(' All done!');
        break;
      }
      console.log('');
    }
  } else {
    console.log('\n--- Step 4: All tasks processed ---');
  }

  // Step 5: Show results
  console.log('\n--- Step 5: Completed Tasks ---');
  const completed = await apiCall('GET', '/tasks/completed');
  const completedTasks = completed.data?.tasks || [];
  if (completedTasks.length > 0) {
    let successCount = 0;
    let failCount = 0;
    for (const entry of completedTasks) {
      // Each entry has { agentId, agentName, task: { id, status, output, ... } }
      const task = entry.task || entry;
      const agentId = entry.agentId || task.agentId;
      const icon = task.status === 'completed' ? '✓' : '✗';
      if (task.status === 'completed') successCount++; else failCount++;
      console.log(`\n  ${icon} Agent: ${agentId}`);
      console.log(`    Status: ${task.status} | Time: ${task.processingTimeMs || 'N/A'}ms`);
      if (task.output) {
        const mock = task.output._mock ? ' [MOCK]' : '';
        const summary = task.output.summary || JSON.stringify(task.output).substring(0, 200);
        console.log(`    Output${mock}: ${summary}`);
      }
      if (task.error) {
        console.log(`    Error: ${task.error}`);
      }
    }
    console.log(`\n  Results: ${successCount} succeeded, ${failCount} failed out of ${completedTasks.length} tasks`);
  } else {
    console.log('  No completed tasks yet');
  }

  // Step 6: Final stats
  console.log('\n--- Step 6: Final Stats ---');
  const finalStats = await apiCall('GET', '/stats');
  if (finalStats.data) {
    console.log(`  Tasks Processed: ${finalStats.data.totalTasksProcessed}`);
    console.log(`  In Queue: ${finalStats.data.totalTasksInQueue}`);
    console.log(`  Health: ${finalStats.data.overallHealth}`);
  }

  console.log('\n========================================');
  console.log('  Test Complete!');
  console.log('  Dashboard: http://localhost:3001/super-admin/ai');
  console.log('========================================\n');
}

main().catch(console.error);
