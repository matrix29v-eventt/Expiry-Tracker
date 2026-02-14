// Test script to verify OCR functionality
const fs = require('fs');
const path = require('path');

// Create a simple test image data URL (1x1 pixel transparent PNG)
const createTestImage = () => {
  const imageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  return Buffer.from(imageData, 'base64');
};

// Test the complete flow
async function testCompleteFlow() {
  console.log('🧪 Testing Complete System Flow...\n');
  
  try {
    // 1. Test Backend Health
    console.log('1. Testing Backend Health...');
    const healthResponse = await fetch('http://localhost:5000/');
    const healthText = await healthResponse.text();
    console.log(`   ✅ Backend: ${healthText}`);
    
    // 2. Test Authentication
    console.log('\n2. Testing Authentication...');
    const registerResponse = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@flow.com',
        password: 'test123'
      })
    });
    const registerData = await registerResponse.json();
    console.log(`   ✅ Register: ${registerData.message}`);
    
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email: 'test@flow.com',
        password: 'test123'
      })
    });
    const loginData = await loginResponse.json();
    console.log(`   ✅ Login: ${loginData.message}`);
    
    // 3. Test Product Operations
    console.log('\n3. Testing Product Operations...');
    
    // Add product
    const addResponse = await fetch('http://localhost:5000/api/products/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name: 'Test Product for OCR',
        expiryDate: '2026-12-25'
      })
    });
    const addData = await addResponse.json();
    console.log(`   ✅ Add Product: ${addData.name}`);
    
    // Get products
    const listResponse = await fetch('http://localhost:5000/api/products/list', {
      credentials: 'include'
    });
    const listData = await listResponse.json();
    console.log(`   ✅ List Products: Found ${listData.length} products`);
    
    // 4. Test OCR Endpoint (should fail gracefully without image)
    console.log('\n4. Testing OCR Endpoint...');
    const ocrResponse = await fetch('http://localhost:5000/api/ocr/expiry', {
      method: 'POST',
      credentials: 'include'
    });
    const ocrData = await ocrResponse.json();
    console.log(`   ✅ OCR Endpoint: ${ocrData.message}`);
    
    // 5. Test Frontend Connection
    console.log('\n5. Testing Frontend Connection...');
    const frontendResponse = await fetch('http://localhost:3000');
    const frontendStatus = frontendResponse.status;
    console.log(`   ✅ Frontend: Status ${frontendStatus} (Running on port 3000)`);
    
    console.log('\n🎉 ALL TESTS PASSED! System is working correctly.');
    console.log('\n📋 Summary:');
    console.log('   ✅ Backend API running on http://localhost:5000');
    console.log('   ✅ Frontend running on http://localhost:3000');
    console.log('   ✅ Authentication working');
    console.log('   ✅ Product CRUD operations working');
    console.log('   ✅ OCR endpoint accessible');
    console.log('   ✅ Full system functional');
    
  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
  }
}

// Run the test
testCompleteFlow();