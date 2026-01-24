#!/usr/bin/env node

/**
 * Email Cron Job Script
 * Runs every hour to process and send scheduled emails
 * 
 * Usage:
 *   node email-cron.js
 * 
 * Add to crontab:
 *   0 * * * * cd /var/www/token-landing/MVP/token-landing && node email-cron.js >> logs/email-cron.log 2>&1
 */

const https = require('https');

const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-token-change-in-production';
const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

console.log(`[${new Date().toISOString()}] Starting email cron job...`);

const options = {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${CRON_SECRET}`,
    'Content-Type': 'application/json'
  }
};

const url = `${API_URL}/api/cron/send-emails`;

const makeRequest = (url) => {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : require('http');
    const req = protocol.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          reject(new Error(`Invalid JSON response: ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
};

makeRequest(url)
  .then(result => {
    console.log(`[${new Date().toISOString()}] Cron job completed:`, JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch(error => {
    console.error(`[${new Date().toISOString()}] Cron job failed:`, error.message);
    process.exit(1);
  });
