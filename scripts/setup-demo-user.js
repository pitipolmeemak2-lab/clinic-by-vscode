#!/usr/bin/env node

/**
 * Create Demo User for Testing
 * This script creates a test user in Supabase Auth
 * Run: node scripts/setup-demo-user.js
 */

const https = require('https');

const SUPABASE_URL = 'https://ctdhjcxtyqulxpiimrrc.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0ZGhqY3h0eXF1bHhwaWltcnJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MDExMDYsImV4cCI6MjA5NDE3NzEwNn0.isMnDixkmM7ZO4DpwgTLwe18UF47uDZRFO7XPNqu9ss';

function makeRequest(method, path, payload) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'ctdhjcxtyqulxpiimrrc.supabase.co',
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: data,
        });
      });
    });

    req.on('error', reject);
    if (payload) {
      req.write(JSON.stringify(payload));
    }
    req.end();
  });
}

async function setupDemo() {
  console.log('🔐 Setting up demo user for auth testing...\n');

  try {
    // 1. Create user
    console.log('1️⃣  Creating user account...');
    const signupRes = await makeRequest('POST', '/auth/v1/signup', {
      email: 'demo@clinic.com',
      password: 'Demo@12345',
    });

    if (signupRes.status === 200 || signupRes.status === 201) {
      const userData = JSON.parse(signupRes.body);
      const userId = userData.id;
      console.log(`✅ User created: demo@clinic.com`);
      console.log(`   User ID: ${userId}\n`);

      // 2. Auto-confirm email by creating profile
      console.log('2️⃣  Creating user profile...');
      const profileRes = await makeRequest('POST', '/rest/v1/profiles', {
        id: userId,
        user_id: userId,
        email: 'demo@clinic.com',
        role: 'doctor',
        first_name: 'Demo',
        last_name: 'Doctor',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (profileRes.status === 201) {
        console.log(`✅ Profile created successfully\n`);
      } else {
        console.log(`⚠️  Profile creation response: ${profileRes.status}`);
        console.log(profileRes.body);
      }

      console.log('✅ Demo user setup complete!\n');
      console.log('📧 Email: demo@clinic.com');
      console.log('🔑 Password: Demo@12345');
      console.log('\n👉 Next steps:');
      console.log('1. Open http://localhost:3000/login');
      console.log('2. Enter credentials above');
      console.log('3. Test the auth flow\n');
    } else {
      console.error('❌ Error creating user:');
      console.error(signupRes.body);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Hint: Make sure Supabase is configured in .env.local');
  }
}

setupDemo();
