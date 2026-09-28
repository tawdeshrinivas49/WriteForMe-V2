// backend/src/modules/auth/auth.service.js
const prisma = require('../../config/database');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_writeforme_key';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

function hashDigiLockerId(digilockerId) {
  const salt = process.env.DIGILOCKER_SALT || 'writeforme_salt_key';
  return crypto.createHash('sha256').update(digilockerId + salt).digest('hex');
}

// -------------------- DigiLocker --------------------
exports.processDigiLockerLogin = async (digiLockerPayload, role, extraProfileData = {}) => {
  let normalizedRole = role.toUpperCase();
  if (normalizedRole === 'CANDIDATE') normalizedRole = 'STUDENT';
  if (!['STUDENT', 'VOLUNTEER'].includes(normalizedRole)) normalizedRole = 'STUDENT';

  const { digilockerId, phone, name, gender, hasFreshAcademicRecords } = digiLockerPayload;
  const digilockerIdHash = hashDigiLockerId(digilockerId);

  let user = await prisma.user.findFirst({
    where: { OR: [{ digilockerIdHash }, { phone }] },
    include: { candidateProfile: true, volunteerProfile: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        phone,
        name,
        gender: gender || 'OTHER',
        role: normalizedRole,
        digilockerIdHash,
      },
      include: { candidateProfile: true, volunteerProfile: true },
    });

    if (normalizedRole === 'STUDENT') {
      await prisma.candidateProfile.create({
        data: {
          userId: user.id,
          udidNumber: extraProfileData.udidNumber || null,
          udidVerified: extraProfileData.udidNumber ? 'VERIFIED_DIGILOCKER' : 'UNVERIFIED',
          disabilityType: extraProfileData.disabilityType || 'VISUAL_IMPAIRMENT',
          homeLat: extraProfileData.homeLat ? parseFloat(extraProfileData.homeLat) : 0.0,
          homeLng: extraProfileData.homeLng ? parseFloat(extraProfileData.homeLng) : 0.0,
        },
      });
    } else if (normalizedRole === 'VOLUNTEER') {
      await prisma.volunteerProfile.create({
        data: {
          userId: user.id,
          eduVerified: hasFreshAcademicRecords ? 'VERIFIED_DIGILOCKER' : 'PENDING_MANUAL_AUDIT',
          highestEducation: extraProfileData.highestEducation || 'BACHELORS',
          stream: extraProfileData.stream || null,
          hasVehicle: extraProfileData.hasVehicle || false,
          vehicleType: extraProfileData.vehicleType || 'NONE',
          lastLat: extraProfileData.lastLat ? parseFloat(extraProfileData.lastLat) : 0.0,
          lastLng: extraProfileData.lastLng ? parseFloat(extraProfileData.lastLng) : 0.0,
        },
      });
    }
  } else if (!user.digilockerIdHash) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { digilockerIdHash },
      include: { candidateProfile: true, volunteerProfile: true },
    });
  }

  // ✅ Fetch fresh user with profiles to include IDs
  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { candidateProfile: true, volunteerProfile: true },
  });

  const token = jwt.sign(
    {
      userId: fullUser.id,
      role: fullUser.role,
      candidateProfileId: fullUser.candidateProfile?.id || null,
      volunteerProfileId: fullUser.volunteerProfile?.id || null,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { user: fullUser, token };
};

// -------------------- Signup (email/password) --------------------
exports.signupUser = async (userData) => {
  const { name, email, password, phone, role, gender, address, disabilityType, education, preferredLanguage } = userData;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { phone }] },
  });
  if (existing) throw new Error('A user with this email or phone already exists.');

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      phone,
      role: role || 'STUDENT',
      gender: gender || 'OTHER',
      address,
      preferredLanguage,
    },
  });

  // For STUDENT/VOLUNTEER, require DigiLocker (return redirect)
  if (role === 'STUDENT' || role === 'VOLUNTEER') {
    const digiLockerProvider = require('./digilocker.provider');
    const { url } = await digiLockerProvider.createAuthorizationUrl(role);
    return { redirectUrl: url };
  }

  // For CONTRIBUTOR, auto‑login
  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { candidateProfile: true, volunteerProfile: true },
  });

  const token = jwt.sign(
    {
      userId: fullUser.id,
      role: fullUser.role,
      candidateProfileId: fullUser.candidateProfile?.id || null,
      volunteerProfileId: fullUser.volunteerProfile?.id || null,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { user: fullUser, token };
};

// -------------------- Login (email/password) --------------------
exports.loginUser = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Invalid email or password');
  if (!user.password) throw new Error('This account uses DigiLocker. Please login with DigiLocker.');

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) throw new Error('Invalid email or password');

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { candidateProfile: true, volunteerProfile: true },
  });

  const token = jwt.sign(
    {
      userId: fullUser.id,
      role: fullUser.role,
      candidateProfileId: fullUser.candidateProfile?.id || null,
      volunteerProfileId: fullUser.volunteerProfile?.id || null,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { user: fullUser, token };
};

// -------------------- Google Login --------------------
exports.googleLogin = async (credential) => {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, sub: googleId, picture } = payload;

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          phone: null,
          role: 'STUDENT',
          gender: 'OTHER',
          googleId,
          profileImageUrl: picture,
        },
      });
    } else {
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId, profileImageUrl: picture },
        });
      }
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { candidateProfile: true, volunteerProfile: true },
    });

    const token = jwt.sign(
      {
        userId: fullUser.id,
        role: fullUser.role,
        candidateProfileId: fullUser.candidateProfile?.id || null,
        volunteerProfileId: fullUser.volunteerProfile?.id || null,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { user: fullUser, token };
  } catch (error) {
    console.error('Google verification error:', error);
    throw new Error('Invalid Google credential');
  }
};