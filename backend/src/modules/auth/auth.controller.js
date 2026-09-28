// backend/src/modules/auth/auth.controller.js
const authService = require('./auth.service');
const DigiLockerProvider = require('./digilocker.provider');
const prisma = require('../../config/database');

exports.initiateDigiLocker = async (req, res) => {
  try {
    let role = (req.query.role || 'CANDIDATE').toUpperCase();
    let prismaRole;
    if (role === 'CANDIDATE' || role === 'STUDENT') {
      prismaRole = 'STUDENT';
    } else if (role === 'VOLUNTEER') {
      prismaRole = 'VOLUNTEER';
    } else {
      prismaRole = 'STUDENT';
    }

    const { url, state, codeVerifier } = await DigiLockerProvider.createAuthorizationUrl(prismaRole);

    // Store the role AND the user's temporary data (if any) in the session
    await prisma.authSession.upsert({
      where: { state },
      update: {
        codeVerifier,
        role: prismaRole,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        metadata: {
          ...(req.body || {}),
          tempUserId: req.user?.id || null, // if user already logged in, we can link later
        },
      },
      create: {
        state,
        codeVerifier,
        role: prismaRole,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        metadata: {
          ...(req.body || {}),
          tempUserId: req.user?.id || null,
        },
      },
    });

    res.status(200).json({ url, state });
  } catch (error) {
    console.error('Initiate Error:', error.message);
    res.status(500).json({ error: error.message || 'Could not initiate DigiLocker verification' });
  }
};

exports.digilockerCallback = async (req, res) => {
  try {
    const { success, id, state } = req.query;

    if (success !== 'True' || !id) {
      return res.status(400).json({ error: 'Invalid callback: missing success or id' });
    }

    // 1. Retrieve session using state
    const session = await prisma.authSession.findUnique({
      where: { state },
    });
    if (!session) {
      return res.status(400).json({ error: 'Invalid or expired session' });
    }

    const role = session.role; // The correct role from signup

    // 2. Fetch user data from Setu
    const digiLockerData = await DigiLockerProvider.fetchUserDataBySessionId(id);

    // 3. Process login (creates/updates user)
    const { user, token } = await authService.processDigiLockerLogin(
      digiLockerData,
      role,
      session.metadata || {} // extra profile data from signup
    );

    // 4. Delete the session (optional)
    await prisma.authSession.delete({ where: { state } });

    res.status(200).json({
      message: 'Authentication successful',
      token,
      user,
    });
  } catch (error) {
    console.error('Callback Error:', error.message);
    res.status(500).json({ error: error.message || 'Authentication failed' });
  }
};

// ---------- Email/Password Signup ----------
exports.signup = async (req, res) => {
  try {
    const userData = req.body;
    const result = await authService.signupUser(userData);
    if (result.redirectUrl) {
      return res.status(201).json({ redirectUrl: result.redirectUrl });
    }
    res.status(201).json({
      message: 'Account created successfully',
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    console.error('Signup Error:', error.message);
    res.status(400).json({ error: error.message });
  }
};

// ---------- Email/Password Login ----------
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const result = await authService.loginUser(email, password);
    res.status(200).json({
      message: 'Login successful',
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(401).json({ error: error.message });
  }
};

// ---------- Google Login ----------
exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Google credential is required' });
    }
    const result = await authService.googleLogin(credential);
    res.status(200).json({
      message: 'Google login successful',
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    console.error('Google Login Error:', error.message);
    res.status(401).json({ error: error.message });
  }
};