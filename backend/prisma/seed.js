const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning existing test data...');
  await prisma.scribeReview.deleteMany();
  await prisma.paymentTransaction.deleteMany();
  await prisma.examRequest.deleteMany();
  await prisma.volunteerProfile.deleteMany();
  await prisma.candidateProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log('🌱 Seeding candidates and volunteers across Pune...');

  // 1. Create Candidates
  const cand1User = await prisma.user.create({
    data: {
      name: 'Aarav Sharma (Needs Transport)',
      phone: '+919800011111',
      gender: 'MALE',
      role: 'STUDENT',
      candidateProfile: {
        create: {
          disabilityType: 'VISUAL_IMPAIRMENT',
          udidNumber: 'UDID-PUNE-101',
          homeLat: 18.5204, // Shivajinagar, Pune
          homeLng: 73.8567
        }
      }
    },
    include: { candidateProfile: true }
  });

  const cand2User = await prisma.user.create({
    data: {
      name: 'Priya Patel (Self Transport)',
      phone: '+919800022222',
      gender: 'FEMALE',
      role: 'STUDENT',
      candidateProfile: {
        create: {
          disabilityType: 'LOCOMOTOR',
          udidNumber: 'UDID-PUNE-102',
          homeLat: 18.5074, // Kothrud, Pune
          homeLng: 73.8077
        }
      }
    },
    include: { candidateProfile: true }
  });

  // 2. Create Volunteers with varying locations, vehicles, and genders
  const volunteersData = [
    {
      name: 'Rohan Gupta (2km from Center, Male, Bike)',
      phone: '+919900011111',
      gender: 'MALE',
      lat: 18.5320, // Near Govt Polytechnic Pune
      lng: 73.8310,
      hasVehicle: true,
      vehicleType: 'TWO_WHEELER'
    },
    {
      name: 'Sneha Rao (3km from Candidate Home, Female, No Vehicle)',
      phone: '+919900022222',
      gender: 'FEMALE',
      lat: 18.5230, // Near Shivajinagar
      lng: 73.8480,
      hasVehicle: false,
      vehicleType: 'NONE'
    },
    {
      name: 'Vikram Singh (15km Away, Male, Car)',
      phone: '+919900033333',
      gender: 'MALE',
      lat: 18.6298, // Pimpri Chinchwad (Far)
      lng: 73.7997,
      hasVehicle: true,
      vehicleType: 'FOUR_WHEELER'
    },
    {
      name: 'Ananya Deshmukh (1.5km from Center, Female, Scooter)',
      phone: '+919900044444',
      gender: 'FEMALE',
      lat: 18.5300,
      lng: 73.8380,
      hasVehicle: true,
      vehicleType: 'TWO_WHEELER'
    }
  ];

  for (const vol of volunteersData) {
    const user = await prisma.user.create({
      data: {
        name: vol.name,
        phone: vol.phone,
        gender: vol.gender,
        role: 'VOLUNTEER',
        volunteerProfile: {
          create: {
            hasVehicle: vol.hasVehicle,
            vehicleType: vol.vehicleType,
            highestEducation: 'BACHELORS',
            lastLat: vol.lat,
            lastLng: vol.lng,
            isAvailable: true
          }
        }
      },
      include: { volunteerProfile: true }
    });

    // Update PostGIS geometry column for volunteer
    await prisma.$executeRaw`
      UPDATE "VolunteerProfile"
      SET "location" = ST_SetSRID(ST_MakePoint(${vol.lng}, ${vol.lat}), 4326)
      WHERE id = ${user.volunteerProfile.id}
    `;
  }

  // 3. Create Exam Requests
  // Request A: Requires Transport
  const req1 = await prisma.examRequest.create({
    data: {
      candidateId: cand1User.candidateProfile.id,
      examName: 'MPSC State Services Prelims 2026',
      examDate: new Date('2026-08-15T10:00:00Z'),
      durationMinutes: 120,
      genderPref: 'ANY',
      requiresTransport: true,
      pickupLat: 18.5204, // Student Home
      pickupLng: 73.8567,
      examCenterName: 'Government Polytechnic, Pune',
      examCenterLat: 18.5314,
      examCenterLng: 73.8344,
      invigilatorPin: '4321',
      completionPin: '8765'
    }
  });

  // Request B: No Transport Needed, Female Only
  const req2 = await prisma.examRequest.create({
    data: {
      candidateId: cand2User.candidateProfile.id,
      examName: 'UPSC Civil Services Prelims 2026',
      examDate: new Date('2026-09-01T09:30:00Z'),
      durationMinutes: 120,
      genderPref: 'FEMALE_ONLY',
      requiresTransport: false,
      examCenterName: 'COEP Technological University, Pune',
      examCenterLat: 18.5293,
      examCenterLng: 73.8560,
      invigilatorPin: '1122',
      completionPin: '3344'
    }
  });

  // Update PostGIS geometry for exam requests
  await prisma.$executeRaw`
    UPDATE "ExamRequest"
    SET "examLocation" = ST_SetSRID(ST_MakePoint(73.8344, 18.5314), 4326),
        "pickupLocation" = ST_SetSRID(ST_MakePoint(73.8567, 18.5204), 4326)
    WHERE id = ${req1.id}
  `;

  await prisma.$executeRaw`
    UPDATE "ExamRequest"
    SET "examLocation" = ST_SetSRID(ST_MakePoint(73.8560, 18.5293), 4326)
    WHERE id = ${req2.id}
  `;

  console.log('✅ Database successfully seeded with candidates, spatial volunteers, and requests!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });