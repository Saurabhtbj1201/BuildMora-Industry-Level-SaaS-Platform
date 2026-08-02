import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Reusable primitives
// ─────────────────────────────────────────────────────────────────────────────

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const slugSchema = z
  .string()
  .min(2)
  .max(80)
  .regex(slugRegex, "Slug must be lowercase letters, numbers, and hyphens only");

export const urlSchema = z.string().url().or(z.literal("")).optional();

export const customLinkSchema = z.object({
  label: z.string().min(1).max(50),
  url: z.string().url(),
});

export const seoFieldsSchema = z.object({
  ogImage: z.string().optional(),
  ogTitle: z.string().max(60).optional(),
  ogDescription: z.string().max(160).optional(),
  metaKeywords: z.string().max(200).optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().toLowerCase(),
  password: z
    .string()
    .min(8)
    .max(100)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      "Password must include uppercase, lowercase, number, and special character"
    ),
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

export const otpSchema = z.object({
  code: z.string().length(6).regex(/^\d{6}$/, "OTP must be 6 digits"),
});

export const totpSchema = z.object({
  token: z.string().length(6).regex(/^\d{6}$/),
});

// ─────────────────────────────────────────────────────────────────────────────
// Profile
// ─────────────────────────────────────────────────────────────────────────────

export const profileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(2000).optional(),
  avatar: z.string().optional(),
  coverImage: z.string().optional(),
  headline: z.string().max(160).optional(),
  location: z.string().max(100).optional(),
  website: urlSchema,
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(20).optional(),
  skills: z.array(z.string()).max(30).optional(),
  education: z
    .array(
      z.object({
        institution: z.string(),
        degree: z.string(),
        year: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .optional(),
  experience: z
    .array(
      z.object({
        company: z.string(),
        role: z.string(),
        duration: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .optional(),
  github: urlSchema,
  linkedin: urlSchema,
  twitter: urlSchema,
  instagram: urlSchema,
  youtube: urlSchema,
  socialLinks: z.array(customLinkSchema).max(10).optional(),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Project
// ─────────────────────────────────────────────────────────────────────────────

export const projectSchema = z
  .object({
    title: z.string().min(1).max(200),
    slug: slugSchema,
    category: z.string().min(1).max(50),
    status: z.enum(["PLANNING", "IN_PROGRESS", "COMPLETED", "ON_HOLD", "ARCHIVED"]),
    startDate: z.string().datetime().optional(),
    description: z.string().max(50000).optional(),
    liveLink: urlSchema,
    githubLink: urlSchema,
    customLinks: z.array(customLinkSchema).max(10).optional(),
    starsRating: z.number().int().min(1).max(5).optional(),
    techStack: z.array(z.string().max(50)).max(30).optional(),
    contributors: z
      .array(
        z.object({
          name: z.string(),
          githubUrl: z.string().url().optional(),
        })
      )
      .max(50)
      .optional(),
    images: z.array(z.string()).max(10).optional(),
    isPublished: z.boolean().optional(),
  })
  .merge(seoFieldsSchema);

// ─────────────────────────────────────────────────────────────────────────────
// Open Source Project
// ─────────────────────────────────────────────────────────────────────────────

export const openSourceSchema = z
  .object({
    title: z.string().min(1).max(200),
    slug: slugSchema,
    category: z.string().min(1).max(50),
    status: z.enum(["PLANNING", "IN_PROGRESS", "COMPLETED", "ON_HOLD", "ARCHIVED"]),
    githubLink: z.string().url("GitHub link is required"),
    documentationLink: urlSchema,
    overview: z.string().max(50000).optional(),
    problemStatement: z.string().max(10000).optional(),
    features: z.string().max(50000).optional(),
    installationGuide: z.string().max(50000).optional(),
    contributionGuidelines: z.string().max(50000).optional(),
    roadmap: z.string().max(20000).optional(),
    customContribInstructions: z.string().max(5000).optional(),
    techStack: z.array(z.string()).max(30).optional(),
    skillsRequired: z.array(z.string()).max(20).optional(),
    images: z.array(z.string()).max(10).optional(),
    customLinks: z.array(customLinkSchema).max(10).optional(),
    isPublished: z.boolean().optional(),
  })
  .merge(seoFieldsSchema);

// ─────────────────────────────────────────────────────────────────────────────
// Blog Post
// ─────────────────────────────────────────────────────────────────────────────

export const blogPostSchema = z
  .object({
    title: z.string().min(1).max(200),
    slug: slugSchema,
    category: z.string().max(50).optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"]),
    publishedAt: z.string().datetime().optional(),
    scheduledAt: z.string().datetime().optional(),
    readingTime: z.number().int().min(1).max(120).optional(),
    excerpt: z.string().max(300).optional(),
    tags: z.array(z.string().max(30)).max(20).optional(),
    content: z.string().max(500000).optional(),
    featuredImage: z.string().optional(),
    ogImage: z.string().optional(),
    seoTitle: z.string().max(60).optional(),
    seoDescription: z.string().max(160).optional(),
    metaKeywords: z.string().max(200).optional(),
  });

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

export const serviceSchema = z
  .object({
    title: z.string().min(1).max(200),
    slug: slugSchema,
    description: z.string().max(10000).optional(),
    price: z.number().min(0).optional(),
    currency: z.string().length(3).default("INR"),
    image: z.string().optional(),
    isPublished: z.boolean().optional(),
    customLinks: z.array(customLinkSchema).max(5).optional(),
    ogImage: z.string().optional(),
    seoTitle: z.string().max(60).optional(),
    seoDescription: z.string().max(160).optional(),
    metaKeywords: z.string().max(200).optional(),
  });

// ─────────────────────────────────────────────────────────────────────────────
// Enquiry & Contact
// ─────────────────────────────────────────────────────────────────────────────

export const enquirySchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  message: z.string().min(10).max(5000),
  phone: z.string().max(20).optional(),
  source: z.enum(["PROJECT", "OPEN_SOURCE", "BLOG", "SERVICE", "COLLABORATION"]),
  projectId: z.string().optional(),
  osProjectId: z.string().optional(),
  blogId: z.string().optional(),
  serviceId: z.string().optional(),
});

export const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  subject: z.string().max(200).optional(),
  message: z.string().min(10).max(5000),
});

// ─────────────────────────────────────────────────────────────────────────────
// Expense
// ─────────────────────────────────────────────────────────────────────────────

export const expenseSchema = z.object({
  title: z.string().min(1).max(200),
  amount: z.number().min(0),
  currency: z.string().length(3).default("INR"),
  category: z.string().min(1).max(50),
  date: z.string().datetime(),
  description: z.string().max(500).optional(),
  isRecurring: z.boolean().default(false),
  recurringPeriod: z
    .enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"])
    .optional(),
  tags: z.array(z.string()).max(5).optional(),
});

export const budgetSchema = z.object({
  monthlyBudget: z.number().min(0),
  categoryBudgets: z.record(z.string(), z.number().min(0)).optional(),
  currency: z.string().length(3).default("INR"),
});

// ─────────────────────────────────────────────────────────────────────────────
// Site Settings
// ─────────────────────────────────────────────────────────────────────────────

export const siteSettingsSchema = z.object({
  siteName: z.string().min(1).max(100),
  tagline: z.string().max(200).optional(),
  footerText: z.string().max(300).optional(),
  seoDescription: z.string().max(160).optional(),
  metaKeywords: z.string().max(200).optional(),
  ogImage: z.string().optional(),
  gaMeasurementId: z
    .string()
    .regex(/^G-[A-Z0-9]+$/, "Must be a valid GA4 Measurement ID (e.g. G-XXXXXXXXXX)")
    .optional()
    .or(z.literal("")),
});

export const customDomainSchema = z.object({
  customDomain: z
    .string()
    .regex(
      /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/,
      "Invalid domain format"
    )
    .optional()
    .or(z.literal("")),
});

export const themeSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  fontFamily: z.string().max(50).optional(),
  layout: z.enum(["minimal", "modern", "classic", "bold"]).optional(),
  darkMode: z.boolean().optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// AI Generation
// ─────────────────────────────────────────────────────────────────────────────

export const aiGenerateSchema = z.object({
  type: z.enum([
    "project_description", "project_seo",
    "os_overview", "os_installation", "os_contribution_guidelines", "os_roadmap",
    "blog_outline", "blog_excerpt", "blog_content", "blog_tags",
    "seo_title", "seo_description", "seo_keywords",
    "profile_bio", "profile_headline", "service_description",
  ]),
  context: z.record(z.string(), z.unknown()),
});

// ─────────────────────────────────────────────────────────────────────────────
// Upload
// ─────────────────────────────────────────────────────────────────────────────

export const uploadPresignSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileType: z.string().min(1),
  fileSize: z.number().int().positive().max(20 * 1024 * 1024), // 20MB max
  folder: z.enum(["profile", "projects", "open-source", "blog", "services", "og", "platform"]),
});
