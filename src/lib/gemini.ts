import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { prisma } from "@/lib/db";
import { isUnlimited } from "@/lib/rbac";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const MODEL = process.env.GEMINI_MODEL ?? "gemini-1.5-flash";

const model = genAI.getGenerativeModel({
  model: MODEL,
  safetySettings: [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  ],
  generationConfig: {
    temperature: 0.7,
    topP: 0.9,
    maxOutputTokens: 2048,
  },
});

// ─────────────────────────────────────────────────────────────────────────────

export type AIGenerationType =
  | "project_description"
  | "project_seo"
  | "os_overview"
  | "os_installation"
  | "os_contribution_guidelines"
  | "os_roadmap"
  | "blog_outline"
  | "blog_excerpt"
  | "blog_content"
  | "blog_tags"
  | "seo_title"
  | "seo_description"
  | "seo_keywords"
  | "profile_bio"
  | "profile_headline"
  | "service_description";

export interface AIGenerateParams {
  tenantId: string;
  type: AIGenerationType;
  context: Record<string, unknown>;
}

export interface AIGenerateResult {
  content: string;
  creditsUsed: number;
  creditsRemaining: number;
}

// ─── Credit check & deduction ─────────────────────────────────────────────────

async function checkAndDeductCredit(tenantId: string): Promise<{ remaining: number }> {
  const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true },
  });

  if (!tenant) throw new Error("Tenant not found");

  // Get or create ledger for current month
  const ledger = await prisma.aiCreditLedger.upsert({
    where: { tenantId_month: { tenantId, month: currentMonth } },
    create: {
      tenantId,
      month: currentMonth,
      used: 0,
      limit: getCreditLimit(tenant.plan),
    },
    update: {},
  });

  if (!isUnlimited(ledger.limit) && ledger.used >= ledger.limit) {
    throw new AICreditsExhaustedError(ledger.used, ledger.limit);
  }

  // Atomically increment usage
  const updated = await prisma.aiCreditLedger.update({
    where: { id: ledger.id },
    data: { used: { increment: 1 } },
  });

  const remaining = isUnlimited(ledger.limit)
    ? -1
    : ledger.limit - updated.used;

  return { remaining };
}

function getCreditLimit(plan: string): number {
  const limits: Record<string, number> = {
    FREE: 10,
    STARTER: 50,
    PRO: 500,
    ENTERPRISE: -1,
  };
  return limits[plan] ?? 10;
}

// ─── Prompt builders ──────────────────────────────────────────────────────────

function buildPrompt(type: AIGenerationType, context: Record<string, unknown>): string {
  const base = "You are a professional technical writer helping developers and students create portfolio content. Keep responses concise, professional, and developer-focused. Return only the content, no extra commentary.";

  const prompts: Record<AIGenerationType, string> = {
    project_description: `${base}\n\nWrite a compelling project description (2-3 paragraphs) for:\nTitle: ${context.title}\nTech Stack: ${context.techStack}\nStatus: ${context.status}\nCategory: ${context.category}\n${context.liveLink ? `Live: ${context.liveLink}` : ""}\n${context.githubLink ? `GitHub: ${context.githubLink}` : ""}`,

    project_seo: `${base}\n\nGenerate SEO metadata for a portfolio project:\nTitle: ${context.title}\nTech Stack: ${context.techStack}\nDescription: ${context.description}\n\nReturn JSON: {"seoTitle": "...", "seoDescription": "...", "keywords": "..."}`,

    os_overview: `${base}\n\nWrite an open source project overview (2-3 paragraphs) for:\nTitle: ${context.title}\nGitHub: ${context.githubLink}\nTech Stack: ${context.techStack}\nCategory: ${context.category}`,

    os_installation: `${base}\n\nWrite a clear installation guide for:\nTitle: ${context.title}\nTech Stack: ${context.techStack}\nGitHub: ${context.githubLink}\n\nFormat as markdown with code blocks.`,

    os_contribution_guidelines: `${base}\n\nWrite contribution guidelines for:\nTitle: ${context.title}\nTech Stack: ${context.techStack}\n\nInclude: fork/PR workflow, code standards, issue templates. Format as markdown.`,

    os_roadmap: `${base}\n\nWrite a roadmap for an open source project:\nTitle: ${context.title}\nFeatures so far: ${context.features}\n\nSuggest 3-4 future milestones. Format as markdown.`,

    blog_outline: `${base}\n\nCreate a detailed blog post outline for:\nTitle: ${context.title}\nCategory: ${context.category}\nTarget audience: ${context.audience ?? "developers"}\n\nReturn 5-7 section headings with brief notes.`,

    blog_excerpt: `${base}\n\nWrite a 2-sentence excerpt/meta description for a blog post:\nTitle: ${context.title}\nContent preview: ${String(context.content ?? "").slice(0, 500)}`,

    blog_content: `${base}\n\nExpand this blog section:\nHeading: ${context.heading}\nContext: ${context.context}\n\nWrite 2-3 well-structured paragraphs. Format as HTML.`,

    blog_tags: `${base}\n\nSuggest 5-8 relevant tags for:\nTitle: ${context.title}\nContent: ${String(context.content ?? "").slice(0, 500)}\n\nReturn as comma-separated values only.`,

    seo_title: `${base}\n\nWrite an SEO-optimized title (50-60 chars) for: "${context.originalTitle}"\nContext: ${context.context}`,

    seo_description: `${base}\n\nWrite an SEO meta description (150-160 chars) for:\nTitle: ${context.title}\nContent: ${String(context.content ?? "").slice(0, 300)}`,

    seo_keywords: `${base}\n\nGenerate 8-10 SEO keywords for:\nTitle: ${context.title}\nContent: ${String(context.content ?? "").slice(0, 300)}\n\nReturn comma-separated only.`,

    profile_bio: `${base}\n\nWrite a professional portfolio bio (100-150 words) for:\nName: ${context.name}\nHeadline: ${context.headline}\nSkills: ${context.skills}\nExperience: ${context.experience}`,

    profile_headline: `${base}\n\nWrite 3 short professional headline options (max 80 chars each) for:\nRole: ${context.role}\nSkills: ${context.skills}\n\nReturn as a numbered list.`,

    service_description: `${base}\n\nWrite a professional service description (100-150 words) for:\nService: ${context.title}\nCategory: ${context.category}\nPrice: ${context.price}`,
  };

  return prompts[type] ?? `${base}\n\nHelp with: ${JSON.stringify(context)}`;
}

// ─── Main generate function ───────────────────────────────────────────────────

export async function generateAIContent(
  params: AIGenerateParams
): Promise<AIGenerateResult> {
  const { tenantId, type, context } = params;

  // 1. Check & deduct credit
  const { remaining } = await checkAndDeductCredit(tenantId);

  // 2. Build prompt
  const prompt = buildPrompt(type, context);

  // 3. Call Gemini
  const result = await model.generateContent(prompt);
  const response = result.response;
  const content = response.text();

  return {
    content: content.trim(),
    creditsUsed: 1,
    creditsRemaining: remaining,
  };
}

// ─── Error types ──────────────────────────────────────────────────────────────

export class AICreditsExhaustedError extends Error {
  readonly status = 429;
  readonly used: number;
  readonly limit: number;

  constructor(used: number, limit: number) {
    super(`AI credits exhausted: ${used}/${limit} used this month`);
    this.name = "AICreditsExhaustedError";
    this.used = used;
    this.limit = limit;
  }
}
