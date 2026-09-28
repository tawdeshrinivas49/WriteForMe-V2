const prisma = require("../../config/database");
const {
  calculateDistanceKm,
  estimateTravelTimeMinutes,
} = require("../../config/mapmyindia");

// Edu rank map – kept for when you uncomment the education filter
const EDU_RANK = {
  BELOW_10TH: 1,
  "10TH": 2,
  SECONDARY: 2,
  "12TH": 3,
  HIGHER_SECONDARY: 3,
  DIPLOMA: 3,
  BACHELORS: 4,
  UNDERGRADUATE: 4,
  GRADUATION: 4,
  MASTERS: 5,
  POSTGRADUATE: 5,
  DOCTORATE: 6,
  PHD: 6,
};

class MatchingService {
  static async findVolunteersForRequest(requestId, radiusKm = 10) {
    const request = await prisma.examRequest.findUnique({
      where: { id: requestId },
      include: {
        candidate: {
          include: { user: true },
        },
        masterExam: true,
      },
    });

    if (!request) {
      throw new Error(`Exam request with ID '${requestId}' not found.`);
    }

    // ========== FILTERS – COMMENTED OUT FOR NOW ==========
    // const targetExamLevel = request.masterExam?.requiredQualification || request.examLevel || 'BACHELORS';
    // const targetExamStream = request.masterExam?.stream || request.stream || request.candidate?.stream || null;

    let searchLat, searchLng;
    let transportStrategy = "";

    if (request.requiresTransport && request.pickupLat && request.pickupLng) {
      searchLat = parseFloat(request.pickupLat);
      searchLng = parseFloat(request.pickupLng);
      transportStrategy = "PICKUP_ANCHORED_SEARCH";
    } else {
      searchLat = parseFloat(request.examCenterLat || request.lat || 0.0);
      searchLng = parseFloat(request.examCenterLng || request.lng || 0.0);
      transportStrategy = "CENTER_ANCHORED_SEARCH";
    }

    const radiusMeters = radiusKm * 1000;

    // ========== GEOFILTERING – COMMENTED OUT ==========
    // Use a large radius to bypass geofiltering for testing
    // const effectiveRadius = process.env.ENABLE_GEOFILTERING === 'true' ? radiusMeters : 1000000; // 1000km
    const effectiveRadius = radiusMeters; // keep as is – volunteers outside radius won't show

    const candidates = await prisma.$queryRaw`
      SELECT 
        vp.id AS "volunteerId",
        vp."userId" AS "userId",
        u.name AS "volunteerName",
        u.phone AS "phone",
        u.gender AS "gender",
        vp."hasVehicle",
        vp."vehicleType",
        vp."highestEducation",
        vp."maxExamLevelAllowed",
        vp."averageRating",
        vp."lastLat" AS "lastLat",
        vp."lastLng" AS "lastLng",
        ROUND(
          (ST_DistanceSphere(
            vp.location, 
            ST_SetSRID(ST_MakePoint(${searchLng}, ${searchLat}), 4326)
          ) / 1000)::numeric, 2
        ) AS "distanceKm"
      FROM "VolunteerProfile" vp
      JOIN "User" u ON vp."userId" = u.id
      WHERE vp."isAvailable" = true
        AND vp.location IS NOT NULL
        AND ST_DistanceSphere(
          vp.location, 
          ST_SetSRID(ST_MakePoint(${searchLng}, ${searchLat}), 4326)
        ) <= ${effectiveRadius}
      ORDER BY "distanceKm" ASC;
    `;

    const filteredVolunteers = candidates
      .filter((vol) => {
        // ========== GENDER FILTER (ACTIVE) ==========
        if (request.genderPref === "FEMALE_ONLY" && vol.gender !== "FEMALE")
          return false;
        if (request.genderPref === "MALE_ONLY" && vol.gender !== "MALE")
          return false;

        // ========== EDUCATION FILTER – COMMENTED OUT ==========
        // const volEduRank = EDU_RANK[vol.highestEducation?.toUpperCase()] || 4;
        // const examEduRank = EDU_RANK[targetExamLevel.toUpperCase()] || 4;
        // if (volEduRank >= examEduRank) return false;

        // ========== STREAM DISCONNECT – COMMENTED OUT ==========
        // if (targetExamStream && vol.volunteerStream && vol.volunteerStream.toUpperCase() === targetExamStream.toUpperCase()) {
        //   return false;
        // }

        return true;
      })
      .map((vol) => {
        const distanceKm =
          parseFloat(vol.distanceKm) ||
          calculateDistanceKm(searchLat, searchLng, vol.lastLat, vol.lastLng);

        const etaMinutes = estimateTravelTimeMinutes(distanceKm);

        let transportAction = "STANDARD_COMMUTE";
        if (request.requiresTransport) {
          if (vol.hasVehicle) {
            transportAction = "DIRECT_VOLUNTEER_RIDE";
          } else {
            transportAction = "TRIGGER_THIRD_PARTY_RIDE";
          }
        }

        return {
          volunteerId: vol.volunteerId,
          userId: vol.userId,
          volunteerName: vol.volunteerName,
          phone: vol.phone,
          gender: vol.gender,
          hasVehicle: vol.hasVehicle,
          vehicleType: vol.vehicleType,
          highestEducation: vol.highestEducation,
          averageRating: parseFloat(vol.averageRating || 5.0),
          distanceKm,
          etaMinutes,
          transportAction,
        };
      });

    return {
      requestId,
      transportStrategy,
      searchCenter: { lat: searchLat, lng: searchLng, radiusKm },
      appliedFilters: {
        genderPref: request.genderPref,
        // targetExamLevel, // commented out
        // targetExamStream, // commented out
      },
      totalEligibleFound: filteredVolunteers.length,
      volunteers: filteredVolunteers,
    };
  }

static async assignVolunteerToRequest(requestId, volunteerId) {
  // ---- Check if volunteer already has an active assignment ----
  const active = await prisma.examRequest.findFirst({
    where: {
      volunteerId: volunteerId,
      status: { in: ['MATCHED', 'IN_PERSON_VERIFIED', 'IN_PROGRESS'] }
    }
  });
  if (active) {
    throw new Error('You already have an active assignment. Please complete it before accepting another.');
  }

  const volunteer = await prisma.volunteerProfile.findUnique({
    where: { id: volunteerId },
    include: { user: { select: { name: true, phone: true } } },
  });

  if (!volunteer) {
    throw new Error(`Volunteer profile with ID '${volunteerId}' not found.`);
  }

  if (!volunteer.upiId) {
    throw new Error('UPI_MISSING');
  }

  const updatedRequest = await prisma.examRequest.update({
    where: { id: requestId },
    data: {
      volunteerId: volunteer.id,
      status: 'MATCHED',
    },
    include: {
      volunteer: { include: { user: true } },
      candidate: { include: { user: true } },
    },
  });

  return updatedRequest;
}

  // Inside MatchingService class
  static async findEligibleRequestsForVolunteer(volunteerId, radiusKm = 10) {

    const activeRequest = await prisma.examRequest.findFirst({
    where: {
      volunteerId: volunteerId,
      status: { in: ['MATCHED', 'IN_PERSON_VERIFIED', 'IN_PROGRESS'] }
    }
  });
  
  if (activeRequest) {
    // Volunteer is busy – return no requests
    return [];
  }
    const volunteer = await prisma.volunteerProfile.findUnique({
      where: { id: volunteerId },
      include: { user: true },
    });

    if (!volunteer) {
      throw new Error("Volunteer profile not found");
    }

    const volLat = volunteer.lastLat ?? 0.0;
    const volLng = volunteer.lastLng ?? 0.0;
    const volGender = volunteer.user.gender;
    const volEdu = volunteer.highestEducation || "BACHELORS";
    const volEduRank = EDU_RANK[volEdu.toUpperCase()] || 4;

    const requests = await prisma.examRequest.findMany({
      where: { status: "CREATED" },
      include: {
        candidate: { include: { user: true } },
      },
    });

    const eligible = [];
    for (const req of requests) {
      const reqLat = req.examCenterLat ?? 0.0;
      const reqLng = req.examCenterLng ?? 0.0;
      let distanceKm = 0;
      if (reqLat && reqLng && volLat && volLng) {
        distanceKm = calculateDistanceKm(volLat, volLng, reqLat, reqLng);
      }

      // Gender filter (active)
      if (req.genderPref === "FEMALE_ONLY" && volGender !== "FEMALE") continue;
      if (req.genderPref === "MALE_ONLY" && volGender !== "MALE") continue;

      // Education filter – commented out
      // const reqExamLevel = req.masterExam?.requiredQualification || req.examLevel || 'BACHELORS';
      // const reqEduRank = EDU_RANK[reqExamLevel.toUpperCase()] || 4;
      // if (volEduRank >= reqEduRank) continue;

      // Geofiltering – commented out (only if you want to filter by distance)
      // if (distanceKm > radiusKm) continue;

      eligible.push({
        ...req,
        distanceKm,
        candidateName: req.candidate?.user?.name || "Unknown",
        candidatePhone: req.candidate?.user?.phone || "—",
      });
    }

    eligible.sort((a, b) => a.distanceKm - b.distanceKm);
    return eligible;
  }
}

module.exports = MatchingService;

// changes are necessary in this as degraded for foundational working
