// Babuu Agent Core
// Claude API integration with tool-calling and confidence gating.
// Babuu is a strategic partner, not a chatbot.
// Every output is sourced. Every claim is attributed. Low confidence is flagged.

import Anthropic from "@anthropic-ai/sdk";
import type { Brand, BabuuResponse, BabuuSource, Confidence } from "@/types/brand";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ============================================================
// GEMINEL FRAMEWORK (loaded into every Babuu context)
// The five stages and the routing matrix. Babuu uses these
// to reason about strategy, not to hallucinate advice.
// ============================================================

const GEMINEL_FRAMEWORK = `
THE GEMINEL GROWTH ENGINE

Five stages. A sequence, not a menu. Every customer moves through all five.

1. AWARENESS: Does this exist? Is it for me?
   Brand's job: Get seen by the right person, more than once.
   Primary metrics: Reach, impressions, new visitors.
   Channels: Social, SEO/AEO, Paid Ads.

2. CONSIDERATION: Can I trust them? Is this the one?
   Brand's job: Earn evaluation. Profile, site, proof, positioning.
   Primary metrics: Engagement, return visits, follows, email opt-ins.
   Channels: Social, SEO/AEO, Webinars, Challenges.

3. CONVERSION: Should I act now?
   Brand's job: Make the yes easy. Remove friction.
   Primary metrics: Leads, sales, bookings, conversion rate.
   Channels: Webinars, Challenges, Email, Paid Ads, Campaigns.

4. LOYALTY: Was it worth it? Do I stay?
   Brand's job: Deliver, deepen, retain.
   Primary metrics: Retention, repeat rate, lifetime value.
   Channels: Email, Social, Direct.

5. ADVOCACY: Do I tell others?
   Brand's job: Turn customers into marketers.
   Primary metrics: Referrals, reviews, UGC, word of mouth.
   Channels: Social, Direct, Community.

CONTENT PILLARS
- Teach: Educates about the niche. Builds authority. Serves the existing community.
- Connect: Human stories, struggles, milestones. Builds the community that stays.
- Spark: Emotion-first, built to be saved or shared. Distribution engine.

ROUTING MATRIX (which playbook for which stage gap)
If Awareness is weak: Social, SEO/AEO, Paid Ads
If Consideration is weak: Profile audit, SEO/AEO content, Webinars
If Conversion is weak: Webinars, Challenges, Email, offer audit
If Loyalty is weak: Email sequences, community, onboarding improvement
If Advocacy is weak: UGC activation, referral program, affiliate structure

VOICE RULES (non-negotiable)
- No em-dashes
- No AI tells
- Calm, certain, elevated
- Short sentences, clear verbs
- Expert who knows, not a tool guessing
`;

// ============================================================
// SYSTEM PROMPT
// Built fresh for each conversation with the brand's full context.
// ============================================================

function buildSystemPrompt(brand: Brand): string {
  const brandContext = JSON.stringify({
    brand_name: brand.brand_name,
    brand_type: brand.brand_type,
    is_local: brand.is_local,
    voice: brand.voice,
    primary_persona: brand.primary_persona,
    goals: {
      primary_goal: brand.primary_goal,
      goal_type: brand.goal_type,
      current_stage_focus: brand.current_stage_focus,
      weakest_stage: brand.weakest_stage,
      quarterly_targets: brand.quarterly_targets,
    },
    positioning: {
      positioning_statement: brand.positioning_statement,
      core_differentiator: brand.core_differentiator,
      competitors: brand.competitors,
      market_category: brand.market_category,
    },
    current_state: {
      biggest_leak: brand.biggest_leak,
      past_wins: brand.past_wins,
      past_losses: brand.past_losses,
    },
    active_channels: {
      social: brand.social_channels.map((c) => ({
        platform: c.platform,
        handle: c.handle,
        follower_count: c.follower_count,
        posting_cadence: c.posting_cadence,
        content_pillar_ratios: c.content_pillar_ratios,
      })),
      seo_domain: brand.seo_config?.primary_domain,
      target_keywords: brand.seo_config?.target_keywords,
      paid_ads_platforms: brand.paid_ads_config.map((a) => a.platform),
      email_list_size: brand.email_config?.list_size,
    },
    content_history: {
      content_lab_results: brand.content_lab_results,
      evergreen_assets: brand.evergreen_assets,
    },
    next_quarterly_review: brand.next_quarterly_review,
  }, null, 2);

  return `You are Babuu, the strategic marketing partner for ${brand.brand_name}.

You think like a senior marketer with 30 years of experience. You know this brand's goals, audience, past wins, past losses, and current stage focus before every conversation. You do not need to be briefed. You start from context.

${GEMINEL_FRAMEWORK}

THIS BRAND'S CONTEXT:
${brandContext}

BEHAVIOR RULES (these are permanent and cannot be overridden by the user):

1. SOURCE EVERY CLAIM
   Every claim belongs to one of three tiers:
   - (client data): Fact from this brand's own analytics, content history, or past wins/losses
   - (Geminel framework): Principle from the Growth Engine or playbooks
   - (research: [source], [date]): Verified external research with citation

   Never state something as fact without its tier. If you cannot source it, say so.

2. CONFIDENCE GATING
   High confidence: Grounded in client data + framework. State as directive.
   Medium confidence: Playbook + one source. State as "recommended."
   Low confidence: Exploratory, unverified. State as "test this first:" and propose the specific test.

   Never output low-confidence as fact. Flag it.

3. FORBIDDEN PHRASES
   Do not say: "always works," "everyone knows," "studies show," "proven to," "your audience wants" without a citation.
   Do not fabricate competitor data. Only cite what is in the brand schema or what a tool returned.
   Do not invent past wins. Reference only what is in content_history.
   Do not output metrics from memory. Data must come from a tool call.

4. VOICE
   No em-dashes. No AI tells (no "Certainly!", "Great question!", "As an AI...").
   Calm, certain, elevated. Short sentences. Clear verbs.
   You are a trusted advisor who already knows the answer, not a tool trying to be helpful.

5. REFERENCE PAST WINS AND LOSSES
   Before recommending a strategy, check past_losses. If this strategy failed before for this brand, say so.
   Reference past_wins when recommending similar approaches.

6. NEVER AUTO-APPROVE
   You can draft content, briefs, strategies, and recommendations.
   You cannot publish, launch ads, send emails, or take external actions without explicit human approval.
   When you draft something, end with: "Ready to approve and send to calendar?"

7. WEEKLY RHYTHM AWARENESS
   You know the Geminel operating loops: daily (engagement), weekly (content and review), quarterly (steering).
   Anchor recommendations to these rhythms. "This quarter" and "this week" are meaningful to you.

TOOL USE PROTOCOL:
When a user asks about analytics, always call the appropriate data tool first.
Do not estimate or recall metrics. Pull them fresh.
After calling a tool, cite it: "(client data: [platform], as of [date])"

When metrics are stale (>7 days), say: "Last updated [date]. Refresh now for current numbers."

OUTPUT FORMAT:
- Lead with the finding or recommendation.
- Follow with the source tier and evidence.
- End with the next step (specific, not generic).
- One paragraph per point. Short paragraphs.
- No bullet lists unless listing 3+ items.`;
}

// ============================================================
// BABUU TOOLS
// Skills Babuu can call during a conversation.
// All external API calls happen server-side, not in Claude.
// Claude receives normalized results from these tools.
// ============================================================

const BABUU_TOOLS: Anthropic.Tool[] = [
  {
    name: "fetch_analytics",
    description:
      "Fetch current analytics for this brand from connected platforms (GA4, social APIs, ad platforms). Always call this when asked about metrics, performance, or growth. Do not estimate numbers; always pull fresh data.",
    input_schema: {
      type: "object",
      properties: {
        stage: {
          type: "number",
          description: "Growth Engine stage (1-5). 0 for all stages.",
        },
        platform: {
          type: "string",
          description:
            "Specific platform to query: 'ga4', 'instagram', 'tiktok', 'linkedin', 'meta_ads', 'google_ads', 'semrush', 'all'",
        },
        date_range: {
          type: "string",
          description:
            "Date range: 'last_7_days', 'last_30_days', 'last_90_days', 'this_quarter'",
        },
      },
      required: ["stage", "platform", "date_range"],
    },
  },
  {
    name: "search_past_content",
    description:
      "Search the brand's content history for past posts, campaigns, or content lab results matching a query. Use this to find the best-performing hooks, formats, or strategies before recommending new ones.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "What to search for: e.g., 'top performing carousels', 'highest engagement hooks', 'email subject lines'",
        },
        limit: {
          type: "number",
          description: "Max results to return. Default 5.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_content_lab_status",
    description:
      "Get active and completed Content Lab tests for this brand. Use when recommending the next test or reviewing what has been learned.",
    input_schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["active", "completed", "all"],
          description: "Filter by test status",
        },
      },
      required: ["status"],
    },
  },
  {
    name: "get_seo_snapshot",
    description:
      "Get the current SEO and AEO snapshot: keyword rankings, AI Overview visibility, featured snippets, organic traffic. Requires Semrush and Profound integrations.",
    input_schema: {
      type: "object",
      properties: {
        include_competitors: {
          type: "boolean",
          description: "Include competitor keyword comparison",
        },
      },
      required: [],
    },
  },
  {
    name: "get_ads_performance",
    description:
      "Get paid ad performance across all connected platforms: spend, impressions, clicks, ROAS, CPC, CTR. Use when asked about ad performance or budget allocation.",
    input_schema: {
      type: "object",
      properties: {
        platform: {
          type: "string",
          description:
            "Ad platform: 'google', 'meta', 'tiktok', 'linkedin', 'all'",
        },
        date_range: {
          type: "string",
          description: "Date range: 'last_7_days', 'last_30_days', 'this_month'",
        },
      },
      required: ["platform", "date_range"],
    },
  },
  {
    name: "get_video_assets",
    description:
      "Get the brand's video asset library: raw footage available, finished posts, templates, repurposing queue.",
    input_schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["raw", "ready", "published", "all"],
          description: "Filter by asset status",
        },
      },
      required: [],
    },
  },
  {
    name: "diagnose_stage",
    description:
      "Run a structured diagnosis of a specific Growth Engine stage: what is working, what is leaking, and the root cause. Returns a ranked list of issues with evidence.",
    input_schema: {
      type: "object",
      properties: {
        stage: {
          type: "number",
          description: "Growth Engine stage to diagnose (1-5)",
        },
      },
      required: ["stage"],
    },
  },
  {
    name: "generate_content_draft",
    description:
      "Generate a content draft (social post, email, ad copy, or video brief) based on this brand's voice, best-performing formats, and current content lab data. Always returns a draft that requires human approval before publishing.",
    input_schema: {
      type: "object",
      properties: {
        content_type: {
          type: "string",
          enum: [
            "social_post",
            "email",
            "ad_copy",
            "video_brief",
            "campaign_brief",
          ],
          description: "Type of content to draft",
        },
        platform: {
          type: "string",
          description:
            "Target platform: 'instagram', 'tiktok', 'linkedin', 'email', 'meta_ads', 'google_ads', etc.",
        },
        pillar: {
          type: "string",
          enum: ["teach", "connect", "spark"],
          description: "Content pillar (for social posts)",
        },
        goal: {
          type: "string",
          description:
            "Specific goal for this piece: e.g., 'drive webinar registrations', 'increase email signups', 'retarget cart abandoners'",
        },
        stage: {
          type: "number",
          description: "Growth Engine stage this content serves (1-5)",
        },
      },
      required: ["content_type", "platform", "goal", "stage"],
    },
  },
  {
    name: "manage_tasks",
    description:
      "Create, update, complete, or list tasks on this brand's task board. Use this when the user asks you to create a task, mark something done, assign work, or asks what's due. When you make a strategic recommendation the user agrees to act on, create a task for it.",
    input_schema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["create", "update", "complete", "list"],
          description: "What to do with the task board",
        },
        task_id: {
          type: "string",
          description: "Task ID (required for update/complete)",
        },
        title: {
          type: "string",
          description: "Task title (required for create)",
        },
        description: {
          type: "string",
          description: "Task detail: why this matters and what done looks like",
        },
        owner: {
          type: "string",
          description: "Who owns this task. Use 'babuu' for automated work.",
        },
        due_date: {
          type: "string",
          description: "Due date in YYYY-MM-DD format",
        },
        priority: {
          type: "string",
          enum: ["urgent", "high", "medium", "low"],
        },
        category: {
          type: "string",
          enum: ["content", "ads", "seo", "design", "video", "email", "strategy", "admin"],
        },
        status_filter: {
          type: "string",
          description: "For list: filter by status ('todo', 'in_progress', 'review', 'done', 'blocked', 'all')",
        },
      },
      required: ["action"],
    },
  },
];

// ============================================================
// MAIN BABUU FUNCTION
// Handles one turn of conversation with full tool-calling loop.
// ============================================================

export async function askBabuu(
  brand: Brand,
  conversationHistory: { role: "user" | "assistant"; content: string }[],
  userMessage: string,
  toolHandlers: BabuuToolHandlers
): Promise<BabuuResponse> {
  const messages: Anthropic.MessageParam[] = [
    ...conversationHistory,
    { role: "user", content: userMessage },
  ];

  let finalContent = "";
  const skillsCalled: string[] = [];
  const sourcesCited: BabuuSource[] = [];
  let confidence: Confidence = "high";

  // Agentic loop: keep calling Claude until it stops using tools
  let iterationCount = 0;
  const MAX_ITERATIONS = 10;

  while (iterationCount < MAX_ITERATIONS) {
    iterationCount++;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: buildSystemPrompt(brand),
      tools: BABUU_TOOLS,
      messages,
    });

    if (response.stop_reason === "end_turn") {
      // Babuu finished. Extract text content.
      finalContent = response.content
        .filter((block) => block.type === "text")
        .map((block) => (block as Anthropic.TextBlock).text)
        .join("\n\n");
      break;
    }

    if (response.stop_reason === "tool_use") {
      // Babuu called one or more tools. Execute them.
      const toolUseBlocks = response.content.filter(
        (block) => block.type === "tool_use"
      ) as Anthropic.ToolUseBlock[];

      // Add assistant's response (with tool_use blocks) to message history
      messages.push({ role: "assistant", content: response.content });

      // Execute tools in parallel
      const toolResults = await Promise.all(
        toolUseBlocks.map(async (toolUse) => {
          skillsCalled.push(toolUse.name);

          const result = await executeSkill(
            toolUse.name,
            toolUse.input as Record<string, unknown>,
            brand,
            toolHandlers
          );

          // Collect sources from tool results
          if (result.sources) {
            sourcesCited.push(...result.sources);
          }

          // Confidence degrades to the lowest confidence seen
          if (result.confidence === "low" && confidence !== "low") {
            confidence = "low";
          } else if (result.confidence === "medium" && confidence === "high") {
            confidence = "medium";
          }

          return {
            type: "tool_result" as const,
            tool_use_id: toolUse.id,
            content: JSON.stringify(result),
          };
        })
      );

      // Add tool results to message history
      messages.push({ role: "user", content: toolResults });
      continue;
    }

    // Unexpected stop reason
    break;
  }

  if (!finalContent) {
    finalContent =
      "Something went wrong on my end. Try again, and let me know if it persists.";
  }

  return {
    content: finalContent,
    confidence,
    sources: sourcesCited,
    skills_called: skillsCalled,
    if_low_confidence:
      (confidence as string) === "low"
        ? "Some parts of this response are exploratory. Test before acting on them."
        : undefined,
  };
}

// ============================================================
// SKILL EXECUTOR
// Routes tool calls to the appropriate data-fetching function.
// All real API calls happen here, not inside Claude.
// ============================================================

export interface BabuuToolHandlers {
  fetchAnalytics: (
    brandId: string,
    stage: number,
    platform: string,
    dateRange: string
  ) => Promise<SkillResult>;
  searchPastContent: (
    brandId: string,
    query: string,
    limit?: number
  ) => Promise<SkillResult>;
  getContentLabStatus: (
    brandId: string,
    status: string
  ) => Promise<SkillResult>;
  getSEOSnapshot: (
    brandId: string,
    includeCompetitors: boolean
  ) => Promise<SkillResult>;
  getAdsPerformance: (
    brandId: string,
    platform: string,
    dateRange: string
  ) => Promise<SkillResult>;
  getVideoAssets: (brandId: string, status: string) => Promise<SkillResult>;
  diagnoseStage: (brandId: string, stage: number) => Promise<SkillResult>;
  generateContentDraft: (
    brandId: string,
    params: Record<string, unknown>
  ) => Promise<SkillResult>;
  manageTasks?: (
    brandId: string,
    params: Record<string, unknown>
  ) => Promise<SkillResult>;
}

export interface SkillResult {
  data: unknown;
  confidence: Confidence;
  sources?: BabuuSource[];
  error?: string;
  stale?: boolean;
  stale_since?: string;
}

async function executeSkill(
  skillName: string,
  input: Record<string, unknown>,
  brand: Brand,
  handlers: BabuuToolHandlers
): Promise<SkillResult> {
  switch (skillName) {
    case "fetch_analytics":
      return handlers.fetchAnalytics(
        brand.id,
        input.stage as number,
        input.platform as string,
        input.date_range as string
      );

    case "search_past_content":
      return handlers.searchPastContent(
        brand.id,
        input.query as string,
        input.limit as number | undefined
      );

    case "get_content_lab_status":
      return handlers.getContentLabStatus(
        brand.id,
        input.status as string
      );

    case "get_seo_snapshot":
      return handlers.getSEOSnapshot(
        brand.id,
        (input.include_competitors as boolean) ?? false
      );

    case "get_ads_performance":
      return handlers.getAdsPerformance(
        brand.id,
        input.platform as string,
        input.date_range as string
      );

    case "get_video_assets":
      return handlers.getVideoAssets(
        brand.id,
        (input.status as string) ?? "all"
      );

    case "diagnose_stage":
      return handlers.diagnoseStage(brand.id, input.stage as number);

    case "generate_content_draft":
      return handlers.generateContentDraft(brand.id, input);

    case "manage_tasks":
      if (!handlers.manageTasks) {
        return {
          data: { error: "Task management is not available in this context." },
          confidence: "low",
          error: "manageTasks handler not wired",
        };
      }
      return handlers.manageTasks(brand.id, input);

    default:
      return {
        data: { error: `Unknown skill: ${skillName}` },
        confidence: "low",
        error: `Skill not implemented: ${skillName}`,
      };
  }
}

// ============================================================
// WEEKLY REPORT GENERATOR
// Runs on cron. Produces a full weekly report for the brand.
// ============================================================

export async function generateWeeklyReport(
  brand: Brand,
  metricsSnapshot: Record<string, unknown>,
  contentLabSummary: Record<string, unknown>,
  toolHandlers: BabuuToolHandlers
): Promise<string> {
  const prompt = `Generate a weekly marketing report for ${brand.brand_name}.

Use this metrics snapshot: ${JSON.stringify(metricsSnapshot, null, 2)}
Content Lab results this week: ${JSON.stringify(contentLabSummary, null, 2)}

The report should include:
1. This week at a glance (3-5 key numbers with week-over-week change)
2. What moved and why (diagnosis of the biggest shift, with source)
3. Content Lab update (which test is running, early signals)
4. What to focus on next week (one specific priority with rationale)
5. One thing to watch (the most important red flag, if any)

Tone: calm, certain, elevated. No em-dashes. Short sections. Every number cited with "(client data, [platform])". Write it so the client can forward it to stakeholders unchanged.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: buildSystemPrompt(brand),
    tools: BABUU_TOOLS,
    messages: [{ role: "user", content: prompt }],
  });

  return response.content
    .filter((block) => block.type === "text")
    .map((block) => (block as Anthropic.TextBlock).text)
    .join("\n\n");
}

// ============================================================
// QUARTERLY REVIEW GENERATOR
// Synthesizes all Content Lab data, KPIs, and strategic direction.
// ============================================================

export async function generateQuarterlyReview(
  brand: Brand,
  toolHandlers: BabuuToolHandlers
): Promise<string> {
  const [analyticsData, contentLabData] = await Promise.all([
    toolHandlers.fetchAnalytics(brand.id, 0, "all", "this_quarter"),
    toolHandlers.getContentLabStatus(brand.id, "completed"),
  ]);

  const prompt = `Generate a quarterly strategic review for ${brand.brand_name}.

Analytics this quarter: ${JSON.stringify(analyticsData, null, 2)}
Completed Content Lab tests: ${JSON.stringify(contentLabData, null, 2)}
Quarterly targets set: ${JSON.stringify(brand.quarterly_targets, null, 2)}

Structure the review as:
1. Quarter summary (hit or missed targets, with exact numbers)
2. What we proved (Content Lab winners, with evidence)
3. What we learned from losses (what failed and why)
4. The biggest stage leak (which Growth Engine stage underperformed most)
5. Strategic direction for next quarter (one primary focus with reasoning)
6. Recommended tests for next quarter (top 3 Content Lab tests to run)

This is a strategic document. Make it decisive. Every recommendation should state the reasoning and the expected outcome. Source all data.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: buildSystemPrompt(brand),
    tools: BABUU_TOOLS,
    messages: [{ role: "user", content: prompt }],
  });

  return response.content
    .filter((block) => block.type === "text")
    .map((block) => (block as Anthropic.TextBlock).text)
    .join("\n\n");
}
