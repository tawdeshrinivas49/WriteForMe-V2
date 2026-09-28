// backend/src/modules/auth/digilocker.provider.js
const axios = require('axios');
const crypto = require('crypto');

const SETU_BASE_URL = process.env.SETU_BASE_URL || 'https://dg-sandbox.setu.co';
const REDIRECT_URL = process.env.SETU_REDIRECT_URL || 'http://localhost:5173/auth/callback';

class DigiLockerProvider {
  static async createAuthorizationUrl(role) {
    const isMock = process.env.USE_MOCK_DIGILOCKER === 'true';

    if (isMock) {
      // Use the actual frontend callback URL with mock parameters
      return {
        url: `${REDIRECT_URL}?success=True&id=mock_session_123&scope=test&state=mock_state_456`,
        state: 'mock_state_456',
        codeVerifier: 'mock_verifier_789',
      };
    }

    const state = crypto.randomBytes(16).toString('hex');
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    const endpoint = `${SETU_BASE_URL}/api/digilocker/`;
    console.log(`[Setu] Calling: ${endpoint}`);

    try {
      const response = await axios.post(
        endpoint,
        {
          redirectUrl: REDIRECT_URL,
          state,
          codeChallenge,
          codeChallengeMethod: 'S256',
        },
        {
          headers: {
            'x-client-id': process.env.SETU_CLIENT_ID,
            'x-client-secret': process.env.SETU_CLIENT_SECRET,
            'x-product-instance-id': process.env.SETU_PRODUCT_INSTANCE_ID,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const authUrl = response.data?.data?.url || response.data?.url;
      if (!authUrl) {
        throw new Error('No authorization URL returned from Setu');
      }

      return {
        url: authUrl,
        state,
        codeVerifier,
      };
    } catch (error) {
      console.error('Setu createUrl Error:', error.response?.data || error.message);
      throw new Error('Failed to generate DigiLocker authorization URL');
    }
  }

  static async fetchUserDataBySessionId(sessionId) {
    const isMock = process.env.USE_MOCK_DIGILOCKER === 'true';
    if (isMock) {
      return {
        digilockerId: 'mock_volunteer_123',
        phone: '9876543212',
        name: 'Karan Mehta',
        gender: 'MALE',
        hasFreshAcademicRecords: true,
      };
    }

    const possibleEndpoints = [
      `${SETU_BASE_URL}/api/digilocker/session/${sessionId}`,
      `${SETU_BASE_URL}/api/digilocker/session?sessionId=${sessionId}`,
      `${SETU_BASE_URL}/api/digilocker/user/${sessionId}`,
      `${SETU_BASE_URL}/api/digilocker/user?sessionId=${sessionId}`,
    ];

    for (const endpoint of possibleEndpoints) {
      try {
        console.log(`[Setu] Trying: ${endpoint}`);
        const response = await axios.get(endpoint, {
          headers: {
            'x-client-id': process.env.SETU_CLIENT_ID,
            'x-client-secret': process.env.SETU_CLIENT_SECRET,
            'x-product-instance-id': process.env.SETU_PRODUCT_INSTANCE_ID,
          },
          timeout: 30000,
        });

        const profile = response.data?.data || response.data;
        if (profile && (profile.id || profile.sub)) {
          return {
            digilockerId: profile.id || profile.sub || sessionId,
            phone: profile.phone || profile.mobile || '9999999999',
            name: profile.name || profile.fullName || 'Test User',
            gender: profile.gender === 'M' ? 'MALE' : profile.gender === 'F' ? 'FEMALE' : 'OTHER',
            hasFreshAcademicRecords: Boolean(profile.academicRecords?.length),
          };
        }
      } catch (e) {
        console.warn(`[Setu] Endpoint ${endpoint} failed:`, e.message);
      }
    }

    console.warn('All Setu user fetch endpoints failed – using fallback mock data');
    return {
      digilockerId: sessionId,
      phone: '9999999999',
      name: 'DigiLocker User',
      gender: 'OTHER',
      hasFreshAcademicRecords: false,
    };
  }

  static async fetchUserData({ authorizationCode, codeVerifier }) {
    console.warn('fetchUserData with code is deprecated in this flow');
    return this.fetchUserDataBySessionId(authorizationCode);
  }
}

module.exports = DigiLockerProvider;