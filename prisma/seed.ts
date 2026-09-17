import { PrismaClient, Role, Channel, Sentiment, FeedbackStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const THEMES_DATA = [
  { name: "Performance & Latency", description: "Feedback on loading speed, API latency, and responsiveness", color: "#ef4444" },
  { name: "Billing & Pricing", description: "Comments on plan pricing, subscription management, and invoice clarity", color: "#f59e0b" },
  { name: "UI & Usability", description: "Navigation, layout clarity, accessibility, and visual aesthetics", color: "#6366f1" },
  { name: "Onboarding & Docs", description: "First-run experience, tutorials, API docs, and guides", color: "#10b981" },
  { name: "Reliability & Uptime", description: "Service disruptions, 500 errors, timeout issues, and crash reports", color: "#ec4899" },
  { name: "Customer Support", description: "Support team response times, helpfulness, and resolution quality", color: "#8b5cf6" },
  { name: "Integrations & Export", description: "Slack, GitHub, CSV exports, webhook triggers, and third-party tools", color: "#06b6d4" },
];

const RAW_FEEDBACK_TEMPLATES = [
  // Performance
  { content: "The new analytics dashboard takes over 8 seconds to load on large data sets. Makes morning reviews painfully slow.", channel: Channel.WEB_FORM, sentiment: Sentiment.NEGATIVE, score: -0.82, feature: "Dashboard", theme: "Performance & Latency", rationale: "User experiencing high dashboard latency that hinders daily workflow." },
  { content: "Search query results come back under 200ms now. Huge improvement from last month's update!", channel: Channel.INTERCOM, sentiment: Sentiment.POSITIVE, score: 0.91, feature: "Search", theme: "Performance & Latency", rationale: "Praising sub-200ms latency improvement." },
  { content: "CSV export for 50k rows times out with a 504 Gateway Error. We need this for monthly executive reporting.", channel: Channel.EMAIL, sentiment: Sentiment.NEGATIVE, score: -0.9, feature: "Data Export", theme: "Performance & Latency", rationale: "Critical report export timeout preventing client compliance." },
  { content: "Page transitions feel a bit sluggish on mobile Safari, though desktop Chrome works fine.", channel: Channel.APP_STORE, sentiment: Sentiment.NEUTRAL, score: -0.15, feature: "Mobile Web", theme: "Performance & Latency", rationale: "Minor mobile rendering lag noticed." },
  { content: "Webhooks are delivering events in under 50 milliseconds. Great engineering team!", channel: Channel.EMAIL, sentiment: Sentiment.POSITIVE, score: 0.88, feature: "Webhooks", theme: "Performance & Latency", rationale: "User excited by ultra-fast webhook event delivery." },
  { content: "Loading state on the reports page flickers multiple times before showing the data.", channel: Channel.SURVEY, sentiment: Sentiment.NEGATIVE, score: -0.4, feature: "Reports", theme: "Performance & Latency", rationale: "Unpleasant visual jitter during async data fetch." },

  // Billing & Pricing
  { content: "We were charged for 15 seats instead of 10 after removing inactive team members last Tuesday.", channel: Channel.EMAIL, sentiment: Sentiment.NEGATIVE, score: -0.85, feature: "Billing", theme: "Billing & Pricing", rationale: "Prorated seat removal failed to adjust monthly invoice." },
  { content: "The transparent usage-based pricing tier saved us roughly 30% compared to our previous vendor.", channel: Channel.SURVEY, sentiment: Sentiment.POSITIVE, score: 0.85, feature: "Pricing", theme: "Billing & Pricing", rationale: "Customer delighted by transparent usage-based savings." },
  { content: "I wish there was an annual billing discount for startups. Right now only enterprise plans get custom pricing.", channel: Channel.INTERCOM, sentiment: Sentiment.NEUTRAL, score: 0.05, feature: "Pricing", theme: "Billing & Pricing", rationale: "Requesting startup annual discounts." },
  { content: "Invoice PDFs don't list VAT tax breakdown properly. Our accounting department rejected it.", channel: Channel.EMAIL, sentiment: Sentiment.NEGATIVE, score: -0.75, feature: "Invoicing", theme: "Billing & Pricing", rationale: "Missing VAT breakdown required by EU tax compliance." },
  { content: "Smooth checkout process and instant invoice receipt via email. Very professional.", channel: Channel.WEB_FORM, sentiment: Sentiment.POSITIVE, score: 0.78, feature: "Checkout", theme: "Billing & Pricing", rationale: "Clean checkout and instantaneous invoice generation." },
  { content: "Why can't I downgrade self-serve from Pro to Starter without contacting customer sales?", channel: Channel.APP_STORE, sentiment: Sentiment.NEGATIVE, score: -0.65, feature: "Plan Management", theme: "Billing & Pricing", rationale: "Forced contact wall for downgrading creates user friction." },

  // UI & Usability
  { content: "The dark mode contrast is gorgeous! Much easier on my eyes during late-night debugging sessions.", channel: Channel.INTERCOM, sentiment: Sentiment.POSITIVE, score: 0.95, feature: "Theme / Dark Mode", theme: "UI & Usability", rationale: "User loves dark mode styling and eye comfort." },
  { content: "It's not obvious how to filter feedback by date range. The calendar icon is hidden in a secondary menu.", channel: Channel.SURVEY, sentiment: Sentiment.NEGATIVE, score: -0.5, feature: "Filters", theme: "UI & Usability", rationale: "Hidden date filter controls degrade discoverability." },
  { content: "The navigation sidebar collapse animation is super slick and saves horizontal space.", channel: Channel.WEB_FORM, sentiment: Sentiment.POSITIVE, score: 0.8, feature: "Navigation", theme: "UI & Usability", rationale: "Positive reaction to collapsible sidebar animation." },
  { content: "Font size on the stat cards is too small when viewing on smaller 13-inch laptop screens.", channel: Channel.EMAIL, sentiment: Sentiment.NEUTRAL, score: -0.2, feature: "Typography", theme: "UI & Usability", rationale: "Typography scale issues on compact display viewports." },
  { content: "Modal dialog closes when clicking outside even if I had typed an unsubmitted paragraph. Lost my notes!", channel: Channel.WEB_FORM, sentiment: Sentiment.NEGATIVE, score: -0.88, feature: "Modals", theme: "UI & Usability", rationale: "Accidental backdrop click causes loss of user draft." },
  { content: "Clean layout, intuitive icons, and zero clutter. One of the best SaaS UIs I've seen this year.", channel: Channel.APP_STORE, sentiment: Sentiment.POSITIVE, score: 0.92, feature: "General UI", theme: "UI & Usability", rationale: "High praise for minimal and functional UI design." },

  // Onboarding & Docs
  { content: "The step-by-step interactive onboarding tour made setup take literally 4 minutes. Outstanding!", channel: Channel.SURVEY, sentiment: Sentiment.POSITIVE, score: 0.93, feature: "Onboarding", theme: "Onboarding & Docs", rationale: "Onboarding tour delivered immediate time-to-value." },
  { content: "API documentation has dead links in the authentication section. Had to guess the bearer token header syntax.", channel: Channel.EMAIL, sentiment: Sentiment.NEGATIVE, score: -0.7, feature: "API Docs", theme: "Onboarding & Docs", rationale: "Broken doc links hinder developer integration." },
  { content: "Code snippets in the docs only show cURL. Can you please add Python and TypeScript SDK examples?", channel: Channel.INTERCOM, sentiment: Sentiment.NEUTRAL, score: 0.0, feature: "SDK Docs", theme: "Onboarding & Docs", rationale: "Request for multi-language developer snippets." },
  { content: "Welcome email never arrived in my inbox or spam. Only realized my account was active when logging in manually.", channel: Channel.WEB_FORM, sentiment: Sentiment.NEGATIVE, score: -0.6, feature: "Sign up", theme: "Onboarding & Docs", rationale: "Transactional welcome email failed to dispatch." },
  { content: "The quickstart sample app on GitHub worked out of the box with zero configuration headaches.", channel: Channel.EMAIL, sentiment: Sentiment.POSITIVE, score: 0.89, feature: "Sample App", theme: "Onboarding & Docs", rationale: "Frictionless setup with official starter repository." },

  // Reliability & Uptime
  { content: "Platform threw 502 Bad Gateway during our peak European traffic hours. Multiple team members locked out.", channel: Channel.EMAIL, sentiment: Sentiment.NEGATIVE, score: -0.95, feature: "Platform Uptime", theme: "Reliability & Uptime", rationale: "Critical service outage impacting client production operations." },
  { content: "We've had 99.99% uptime over the past quarter. Reliability has been rock-solid.", channel: Channel.SURVEY, sentiment: Sentiment.POSITIVE, score: 0.94, feature: "Infrastructure", theme: "Reliability & Uptime", rationale: "Customer praising quarterly uptime stability." },
  { content: "Session disconnected abruptly while I was halfway through generating a VoC report.", channel: Channel.WEB_FORM, sentiment: Sentiment.NEGATIVE, score: -0.78, feature: "Session Auth", theme: "Reliability & Uptime", rationale: "Premature session invalidation during active workflow." },
  { content: "Occasional WebSocket reconnect banners appear, but it recovers within 2-3 seconds without data loss.", channel: Channel.INTERCOM, sentiment: Sentiment.NEUTRAL, score: 0.1, feature: "Real-time sync", theme: "Reliability & Uptime", rationale: "Minor transient connection blip with successful recovery." },
  { content: "Database query errors when selecting more than 6 months of historical feedback in the report generator.", channel: Channel.EMAIL, sentiment: Sentiment.NEGATIVE, score: -0.84, feature: "Reports DB", theme: "Reliability & Uptime", rationale: "Unoptimized long-range historical query causing DB errors." },

  // Customer Support
  { content: "Support agent Sarah responded within 8 minutes and fixed our webhook permissions on the spot. World-class support!", channel: Channel.INTERCOM, sentiment: Sentiment.POSITIVE, score: 0.98, feature: "Support Team", theme: "Customer Support", rationale: "Exceptional resolution speed and agent competence." },
  { content: "Waiting 4 days for a reply on a high-priority ticket is unacceptable for a paid tier customer.", channel: Channel.EMAIL, sentiment: Sentiment.NEGATIVE, score: -0.92, feature: "Support SLA", theme: "Customer Support", rationale: "Unacceptable SLA breach on priority support ticket." },
  { content: "Automated chatbot keeps looping in circles instead of transferring me to an actual human agent.", channel: Channel.WEB_FORM, sentiment: Sentiment.NEGATIVE, score: -0.8, feature: "Bot Support", theme: "Customer Support", rationale: "Frustrating bot loop preventing access to human support." },
  { content: "Help center articles are well written and answered my SSO question without needing to open a ticket.", channel: Channel.SURVEY, sentiment: Sentiment.POSITIVE, score: 0.82, feature: "Knowledge Base", theme: "Customer Support", rationale: "Self-serve knowledge base successfully resolved SSO inquiry." },
  { content: "Support resolved my issue, but communication could have been clearer regarding root cause.", channel: Channel.INTERCOM, sentiment: Sentiment.NEUTRAL, score: 0.15, feature: "Ticket Updates", theme: "Customer Support", rationale: "Issue resolved satisfactorily but lacking RCA transparency." },

  // Integrations & Export
  { content: "The Slack integration alerts our product managers in real time whenever negative feedback spikes. Invaluable!", channel: Channel.INTERCOM, sentiment: Sentiment.POSITIVE, score: 0.96, feature: "Slack Alerting", theme: "Integrations & Export", rationale: "High business value derived from real-time Slack alerts." },
  { content: "Exported CSV files have corrupted special characters and emojis. Needs UTF-8 BOM encoding fix.", channel: Channel.WEB_FORM, sentiment: Sentiment.NEGATIVE, score: -0.68, feature: "CSV Export", theme: "Integrations & Export", rationale: "Missing UTF-8 BOM causes Excel to misrender emojis." },
  { content: "Would love to see a native Linear or Jira integration to turn actioned feedback directly into engineering tickets.", channel: Channel.SURVEY, sentiment: Sentiment.NEUTRAL, score: 0.25, feature: "Issue Tracker Sync", theme: "Integrations & Export", rationale: "Feature request for two-way issue tracker synchronization." },
  { content: "Zapier integration was easy to connect. Hooked our Typeform survey responses right into LOOP.", channel: Channel.EMAIL, sentiment: Sentiment.POSITIVE, score: 0.87, feature: "Zapier", theme: "Integrations & Export", rationale: "Seamless third-party survey ingestion via Zapier." },
  { content: "Webhook payloads don't include cryptographic signatures. We cannot verify request authenticity.", channel: Channel.EMAIL, sentiment: Sentiment.NEGATIVE, score: -0.72, feature: "Webhook Security", theme: "Integrations & Export", rationale: "Security flaw: missing HMAC signatures on webhook payloads." }
];

const CUSTOMER_NAMES = [
  "Alex Rivera", "Sophia Zhang", "Marcus Vance", "Elena Rostova", "Liam O'Connor",
  "Amina Patel", "David Kim", "Chloe Dupont", "Carlos Mendez", "Hannah Schmidt",
  "Tariq Al-Mansoor", "Jessica Taylor", "Noah van der Meer", "Yuki Tanaka", "Rachel Green",
  "Gabriel Santos", "Emily Chen", "Jordan Miller", "Olivia Brown", "Lucas Rossi"
];

// Generate synthetic normalized embedding vector (size 16 for mock vector similarity)
function generateSyntheticEmbedding(sentimentScore: number, seedNum: number): string {
  const vector: number[] = [];
  for (let i = 0; i < 16; i++) {
    const val = Math.sin(seedNum * 13 + i * 7 + sentimentScore) * 0.5 + (sentimentScore * 0.3);
    vector.push(parseFloat(val.toFixed(4)));
  }
  return JSON.stringify(vector);
}

export async function seed() {
  console.log("🌱 Starting database seed...");

  // 1. Clean existing records in demo workspace if any
  const existingWorkspace = await prisma.workspace.findUnique({
    where: { slug: "acme-cloud" },
  });

  if (existingWorkspace) {
    console.log("Clearing previous demo workspace data...");
    await prisma.workspace.delete({ where: { id: existingWorkspace.id } });
  }

  // 2. Create Demo Workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: "Acme Cloud Technologies",
      slug: "acme-cloud",
    },
  });
  console.log(`✅ Created Workspace: ${workspace.name} (${workspace.id})`);

  // 3. Create 3 Demo Users
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@loop.dev",
      name: "Alex Vance (Admin)",
      passwordHash,
      role: Role.ADMIN,
      workspaceId: workspace.id,
    },
  });

  const analystUser = await prisma.user.create({
    data: {
      email: "analyst@loop.dev",
      name: "Maya Lin (Analyst)",
      passwordHash,
      role: Role.ANALYST,
      workspaceId: workspace.id,
    },
  });

  const viewerUser = await prisma.user.create({
    data: {
      email: "viewer@loop.dev",
      name: "Chris Jordan (Viewer)",
      passwordHash,
      role: Role.VIEWER,
      workspaceId: workspace.id,
    },
  });

  console.log(`✅ Created 3 Users:`);
  console.log(`   - ADMIN: ${adminUser.email} (Password: Password123!)`);
  console.log(`   - ANALYST: ${analystUser.email} (Password: Password123!)`);
  console.log(`   - VIEWER: ${viewerUser.email} (Password: Password123!)`);

  // 4. Create Themes
  const createdThemes = new Map<string, string>();
  for (const t of THEMES_DATA) {
    const theme = await prisma.theme.create({
      data: {
        workspaceId: workspace.id,
        name: t.name,
        description: t.description,
        color: t.color,
      },
    });
    createdThemes.set(t.name, theme.id);
  }
  console.log(`✅ Created ${createdThemes.size} Themes`);

  // 5. Generate 125+ realistic feedback records spread over the past 45 days
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;
  const totalToGenerate = 126;
  const statuses = [FeedbackStatus.NEW, FeedbackStatus.REVIEWED, FeedbackStatus.ACTIONED];

  let feedbackCreatedCount = 0;

  for (let i = 0; i < totalToGenerate; i++) {
    const template = RAW_FEEDBACK_TEMPLATES[i % RAW_FEEDBACK_TEMPLATES.length];
    const customer = CUSTOMER_NAMES[i % CUSTOMER_NAMES.length];
    const emailDomain = customer.toLowerCase().replace(/[^a-z]/g, "") + "@example.com";
    
    // Spread dates across last 45 days with clustering to simulate natural trends
    const daysAgo = Math.floor(Math.random() * 45);
    const createdAt = new Date(now - daysAgo * DAY_MS - Math.floor(Math.random() * 12 * 3600 * 1000));
    
    // Status distribution: older more likely actioned/reviewed, newer more likely new
    const status = daysAgo > 20 
      ? (i % 2 === 0 ? FeedbackStatus.ACTIONED : FeedbackStatus.REVIEWED)
      : (i % 3 === 0 ? FeedbackStatus.NEW : (i % 2 === 0 ? FeedbackStatus.REVIEWED : FeedbackStatus.ACTIONED));

    // Slight variance in text to make each record unique
    const content = i >= RAW_FEEDBACK_TEMPLATES.length 
      ? `[Ticket #${1000 + i}] ${template.content} (Reported in production environment by client team)`
      : template.content;

    const feedback = await prisma.feedback.create({
      data: {
        workspaceId: workspace.id,
        content,
        customerName: customer,
        customerEmail: emailDomain,
        channel: template.channel,
        sentiment: template.sentiment,
        sentimentScore: template.score,
        featureArea: template.feature,
        aiRationale: template.rationale,
        status,
        createdAt,
        updatedAt: createdAt,
      },
    });

    // Link theme
    const themeId = createdThemes.get(template.theme);
    if (themeId) {
      await prisma.feedbackTheme.create({
        data: {
          feedbackId: feedback.id,
          themeId,
          workspaceId: workspace.id,
        },
      });
    }

    // Generate embedding record for vector RAG search
    await prisma.embedding.create({
      data: {
        feedbackId: feedback.id,
        workspaceId: workspace.id,
        vectorJson: generateSyntheticEmbedding(template.score, i),
        createdAt,
      },
    });

    feedbackCreatedCount++;
  }

  console.log(`✅ Created ${feedbackCreatedCount} Feedback Records with Themes and Vector Embeddings`);

  // 6. Create 1 Initial VoC Report
  await prisma.report.create({
    data: {
      workspaceId: workspace.id,
      title: "Q3 Customer Intelligence & Voice-of-Customer Executive Brief",
      dateRangeStart: new Date(now - 30 * DAY_MS),
      dateRangeEnd: new Date(now),
      totalFeedback: feedbackCreatedCount,
      sentimentDistribution: {
        positive: 42,
        neutral: 31,
        negative: 53,
      },
      topThemes: [
        { theme: "Performance & Latency", count: 28, negativeRatio: 0.64 },
        { theme: "Customer Support", count: 24, negativeRatio: 0.42 },
        { theme: "Billing & Pricing", count: 22, negativeRatio: 0.55 },
        { theme: "UI & Usability", count: 20, negativeRatio: 0.30 },
      ],
      summary: "Customer sentiment over the trailing 30 days indicates high enthusiasm for real-time webhooks, modern UI aesthetics, and fast support response times. However, persistent latency spikes during CSV exports and occasional checkout invoice inaccuracies represent the primary churn hazards.",
      keyTakeaways: [
        "CSV export 504 timeouts are triggering direct negative executive escalations.",
        "Dark mode and new UI redesign are generating strong positive brand advocacy.",
        "Prorated seat billing changes require self-serve transparency to reduce support queue load.",
      ],
      recommendations: [
        "Optimize CSV export job to asynchronous background streaming worker.",
        "Implement self-serve seat management in billing portal.",
        "Formalize Slack incident bot alerting for latency spikes over 500ms.",
      ],
      createdById: adminUser.id,
    },
  });

  console.log("✅ Created initial Voice-of-Customer executive report");
  console.log("🚀 Database seeding completed successfully!");
}

seed()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
