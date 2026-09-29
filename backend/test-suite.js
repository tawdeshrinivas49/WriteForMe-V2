const axios = require('axios');

const BASE_URL = 'https://writeforme-api.onrender.com/api/v1';

async function runFullSystemTest() {
  console.log('🚀 Starting Automated Bulk API Test...\n');

  try {
    // 1. Health Check
    const health = await axios.get('https://writeforme-api.onrender.com/health');
    console.log('✅ 1. GET /health -> Status:', health.status);

    // 2. Student Login
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'shrinivastawde2@gmail.com',
      password: 'Password'
    });
    
    const token = loginRes.data.token || loginRes.data.data?.token;
    if (!token) {
      throw new Error('Failed to retrieve JWT token from login response');
    }
    console.log('✅ 2. POST /auth/login -> Authenticated');

    const authHeader = { headers: { Authorization: `Bearer ${token}` } };

    // 3. Get Student Profile
    const profile = await axios.get(`${BASE_URL}/users/profile`, authHeader);
    console.log('✅ 3. GET /users/profile -> Profile Loaded');

    // 4. Create Exam Request (matching Prisma schema fields)
    const requestPayload = {
      examName: 'CIVIL SERVICES (PRELIMINARY) EXAMINATION, 2025',
      advtNumber: 'ADVT-2025-001',
      examDate: '2025-05-25T09:00:00.000Z',
      durationMinutes: 120,
      examCenterName: 'Delhi Public School, RK Puram',
      examCenterLat: 28.5619,
      examCenterLng: 77.1708,
      latitude: 28.5619,          // Fallback alias for controllers
      longitude: 77.1708,         // Fallback alias for controllers
      genderPref: 'ANY',
      preferredGender: 'ANY'      // Fallback alias for controllers
    };

    const requestRes = await axios.post(`${BASE_URL}/requests`, requestPayload, authHeader);
    
    // Safely extract request object from different wrapper formats
    const createdRequest = requestRes.data.data || requestRes.data.request || requestRes.data;
    const requestId = createdRequest.id;

    if (!requestId) {
      console.error('⚠️ Response received but ID missing:', JSON.stringify(requestRes.data, null, 2));
      throw new Error('Created Request ID is undefined');
    }

    console.log(`✅ 4. POST /requests -> Created Request ID: ${requestId}`);

    // 5. Verify Escrow Payment
    const escrowPayload = {
      requestId: requestId,
      razorpayOrderId: 'order_test_123',
      razorpayPaymentId: 'pay_test_123',
      razorpaySignature: 'mock_signature_for_test',
      pgOrderId: 'order_test_123',
      pgPaymentId: 'pay_test_123'
    };

    const escrowRes = await axios.post(`${BASE_URL}/payments/verify-escrow`, escrowPayload, authHeader);
    console.log('✅ 5. POST /payments/verify-escrow -> Escrow Status Confirmed:', escrowRes.data.message || 'SUCCESS');

    console.log('\n🎉 ALL CORE ENDPOINTS RESPONDING HEALTHILY!');

  } catch (error) {
    console.error('\n❌ Test Failed at endpoint:', error.config?.url || 'Unknown Endpoint');
    if (error.response) {
      console.error('Status Code:', error.response.status);
      console.error('Error Response Body:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error Message:', error.message);
    }
  }
}

runFullSystemTest();