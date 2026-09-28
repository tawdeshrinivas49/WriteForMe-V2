const userService = require("./user.service");
const prisma = require("../../config/database");
const path = require("path");
const fs = require("fs");

// --------------------------------------------------------------------
//  PROFILE & PROFILE UPDATES
// --------------------------------------------------------------------

// GET /api/v1/users/profile
exports.getProfile = async (req, res) => {
  try {
    const profile = await userService.getUserProfile(req.user.id);
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// PUT /api/v1/users/profile-image
exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No image file provided." });
    }

    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, "../../../uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Save file to disk
    const ext = path.extname(req.file.originalname) || ".jpg";
    const filename = `profile_${req.user.id}_${Date.now()}${ext}`;
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, req.file.buffer);

    // Build URL
    const imageUrl = `/uploads/${filename}`;

    // Update user record
    await prisma.user.update({
      where: { id: req.user.id },
      data: { profileImageUrl: imageUrl },
    });

    res.status(200).json({ success: true, data: { profileImageUrl: imageUrl } });
  } catch (error) {
    console.error("Profile image upload error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /api/v1/users/candidate-profile
exports.updateCandidateProfile = async (req, res) => {
  try {
    const { udidNumber, disabilityType, homeLat, homeLng } = req.body;
    const result = await userService.updateCandidateProfile(req.user.id, {
      udidNumber,
      disabilityType,
      homeLat,
      homeLng,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// PUT /api/v1/users/volunteer-profile
exports.updateVolunteerProfile = async (req, res) => {
  try {
    const { upiId, hasVehicle, vehicleType, highestEducation, maxExamLevelAllowed, eduDocumentUrl } = req.body;
    const result = await userService.updateVolunteerProfile(req.user.id, {
      upiId,
      hasVehicle,
      vehicleType,
      highestEducation,
      maxExamLevelAllowed,
      eduDocumentUrl,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// PUT /api/v1/users/location
exports.updateVolunteerLocation = async (req, res) => {
  try {
    const { lastLat, lastLng } = req.body;
    const result = await userService.updateVolunteerLocation(req.user.id, lastLat, lastLng);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// PUT /api/v1/users/toggle-availability
exports.toggleVolunteerAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;
    if (typeof isAvailable !== "boolean") {
      return res.status(400).json({ success: false, error: "isAvailable must be boolean" });
    }
    const result = await userService.toggleVolunteerAvailability(req.user.id, isAvailable);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// --------------------------------------------------------------------
//  DASHBOARDS (with payment status)
// --------------------------------------------------------------------

// GET /api/v1/users/dashboard/student
exports.getStudentDashboard = async (req, res, next) => {
  try {
    const data = await userService.getStudentDashboard(req.user.id);
    res.json(data);
  } catch (error) {
    console.error("Student dashboard error:", error);
    next(error);
  }
};

// GET /api/v1/users/dashboard/volunteer
exports.getVolunteerDashboard = async (req, res, next) => {
  try {
    const data = await userService.getVolunteerDashboard(req.user.id);
    res.json(data);
  } catch (error) {
    console.error("Volunteer dashboard error:", error);
    next(error);
  }
};