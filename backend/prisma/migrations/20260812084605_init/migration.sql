-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'VOLUNTEER', 'SUPER_ADMIN', 'ORG_ADMIN');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "GenderPreference" AS ENUM ('ANY', 'MALE_ONLY', 'FEMALE_ONLY');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('CREATED', 'MATCHED', 'IN_PERSON_VERIFIED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING_MANUAL_AUDIT', 'VERIFIED_DIGILOCKER', 'VERIFIED_MANUAL');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('NONE', 'TWO_WHEELER', 'FOUR_WHEELER', 'BICYCLE');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('PLATFORM_FEE_INBOUND', 'SCRIBE_PAYOUT_OUTBOUND', 'REFUND');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'ESCROWED', 'QUEUED_FOR_PAYOUT', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "FeedbackCategory" AS ENUM ('APP_UX', 'MATCHING_SPEED', 'PAYMENTS_ESCROW', 'BUG_REPORT', 'GENERAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "role" "Role" NOT NULL,
    "profileImageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "udidNumber" TEXT,
    "udidVerified" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "disabilityType" TEXT,
    "homeLat" DOUBLE PRECISION,
    "homeLng" DOUBLE PRECISION,
    "location" geometry(Point, 4326),

    CONSTRAINT "CandidateProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolunteerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "upiId" TEXT,
    "xpPoints" INTEGER NOT NULL DEFAULT 0,
    "totalExams" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "hasVehicle" BOOLEAN NOT NULL DEFAULT false,
    "vehicleType" "VehicleType" NOT NULL DEFAULT 'NONE',
    "highestEducation" TEXT,
    "eduVerified" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "eduDocumentUrl" TEXT,
    "maxExamLevelAllowed" TEXT NOT NULL DEFAULT 'SECONDARY',
    "lastLat" DOUBLE PRECISION,
    "lastLng" DOUBLE PRECISION,
    "location" geometry(Point, 4326),

    CONSTRAINT "VolunteerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamRequest" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "volunteerId" TEXT,
    "examName" TEXT NOT NULL,
    "advtNumber" TEXT,
    "admitCardUrl" TEXT,
    "examDate" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "genderPref" "GenderPreference" NOT NULL DEFAULT 'ANY',
    "status" "RequestStatus" NOT NULL DEFAULT 'CREATED',
    "requiresTransport" BOOLEAN NOT NULL DEFAULT false,
    "pickupLat" DOUBLE PRECISION,
    "pickupLng" DOUBLE PRECISION,
    "pickupLocation" geometry(Point, 4326),
    "examCenterName" TEXT,
    "examCenterLat" DOUBLE PRECISION NOT NULL,
    "examCenterLng" DOUBLE PRECISION NOT NULL,
    "examLocation" geometry(Point, 4326),
    "masterExamId" TEXT,
    "isFromMasterRegistry" BOOLEAN NOT NULL DEFAULT false,
    "invigilatorPin" TEXT,
    "completionPin" TEXT,
    "pinVerifiedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "pgOrderId" TEXT,
    "payoutRefId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "domain" TEXT,
    "reputationScore" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScribeReview" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "tags" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScribeReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userRole" TEXT,
    "category" "FeedbackCategory" NOT NULL DEFAULT 'GENERAL',
    "rating" INTEGER NOT NULL,
    "feedbackText" TEXT NOT NULL,
    "appVersion" TEXT,
    "deviceInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL DEFAULT 'GLOBAL',
    "isPlatformFree" BOOLEAN NOT NULL DEFAULT true,
    "freeRequestQuotaLimit" INTEGER NOT NULL DEFAULT 1000,
    "currentRequestCount" INTEGER NOT NULL DEFAULT 0,
    "defaultPlatformFee" DOUBLE PRECISION NOT NULL DEFAULT 50.0,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterExam" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "organizer" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MasterExam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthSession" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "codeVerifier" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateProfile_userId_key" ON "CandidateProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateProfile_udidNumber_key" ON "CandidateProfile"("udidNumber");

-- CreateIndex
CREATE UNIQUE INDEX "VolunteerProfile_userId_key" ON "VolunteerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_domain_key" ON "Organization"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "ScribeReview_requestId_key" ON "ScribeReview"("requestId");

-- CreateIndex
CREATE INDEX "PlatformFeedback_userId_idx" ON "PlatformFeedback"("userId");

-- CreateIndex
CREATE INDEX "PlatformFeedback_category_idx" ON "PlatformFeedback"("category");

-- CreateIndex
CREATE UNIQUE INDEX "AuthSession_state_key" ON "AuthSession"("state");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateProfile" ADD CONSTRAINT "CandidateProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerProfile" ADD CONSTRAINT "VolunteerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamRequest" ADD CONSTRAINT "ExamRequest_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "CandidateProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamRequest" ADD CONSTRAINT "ExamRequest_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "VolunteerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamRequest" ADD CONSTRAINT "ExamRequest_masterExamId_fkey" FOREIGN KEY ("masterExamId") REFERENCES "MasterExam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ExamRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScribeReview" ADD CONSTRAINT "ScribeReview_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ExamRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformFeedback" ADD CONSTRAINT "PlatformFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
