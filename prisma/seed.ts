import "dotenv/config"; // Load .env before anything else
import { PrismaClient, PlanType, TenantRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

// Prisma 7 requires adapter for direct connection
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });



const AI_CREDIT_LIMITS: Record<PlanType, number> = {
  FREE: 10,
  STARTER: 50,
  PRO: 500,
  ENTERPRISE: -1,
};

async function main() {
  console.log("🌱 Seeding BuildMora database...\n");

  // ─── Super Admin User ────────────────────────────────────────────────────
  const superAdminEmail =
    process.env.SUPER_ADMIN_EMAIL ?? "admin@buildmora.com";

  const existingAdmin = await prisma.user.findUnique({
    where: { email: superAdminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("Admin@BuildMora2026!", 12);

    const superAdmin = await prisma.user.create({
      data: {
        email: superAdminEmail,
        name: "BuildMora Admin",
        passwordHash,
        emailVerified: new Date(),
        isSuperAdmin: true,
        isActive: true,
      },
    });

    // Super admin gets their own tenant/site too
    const adminTenant = await prisma.tenant.create({
      data: {
        ownerId: superAdmin.id,
        siteName: "BuildMora Platform",
        siteSlug: "buildmora-admin",
        tagline: "Platform Administration Site",
        plan: PlanType.ENTERPRISE,
        isActive: true,
      },
    });

    await prisma.profile.create({
      data: {
        tenantId: adminTenant.id,
        displayName: "BuildMora Admin",
        headline: "Platform Administrator",
      },
    });

    console.log(`✅ Super admin created: ${superAdminEmail}`);
    console.log(`   Default password: Admin@BuildMora2026!`);
    console.log(`   ⚠️  Change this immediately after first login!\n`);
  } else {
    console.log(`ℹ️  Super admin already exists: ${superAdminEmail}\n`);
  }

  // ─── Demo Tenant (for development) ───────────────────────────────────────
  if (process.env.NODE_ENV === "development") {
    const demoEmail = "demo@buildmora.com";
    const existingDemo = await prisma.user.findUnique({
      where: { email: demoEmail },
    });

    if (!existingDemo) {
      const passwordHash = await bcrypt.hash("Demo@1234!", 12);

      const demoUser = await prisma.user.create({
        data: {
          email: demoEmail,
          name: "Demo User",
          passwordHash,
          emailVerified: new Date(),
          isActive: true,
        },
      });

      const demoTenant = await prisma.tenant.create({
        data: {
          ownerId: demoUser.id,
          siteName: "Demo Portfolio",
          siteSlug: "demo",
          tagline: "A demonstration portfolio",
          plan: PlanType.PRO,
          isActive: true,
        },
      });

      // Add owner role
      await prisma.tenantUserRole.create({
        data: {
          userId: demoUser.id,
          tenantId: demoTenant.id,
          role: TenantRole.OWNER,
        },
      });

      // Create profile
      await prisma.profile.create({
        data: {
          tenantId: demoTenant.id,
          displayName: "Demo User",
          headline: "Full Stack Developer & Open Source Enthusiast",
          bio: "I build things for the web. Passionate about React, Node.js, and developer tools.",
          location: "Noida, India",
          github: "https://github.com/demo",
          linkedin: "https://linkedin.com/in/demo",
          skills: JSON.stringify([
            "TypeScript",
            "React",
            "Node.js",
            "PostgreSQL",
            "AWS",
          ]),
        },
      });

      // Seed AI credit ledger for current month
      const currentMonth = new Date()
        .toISOString()
        .slice(0, 7); // "YYYY-MM"
      await prisma.aiCreditLedger.create({
        data: {
          tenantId: demoTenant.id,
          month: currentMonth,
          used: 0,
          limit: AI_CREDIT_LIMITS[PlanType.PRO],
        },
      });

      // Sample project
      await prisma.project.create({
        data: {
          tenantId: demoTenant.id,
          title: "BuildMora Platform",
          slug: "buildmora-platform",
          category: "SaaS",
          status: "IN_PROGRESS",
          description:
            "<p>A multi-tenant SaaS platform for students and professionals to showcase their work.</p>",
          techStack: ["Next.js", "TypeScript", "PostgreSQL", "AWS"],
          liveLink: "https://buildmora.com",
          githubLink: "https://github.com/demo/buildmora",
          isPublished: true,
        },
      });

      // Sample blog post
      await prisma.blogPost.create({
        data: {
          tenantId: demoTenant.id,
          title: "Getting Started with BuildMora",
          slug: "getting-started-with-buildmora",
          authorId: demoUser.id,
          authorName: "Demo User",
          category: "Tutorial",
          status: "PUBLISHED",
          publishedAt: new Date(),
          readingTime: 5,
          excerpt:
            "Learn how to set up your BuildMora profile and start showcasing your work.",
          tags: ["buildmora", "portfolio", "tutorial"],
          content:
            "<p>Welcome to BuildMora! This guide will help you get started...</p>",
          isPublished: true,
        } as Parameters<typeof prisma.blogPost.create>[0]["data"],
      });

      console.log(`✅ Demo user created: ${demoEmail}`);
      console.log(`   Demo password: Demo@1234!`);
      console.log(`   Demo site: http://demo.localhost:3000\n`);
    } else {
      console.log(`ℹ️  Demo user already exists: ${demoEmail}\n`);
    }
  }

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
