const prisma = require('../../config/database');

class OrganizationService {
  /**
   * Helper: Standardize & sanitize domain strings
   * Examples:
   *   "https://www.mitaoe.ac.in/about" -> "mitaoe.ac.in"
   *   "@mitaoe.ac.in"                -> "mitaoe.ac.in"
   */
  static sanitizeDomain(domain) {
    if (!domain || typeof domain !== 'string') return null;
    return domain
      .toLowerCase()
      .trim()
      .replace(/^(https?:\/\/)?(www\.)?/, '') // Remove protocol and www
      .replace(/\/.*$/, '')                 // Remove path / query params
      .replace(/^@/, '');                   // Remove leading @ if present
  }

  /**
   * 1. Create Organization with Domain Uniqueness Guard
   */
  static async createOrganization(data) {
    const { name, type, domain, reputationScore } = data;

    if (!name || !type) {
      throw new Error('Name and type are required to create an organization.');
    }

    const cleanDomain = this.sanitizeDomain(domain);

    // Atomicity check: Verify domain doesn't already exist before insertion
    if (cleanDomain) {
      const existingOrg = await prisma.organization.findUnique({
        where: { domain: cleanDomain }
      });

      if (existingOrg) {
        throw new Error(
          `An organization with domain '${cleanDomain}' already exists (${existingOrg.name}).`
        );
      }
    }

    return await prisma.organization.create({
      data: {
        name: name.trim(),
        type: type.trim(),
        domain: cleanDomain,
        reputationScore: reputationScore ? parseInt(reputationScore, 10) : 100
      }
    });
  }

  /**
   * 2. Fetch All Organizations
   */
  static async getAllOrganizations() {
    return await prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });
  }

  /**
   * 3. Fetch Organization by ID (Includes Affiliated Users)
   */
  static async getOrganizationById(id) {
    const org = await prisma.organization.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            phone: true,
            role: true,
            isActive: true,
            createdAt: true
          }
        },
        _count: {
          select: { users: true }
        }
      }
    });

    if (!org) {
      throw new Error(`Organization with ID ${id} not found.`);
    }

    return org;
  }

  /**
   * 4. Fetch Organization by Domain Name
   */
  static async getOrganizationByDomain(domain) {
    const cleanDomain = this.sanitizeDomain(domain);
    if (!cleanDomain) return null;

    return await prisma.organization.findUnique({
      where: { domain: cleanDomain },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });
  }

  /**
   * 5. Assign User to Organization Manually
   */
  static async assignUserToOrganization(userId, organizationId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error(`User with ID ${userId} not found.`);
    }

    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) {
      throw new Error(`Organization with ID ${organizationId} not found.`);
    }

    return await prisma.user.update({
      where: { id: userId },
      data: { organizationId },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        organizationId: true
      }
    });
  }

  /**
   * 6. Automatically Assign Candidate to Organization via Email Domain
   * Useful during auth/registration. Ignores public email providers.
   */
  static async assignUserByEmailDomain(userId, email) {
    if (!email || !email.includes('@')) return null;

    const emailDomain = this.sanitizeDomain(email.split('@')[1]);

    // Skip public consumer email domains
    const publicDomains = [
      'gmail.com',
      'yahoo.com',
      'outlook.com',
      'hotmail.com',
      'icloud.com',
      'protonmail.com'
    ];

    if (publicDomains.includes(emailDomain)) return null;

    const org = await prisma.organization.findUnique({
      where: { domain: emailDomain }
    });

    if (org) {
      return await prisma.user.update({
        where: { id: userId },
        data: { organizationId: org.id },
        select: {
          id: true,
          name: true,
          role: true,
          organizationId: true
        }
      });
    }

    return null;
  }

  /**
   * 7. Organization Dashboard Metrics & Analytics
   */
  static async getOrganizationMetrics(organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        users: {
          select: {
            id: true,
            role: true,
            candidateProfile: {
              select: { id: true }
            }
          }
        }
      }
    });

    if (!org) {
      throw new Error(`Organization with ID ${organizationId} not found.`);
    }

    const candidateProfileIds = org.users
      .filter((u) => u.candidateProfile)
      .map((u) => u.candidateProfile.id);

    // Fetch exam request metrics for affiliated candidate profiles
    const totalRequests = await prisma.examRequest.count({
      where: { candidateId: { in: candidateProfileIds } }
    });

    const completedRequests = await prisma.examRequest.count({
      where: {
        candidateId: { in: candidateProfileIds },
        status: 'COMPLETED'
      }
    });

    const inProgressRequests = await prisma.examRequest.count({
      where: {
        candidateId: { in: candidateProfileIds },
        status: 'IN_PROGRESS'
      }
    });

    return {
      organizationId: org.id,
      organizationName: org.name,
      domain: org.domain,
      reputationScore: org.reputationScore,
      totalAffiliatedUsers: org.users.length,
      totalCandidateProfiles: candidateProfileIds.length,
      examStats: {
        totalRequests,
        completedRequests,
        inProgressRequests
      }
    };
  }

  /**
   * 8. Cleanup Duplicate Organizations by Name (Data Sanity Tool)
   * Merges users into the primary (oldest) entry and removes duplicates.
   */
  static async removeDuplicateOrganizationsByName(name) {
    const orgs = await prisma.organization.findMany({
      where: { name: { equals: name, mode: 'insensitive' } },
      orderBy: { createdAt: 'asc' }
    });

    if (orgs.length <= 1) {
      return { primaryOrg: orgs[0] || null, deletedCount: 0 };
    }

    const primaryOrg = orgs[0];
    const duplicateIds = orgs.slice(1).map((o) => o.id);

    // Re-bind all existing users to the primary organization
    await prisma.user.updateMany({
      where: { organizationId: { in: duplicateIds } },
      data: { organizationId: primaryOrg.id }
    });

    // Delete redundant organization records
    const deleteResult = await prisma.organization.deleteMany({
      where: { id: { in: duplicateIds } }
    });

    return {
      primaryOrg,
      deletedCount: deleteResult.count
    };
  }
}

module.exports = OrganizationService;