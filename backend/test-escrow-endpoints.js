/**
 * Test script to verify escrow endpoints
 */

import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000/api';

async function testEscrowEndpoints() {
  console.log('🧪 Testing Escrow Endpoints...\n');

  const testProjectId = '68ea1a149d77aff2adf1f638';
  
  // Test data
  const testData = {
    project_id: testProjectId
  };

  try {
    // Test 1: Check if server is running
    console.log('1️⃣ Testing server connectivity...');
    const healthResponse = await fetch('http://localhost:5000/api/health');
    if (healthResponse.ok) {
      console.log('✅ Server is running');
    } else {
      console.log('❌ Server health check failed');
    }

    // Test 2: Test escrow/status endpoint
    console.log('\n2️⃣ Testing escrow/status endpoint...');
    const statusResponse = await fetch(`${API_BASE_URL}/escrow/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'id': 'test-user-id',
        'user_role': 'client'
      },
      body: JSON.stringify(testData)
    });

    console.log('Status Response:', statusResponse.status);
    console.log('Status Headers:', Object.fromEntries(statusResponse.headers.entries()));
    
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('✅ Escrow status endpoint working:', statusData);
    } else {
      const errorText = await statusResponse.text();
      console.log('❌ Escrow status endpoint failed:', errorText);
    }

    // Test 3: Test other escrow endpoints
    console.log('\n3️⃣ Testing other escrow endpoints...');
    
    const endpoints = [
      '/escrow/create',
      '/escrow/verify', 
      '/escrow/release-milestone',
      '/escrow/reset'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'id': 'test-user-id',
            'user_role': 'client'
          },
          body: JSON.stringify(testData)
        });
        
        console.log(`${endpoint}: ${response.status} ${response.statusText}`);
      } catch (error) {
        console.log(`${endpoint}: Error - ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testEscrowEndpoints();
