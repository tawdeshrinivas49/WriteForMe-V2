// backend/src/modules/requests/request.controller.js
const RequestsService = require("./request.service");
const prisma = require("../../config/database");

exports.createRequest = async (req, res) => {
  try {
    const payload = req.body;
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required." });
    }

    // Fetch user with candidate profile
    let user = await prisma.user.findUnique({
      where: { id: userId },
      include: { candidateProfile: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (user.role !== "STUDENT") {
      return res
        .status(403)
        .json({ error: "Only students can create exam requests." });
    }

    // ✅ If no candidate profile exists, create one with defaults
    if (!user.candidateProfile) {
      console.log(`Creating default CandidateProfile for user ${userId}`);
      const candidateProfile = await prisma.candidateProfile.create({
        data: {
          userId: userId,
          udidNumber: null,
          udidVerified: "UNVERIFIED",
          disabilityType: "OTHER",
          homeLat: 0.0,
          homeLng: 0.0,
        },
      });
      user.candidateProfile = candidateProfile;
    }

    const candidateId = user.candidateProfile.id;

    // Validate required fields
    if (!payload.examName || !payload.examDate) {
      return res.status(400).json({
        error: "Missing required fields: examName and examDate are mandatory",
      });
    }

    const newRequest = await RequestsService.createRequest(
      payload,
      candidateId,
    );

    res.status(201).json({
      message: "Exam request successfully created.",
      data: newRequest,
    });
  } catch (error) {
    console.error("Create Request Error:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to create exam request" });
  }
};

exports.getRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    let where = {};

    if (user?.role === "STUDENT") {
      where.candidateId = req.user.candidateProfileId;
    } else if (user?.role === "VOLUNTEER") {
      // Volunteers see all CREATED requests
      where.status = "CREATED";
    }

    const requests = await prisma.examRequest.findMany({
      where,
      include: {
        candidate: { include: { user: true } },
        volunteer: { include: { user: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ data: requests });
  } catch (error) {
    console.error("Get Requests Error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getRequestById = async (req, res) => {
  try {
    const request = await RequestsService.getRequestById(req.params.id);
    if (!request)
      return res.status(404).json({ error: "Exam request not found" });
    res.status(200).json({ data: request });
  } catch (error) {
    console.error("Get Request By ID Error:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to retrieve request details" });
  }
};

exports.verifyStartPin = async (req, res) => {
  try {
    const { id } = req.params;
    const { pin } = req.body;
    if (!pin)
      return res
        .status(400)
        .json({ error: "Invigilator start PIN is required." });
    const updatedRequest = await RequestsService.verifyStartPin(id, pin);
    res.status(200).json({
      success: true,
      message:
        "Invigilator PIN verified successfully! Exam is now IN_PROGRESS.",
      data: updatedRequest,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.verifyCompletionPin = async (req, res) => {
  try {
    const { id } = req.params;
    const { pin } = req.body;
    if (!pin)
      return res.status(400).json({ error: "Completion PIN is required." });
    const updatedRequest = await RequestsService.verifyCompletionPin(id, pin);
    res.status(200).json({
      success: true,
      message:
        "Completion PIN verified successfully! Exam is officially COMPLETED.",
      data: updatedRequest,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
