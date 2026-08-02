# BuildMora — Industry-Level SaaS Platform
## Full End-to-End Implementation Plan

> **Platform Summary**: A multi-tenant SaaS for students & professionals to showcase profiles, projects, blogs, and services. Features role-based access (Super Admin, Tenant Admin, Collaborator, Public), AI-assisted content creation, personal expense tracking, and AWS-native infrastructure.

---

## Tech Stack Confirmed

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15 (App Router, SSR/SSG) |
| **Backend** | Next.js API Routes (monorepo) |
| **Database** | PostgreSQL + Prisma ORM |
| **Auth** | Auth.js (NextAuth v5) + bcrypt + JWT + MFA |
| **AI Assistant** | Google Gemini API |
| **Payments** | Razorpay (subscriptions) |
| **File Storage** | AWS S3 + CloudFront CDN |
| **Email** | AWS SES |
| **Deployment** | AWS (ECS Fargate + RDS + CloudFront) |
| **UI** | Tailwind CSS + shadcn/ui |
| **Charts** | Recharts |
| **Rich Text** | TipTap Editor |
| **Language** | TypeScript (strict mode) |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   CloudFront CDN                    │
│          (Static assets + Edge caching)             │
└──────────┬──────────────────────────┬───────────────┘
           │                          │
    ┌──────▼──────┐           ┌───────▼──────┐
    │  Next.js App │           │  AWS S3       │
    │  (ECS Fargate│           │  (Images,     │
    │   App Router)│           │   Docs, OG)   │
    └──────┬──────┘           └───────────────┘
           │
    ┌──────▼──────────────────────────────────┐
    │            Next.js API Routes            │
    │  /api/auth, /api/tenants, /api/projects  │
    │  /api/blogs, /api/enquiries, /api/admin  │
    └──────┬──────────────┬───────────────────┘
           │              │
    ┌──────▼───┐    ┌─────▼──────────┐
    │ PostgreSQL│    │ AWS SES        │
    │ (AWS RDS) │    │ (Transactional │
    │  Prisma   │    │  Emails)       │
    └───────────┘    └────────────────┘
```

### Multi-Tenant Architecture Strategy
- **Tenant Isolation**: Row-level security using `tenant_id` on all data tables
- **Custom Domains**: Each tenant can map a custom domain → the app resolves tenant by `Host` header or subdomain
- **Subdomain Routing**: `{username}.buildmora.com` (or custom domain) → tenant-aware SSR pages
- **Shared Infrastructure**: All tenants share one database (with RLS) and one app deployment

---

## Database Schema (PostgreSQL + Prisma)

### Core Entities

#### Users & Tenants
```prisma
model User {
  id              String   @id @default(cuid())
  email           String   @unique
  name            String?
  passwordHash    String?
  emailVerified   DateTime?
  image           String?
  mfaSecret       String?
  mfaEnabled      Boolean  @default(false)
  isActive        Boolean  @default(true)
  isSuperAdmin    Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  accounts        Account[]
  sessions        Session[]
  tenant          Tenant?          // owns one tenant
  tenantRoles     TenantUserRole[] // may be admin of other tenants
  expenses        Expense[]
  auditLogs       AuditLog[]
}

model Tenant {
  id              String   @id @default(cuid())
  ownerId         String   @unique
  owner           User     @relation(fields: [ownerId], references: [id])
  
  // Site Identity
  siteName        String
  siteSlug        String   @unique  // buildmora.com/u/{siteSlug}
  customDomain    String?  @unique
  siteUrl         String?
  tagline         String?
  footerText      String?
  
  // SEO Defaults
  seoDescription  String?
  metaKeywords    String?
  ogImage         String?
  
  // Appearance
  themeConfig     Json?    // color scheme, fonts, layout
  logo            String?
  favicon         String?
  
  // Status
  isActive        Boolean  @default(true)
  plan            PlanType @default(FREE)
  planExpiresAt   DateTime?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  userRoles       TenantUserRole[]
  profile         Profile?
  projects        Project[]
  openSourceProjects OpenSourceProject[]
  blogPosts       BlogPost[]
  services        Service[]
  reviews         Review[]
  enquiries       Enquiry[]
  contacts        Contact[]
  pageOgSettings  PageOgSetting[]
  subscription    Subscription?
}

model TenantUserRole {
  id        String   @id @default(cuid())
  userId    String
  tenantId  String
  role      TenantRole
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id])
  tenant    Tenant   @relation(fields: [tenantId], references: [id])

  @@unique([userId, tenantId])
}

enum TenantRole {
  OWNER
  ADMIN
  COLLABORATOR
  VIEWER
}

enum PlanType {
  FREE
  STARTER
  PRO
  ENTERPRISE
}
```

#### Profile
```prisma
model Profile {
  id              String   @id @default(cuid())
  tenantId        String   @unique
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  
  displayName     String?
  bio             String?  @db.Text
  avatar          String?
  coverImage      String?
  headline        String?
  location        String?
  website         String?
  email           String?
  phone           String?
  
  // Skills, Education, Experience (stored as JSON arrays)
  skills          Json?    // string[]
  education       Json?    // { institution, degree, year, description }[]
  experience      Json?    // { company, role, duration, description }[]
  certifications  Json?
  
  // Social Links
  github          String?
  linkedin        String?
  twitter         String?
  instagram       String?
  youtube         String?
  socialLinks     Json?    // custom: { label, url }[]
  
  // SEO
  seoTitle        String?
  seoDescription  String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

#### Projects
```prisma
model Project {
  id              String        @id @default(cuid())
  tenantId        String
  tenant          Tenant        @relation(fields: [tenantId], references: [id])
  
  title           String
  slug            String
  category        String
  status          ProjectStatus @default(IN_PROGRESS)
  startDate       DateTime?
  description     String?       @db.Text  // TipTap HTML
  liveLink        String?
  githubLink      String?
  customLinks     Json?         // { label, url }[]
  starsRating     Int?          // 1-5
  techStack       String[]
  contributors    Json?         // { name, githubUrl }[]
  images          String[]      // S3 keys
  
  // OG / SEO
  ogImage         String?
  ogTitle         String?
  ogDescription   String?
  metaKeywords    String?
  
  isPublished     Boolean       @default(false)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  enquiries       Enquiry[]
  reviews         Review[]
  
  @@unique([tenantId, slug])
}

enum ProjectStatus {
  PLANNING
  IN_PROGRESS
  COMPLETED
  ON_HOLD
  ARCHIVED
}
```

#### Open Source Projects
```prisma
model OpenSourceProject {
  id                      String        @id @default(cuid())
  tenantId                String
  tenant                  Tenant        @relation(fields: [tenantId], references: [id])
  
  title                   String
  slug                    String
  category                String
  status                  ProjectStatus @default(IN_PROGRESS)
  githubLink              String
  documentationLink       String?
  
  overview                String?       @db.Text
  problemStatement        String?       @db.Text
  techStack               String[]
  features                String?       @db.Text  // TipTap
  installationGuide       String?       @db.Text  // TipTap
  contributionGuidelines  String?       @db.Text  // TipTap
  roadmap                 String?       @db.Text  // TipTap
  customContribInstructions String?     @db.Text
  skillsRequired          String[]
  images                  String[]
  customLinks             Json?
  
  ogImage                 String?
  ogTitle                 String?
  ogDescription           String?
  metaKeywords            String?
  
  isPublished             Boolean       @default(false)
  createdAt               DateTime      @default(now())
  updatedAt               DateTime      @updatedAt
  
  contributors            OSContributor[]
  tasks                   ContributorTask[]
  enquiries               Enquiry[]
  
  @@unique([tenantId, slug])
}

model OSContributor {
  id              String   @id @default(cuid())
  projectId       String
  project         OpenSourceProject @relation(fields: [projectId], references: [id])
  tenantId        String
  
  name            String
  githubUrl       String?
  role            String?
  avatarUrl       String?
  
  tasks           ContributorTask[]
  createdAt       DateTime @default(now())
}

model ContributorTask {
  id            String          @id @default(cuid())
  projectId     String
  project       OpenSourceProject @relation(fields: [projectId], references: [id])
  contributorId String?
  contributor   OSContributor?  @relation(fields: [contributorId], references: [id])
  tenantId      String
  
  title         String
  description   String?         @db.Text
  status        TaskStatus      @default(OPEN)
  priority      Priority        @default(MEDIUM)
  dueDate       DateTime?
  
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
}

enum TaskStatus { OPEN IN_PROGRESS REVIEW DONE CLOSED }
enum Priority  { LOW MEDIUM HIGH URGENT }
```

#### Blog
```prisma
model BlogPost {
  id              String      @id @default(cuid())
  tenantId        String
  tenant          Tenant      @relation(fields: [tenantId], references: [id])
  
  title           String
  slug            String
  authorId        String      // user id
  category        String?
  status          PostStatus  @default(DRAFT)
  publishedAt     DateTime?
  readingTime     Int?        // minutes
  excerpt         String?
  tags            String[]
  content         String?     @db.Text  // TipTap HTML
  featuredImage   String?
  
  ogImage         String?
  seoTitle        String?
  seoDescription  String?
  metaKeywords    String?
  
  viewCount       Int         @default(0)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  enquiries       Enquiry[]
  
  @@unique([tenantId, slug])
}

enum PostStatus { DRAFT PUBLISHED SCHEDULED ARCHIVED }
```

#### Services, Reviews, Contacts, Enquiries
```prisma
model Service {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  
  title       String
  slug        String
  description String?  @db.Text
  price       Decimal? @db.Money
  currency    String   @default("INR")
  image       String?
  isPublished Boolean  @default(false)
  customLinks Json?
  
  ogImage     String?
  seoTitle    String?
  seoDescription String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  enquiries   Enquiry[]
  reviews     Review[]
  
  @@unique([tenantId, slug])
}

model Review {
  id          String       @id @default(cuid())
  tenantId    String
  tenant      Tenant       @relation(fields: [tenantId], references: [id])
  projectId   String?
  serviceId   String?
  
  reviewerName  String
  reviewerEmail String?
  rating        Int         // 1-5
  content       String?     @db.Text
  status        ReviewStatus @default(PENDING)
  
  project     Project?     @relation(fields: [projectId], references: [id])
  service     Service?     @relation(fields: [serviceId], references: [id])
  
  createdAt   DateTime     @default(now())
}

model Enquiry {
  id            String        @id @default(cuid())
  tenantId      String
  tenant        Tenant        @relation(fields: [tenantId], references: [id])
  
  name          String
  email         String
  message       String        @db.Text
  phone         String?
  source        EnquirySource // PROJECT, OPEN_SOURCE, BLOG, SERVICE
  projectId     String?
  osProjectId   String?
  blogId        String?
  serviceId     String?
  status        EnquiryStatus @default(NEW)
  
  project       Project?      @relation(fields: [projectId], references: [id])
  osProject     OpenSourceProject? @relation(fields: [osProjectId], references: [id])
  blog          BlogPost?     @relation(fields: [blogId], references: [id])
  service       Service?      @relation(fields: [serviceId], references: [id])
  
  createdAt     DateTime      @default(now())
}

model Contact {
  id        String        @id @default(cuid())
  tenantId  String
  tenant    Tenant        @relation(fields: [tenantId], references: [id])
  
  name      String
  email     String
  subject   String?
  message   String        @db.Text
  status    EnquiryStatus @default(NEW)
  
  createdAt DateTime      @default(now())
}

enum ReviewStatus  { PENDING APPROVED REJECTED }
enum EnquirySource { PROJECT OPEN_SOURCE BLOG SERVICE COLLABORATION }
enum EnquiryStatus { NEW READ REPLIED RESOLVED ARCHIVED }
```

#### Expense Tracker
```prisma
model Expense {
  id          String          @id @default(cuid())
  userId      String
  user        User            @relation(fields: [userId], references: [id])
  
  title       String
  amount      Decimal         @db.Decimal(10, 2)
  currency    String          @default("INR")
  category    String
  date        DateTime
  description String?
  isRecurring Boolean         @default(false)
  recurringPeriod RecurringPeriod?
  
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
}

model Budget {
  id          String   @id @default(cuid())
  userId      String   @unique
  monthlyBudget Decimal @db.Decimal(10, 2)
  categories  Json?    // { category: budget }
  currency    String   @default("INR")
  updatedAt   DateTime @updatedAt
}

enum RecurringPeriod { DAILY WEEKLY MONTHLY YEARLY }
```

#### Subscriptions & Payments
```prisma
model Subscription {
  id                String   @id @default(cuid())
  tenantId          String   @unique
  tenant            Tenant   @relation(fields: [tenantId], references: [id])
  
  razorpaySubId     String?  @unique
  razorpayCustomerId String?
  plan              PlanType
  status            SubStatus @default(ACTIVE)
  currentPeriodStart DateTime
  currentPeriodEnd  DateTime
  cancelAtPeriodEnd Boolean  @default(false)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model PaymentLog {
  id              String   @id @default(cuid())
  tenantId        String
  razorpayOrderId String?
  razorpayPaymentId String?
  amount          Decimal
  currency        String   @default("INR")
  status          String
  metadata        Json?
  createdAt       DateTime @default(now())
}

enum SubStatus { ACTIVE PAST_DUE CANCELLED TRIALING }
```

#### Audit Log (Super Admin)
```prisma
model AuditLog {
  id          String   @id @default(cuid())
  userId      String?
  user        User?    @relation(fields: [userId], references: [id])
  tenantId    String?
  
  action      String   // e.g. "project.created", "user.disabled"
  entity      String?  // e.g. "Project"
  entityId    String?
  metadata    Json?
  ipAddress   String?
  userAgent   String?
  
  createdAt   DateTime @default(now())
}

model SupportRequest {
  id          String          @id @default(cuid())
  tenantId    String?
  userId      String?
  name        String
  email       String
  subject     String
  message     String          @db.Text
  status      SupportStatus   @default(OPEN)
  priority    Priority        @default(MEDIUM)
  adminNotes  String?
  resolvedAt  DateTime?
  createdAt   DateTime        @default(now())
}

enum SupportStatus { OPEN IN_PROGRESS RESOLVED CLOSED }
```

---

## Project Structure

```
buildmora/
├── src/
│   ├── app/
│   │   ├── (marketing)/              # Public marketing site
│   │   │   ├── page.tsx              # Landing page
│   │   │   ├── features/
│   │   │   ├── pricing/
│   │   │   ├── docs/
│   │   │   ├── faq/
│   │   │   ├── support/
│   │   │   ├── about/
│   │   │   ├── blog/                 # Platform blog
│   │   │   ├── privacy-policy/
│   │   │   └── terms-of-service/
│   │   │
│   │   ├── (auth)/                   # Auth pages
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── verify-email/
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   │
│   │   ├── dashboard/                # Tenant admin dashboard
│   │   │   ├── layout.tsx            # Sidebar + topbar layout
│   │   │   ├── page.tsx              # Overview / analytics
│   │   │   ├── profile/
│   │   │   │   └── page.tsx          # Profile editor
│   │   │   ├── personalization/
│   │   │   │   └── page.tsx          # Theme, appearance
│   │   │   ├── expenses/
│   │   │   │   ├── page.tsx          # Expense overview
│   │   │   │   ├── history/
│   │   │   │   ├── analytics/
│   │   │   │   └── recurring/
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx          # Projects list
│   │   │   │   ├── new/
│   │   │   │   └── [id]/
│   │   │   │       └── edit/
│   │   │   ├── open-source/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   └── [id]/edit/
│   │   │   ├── contributors/
│   │   │   │   ├── page.tsx          # Contributors list
│   │   │   │   └── [id]/tasks/
│   │   │   ├── blog/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   └── [id]/edit/
│   │   │   ├── reviews/
│   │   │   ├── services/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   └── [id]/edit/
│   │   │   ├── enquiries/
│   │   │   ├── contacts/
│   │   │   ├── admins/
│   │   │   └── settings/
│   │   │       ├── page.tsx          # General settings
│   │   │       ├── seo/
│   │   │       ├── domain/
│   │   │       └── appearance/
│   │   │
│   │   ├── super-admin/              # Super Admin portal
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # Super admin overview
│   │   │   ├── users/
│   │   │   │   ├── page.tsx          # All users
│   │   │   │   └── [id]/
│   │   │   ├── tenants/
│   │   │   │   ├── page.tsx          # All tenants/sites
│   │   │   │   └── [id]/
│   │   │   ├── subscriptions/
│   │   │   ├── analytics/
│   │   │   ├── support/
│   │   │   ├── audit-logs/
│   │   │   └── settings/
│   │   │
│   │   ├── [domain]/                 # Tenant public site (subdomain/custom domain)
│   │   │   ├── page.tsx              # Public profile home
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx          # Public projects list
│   │   │   │   └── [slug]/           # Project detail
│   │   │   ├── open-source/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/
│   │   │   ├── blog/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/
│   │   │   ├── services/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/
│   │   │   ├── about/                # About + contact form
│   │   │   └── contact/
│   │   │
│   │   └── api/                      # API Routes
│   │       ├── auth/[...nextauth]/
│   │       ├── tenants/
│   │       ├── profile/
│   │       ├── projects/
│   │       ├── open-source/
│   │       ├── blog/
│   │       ├── services/
│   │       ├── reviews/
│   │       ├── enquiries/
│   │       ├── contacts/
│   │       ├── expenses/
│   │       ├── contributors/
│   │       ├── ai/
│   │       │   ├── generate/         # Gemini content generation
│   │       │   └── suggest/
│   │       ├── upload/               # S3 presigned URL generator
│   │       ├── webhooks/
│   │       │   ├── razorpay/
│   │       │   └── email/
│   │       └── admin/                # Super admin APIs
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui base components
│   │   ├── layout/
│   │   │   ├── DashboardSidebar.tsx
│   │   │   ├── DashboardTopbar.tsx
│   │   │   ├── SuperAdminLayout.tsx
│   │   │   └── MarketingNav.tsx
│   │   ├── dashboard/
│   │   │   ├── OverviewStats.tsx     # KPI cards
│   │   │   ├── AnalyticsChart.tsx    # Recharts wrappers
│   │   │   ├── ActivityFeed.tsx
│   │   │   └── PerformanceMetrics.tsx
│   │   ├── editor/
│   │   │   ├── TipTapEditor.tsx      # Rich text editor
│   │   │   └── AIAssistantPanel.tsx  # Gemini sidebar
│   │   ├── forms/
│   │   │   ├── ProjectForm.tsx
│   │   │   ├── OpenSourceForm.tsx
│   │   │   ├── BlogForm.tsx
│   │   │   └── ServiceForm.tsx
│   │   ├── expenses/
│   │   │   ├── ExpenseCard.tsx
│   │   │   ├── BudgetMeter.tsx
│   │   │   └── CashFlowChart.tsx
│   │   ├── public/                   # Public profile components
│   │   │   ├── ProfileHero.tsx
│   │   │   ├── ProjectCard.tsx
│   │   │   ├── BlogCard.tsx
│   │   │   └── ContactForm.tsx
│   │   └── shared/
│   │       ├── StarRating.tsx
│   │       ├── ImageUploader.tsx     # S3 direct upload
│   │       ├── SlugInput.tsx
│   │       └── SEOPreview.tsx
│   │
│   ├── lib/
│   │   ├── auth.ts                   # Auth.js config
│   │   ├── db.ts                     # Prisma client
│   │   ├── s3.ts                     # S3 presigned URL utils
│   │   ├── ses.ts                    # SES email helpers
│   │   ├── gemini.ts                 # Gemini API client
│   │   ├── razorpay.ts               # Razorpay client
│   │   ├── tenant.ts                 # Tenant resolution middleware
│   │   ├── rbac.ts                   # Permission checks
│   │   ├── sitemap.ts                # Dynamic sitemap generator
│   │   └── validators/               # Zod schemas
│   │
│   ├── hooks/
│   │   ├── useTenant.ts
│   │   ├── useAIAssistant.ts
│   │   └── useUpload.ts
│   │
│   ├── emails/                       # React Email templates
│   │   ├── EnquiryNotification.tsx
│   │   ├── ContactNotification.tsx
│   │   ├── WelcomeEmail.tsx
│   │   ├── SupportConfirmation.tsx
│   │   └── CollaborationRequest.tsx
│   │
│   └── middleware.ts                 # Tenant domain resolution
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── public/
│   ├── robots.txt                    # Platform-level robots.txt
│   └── sitemap.xml                   # Platform sitemap
│
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## RBAC & Multi-Tenant Authorization

### Permission Matrix

| Feature | Super Admin | Tenant Owner | Tenant Admin | Collaborator | Public |
|---|---|---|---|---|---|
| View all tenants | ✅ | ❌ | ❌ | ❌ | ❌ |
| Disable users | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage own profile | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage projects | ✅ | ✅ | ✅ | View Only | ❌ |
| Add blog posts | ✅ | ✅ | ✅ | Draft Only | ❌ |
| Manage services | ✅ | ✅ | ✅ | ❌ | ❌ |
| View enquiries | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage contributors | ✅ | ✅ | ✅ | View Tasks | ❌ |
| Site settings | ✅ | ✅ | ✅ | ❌ | ❌ |
| Billing/subscriptions | ✅ | ✅ | ❌ | ❌ | ❌ |
| Add tenant admins | ✅ | ✅ | ❌ | ❌ | ❌ |
| Expense tracker | N/A | ✅ | N/A | N/A | ❌ |
| View public profiles | ✅ | ✅ | ✅ | ✅ | ✅ |
| Submit contact forms | ✅ | ✅ | ✅ | ✅ | ✅ |

### Middleware Tenant Resolution
```typescript
// middleware.ts
// 1. Check Host header against custom domains in DB (cached via Redis or in-memory)
// 2. Fall back to subdomain: {slug}.buildmora.com
// 3. Inject tenantId into request headers for SSR
// 4. Redirect /dashboard to auth if not logged in
// 5. Redirect /super-admin to auth + check isSuperAdmin
```

---

## API Design

### REST Endpoints (Next.js API Routes)

#### Auth
- `POST /api/auth/register` — Create user + provision tenant
- `GET/POST /api/auth/[...nextauth]` — NextAuth handlers
- `POST /api/auth/verify-email` — Email verification
- `POST /api/auth/mfa/setup` — TOTP setup
- `POST /api/auth/mfa/verify` — TOTP verification

#### Tenant & Profile
- `GET/PUT /api/tenants/[id]` — Tenant settings
- `GET/PUT /api/profile` — Profile CRUD (tenant-scoped)
- `GET /api/tenants/[id]/analytics` — Dashboard KPIs

#### Projects
- `GET /api/projects` — List (tenant-scoped, with pagination/filter)
- `POST /api/projects` — Create
- `GET/PUT/DELETE /api/projects/[id]` — CRUD
- `POST /api/projects/[id]/publish` — Toggle publish

#### Open Source
- `GET/POST /api/open-source` — List + Create
- `GET/PUT/DELETE /api/open-source/[id]` — CRUD
- `GET/POST /api/open-source/[id]/contributors` — Manage contributors
- `GET/POST /api/open-source/[id]/tasks` — Manage tasks

#### Blog
- `GET/POST /api/blog` — List + Create
- `GET/PUT/DELETE /api/blog/[id]` — CRUD
- `POST /api/blog/[id]/publish` — Toggle publish

#### Expenses
- `GET/POST /api/expenses` — List + Create
- `PUT/DELETE /api/expenses/[id]` — Update/Delete
- `GET/PUT /api/expenses/budget` — Budget config
- `GET /api/expenses/analytics` — Trends, category breakdown

#### Enquiries & Contacts
- `GET /api/enquiries` — List (tenant dashboard)
- `POST /api/enquiries` — Submit (public form → triggers SES)
- `PUT /api/enquiries/[id]` — Update status
- `GET/POST /api/contacts` — Contact form submissions

#### AI Assistant
- `POST /api/ai/generate` — Generate content with Gemini
  - Body: `{ context, type: "description"|"seo"|"keywords"|"outline"|"summary", data }`
- `POST /api/ai/suggest` — Get improvement suggestions

#### File Upload
- `POST /api/upload/presign` — Generate S3 presigned PUT URL
  - Body: `{ fileName, fileType, folder }`
  - Returns: `{ uploadUrl, publicUrl, key }`

#### Super Admin
- `GET /api/admin/users` — All users (paginated, filterable)
- `PUT /api/admin/users/[id]/disable` — Disable/enable user
- `GET /api/admin/tenants` — All tenants
- `GET /api/admin/analytics` — Platform-wide metrics
- `GET /api/admin/audit-logs` — Audit trail
- `GET /api/admin/support` — All support requests

#### Webhooks
- `POST /api/webhooks/razorpay` — Payment events (HMAC verified)

---

## AI Assistant Integration (Google Gemini)

### Use Cases per Section

| Section | AI Capabilities |
|---|---|
| **Project Form** | Generate description from title+tech stack, suggest SEO title/keywords, auto-generate slug |
| **Open Source** | Generate overview, installation guide, contribution guidelines, roadmap from GitHub README |
| **Blog Editor** | Generate outline from title, expand sections, suggest tags, write excerpt, improve readability |
| **SEO Fields** | Auto-generate meta descriptions and keywords from content |
| **Profile** | Suggest bio/headline from skills and experience |

### Implementation
```typescript
// lib/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

// Rate limited: 10 requests/minute per tenant (free tier)
// Premium tenants: higher limits via Gemini Pro
```

### AI Assistant UI
- Floating panel on the right side of forms
- "✨ AI Assist" button in TipTap toolbar
- Suggestions shown in a diff-style preview (accept/reject)
- Prompt templates pre-loaded per context type

---

## Email Workflows (AWS SES)

### Triggered Emails

| Event | Recipients | Template |
|---|---|---|
| New user registration | User | `WelcomeEmail` + verification link |
| New enquiry submitted | Tenant owner + visitor | `EnquiryNotification` + `EnquiryConfirmation` |
| New contact form | Tenant owner + visitor | `ContactNotification` |
| Collaboration request | Tenant owner | `CollaborationRequest` |
| Support request | Super admin + submitter | `SupportConfirmation` |
| Subscription activated/cancelled | User | `SubscriptionUpdate` |
| Admin added to tenant | New admin | `AdminInvite` |

### Email Architecture
- Templates built with **React Email** + styled components
- Sent via `@aws-sdk/client-ses` in API route handlers
- SES verified domain: `@buildmora.com`
- Bounce/complaint handling via SES SNS webhooks

---

## File Upload Architecture (AWS S3)

### Presigned URL Flow
```
1. Frontend requests presigned URL → POST /api/upload/presign
2. API generates S3 presigned PUT URL (15 min expiry)
3. Frontend uploads directly to S3 (bypasses app server)
4. Frontend POSTs the returned S3 key to save in DB
5. CloudFront CDN serves the uploaded file
```

### S3 Bucket Structure
```
buildmora-assets/
├── tenants/{tenantId}/
│   ├── profile/          # avatar, cover
│   ├── projects/         # project images
│   ├── open-source/      # OS project images
│   ├── blog/             # blog featured images, OG images
│   ├── services/         # service images
│   └── og/               # per-page OG images
└── platform/
    └── ...               # platform-level assets
```

---

## SEO Architecture

### Per-Tenant Public Site
- **robots.txt**: Served dynamically at `/{domain}/robots.txt`
  - Disallow: `/dashboard`, `/api`
  - Sitemap: `https://{domain}/sitemap.xml`
- **sitemap.xml**: Dynamically generated
  - Includes: profile, all published projects, OS projects, blog posts, services
- **Per-page metadata**: Next.js `generateMetadata()` in each public route
- **OG images**: Stored in S3, referenced in `<meta property="og:image">`

### Platform-Level SEO
- Marketing pages have static metadata
- Platform blog with full SEO support
- `llms.txt` file exposing platform capabilities for LLM crawlers

---

## Subscription Plans

| Feature | Free | Starter | Pro | Enterprise |
|---|---|---|---|---|
| Projects | 3 | 10 | Unlimited | Unlimited |
| Blog Posts | 5 | 25 | Unlimited | Unlimited |
| Open Source Projects | 1 | 5 | Unlimited | Unlimited |
| AI Assists/month | 10 | 50 | 500 | Unlimited |
| Custom Domain | ❌ | ✅ | ✅ | ✅ |
| S3 Storage | 100MB | 1GB | 10GB | 100GB |
| Expense Tracker | ✅ | ✅ | ✅ | ✅ |
| Analytics | Basic | Advanced | Full | Full + API |
| Priority Support | ❌ | ❌ | ✅ | ✅ |

---

## Deployment Architecture (AWS)

```
Route 53 (DNS)
     │
     ├─── buildmora.com → CloudFront → Next.js (ECS Fargate)
     │                                      │
     │                              ┌───────┴────────┐
     │                              │  AWS RDS       │
     └─── *.buildmora.com ─────>    │  (PostgreSQL)  │
                                    └───────┬────────┘
                                            │
                               ┌────────────┼────────────┐
                               │            │            │
                             S3+CF        SES         CloudWatch
                          (File storage) (Emails)    (Monitoring)
```

### Infrastructure as Code (recommended)
- Use **AWS CDK** or **Terraform** for reproducible infra
- Separate environments: `dev`, `staging`, `production`
- Secrets in **AWS Secrets Manager** / `.env.local`
- CI/CD: **GitHub Actions** → build → push to ECR → ECS rolling update

---

## Security Implementation

### OWASP Compliance
- ✅ **SQL Injection**: Prisma parameterized queries
- ✅ **XSS**: TipTap HTML sanitization via DOMPurify; CSP headers
- ✅ **CSRF**: SameSite cookies + CSRF tokens on state-changing forms
- ✅ **Auth**: NextAuth + bcrypt (12 rounds) + JWT RS256
- ✅ **Rate Limiting**: API rate limits per IP/tenant (next-rate-limit or Upstash)
- ✅ **Tenant Isolation**: Every DB query includes `WHERE tenant_id = ?`
- ✅ **File Upload**: Validate MIME type + size limit server-side before presign
- ✅ **HTTPS Only**: CloudFront enforces HTTPS; HSTS headers
- ✅ **Secrets**: No secrets in client bundles; all in server-only lib files
- ✅ **Audit Log**: All sensitive actions logged to `AuditLog` table

---

## Public Marketing Site Pages

| Route | Content |
|---|---|
| `/` | Landing page (hero, features, testimonials, pricing CTA) |
| `/features` | Detailed feature breakdown with screenshots |
| `/pricing` | Plan comparison table with Razorpay checkout |
| `/docs` | Documentation hub (Getting Started, API reference) |
| `/faq` | Accordion FAQ |
| `/support` | Support form + ticket status |
| `/about` | Company/platform info |
| `/blog` | Platform-level blog |
| `/privacy-policy` | Legal page |
| `/terms-of-service` | Legal page |

---

## Implementation Phases

### Phase 1 — Foundation (Weeks 1–3)
- [ ] Project setup (Next.js 15, Prisma, Tailwind, shadcn/ui)
- [ ] Database schema + migrations
- [ ] Auth.js setup (credentials + OAuth + email verification + MFA)
- [ ] Tenant provisioning on registration
- [ ] Middleware for tenant domain resolution
- [ ] RBAC permission layer (`lib/rbac.ts`)
- [ ] S3 presigned upload endpoint
- [ ] SES email service + React Email templates

### Phase 2 — Dashboard Core (Weeks 4–6)
- [ ] Dashboard layout (sidebar, topbar, breadcrumbs)
- [ ] Overview/analytics page (KPI cards, Recharts)
- [ ] Profile management (form + S3 image upload)
- [ ] Site settings (general, SEO, appearance)
- [ ] Personalization (theme, colors, fonts)

### Phase 3 — Content Management (Weeks 7–10)
- [ ] Projects CRUD + TipTap editor + AI assistant
- [ ] Open Source Projects CRUD + AI assistant
- [ ] Contributors + Task management (Kanban board)
- [ ] Blog CRUD + TipTap + AI assistant + SEO preview
- [ ] Services CRUD
- [ ] Reviews moderation
- [ ] Enquiries + Contacts management + SES triggers

### Phase 4 — Expense Tracker (Week 11)
- [ ] Expense CRUD + recurring bills
- [ ] Budget configuration
- [ ] Expense analytics (Recharts: pie, line, bar)
- [ ] Export (CSV download)

### Phase 5 — Public Profile Sites (Weeks 12–14)
- [ ] SSR public profile pages (tenant-resolved)
- [ ] Public project detail pages
- [ ] Public blog with reading time + SEO
- [ ] Public services + enquiry forms
- [ ] Dynamic robots.txt + sitemap.xml per tenant
- [ ] Custom domain support (middleware)

### Phase 6 — Super Admin Portal (Week 15)
- [ ] User management (list, view, disable)
- [ ] Tenant management
- [ ] Platform analytics
- [ ] Audit log viewer
- [ ] Support ticket management
- [ ] Subscription/billing management

### Phase 7 — Payments & Subscriptions (Week 16)
- [ ] Razorpay subscription plans
- [ ] Webhook handler for payment events
- [ ] Plan enforcement (feature gates based on plan)
- [ ] Billing dashboard

### Phase 8 — Marketing Site + Legal (Week 17)
- [ ] Landing page (hero, features, pricing, testimonials)
- [ ] Docs pages
- [ ] FAQ + Support pages
- [ ] Privacy Policy + Terms of Service
- [ ] Platform blog
- [ ] Platform-level robots.txt + sitemap.xml + llms.txt

### Phase 9 — Polish & Production (Week 18)
- [ ] Performance optimization (ISR, image optimization, lazy loading)
- [ ] Security audit (OWASP checklist)
- [ ] Load testing
- [ ] AWS production deployment (ECS + RDS + CloudFront)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Monitoring (CloudWatch + Sentry)

---

## Key Dependencies

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "@auth/prisma-adapter": "latest",
    "next-auth": "^5.0.0",
    "@prisma/client": "^5.x",
    "@tiptap/react": "latest",
    "@tiptap/extension-*": "latest",
    "recharts": "^2.x",
    "@google/generative-ai": "latest",
    "@aws-sdk/client-s3": "latest",
    "@aws-sdk/client-ses": "latest",
    "@aws-sdk/s3-request-presigner": "latest",
    "razorpay": "latest",
    "react-email": "latest",
    "@react-email/components": "latest",
    "zod": "^3.x",
    "react-hook-form": "latest",
    "@hookform/resolvers": "latest",
    "dompurify": "latest",
    "bcryptjs": "latest",
    "otplib": "latest",
    "sharp": "latest",
    "date-fns": "latest",
    "clsx": "latest",
    "lucide-react": "latest"
  },
  "devDependencies": {
    "prisma": "^5.x",
    "typescript": "^5.x",
    "tailwindcss": "^3.x"
  }
}
```

---

## ✅ Finalized Architecture Decisions

### 1. Custom Domain SSL — AWS ACM Wildcard
- Wildcard cert `*.buildmora.com` via AWS ACM covers all `{slug}.buildmora.com` subdomains
- For tenant **custom domains**: tenant adds `CNAME @ → cname.buildmora.com` in their DNS registrar
- ACM cert provisioned per custom domain via ACM API (DNS validation auto-flow)
- ALB terminates SSL and routes to Next.js app by `Host` header
- `Tenant.customDomainVerified Boolean` tracks verification status
- Dashboard shows DNS instructions + live verification status checker

### 2. Subdomain Routing — `{slug}.buildmora.com`
- Route 53 wildcard A record: `*.buildmora.com → ALB`
- Next.js `middleware.ts` reads `Host` header → strips `.buildmora.com` → extracts slug
- Slug cached in-memory (LRU cache, 5 min TTL) → resolved to `tenantId`
- Custom domain fallback: if Host ≠ `*.buildmora.com`, query `Tenant.customDomain` column
- Additional DB models needed:
  ```prisma
  // Added to Tenant model
  customDomainVerified  Boolean  @default(false)
  customDomainVerifiedAt DateTime?
  gaMeasurementId       String?   // GA4 slot
  ```

### 3. MFA — TOTP (Google Authenticator) + Email OTP
- **TOTP**: `otplib` generates secret; stored AES-encrypted in `User.mfaSecret`
  - QR code via `qrcode` npm package for Google Authenticator / Authy
- **Email OTP**: 6-digit code hashed with bcrypt, sent via SES, expires in 10 min
  ```prisma
  model EmailOtp {
    id        String   @id @default(cuid())
    userId    String
    codeHash  String
    purpose   OtpPurpose  // LOGIN, EMAIL_VERIFY, PASSWORD_RESET
    expiresAt DateTime
    used      Boolean  @default(false)
    createdAt DateTime @default(now())
  }
  enum OtpPurpose { LOGIN EMAIL_VERIFY PASSWORD_RESET MFA_SETUP }
  ```
- User selects preferred MFA in Security Settings (TOTP or Email OTP)
- Both can be active simultaneously as fallback

### 4. AI Credits — Per-Plan Credit System
```prisma
model AiCreditLedger {
  id        String   @id @default(cuid())
  tenantId  String
  month     String   // "2026-07" — YYYY-MM
  used      Int      @default(0)
  limit     Int      // -1 = unlimited
  updatedAt DateTime @updatedAt

  @@unique([tenantId, month])
}
```
- Limits: Free=10, Starter=50, Pro=500, Enterprise=-1 (unlimited)
- Every `POST /api/ai/generate` → check ledger → reject if `used >= limit` → increment `used`
- Credits reset on 1st of month (check-on-use strategy: compare month string)
- Dashboard sidebar shows credit usage meter: `Used 3 / 10 AI credits this month`
- Super admin can manually grant bonus credits

### 5. Analytics — GA4 Integration Slot + Internal Events
- Tenant enters **GA4 Measurement ID** in `Dashboard → Site Settings → Analytics`
- Stored as `Tenant.gaMeasurementId`
- Public profile pages inject GA4 `<Script>` conditionally:
  ```tsx
  {tenant.gaMeasurementId && (
    <GoogleAnalytics gaId={tenant.gaMeasurementId} />
  )}
  ```
- Internal dashboard KPIs powered by `AnalyticsEvent` table:
  ```prisma
  model AnalyticsEvent {
    id        String    @id @default(cuid())
    tenantId  String
    type      EventType
    entityId  String?   // projectId, blogId, etc.
    metadata  Json?     // { path, referrer, country }
    createdAt DateTime  @default(now())
  }
  enum EventType {
    PAGE_VIEW PROJECT_VIEW BLOG_VIEW SERVICE_VIEW
    FORM_SUBMIT ENQUIRY_SUBMIT CONTACT_SUBMIT REVIEW_SUBMIT
  }
  ```
- Events logged server-side on every public SSR page load
- Dashboard charts aggregate `AnalyticsEvent` by type + date range

---

## Verification Plan

### Automated Tests
- `npx prisma db push` — Schema validation
- `jest` — Unit tests for RBAC logic, tenant resolution, API validators
- `playwright` — E2E: register → create project → publish → view public page

### Manual Verification
- Full registration + onboarding flow
- Multi-tenant isolation (two users can't see each other's data)
- AI assistant in all three editors (project, blog, open source)
- Expense tracker with budget alerts
- Custom domain resolution in middleware
- SES email delivery for all trigger points
- Super admin can view/disable any tenant
- Razorpay subscription + webhook + plan enforcement
- SEO: robots.txt and sitemap.xml generated correctly per tenant
- Public profile pages SSR with correct OG metadata
