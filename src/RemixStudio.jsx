import React, { useState, useEffect, useMemo, useRef, Fragment } from "react";
import {
  Play, Loader2, CheckCircle2, XCircle, AlertCircle, ChevronRight, ChevronDown,
  FileText, MessageSquare, LifeBuoy, Lightbulb, StickyNote, Building2,
  X, Info, Radio, Activity, Gauge, Quote, ExternalLink, Copy, RefreshCw,
  Layers, GitBranch, Sparkles, Shield, Settings
} from "lucide-react";

/* =========================================================================
   REMIX INTELLIGENCE STUDIO — MVP
   Weekly Executive Signal Mix for RelayForge (fictional B2B SaaS / AI startup)

   Orchestrates a six-agent pipeline:
     Ingestion → Theme → Contradiction → Recommendation → Critic → Memo
   against a synthetic weekly batch of 38 cross-functional signals.

   Runs in two modes:
     · Live  — calls the Anthropic API directly from the browser
     · Demo  — plays back hand-crafted outputs (for offline demos)

   Model: swappable; default assumes the in-artifact Anthropic endpoint.
   ========================================================================= */

// Swap this if your environment routes to a different model name.
// claude-sonnet-4-5 is the default; claude-opus-4-7 will give stronger synthesis
// at higher cost and latency.
const MODEL = "claude-opus-4-7";

// Company scenario (per PRD Section 9 / C)
const COMPANY = {
  name: "RelayForge",
  category: "AI workflow automation for mid-market operations teams",
  stage: "Series A",
  week_label: "Week of March 2, 2026",
  strategic_frame:
    "Leadership wants to push analytics as the Q2 wedge, but customers point at integrations, onboarding, and trust.",
};

/* -------------------------------------------------------------------------
   1. SYNTHETIC DATASET — 38 records
   Composition: 10 customer calls · 12 support tickets · 8 product feedback ·
                5 sales notes · 3 internal notes  (per PRD §E)
   Designed to contain: 3 cross-source themes, 3 non-trivial contradictions,
   and one plausible-but-over-indexed ("noise") theme (analytics demand).
   ------------------------------------------------------------------------- */

const SIGNALS = [
  // --- CUSTOMER CALLS (10) ---
  {
    id: "sig_001", source_type: "customer_call", date: "2026-03-02", team: "sales",
    account_name: "Northstar Health", account_segment: "mid-market", region: "US",
    topic_tags: ["integration", "salesforce", "onboarding"],
    summary: "Prospect likes the workflow automation vision but says rollout cannot proceed without Salesforce integration.",
    sentiment: "mixed", urgency: 5, evidence_strength: 4,
    quoted_claims: ["We need Salesforce integration before rollout.", "The automation is compelling but we live in Salesforce."],
    metrics: { deal_size_estimate: 45000, seats: 120 }, owner: "AE_01"
  },
  {
    id: "sig_002", source_type: "customer_call", date: "2026-03-02", team: "sales",
    account_name: "Aperture Ops", account_segment: "enterprise", region: "US",
    topic_tags: ["security", "trust", "procurement"],
    summary: "Late-stage prospect is interested, but security review is slowing the buying process.",
    sentiment: "mixed", urgency: 4, evidence_strength: 4,
    quoted_claims: ["We need stronger answers on data handling and model access."],
    metrics: { deal_size_estimate: 120000, seats: 400 }, owner: "AE_02"
  },
  {
    id: "sig_003", source_type: "customer_call", date: "2026-03-03", team: "sales",
    account_name: "Blue Current", account_segment: "mid-market", region: "EU",
    topic_tags: ["onboarding", "configuration"],
    summary: "Customer sees value but worries setup is too complex for a small operations team.",
    sentiment: "mixed", urgency: 4, evidence_strength: 3,
    quoted_claims: ["This looks powerful, but implementation seems heavy."],
    metrics: { deal_size_estimate: 32000 }, owner: "AE_03"
  },
  {
    id: "sig_004", source_type: "customer_call", date: "2026-03-03", team: "sales",
    account_name: "Meridian Retail", account_segment: "mid-market", region: "US",
    topic_tags: ["analytics", "dashboard"],
    summary: "Operations lead wants more dashboard segmentation and analytics views for managers.",
    sentiment: "positive", urgency: 2, evidence_strength: 2,
    quoted_claims: ["Manager-level analytics would be useful."],
    metrics: { deal_size_estimate: 28000 }, owner: "AE_01"
  },
  {
    id: "sig_019", source_type: "customer_call", date: "2026-03-03", team: "sales",
    account_name: "Fernway Labs", account_segment: "mid-market", region: "US",
    topic_tags: ["integration", "hubspot", "onboarding"],
    summary: "Prospect asks whether rollout is feasible without native HubSpot sync; decision is paused pending answer.",
    sentiment: "mixed", urgency: 4, evidence_strength: 4,
    quoted_claims: ["Without HubSpot two-way sync this won't work for our RevOps team."],
    metrics: { deal_size_estimate: 38000 }, owner: "AE_04"
  },
  {
    id: "sig_020", source_type: "customer_call", date: "2026-03-04", team: "sales",
    account_name: "Crestline Logistics", account_segment: "enterprise", region: "US",
    topic_tags: ["security", "compliance", "soc2"],
    summary: "Enterprise buyer requires SOC 2 Type II and a completed vendor risk questionnaire before expanding pilot.",
    sentiment: "neutral", urgency: 4, evidence_strength: 5,
    quoted_claims: ["No SOC 2 Type II, no expansion."],
    metrics: { deal_size_estimate: 220000, seats: 800 }, owner: "AE_02"
  },
  {
    id: "sig_021", source_type: "customer_call", date: "2026-03-04", team: "sales",
    account_name: "PaloVerde Systems", account_segment: "mid-market", region: "US",
    topic_tags: ["integration", "ecosystem"],
    summary: "Demo went well but prospect flagged that the listed integration catalog is shorter than competitors'.",
    sentiment: "mixed", urgency: 3, evidence_strength: 3,
    quoted_claims: ["You've got 12 integrations listed; Zapier-adjacent tools have 200+."],
    metrics: { deal_size_estimate: 22000 }, owner: "AE_03"
  },
  {
    id: "sig_022", source_type: "customer_call", date: "2026-03-05", team: "sales",
    account_name: "Beacon Clinic Network", account_segment: "mid-market", region: "US",
    topic_tags: ["security", "hipaa", "compliance"],
    summary: "Healthcare prospect will not proceed without a BAA and clarity on PHI handling inside automated workflows.",
    sentiment: "mixed", urgency: 5, evidence_strength: 5,
    quoted_claims: ["We can't pilot without a signed BAA."],
    metrics: { deal_size_estimate: 64000 }, owner: "AE_05"
  },
  {
    id: "sig_023", source_type: "customer_call", date: "2026-03-05", team: "sales",
    account_name: "Quadrant Analytics", account_segment: "mid-market", region: "US",
    topic_tags: ["analytics", "reporting", "bi"],
    summary: "Data-forward customer would buy immediately if native pivot-style analytics on workflow outputs existed.",
    sentiment: "positive", urgency: 3, evidence_strength: 3,
    quoted_claims: ["Give us analytics on the workflow data and we're sold."],
    metrics: { deal_size_estimate: 54000 }, owner: "AE_01"
  },
  {
    id: "sig_024", source_type: "customer_call", date: "2026-03-06", team: "sales",
    account_name: "Riverstone Industries", account_segment: "mid-market", region: "US",
    topic_tags: ["onboarding", "implementation", "services"],
    summary: "Prospect asked whether we offer implementation services because they can't dedicate an admin for setup.",
    sentiment: "mixed", urgency: 4, evidence_strength: 4,
    quoted_claims: ["We don't have someone to own this setup internally."],
    metrics: { deal_size_estimate: 40000 }, owner: "AE_04"
  },

  // --- SUPPORT TICKETS (12) ---
  {
    id: "sig_005", source_type: "support_ticket", date: "2026-03-03", team: "support",
    account_name: "Northstar Health", account_segment: "mid-market", region: "US",
    topic_tags: ["permissions", "onboarding"],
    summary: "Admin cannot complete workspace setup because role permissions are unclear in onboarding.",
    sentiment: "negative", urgency: 5, evidence_strength: 5,
    quoted_claims: ["We do not know which permission set to choose."], owner: "CSM_01"
  },
  {
    id: "sig_006", source_type: "support_ticket", date: "2026-03-03", team: "support",
    account_name: "NovaGrid", account_segment: "mid-market", region: "US",
    topic_tags: ["integration", "salesforce"],
    summary: "Customer cannot map workflow fields correctly to Salesforce objects during setup.",
    sentiment: "negative", urgency: 5, evidence_strength: 5,
    quoted_claims: ["Field mapping fails during sync."], owner: "CSM_02"
  },
  {
    id: "sig_007", source_type: "support_ticket", date: "2026-03-04", team: "support",
    account_name: "Blue Current", account_segment: "mid-market", region: "EU",
    topic_tags: ["configuration", "onboarding"],
    summary: "Customer is confused by workflow configuration steps and asks for implementation help.",
    sentiment: "negative", urgency: 4, evidence_strength: 4,
    quoted_claims: ["I've been stuck on step 3 for two days."], owner: "CSM_03"
  },
  {
    id: "sig_008", source_type: "support_ticket", date: "2026-03-04", team: "support",
    account_name: "Meridian Retail", account_segment: "mid-market", region: "US",
    topic_tags: ["analytics", "reporting"],
    summary: "Customer asks whether dashboard analytics can be segmented by manager and region.",
    sentiment: "neutral", urgency: 2, evidence_strength: 3, owner: "CSM_01"
  },
  {
    id: "sig_009", source_type: "support_ticket", date: "2026-03-04", team: "support",
    account_name: "Aperture Ops", account_segment: "enterprise", region: "US",
    topic_tags: ["security", "sso", "compliance"],
    summary: "Prospect requests documentation on SSO, audit logs, and data retention before moving forward.",
    sentiment: "mixed", urgency: 4, evidence_strength: 4, owner: "CSM_04"
  },
  {
    id: "sig_025", source_type: "support_ticket", date: "2026-03-04", team: "support",
    account_name: "Fernway Labs", account_segment: "mid-market", region: "US",
    topic_tags: ["integration", "salesforce", "auth"],
    summary: "Webhook authentication between RelayForge and Salesforce fails after initial setup; tokens rotate unexpectedly.",
    sentiment: "negative", urgency: 5, evidence_strength: 5,
    quoted_claims: ["The Salesforce OAuth token expires every 2 hours and breaks the workflow."], owner: "CSM_02"
  },
  {
    id: "sig_026", source_type: "support_ticket", date: "2026-03-05", team: "support",
    account_name: "Crestline Logistics", account_segment: "enterprise", region: "US",
    topic_tags: ["security", "audit_log", "compliance"],
    summary: "Enterprise admin requests ability to export audit logs for SOC 2 evidence collection.",
    sentiment: "mixed", urgency: 4, evidence_strength: 4, owner: "CSM_04"
  },
  {
    id: "sig_027", source_type: "support_ticket", date: "2026-03-05", team: "support",
    account_name: "NovaGrid", account_segment: "mid-market", region: "US",
    topic_tags: ["templates", "configuration", "onboarding"],
    summary: "Customer reports there are no out-of-the-box workflow templates for their use case, so they abandoned setup.",
    sentiment: "negative", urgency: 4, evidence_strength: 4,
    quoted_claims: ["We shouldn't have to build this from scratch."], owner: "CSM_02"
  },
  {
    id: "sig_028", source_type: "support_ticket", date: "2026-03-05", team: "support",
    account_name: "Stellargate Corp", account_segment: "mid-market", region: "US",
    topic_tags: ["integration", "salesforce", "reliability"],
    summary: "Intermittent Salesforce sync failures reported by multiple users on same account.",
    sentiment: "negative", urgency: 5, evidence_strength: 5, owner: "CSM_03"
  },
  {
    id: "sig_029", source_type: "support_ticket", date: "2026-03-05", team: "support",
    account_name: "Riverstone Industries", account_segment: "mid-market", region: "US",
    topic_tags: ["permissions", "roles", "onboarding"],
    summary: "Role permissions model confuses admins; multiple attempts needed to configure correct access.",
    sentiment: "negative", urgency: 4, evidence_strength: 4, owner: "CSM_01"
  },
  {
    id: "sig_030", source_type: "support_ticket", date: "2026-03-06", team: "support",
    account_name: "Beacon Clinic Network", account_segment: "mid-market", region: "US",
    topic_tags: ["compliance", "hipaa", "legal"],
    summary: "Customer waiting on BAA and PHI handling documentation; blocked from starting pilot.",
    sentiment: "negative", urgency: 5, evidence_strength: 5, owner: "CSM_04"
  },
  {
    id: "sig_031", source_type: "support_ticket", date: "2026-03-06", team: "support",
    account_name: "PaloVerde Systems", account_segment: "mid-market", region: "US",
    topic_tags: ["data_import", "onboarding"],
    summary: "CSV import step fails silently for files over 5 MB; customer unable to complete initial data load.",
    sentiment: "negative", urgency: 4, evidence_strength: 5, owner: "CSM_03"
  },

  // --- PRODUCT FEEDBACK (8) ---
  {
    id: "sig_010", source_type: "product_feedback", date: "2026-03-04", team: "product",
    account_name: "Meridian Retail", account_segment: "mid-market", region: "US",
    topic_tags: ["analytics", "dashboard"],
    summary: "Power user requests custom dashboard slices by team lead and time period.",
    sentiment: "positive", urgency: 2, evidence_strength: 2, owner: "PM_01"
  },
  {
    id: "sig_011", source_type: "product_feedback", date: "2026-03-04", team: "product",
    account_name: "NovaGrid", account_segment: "mid-market", region: "US",
    topic_tags: ["integration", "salesforce", "api"],
    summary: "Customer asks for easier Salesforce setup and clearer API mapping examples.",
    sentiment: "mixed", urgency: 4, evidence_strength: 4, owner: "PM_02"
  },
  {
    id: "sig_012", source_type: "product_feedback", date: "2026-03-04", team: "product",
    account_name: "Blue Current", account_segment: "mid-market", region: "EU",
    topic_tags: ["configuration", "templates", "onboarding"],
    summary: "Customer asks for starter templates because workflow configuration feels too open-ended.",
    sentiment: "mixed", urgency: 4, evidence_strength: 4, owner: "PM_03"
  },
  {
    id: "sig_032", source_type: "product_feedback", date: "2026-03-05", team: "product",
    account_name: "Fernway Labs", account_segment: "mid-market", region: "US",
    topic_tags: ["integration", "salesforce", "wizard"],
    summary: "Request for a guided Salesforce setup wizard with pre-built field mapping presets.",
    sentiment: "mixed", urgency: 4, evidence_strength: 4, owner: "PM_02"
  },
  {
    id: "sig_033", source_type: "product_feedback", date: "2026-03-05", team: "product",
    account_name: "Aperture Ops", account_segment: "enterprise", region: "US",
    topic_tags: ["admin", "enterprise", "security"],
    summary: "Enterprise admin requests centralized admin console with role delegation, audit trails, and SCIM provisioning.",
    sentiment: "mixed", urgency: 4, evidence_strength: 4, owner: "PM_04"
  },
  {
    id: "sig_034", source_type: "product_feedback", date: "2026-03-05", team: "product",
    account_name: "Quadrant Analytics", account_segment: "mid-market", region: "US",
    topic_tags: ["analytics", "charting", "bi"],
    summary: "Advanced user requests custom chart builder and data export to BI tools.",
    sentiment: "positive", urgency: 2, evidence_strength: 3, owner: "PM_01"
  },
  {
    id: "sig_035", source_type: "product_feedback", date: "2026-03-06", team: "product",
    account_name: "Riverstone Industries", account_segment: "mid-market", region: "US",
    topic_tags: ["onboarding", "tutorial", "ux"],
    summary: "Customer suggests in-app guided tours and pre-filled sample workflows for new admins.",
    sentiment: "mixed", urgency: 4, evidence_strength: 3, owner: "PM_03"
  },
  {
    id: "sig_036", source_type: "product_feedback", date: "2026-03-06", team: "product",
    account_name: "Stellargate Corp", account_segment: "mid-market", region: "US",
    topic_tags: ["integration", "salesforce", "hubspot"],
    summary: "Mid-size customer needs both Salesforce and HubSpot simultaneously; current integration is single-source.",
    sentiment: "negative", urgency: 4, evidence_strength: 4, owner: "PM_02"
  },

  // --- SALES NOTES (5) ---
  {
    id: "sig_013", source_type: "sales_note", date: "2026-03-05", team: "sales",
    account_name: "Aperture Ops", account_segment: "enterprise", region: "US",
    topic_tags: ["security", "trust", "procurement"],
    summary: "Rep says enterprise deals need a tighter trust story, especially around model access and controls.",
    sentiment: "neutral", urgency: 4, evidence_strength: 4, owner: "AE_02"
  },
  {
    id: "sig_014", source_type: "sales_note", date: "2026-03-05", team: "sales",
    account_name: "General", account_segment: "mid-market", region: "US",
    topic_tags: ["messaging", "ease_of_use", "positioning"],
    summary: "Sales messaging continues to emphasize fast deployment and ease of setup as the main differentiator.",
    sentiment: "positive", urgency: 3, evidence_strength: 3, owner: "AE_MGR"
  },
  {
    id: "sig_015", source_type: "sales_note", date: "2026-03-05", team: "sales",
    account_name: "General", account_segment: "mid-market", region: "US",
    topic_tags: ["pricing", "packaging"],
    summary: "Multiple prospects seemed confused about which plan includes advanced workflow controls.",
    sentiment: "negative", urgency: 3, evidence_strength: 3, owner: "AE_MGR"
  },
  {
    id: "sig_037", source_type: "sales_note", date: "2026-03-06", team: "sales",
    account_name: "General", account_segment: "all", region: "US",
    topic_tags: ["pipeline", "integration", "deal_risk"],
    summary: "Pipeline review: 4 deals totaling $340k stalled past 30 days citing integration dependencies as the primary blocker.",
    sentiment: "negative", urgency: 5, evidence_strength: 5,
    quoted_claims: ["Integration is named as the stall reason in 4 of 4 late-stage stalled deals."],
    metrics: { deal_count: 4, pipeline_at_risk: 340000 }, owner: "AE_MGR"
  },
  {
    id: "sig_038", source_type: "sales_note", date: "2026-03-06", team: "sales",
    account_name: "General", account_segment: "mid-market", region: "US",
    topic_tags: ["positioning", "analytics", "competition"],
    summary: "Reps report that leading with 'analytics' in pitch gets polite interest but rarely drives deal motion; 'integration-first' stories convert better.",
    sentiment: "mixed", urgency: 3, evidence_strength: 3, owner: "AE_MGR"
  },

  // --- INTERNAL NOTES (3) ---
  {
    id: "sig_016", source_type: "internal_note", date: "2026-03-05", team: "leadership",
    account_name: "Internal", account_segment: "all", region: "global",
    topic_tags: ["roadmap", "analytics", "strategy"],
    summary: "Leadership review notes propose doubling down on analytics in Q2 as the core strategic differentiator.",
    sentiment: "neutral", urgency: 3, evidence_strength: 3,
    quoted_claims: ["Analytics is our wedge; let's own it in Q2."], owner: "CEO"
  },
  {
    id: "sig_017", source_type: "internal_note", date: "2026-03-05", team: "product",
    account_name: "Internal", account_segment: "all", region: "global",
    topic_tags: ["roadmap", "onboarding", "capacity"],
    summary: "Onboarding fixes are tentatively pushed to later in the quarter due to limited engineering capacity.",
    sentiment: "neutral", urgency: 4, evidence_strength: 4, owner: "CPO"
  },
  {
    id: "sig_018", source_type: "internal_note", date: "2026-03-05", team: "leadership",
    account_name: "Internal", account_segment: "all", region: "global",
    topic_tags: ["assumption", "integration", "strategy"],
    summary: "Leadership assumes current integration issues are edge-case implementation problems rather than core blockers.",
    sentiment: "neutral", urgency: 3, evidence_strength: 2,
    quoted_claims: ["Integration pain is edge-case; our platform approach scales past it."], owner: "CEO"
  },
];

// Quick lookup by id
const SIGNAL_BY_ID = Object.fromEntries(SIGNALS.map(s => [s.id, s]));

const SOURCE_META = {
  customer_call:    { label: "Customer call",    short: "CALL", icon: MessageSquare },
  support_ticket:   { label: "Support ticket",   short: "TICK", icon: LifeBuoy },
  product_feedback: { label: "Product feedback", short: "PROD", icon: Lightbulb },
  sales_note:       { label: "Sales note",       short: "SALE", icon: FileText },
  internal_note:    { label: "Internal note",    short: "INT",  icon: StickyNote },
};

/* -------------------------------------------------------------------------
   2. AGENT SYSTEM PROMPTS
   Each agent returns strict JSON that flows into the next.
   ------------------------------------------------------------------------- */

const PROMPTS = {
  ingestion: `You are the Ingestion Agent in a multi-agent strategic intelligence system for B2B SaaS leadership. Your job: take raw cross-functional signals and produce a clean, normalized set with enriched metadata ready for downstream synthesis.

For each signal:
1. Validate schema conformance; flag any missing required fields.
2. Normalize topic_tags to canonical snake_case, merging near-duplicates (e.g. "salesforce" / "SFDC" / "sf").
3. Infer a canonical_category from: integration, onboarding, trust_security, analytics, pricing, messaging, strategy, other.
4. Assign signal_quality 1-5 based on specificity, evidence_strength, and source reliability.
5. Set potential_noise=true if the signal appears to be an isolated vocal-minority opinion rather than a broader pattern.

Return STRICT JSON ONLY, no prose, no markdown fences:
{
  "normalized_signals": [
    { "id": "sig_001", "canonical_category": "integration", "normalized_tags": ["..."],
      "signal_quality": 4, "potential_noise": false, "notes": "short rationale" }
  ],
  "quality_report": {
    "total": <int>, "by_category": { "<cat>": <int> },
    "by_source_type": { "<type>": <int> }, "avg_quality": <float>,
    "low_quality_count": <int>, "noise_flagged_count": <int>
  }
}`,

  theme: `You are the Theme Agent. Detect cross-source strategic themes — patterns that appear across MULTIPLE source types.

Requirements for a valid theme:
- Spans >=2 source types (ideally 3+).
- >=3 supporting signals.
- Specific and actionable (NOT generic one-word labels). Prefer "Salesforce integration friction blocks mid-market deployments" over "Integration".
- Include trend direction where inferable (rising/stable/falling/unknown).
- Rank by strategic weight (volume x urgency x evidence_strength x segment_reach).

Produce 3-6 themes. Flag at least one as noise_flag:true if the data plausibly overweights a vocal-minority opinion.

Return STRICT JSON ONLY:
{
  "themes": [
    { "id": "theme_01",
      "title": "short executive-readable title",
      "one_line_summary": "single sentence",
      "description": "2-3 sentence paragraph",
      "evidence_signal_ids": ["sig_001", ...],
      "source_types_covered": ["customer_call", ...],
      "teams_involved": ["sales", ...],
      "account_segments": ["mid-market", ...],
      "strategic_weight": <1-10>, "urgency": <1-5>,
      "confidence": <0-1>, "trend": "rising|stable|falling|unknown",
      "noise_flag": <bool>, "noise_reasoning": "if flagged, 1 sentence" }
  ]
}`,

  contradiction: `You are the Contradiction Agent. Surface NON-TRIVIAL tensions where different signals, teams, or internal assumptions disagree in ways that could cause strategic drift.

Types to look for:
1. internal_vs_external — internal assumption vs. customer evidence.
2. cross_functional — different teams narrating different realities.
3. positioning_vs_reality — marketing/sales messaging vs. what support/product data show.
4. roadmap_vs_signal — roadmap prioritization vs. signal urgency.
5. stated_vs_revealed — customer says X, behavior shows Y.

For each contradiction:
- Name both sides clearly (side_a, side_b).
- Cite specific signal IDs supporting each side.
- Severity = cost if not reconciled.
- Resolution hint = what would reconcile it.

Produce 2-5 contradictions. QUALITY OVER QUANTITY — do not invent tensions that aren't in the evidence.

Return STRICT JSON ONLY:
{
  "contradictions": [
    { "id": "contra_01",
      "title": "short title",
      "type": "internal_vs_external|cross_functional|positioning_vs_reality|roadmap_vs_signal|stated_vs_revealed",
      "description": "2-3 sentences",
      "side_a": { "claim": "...", "source": "leadership|sales|...", "evidence_ids": [...] },
      "side_b": { "claim": "...", "source": "customers|support|...", "evidence_ids": [...] },
      "severity": <1-5>, "confidence": <0-1>,
      "resolution_hint": "1-2 sentences" }
  ]
}`,

  recommendation: `You are the Recommendation Agent. Produce 3-5 decision-ready recommendations for the executive team.

Rules:
- Every recommendation must cite specific evidence (signal IDs AND theme/contradiction IDs).
- Owner is a ROLE (CEO, CPO, CRO, Head of GTM, Chief of Staff) — not a person.
- decision_type: re-sequence, invest, defer, kill, explore, communicate.
- Confidence reflects evidence quality, not enthusiasm.
- Urgency reflects cost of delay.
- Include AT LEAST ONE "hard call" — something the team probably doesn't want to hear but the evidence supports.
- Include counter_argument for each rec — the strongest case against it.

Return STRICT JSON ONLY:
{
  "recommendations": [
    { "id": "rec_01",
      "title": "short imperative title",
      "action": "2-4 sentences on what to do",
      "rationale": "why, tied to evidence",
      "evidence": { "signal_ids": [...], "theme_ids": [...], "contradiction_ids": [...] },
      "decision_type": "re-sequence|invest|defer|kill|explore|communicate",
      "owner_role": "CEO|CPO|CRO|Head of GTM|Chief of Staff|...",
      "confidence": <0-1>, "urgency": <1-5>,
      "timeframe": "this_week|this_month|this_quarter",
      "expected_impact": "1 sentence",
      "risk_if_wrong": "1 sentence",
      "counter_argument": "1 sentence" }
  ]
}`,

  critic: `You are the Critic Agent. Stress-test the themes, contradictions, and recommendations against the raw evidence. You are the adversarial check on LLM optimism and overreach.

Look for:
1. Themes with weak evidence or vocal-minority bias.
2. Contradictions that are actually just noise or trivial disagreements.
3. Recommendations with unsupported leaps or unstated assumptions.
4. Missing context (segment-specific signals over-generalized).
5. Confidence mis-calibration (both over and under).
6. Logical gaps in causal chains.

For each item, either CONFIRM with short justification, or CHALLENGE with a specific concern. Recommendations may also be 'soften' (overstated) or 'sharpen' (underspecified).

Also produce:
- overall_confidence in the memo (0-1)
- top 3 caveats the reader should know
- one BLIND SPOT the signals probably miss (what is NOT in this data but should inform the decision?)

Return STRICT JSON ONLY:
{
  "critique": {
    "theme_notes": [{ "id": "theme_01", "verdict": "confirm|challenge", "comment": "..." }],
    "contradiction_notes": [{ "id": "contra_01", "verdict": "confirm|challenge", "comment": "..." }],
    "recommendation_notes": [{ "id": "rec_01", "verdict": "confirm|challenge|soften|sharpen", "comment": "..." }],
    "overall_confidence": <0-1>,
    "caveats": ["...", "...", "..."],
    "blind_spot": "1-2 sentences",
    "meta_notes": "cross-cutting concern, if any"
  }
}`,

  memo: `You are the Memo Compiler. Compose a concise, executive-readable weekly decision memo in GitHub-flavored markdown.

Structure (use these exact section headers):

# Weekly Executive Signal Mix — <Company> — <Week>

## TL;DR
3 sentences max. What changed. What matters most. What decision is most urgent.

## What Mattered This Week
3-5 bullets. Each ends with [sig_IDs].

## Themes
One paragraph per theme. **Title** — one-sentence description — [evidence: sig_IDs].

## Contradictions
One paragraph per contradiction. **Title** — side A vs side B — severity — [evidence: sig_IDs].

## Recommended Actions
Numbered list. For each:
**N. Title (owner_role, timeframe, confidence %)**
- What: ...
- Why: ...
- Risk if wrong: ...

## Caveats & Confidence
- Overall confidence: X%
- Bulleted caveats
- Blind spot: ...

Rules:
- No hedging fluff. Executive voice: direct, evidence-cited, falsifiable.
- Every claim traces to signal IDs.
- Total length: 500-900 words.
- Apply the critic's feedback — soften where critic said 'soften', sharpen where critic said 'sharpen', omit items the critic rejected.

Return ONLY the markdown memo. No JSON, no preamble, no closing remarks.`
};

/* -------------------------------------------------------------------------
   3. DEMO-MODE OUTPUTS (hand-crafted gold-standard responses)
   These play back when users run without an API call. Designed to showcase
   what the live pipeline should produce at its best.
   ------------------------------------------------------------------------- */

const DEMO_OUTPUTS = {
  ingestion: {
    quality_report: {
      total_signals: 38,
      by_source: { customer_call: 10, support_ticket: 12, product_feedback: 8, sales_note: 5, internal_note: 3 },
      by_team: { sales: 9, support: 12, product: 8, cs: 6, leadership: 3 },
      date_range: { start: "2026-02-24", end: "2026-03-02" },
      avg_evidence_strength: 3.9,
      high_urgency_count: 14,
      anomalies: [
        "Two product_feedback items (sig_008, sig_023) are from the same power-user account — weight accordingly.",
        "sig_017 and sig_018 are internal-note assumptions without external evidence; track as beliefs, not facts."
      ],
      coverage_notes: "Batch has strong cross-functional coverage — all 5 source types represented with meaningful volume. Sales notes slightly underweighted relative to pipeline stakes."
    },
    _summary: "38/38 signals validated · 5 source types · avg evidence 3.9/5 · 14 high-urgency"
  },
  themes: {
    themes: [
      {
        id: "theme_01",
        title: "Salesforce integration is the dominant deal blocker",
        summary: "Across 11 signals spanning all 5 source types, Salesforce is the single highest-friction surface — field mapping, OAuth, sync reliability. Prospects (Northstar, Fernway, NovaGrid, Stellargate) are refusing to expand without a reliable sync; existing customers hit OAuth and sync bugs in production.",
        why_it_matters: "Directly contradicts the Q2 analytics-as-wedge bet and constrains current-quarter close rates. $340k of mid-market pipeline is conditioned on resolution.",
        evidence: ["sig_001","sig_006","sig_011","sig_019","sig_025","sig_028","sig_032","sig_036","sig_037","sig_038","sig_018"],
        source_types: ["customer_call","support_ticket","product_feedback","sales_note","internal_note"],
        strength: 5,
        trend: "rising",
        noise_flag: false,
        noise_note: ""
      },
      {
        id: "theme_02",
        title: "Onboarding complexity is stalling customers before first value",
        summary: "Ten signals across customer calls, support, and product feedback trace the same arc: customers see value but can't reach first-run success without help. Problems cluster at permissions (5), configuration/templates (4), and data import (2).",
        why_it_matters: "Product's decision to defer onboarding to late Q2 (sig_017) directly contradicts this signal density. Every week the gap persists, sales' 'fast deployment' positioning becomes less defensible.",
        evidence: ["sig_003","sig_005","sig_007","sig_012","sig_024","sig_027","sig_029","sig_031","sig_035","sig_017"],
        source_types: ["customer_call","support_ticket","product_feedback","internal_note"],
        strength: 5,
        trend: "rising",
        noise_flag: false,
        noise_note: ""
      },
      {
        id: "theme_03",
        title: "Enterprise trust gap: SOC 2, BAA, SSO/SCIM, audit logs",
        summary: "Eight signals from Aperture Ops, Crestline, Beacon Clinic describe a consistent pattern: mid-to-late-stage enterprise deals stall on compliance and admin tooling. Representative asks: SOC 2 Type II, BAA for PHI handling, SCIM provisioning, exportable audit logs, model-access controls.",
        why_it_matters: "This is a conditional-buying pattern, not a vocal minority. Three named enterprise deals are effectively paused pending these assets — deterministic, build-once work that unlocks revenue.",
        evidence: ["sig_002","sig_009","sig_013","sig_020","sig_022","sig_026","sig_030","sig_033"],
        source_types: ["customer_call","support_ticket","sales_note","product_feedback"],
        strength: 4,
        trend: "steady",
        noise_flag: false,
        noise_note: ""
      },
      {
        id: "theme_04",
        title: "Analytics demand is real but narrow — possibly overweighted internally",
        summary: "Six signals (Meridian, Quadrant, product feedback) ask for richer analytics. These are genuine — but they come from data-forward power users at already-engaged accounts. Sales manager reports (sig_038) that analytics-led pitches draw polite interest without moving deals.",
        why_it_matters: "The internal bet (sig_016) to 'own analytics in Q2' rests on a thinner base than the raw signal count implies. Misreading this as a wedge risks misallocating a full quarter of engineering.",
        evidence: ["sig_004","sig_008","sig_010","sig_023","sig_034","sig_016","sig_038"],
        source_types: ["customer_call","support_ticket","product_feedback","sales_note","internal_note"],
        strength: 2,
        trend: "steady",
        noise_flag: true,
        noise_note: "All six analytics-demand signals come from data-forward power users at already-engaged accounts; no stalled or lost deal cites analytics as the blocker. High visibility ≠ high strategic weight."
      }
    ]
  },
  contradictions: {
    contradictions: [
      {
        id: "contra_01",
        title: "Leadership's Q2 analytics bet vs. customer evidence that integration is the real blocker",
        side_a: {
          label: "Leadership",
          claim: "Analytics is the Q2 wedge — let's own it and build the differentiator.",
          evidence: ["sig_016"]
        },
        side_b: {
          label: "Customers + sales + support",
          claim: "Integration dependencies — especially Salesforce — are the actual constraint on deal velocity and drive the support volume.",
          evidence: ["sig_001","sig_019","sig_025","sig_028","sig_037","sig_038"]
        },
        severity: 5,
        so_what: "Re-sequence Q2 to prioritize integration reliability and Salesforce-grade setup; hold analytics as an H2 bet pending revised evidence. The longer this contradiction stands, the more Q2 capacity is spent on a bet customers aren't paying to get."
      },
      {
        id: "contra_02",
        title: "Sales messaging says 'fast deployment' while support reality shows systemic setup failures",
        side_a: {
          label: "Sales",
          claim: "Fast deployment and ease-of-setup are our differentiators — lead every pitch with them.",
          evidence: ["sig_014"]
        },
        side_b: {
          label: "Support + product",
          claim: "Onboarding is blocking customers this week across permissions, templates, data import, and integration setup.",
          evidence: ["sig_005","sig_007","sig_012","sig_027","sig_029","sig_031","sig_035"]
        },
        severity: 4,
        so_what: "Pause the 'fast deployment' lead until onboarding fixes ship, or reframe around 'fastest time-to-value once configured.' The promise-vs-reality gap is the live source of early-stage dissatisfaction."
      },
      {
        id: "contra_03",
        title: "Leadership treats integration pain as edge cases; cross-source evidence shows a systemic pattern",
        side_a: {
          label: "Leadership",
          claim: "Integration pain is edge-case implementation; our platform approach scales past it.",
          evidence: ["sig_018"]
        },
        side_b: {
          label: "Sales pipeline + support",
          claim: "Integration is named in 4 of 4 stalled late-stage deals ($340k at risk) and drives a material share of P1 support load.",
          evidence: ["sig_006","sig_025","sig_028","sig_036","sig_037"]
        },
        severity: 5,
        so_what: "Hold a leadership review of integration data this week — stalled-deal reasons, P1 support breakdown — and explicitly revise the 'edge case' framing in the planning doc. The largest strategic risk this week is drift between internal belief and customer-visible reality."
      }
    ]
  },
  recommendations: {
    recommendations: [
      {
        id: "rec_01",
        title: "Re-sequence Q2: integration reliability before analytics",
        what: "Shift the Q2 roadmap headline from 'analytics differentiator' to 'integration reliability + Salesforce-grade setup + multi-CRM (HubSpot next).' Reserve 60-70% of engineering capacity accordingly. Hold analytics as an opt-in bet for power users, not the headline wedge.",
        why: "Three of four top themes and two of three contradictions point here; $340k of mid-market pipeline is stalled on this; sales reports integration-first pitches convert while analytics-led ones don't. The analytics wedge rests on thinner evidence than the raw signal count suggests.",
        risk_if_wrong: "Delays the differentiation bet by a quarter. If a competitor's analytics push were actually winning deals today, this re-sequence cedes ground. Counter: no deal-loss evidence in this batch cites a competitor's analytics; integration is where deals are actually lost.",
        owner: "CEO + CPO",
        horizon: "this week",
        confidence: 0.85,
        hard_call: true,
        links_to_themes: ["theme_01","theme_04"],
        links_to_contradictions: ["contra_01","contra_03"],
        evidence: ["sig_001","sig_019","sig_025","sig_028","sig_036","sig_037","sig_038"]
      },
      {
        id: "rec_02",
        title: "30-day onboarding hardening sprint — do not defer to Q3",
        what: "Pull onboarding fixes forward into this month. Cross-functional tiger team on: permissions-model redesign, 4-6 starter workflow templates, >5MB CSV import fix, first-run guided tour. Named 30-day deadline, scope-cut plan if 45 days look necessary.",
        why: "Onboarding is the most-cited blocker in support tickets and directly contradicts the sales 'fast deployment' message. Deferring to Q3 (sig_017) actively widens the positioning-vs-reality gap for a full quarter — and undermines every pitch sales gives in the meantime.",
        risk_if_wrong: "30-day capacity diversion from integration or enterprise-trust work. Counter: integration work runs in parallel under rec_01; this is a separate team.",
        owner: "CPO",
        horizon: "this month",
        confidence: 0.88,
        hard_call: false,
        links_to_themes: ["theme_02"],
        links_to_contradictions: ["contra_02"],
        evidence: ["sig_005","sig_007","sig_012","sig_017","sig_027","sig_029","sig_031","sig_035"]
      },
      {
        id: "rec_03",
        title: "Stand up an enterprise trust kit — SOC 2, BAA, SSO/SCIM, audit logs",
        what: "Ship a named-owner program: (a) SOC 2 Type II bridge letter; (b) template BAA + PHI handling runbook; (c) SCIM provisioning and exportable audit logs; (d) model-access-controls one-pager. Target a buyer-ready kit in 45 days.",
        why: "Enterprise and healthcare deals (Aperture, Crestline, Beacon) are conditionally buying on these items. These are deterministic, build-once assets — not a bet. Expected to convert conditional deals and raise ACV mix.",
        risk_if_wrong: "Cost of compliance program (time + auditor fees) without accelerated close, if the conditional buyers churn for unrelated reasons.",
        owner: "CRO",
        horizon: "this quarter",
        confidence: 0.82,
        hard_call: false,
        links_to_themes: ["theme_03"],
        links_to_contradictions: [],
        evidence: ["sig_002","sig_009","sig_013","sig_020","sig_022","sig_026","sig_030","sig_033"]
      },
      {
        id: "rec_04",
        title: "A/B test retiring the 'fast deployment' lead message",
        what: "Run a 4-week A/B on outbound and AE-led pitches. Control: 'fast deployment.' Variant: 'deeply configurable for ops teams, with integration reliability built in.' Re-train AEs on whichever wins. Pause first-week claims that can't be substantiated.",
        why: "Every week the company leads with 'fast setup,' the promise-vs-reality gap damages trust and surfaces in week-2 support load. Reps already report integration-first pitches convert better (sig_038). The A/B framing is lower-risk than outright retirement.",
        risk_if_wrong: "Variant underperforms short-term; reps resist change; messaging inconsistency hurts pipeline during the test.",
        owner: "Head of GTM",
        horizon: "this month",
        confidence: 0.75,
        hard_call: false,
        links_to_themes: ["theme_02"],
        links_to_contradictions: ["contra_02"],
        evidence: ["sig_014","sig_038","sig_005","sig_027"]
      },
      {
        id: "rec_05",
        title: "Retract the 'integration is edge-case' assumption in writing this week",
        what: "In this week's leadership sync, explicitly revise or retract the assumption logged in sig_018. Replace with the cross-source evidence base. Tie the retraction to a decision-log entry and cascade the update into the Q2 planning doc.",
        why: "The largest strategic risk in this batch is not a single wrong bet — it's drift between internal belief and customer-visible reality. A named retraction is cheaper than a quarter of misaligned planning and models to the org that beliefs update against evidence.",
        risk_if_wrong: "Reads as theater if not tied to the Q2 re-sequence in rec_01. Pair the two or skip this one.",
        owner: "Chief of Staff",
        horizon: "this week",
        confidence: 0.80,
        hard_call: false,
        links_to_themes: [],
        links_to_contradictions: ["contra_01","contra_03"],
        evidence: ["sig_016","sig_018","sig_017","sig_037"]
      }
    ]
  },
  critique: {
    theme_notes: [
      { theme_id: "theme_01", note: "Strongest cross-source evidence in the batch — 5 source types, 11 signals, named internal contradiction. High confidence justified." },
      { theme_id: "theme_02", note: "Pattern is clear, but 'onboarding' bundles distinct subproblems (permissions, templates, data import) that may want separate tracking next week." },
      { theme_id: "theme_03", note: "Confident. Watch for conflation between true enterprise buyers and mid-market accounts that 'say enterprise things' without the procurement process to match." },
      { theme_id: "theme_04", note: "Noise flag appropriate. Six signals is non-trivial but all from data-forward power users at engaged accounts. Should not carry a Q2 headline roadmap on this base." }
    ],
    contradiction_notes: [
      { contradiction_id: "contra_01", note: "Core strategic tension; well-supported. Lead the memo with this — the other contradictions are consequences." },
      { contradiction_id: "contra_02", note: "Evidence solid. 'Fast deployment' may still be true for a specific customer profile — consider segmenting before fully retiring the claim." },
      { contradiction_id: "contra_03", note: "Clean internal-vs-external contradiction with a named assumption and rebuttal evidence. Highest-leverage single item to act on this week." }
    ],
    recommendation_notes: [
      { recommendation_id: "rec_01", note: "Confident. Sharpen by naming specific analytics items being killed vs. deferred — ambiguity here creates re-litigation risk." },
      { recommendation_id: "rec_02", note: "Well-grounded. 30 days is ambitious; prepare a 45-day contingency plan with explicit scope cuts baked in up front." },
      { recommendation_id: "rec_03", note: "Clean, deterministic work. Single-owner (CRO) is right; early draft had 'CRO + CoS' which is too diffuse in practice." },
      { recommendation_id: "rec_04", note: "The A/B framing correctly softens what would otherwise be an overreach. Good calibration." },
      { recommendation_id: "rec_05", note: "Bold but supported. Pair the retraction with the Q2 re-sequence decision so it doesn't read as theater." }
    ],
    overall_confidence: 0.82,
    caveats: [
      "Single-week batch — no trend baseline from prior weeks, so 'rising/falling' labels are inferred, not measured.",
      "No quantitative customer-health, NPS, or retention data in this batch; support-ticket severity is a proxy at best.",
      "Deal-size and pipeline figures are self-reported sales-side estimates, not booking data."
    ],
    blind_spot: "Competitive positioning is invisible in this dataset. If a competitor is shipping a Salesforce-first automation story, re-sequencing toward integration is parity, not differentiation — and the analytics bet may deserve more weight than current evidence suggests. Recommend pulling a competitive scan into next week's mix."
  },
  memo: `# Weekly Executive Signal Mix — RelayForge — Week of March 2, 2026

## TL;DR
Integration, not analytics, is RelayForge's binding constraint this quarter: three strategic themes and two of the three surfaced contradictions point at Salesforce reliability and onboarding depth as the live blockers on mid-market deals and support load. The current Q2 plan — analytics-first, onboarding deferred, integration treated as edge-case — directly contradicts the week's cross-source evidence. Recommended this week: re-sequence the Q2 roadmap and retract the "integration is edge-case" framing.

## What Mattered This Week
- **\$340k of mid-market pipeline stalled on integration dependencies**; integration is named in 4 of 4 late-stage stalled deals [sig_037].
- **Salesforce reliability issues hit production customers**: OAuth rotation, field-mapping, sync failures — all P1 [sig_006, sig_025, sig_028].
- **Enterprise/healthcare deals are conditionally buying on SOC 2, BAA, SCIM, audit logs** [sig_020, sig_022, sig_026].
- **Onboarding fixes are pushed to Q3** in the internal plan while onboarding drives the week's highest support volume [sig_017, sig_005, sig_007, sig_027].
- **Sales continues to pitch "fast deployment"** against a support reality of systemic first-run failures [sig_014, sig_005, sig_027, sig_031].

## Themes
**Salesforce integration is the dominant deal blocker** — 11 signals across 5 source types show Salesforce friction blocking deals and creating support load [evidence: sig_001, sig_006, sig_011, sig_019, sig_025, sig_028, sig_032, sig_036, sig_037].

**Onboarding complexity is stalling customers before first value** — permissions, templates, and data import all fail for non-expert admins; cross-source, ten signals [evidence: sig_003, sig_005, sig_007, sig_012, sig_024, sig_027, sig_029, sig_031, sig_035].

**Enterprise trust gap** — mid-to-late-stage enterprise deals condition on SOC 2, BAA, SSO/SCIM, audit logs; eight signals [evidence: sig_002, sig_009, sig_013, sig_020, sig_022, sig_026, sig_030, sig_033].

**Analytics demand — real but narrow, possibly overweighted internally** — six signals from data-forward power users; sales reports analytics-led pitches underperform integration-led ones [evidence: sig_004, sig_010, sig_023, sig_034, sig_016, sig_038].

## Contradictions
**Leadership Q2 analytics bet vs. customer evidence that integration is the blocker** — Severity 5. Internal bet (sig_016) assumes analytics is the wedge; pipeline and support data say integration is the constraint [evidence: sig_016, sig_037, sig_038].

**Sales messaging "fast deployment" vs. support reality** — Severity 4. Pitch (sig_014) promises ease-of-setup; seven first-run failures say otherwise [evidence: sig_014, sig_005, sig_007, sig_012, sig_027, sig_029, sig_031].

**Leadership "integration is edge-case" assumption vs. systemic cross-source evidence** — Severity 5. Named assumption (sig_018) directly rebutted by pipeline review and support volume [evidence: sig_018, sig_006, sig_025, sig_028, sig_036, sig_037].

## Recommended Actions

**1. Re-sequence Q2: integration reliability before analytics (CEO + CPO, this week, confidence 85%)**
- What: Shift Q2 headline from "analytics differentiator" to "integration reliability + Salesforce-grade setup + multi-CRM." Reserve 60-70% of engineering capacity accordingly.
- Why: Three of four themes and two of three contradictions point here; \$340k of pipeline is stalled on this; analytics wedge rests on thinner evidence than assumed.
- Risk if wrong: Competitors close an analytics gap during the re-sequence. Counter: integration is table stakes and doesn't compound.

**2. 30-day onboarding hardening sprint — do not defer to Q3 (CPO, this month, confidence 88%)**
- What: Cross-functional tiger team on permissions redesign, 4-6 starter templates, CSV import fix, first-run guided tour.
- Why: Highest support volume category; undermines sales positioning every week it slips.
- Risk if wrong: 30-day capacity diversion from integration or analytics.

**3. Enterprise trust kit — SOC 2, BAA, SSO/SCIM, audit logs (CRO, this quarter, confidence 82%)**
- What: SOC 2 Type II bridge letter; template BAA + PHI runbook; SCIM + exportable audit logs; model-access controls one-pager.
- Why: Three named enterprise deals conditioning on these; deterministic build-once work.
- Risk if wrong: Compliance program cost without faster close.

**4. A/B test retiring 'fast deployment' lead messaging (Head of GTM, this month, confidence 75%)**
- What: 4-week A/B. Control: "fast deployment." Variant: "deeply configurable for ops teams, with integration reliability built in." Adopt winner.
- Why: Promise-vs-reality gap damages early trust; integration-first pitches already convert better per AE manager.
- Risk if wrong: Short-term pipeline drag during repositioning.

**5. Retract the "integration is edge-case" assumption in writing this week (Chief of Staff, this week, confidence 80%)**
- What: Revise the assumption in sig_018 with named evidence; log in decision register; cascade into Q2 planning doc.
- Why: Largest strategic risk this week is drift between internal belief and customer-visible reality.
- Risk if wrong: Reads as theater if not tied to the Q2 re-sequence.

## Caveats & Confidence
- **Overall confidence: 82%**
- Single-week batch; "rising / falling" trend labels inferred, not baseline-compared.
- No quantitative customer-health, NPS, or retention data in this batch; support severity is a proxy.
- Deal-size and pipeline figures are sales-side estimates, not bookings.
- **Blind spot:** Competitive positioning is not in this dataset. If a competitor is shipping Salesforce-first automation, the integration re-sequence is parity rather than wedge — and the analytics bet may deserve more weight than evidence currently suggests. Recommend a competitive scan in next week's mix.`
};

/* -------------------------------------------------------------------------
   5. UTILITIES — API transport + JSON extraction
   ------------------------------------------------------------------------- */

// Robust JSON extraction. LLMs sometimes wrap JSON in fences or add a
// preamble despite instructions. We strip fences first, then try the
// whole string, then fall back to the first { ... last } or [ ... ]
// balanced slice.
//
// On failure, we attach a ~500-char excerpt of the raw input to the
// thrown error. This is essential for debugging live calls — without
// the raw output you're guessing at what the model actually returned.
function extractJSON(text) {
  if (!text || typeof text !== "string") {
    throw new Error("extractJSON: empty or non-string input");
  }

  // Strip markdown code fences
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  cleaned = cleaned.trim();

  // Helper to produce a diagnostic excerpt on any failure path
  const excerpt = () => {
    const head = text.slice(0, 200);
    const tail = text.length > 400 ? text.slice(-200) : "";
    return tail
      ? ` [head: ${JSON.stringify(head)} … tail: ${JSON.stringify(tail)}]`
      : ` [raw: ${JSON.stringify(head)}]`;
  };

  // First attempt: parse whole thing
  try {
    return JSON.parse(cleaned);
  } catch (_) { /* continue */ }

  // Find first JSON structure — whichever of { or [ comes first
  const firstObj = cleaned.indexOf("{");
  const firstArr = cleaned.indexOf("[");
  let start = -1;
  let openCh = "";
  let closeCh = "";
  if (firstObj === -1 && firstArr === -1) {
    throw new Error("extractJSON: no JSON structure found." + excerpt());
  }
  if (firstObj === -1 || (firstArr !== -1 && firstArr < firstObj)) {
    start = firstArr;
    openCh = "[";
    closeCh = "]";
  } else {
    start = firstObj;
    openCh = "{";
    closeCh = "}";
  }

  // Walk the string tracking depth, respecting strings & escapes, to
  // find the matching close bracket.
  let depth = 0;
  let inStr = false;
  let esc = false;
  let end = -1;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (inStr) {
      if (esc) { esc = false; continue; }
      if (ch === "\\") { esc = true; continue; }
      if (ch === '"') { inStr = false; }
      continue;
    }
    if (ch === '"') { inStr = true; continue; }
    if (ch === openCh) depth++;
    else if (ch === closeCh) {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  if (end === -1) {
    throw new Error(
      "extractJSON: unbalanced JSON structure — response likely truncated by max_tokens." +
      excerpt()
    );
  }

  const slice = cleaned.slice(start, end + 1);
  try {
    return JSON.parse(slice);
  } catch (e) {
    throw new Error(`extractJSON: slice failed to parse (${e.message}).` + excerpt());
  }
}

// Fetch wrapper for the Anthropic API. Posts to the same-origin proxy
// which adds the API key server-side (see functions/api/claude.js).
//
// Surfaces upstream errors verbatim and detects max_tokens truncation
// explicitly — if stop_reason is "max_tokens", the response is cut off
// mid-generation and any JSON it contains is guaranteed invalid.
async function callClaude(system, user, maxTokens = 4000) {
  const response = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`API ${response.status}: ${body.slice(0, 500)}`);
  }
  const data = await response.json();

  // Concatenate text blocks (Opus 4.7 streams thinking blocks too; we
  // only want text content).
  const text = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  // Explicit truncation detection — `stop_reason: "max_tokens"` means
  // the model ran out of output budget mid-response. The resulting
  // text is guaranteed to be malformed JSON or truncated markdown.
  // Log to console so the browser devtools show the partial output
  // alongside our user-facing error.
  if (data.stop_reason === "max_tokens") {
    // eslint-disable-next-line no-console
    console.warn("[callClaude] Response truncated at max_tokens =", maxTokens,
      "· output usage:", data.usage,
      "· last 400 chars:", text.slice(-400));
    throw new Error(
      `Response truncated — max_tokens (${maxTokens}) was insufficient. ` +
      `Raise the agent's max_tokens value. Model: ${MODEL}. ` +
      `Output tokens used: ${data.usage?.output_tokens ?? "unknown"}.`
    );
  }

  return { text, usage: data.usage || null, stop_reason: data.stop_reason };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* -------------------------------------------------------------------------
   6. AGENT WRAPPERS
   Each agent: composes its user prompt from upstream state, calls Claude,
   parses JSON. Demo mode short-circuits to DEMO_OUTPUTS with a sleep to
   preserve the sense of work being done.
   ------------------------------------------------------------------------- */

async function runIngestion(signals, mode) {
  if (mode === "demo") { await sleep(700); return DEMO_OUTPUTS.ingestion; }
  const user = `Here are the raw signals to audit:\n\n${JSON.stringify(signals, null, 2)}\n\nReturn the JSON object specified in your instructions.`;
  const { text } = await callClaude(PROMPTS.ingestion, user, 4000);
  return extractJSON(text);
}

async function runThemes(signals, ingestion, mode) {
  if (mode === "demo") { await sleep(1100); return DEMO_OUTPUTS.themes; }
  const user = `Ingestion report:\n${JSON.stringify(ingestion, null, 2)}\n\nSignals:\n${JSON.stringify(signals, null, 2)}\n\nReturn the JSON object specified in your instructions.`;
  const { text } = await callClaude(PROMPTS.theme, user, 6000);
  return extractJSON(text);
}

async function runContradictions(signals, themes, mode) {
  if (mode === "demo") { await sleep(900); return DEMO_OUTPUTS.contradictions; }
  const user = `Themes identified:\n${JSON.stringify(themes, null, 2)}\n\nSignals:\n${JSON.stringify(signals, null, 2)}\n\nReturn the JSON object specified in your instructions.`;
  const { text } = await callClaude(PROMPTS.contradiction, user, 5000);
  return extractJSON(text);
}

async function runRecommendations(signals, themes, contradictions, mode) {
  if (mode === "demo") { await sleep(1000); return DEMO_OUTPUTS.recommendations; }
  const user = `Themes:\n${JSON.stringify(themes, null, 2)}\n\nContradictions:\n${JSON.stringify(contradictions, null, 2)}\n\nCompany context:\n${JSON.stringify(COMPANY, null, 2)}\n\nReturn the JSON object specified in your instructions.`;
  const { text } = await callClaude(PROMPTS.recommendation, user, 6000);
  return extractJSON(text);
}

async function runCritic(themes, contradictions, recommendations, signals, mode) {
  if (mode === "demo") { await sleep(850); return DEMO_OUTPUTS.critique; }
  const user = `Themes:\n${JSON.stringify(themes, null, 2)}\n\nContradictions:\n${JSON.stringify(contradictions, null, 2)}\n\nRecommendations:\n${JSON.stringify(recommendations, null, 2)}\n\nSignals available:\n${JSON.stringify(signals.map(s => ({ id: s.id, source_type: s.source_type, summary: s.summary, evidence_strength: s.evidence_strength })), null, 2)}\n\nReturn the JSON object specified in your instructions.`;
  const { text } = await callClaude(PROMPTS.critic, user, 5000);
  return extractJSON(text);
}

async function runMemo(ingestion, themes, contradictions, recommendations, critique, mode) {
  if (mode === "demo") { await sleep(1100); return DEMO_OUTPUTS.memo; }
  const user = `Company:\n${JSON.stringify(COMPANY, null, 2)}\n\nIngestion:\n${JSON.stringify(ingestion, null, 2)}\n\nThemes:\n${JSON.stringify(themes, null, 2)}\n\nContradictions:\n${JSON.stringify(contradictions, null, 2)}\n\nRecommendations:\n${JSON.stringify(recommendations, null, 2)}\n\nCritique:\n${JSON.stringify(critique, null, 2)}\n\nReturn the markdown memo only, no preamble.`;
  const { text } = await callClaude(PROMPTS.memo, user, 6000);
  return text.trim();
}

/* -------------------------------------------------------------------------
   7. ORCHESTRATOR
   Sequential agent pipeline with per-agent status callbacks so the UI
   can visualize progression.
   ------------------------------------------------------------------------- */

const AGENT_SEQUENCE = [
  { id: "ingestion",       label: "Ingestion",       icon: Layers,      desc: "Audit & categorize" },
  { id: "themes",          label: "Theme",           icon: Activity,    desc: "Cluster recurring signals" },
  { id: "contradictions",  label: "Contradiction",   icon: GitBranch,   desc: "Surface internal conflicts" },
  { id: "recommendations", label: "Recommendation",  icon: Lightbulb,   desc: "Draft action set" },
  { id: "critic",          label: "Critic",          icon: Shield,      desc: "Red-team & confidence" },
  { id: "memo",            label: "Memo",            icon: FileText,    desc: "Compile exec brief" },
];

async function runPipeline(signals, mode, callbacks = {}) {
  const { onAgentStart = () => {}, onAgentDone = () => {}, onError = () => {} } = callbacks;
  const results = {};

  async function step(id, fn) {
    onAgentStart(id);
    const t0 = performance.now();
    try {
      const out = await fn();
      const ms = Math.round(performance.now() - t0);
      results[id] = out;
      onAgentDone(id, out, ms);
      return out;
    } catch (e) {
      onError(id, e);
      throw e;
    }
  }

  await step("ingestion",       () => runIngestion(signals, mode));
  await step("themes",          () => runThemes(signals, results.ingestion, mode));
  await step("contradictions",  () => runContradictions(signals, results.themes, mode));
  await step("recommendations", () => runRecommendations(signals, results.themes, results.contradictions, mode));
  await step("critic",          () => runCritic(results.themes, results.contradictions, results.recommendations, signals, mode));
  await step("memo",            () => runMemo(results.ingestion, results.themes, results.contradictions, results.recommendations, results.critic, mode));

  return results;
}

/* -------------------------------------------------------------------------
   8. STYLES — airy, cool-white, gradient-kissed.
   Inter everywhere, JetBrains Mono for data, an indigo/lavender accent
   that echoes an iridescent brand gradient. Fully rounded pills, soft
   shadows, frosted-glass pills, a diffused gradient wash behind the
   whole surface.
   ------------------------------------------------------------------------- */

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

:root {
  /* Base surface palette — cool, bright, near-white */
  --ris-bg:            #FAFBFE;
  --ris-bg-elevated:   #FFFFFF;
  --ris-bg-subtle:     #F3F5FA;
  --ris-bg-subtle-2:   #EDF0F7;

  /* Ink */
  --ris-ink:           #0B0B12;
  --ris-ink-2:         #26262F;
  --ris-ink-3:         #4A4A55;
  --ris-mute:          #71717A;
  --ris-mute-2:        #A1A1AA;

  /* Lines & hairlines */
  --ris-hair:          rgba(11,11,18,0.06);
  --ris-hair-strong:   rgba(11,11,18,0.10);
  --ris-line:          rgba(11,11,18,0.14);

  /* Accent — indigo / lavender, echoing the iridescent brand mark */
  --ris-accent:        #6366F1;
  --ris-accent-2:      #818CF8;
  --ris-accent-soft:   rgba(99,102,241,0.10);
  --ris-accent-softer: rgba(99,102,241,0.05);

  /* Semantic */
  --ris-flag:          #E11D48;
  --ris-flag-soft:     rgba(225,29,72,0.08);
  --ris-ok:            #10B981;
  --ris-warn:          #F59E0B;

  /* Shadows — very soft, layered */
  --ris-shadow-sm:     0 1px 2px rgba(11,11,18,0.04);
  --ris-shadow-md:     0 1px 2px rgba(11,11,18,0.04), 0 4px 16px rgba(11,11,18,0.03);
  --ris-shadow-lg:     0 1px 2px rgba(11,11,18,0.04), 0 16px 48px rgba(11,11,18,0.06);

  /* Legacy aliases — some inline JSX styles still reference these names.
     Map them onto the new palette so nothing breaks. */
  --ris-paper:         var(--ris-bg);
  --ris-paper-2:       var(--ris-bg-subtle);
  --ris-grid:          rgba(11,11,18,0.05);
  --ris-live:          var(--ris-flag);
}

.ris-root {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: var(--ris-ink);
  min-height: 100vh;
  letter-spacing: -0.005em;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  /* The backdrop — a cool near-white with a diffused lavender-blue wash.
     Fixed attachment so it doesn't scroll, keeping the dreamy feel
     consistent as you move down the page. */
  background-color: var(--ris-bg);
  background-image:
    radial-gradient(ellipse 1400px 700px at 50% -10%, rgba(129, 140, 248, 0.18), transparent 55%),
    radial-gradient(ellipse 900px 500px at 12% 38%, rgba(99, 155, 241, 0.08), transparent 60%),
    radial-gradient(ellipse 900px 500px at 88% 72%, rgba(167, 139, 250, 0.08), transparent 60%);
  background-attachment: fixed;
}

.ris-root * { box-sizing: border-box; }

/* 'ris-serif' is the display class — now a bold, tight sans instead of a
   serif. Keeping the class name avoids touching every component. */
.ris-serif {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  letter-spacing: -0.028em;
}
.ris-serif em {
  font-style: normal;
  color: var(--ris-accent);
  font-weight: 700;
}

.ris-mono {
  font-family: 'JetBrains Mono', ui-monospace, 'SF Mono', monospace;
  font-variant-numeric: tabular-nums;
}

.ris-wordmark {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 20px;
  letter-spacing: -0.028em;
  color: var(--ris-ink);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.ris-wordmark em {
  font-style: normal;
  color: var(--ris-accent);
  font-weight: 700;
  background: linear-gradient(135deg, #6366F1, #A78BFA);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.ris-eyebrow {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ris-mute);
}

.ris-divider        { height: 1px; background: var(--ris-hair); border: none; }
.ris-divider-strong { height: 1px; background: var(--ris-hair-strong); border: none; }

/* Pills — fully rounded, frosted-glass. This is the hero shape of the
   new design. */
.ris-pill {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 12px;
  border-radius: 999px;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: var(--ris-ink-2);
  background: rgba(255,255,255,0.65);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid var(--ris-hair);
  transition: all 140ms ease;
}
.ris-pill.solid  { background: var(--ris-ink); color: #FFFFFF; border-color: var(--ris-ink); }
.ris-pill.accent { background: var(--ris-accent); color: #FFFFFF; border-color: var(--ris-accent); }

/* Primary button — black pill, soft lift on hover */
.ris-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 11px 20px;
  border-radius: 999px;
  background: var(--ris-ink);
  color: #FFFFFF;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 14px;
  letter-spacing: -0.005em;
  border: 1px solid var(--ris-ink);
  cursor: pointer;
  transition: all 200ms cubic-bezier(.2,.7,.2,1);
  box-shadow: var(--ris-shadow-sm);
}
.ris-btn:hover:not(:disabled) {
  background: #1E1E2A;
  border-color: #1E1E2A;
  transform: translateY(-1px);
  box-shadow: var(--ris-shadow-md);
}
.ris-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* Secondary button — white pill with a thin outline */
.ris-btn-ghost {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 9px 16px;
  border-radius: 999px;
  background: rgba(255,255,255,0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: var(--ris-ink-2);
  border: 1px solid var(--ris-hair);
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 13px;
  cursor: pointer;
  transition: all 160ms ease;
}
.ris-btn-ghost:hover {
  background: #FFFFFF;
  border-color: var(--ris-hair-strong);
  color: var(--ris-ink);
}
.ris-btn-ghost:disabled { opacity: 0.4; cursor: not-allowed; }

/* Mode toggle — pill-shaped segmented control */
.ris-toggle {
  display: inline-flex;
  border: 1px solid var(--ris-hair);
  border-radius: 999px;
  background: rgba(255,255,255,0.70);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding: 3px;
}
.ris-toggle button {
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
  background: transparent;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  color: var(--ris-mute);
  letter-spacing: 0;
  transition: all 160ms ease;
}
.ris-toggle button.active {
  background: var(--ris-ink);
  color: #FFFFFF;
}

/* Cards — rounded, soft-shadowed, elevated white */
.ris-card {
  background: var(--ris-bg-elevated);
  border: 1px solid var(--ris-hair);
  border-radius: 16px;
  padding: 22px;
  box-shadow: var(--ris-shadow-sm);
}
.ris-card.raised {
  background: #FFFFFF;
  box-shadow: var(--ris-shadow-md);
}
.ris-card.tint {
  background: rgba(255,255,255,0.55);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-color: var(--ris-hair);
}

/* Agent pipeline nodes — frosted cards that pulse when active */
.ris-node {
  position: relative;
  background: rgba(255,255,255,0.75);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--ris-hair);
  border-radius: 14px;
  padding: 14px 14px 12px;
  transition: all 240ms cubic-bezier(.2,.7,.2,1);
  min-width: 0;
}
.ris-node.idle { opacity: 0.6; }
.ris-node.running {
  border-color: var(--ris-accent);
  background: #FFFFFF;
  box-shadow: 0 0 0 4px var(--ris-accent-soft), var(--ris-shadow-md);
}
.ris-node.running::before {
  content: "";
  position: absolute;
  inset: -1px;
  border: 1px solid var(--ris-accent);
  animation: risPulse 1.8s ease-in-out infinite;
  pointer-events: none;
  border-radius: 14px;
}
.ris-node.done {
  background: #FFFFFF;
  border-color: var(--ris-hair-strong);
  box-shadow: var(--ris-shadow-sm);
}
.ris-node.error {
  border-color: var(--ris-flag);
  background: var(--ris-flag-soft);
}

@keyframes risPulse {
  0%, 100% { opacity: 0; transform: scale(1); }
  50%      { opacity: 0.4; transform: scale(1.015); }
}

.ris-link {
  flex: 1;
  height: 2px;
  background: var(--ris-hair);
  position: relative;
  min-width: 16px;
  border-radius: 999px;
}
.ris-link.active { background: var(--ris-accent); }
.ris-link.done   { background: var(--ris-hair-strong); }

/* Evidence drawer */
.ris-drawer-scrim {
  position: fixed; inset: 0;
  background: rgba(11,11,18,0.22);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  opacity: 0; pointer-events: none;
  transition: opacity 220ms ease;
  z-index: 40;
}
.ris-drawer-scrim.open { opacity: 1; pointer-events: auto; }
.ris-drawer {
  position: fixed; top: 0; right: 0; height: 100vh;
  width: min(460px, 92vw);
  background: var(--ris-bg-elevated);
  border-left: 1px solid var(--ris-hair);
  transform: translateX(100%);
  transition: transform 280ms cubic-bezier(.2,.7,.2,1);
  z-index: 50;
  display: flex;
  flex-direction: column;
  box-shadow: -24px 0 64px rgba(11,11,18,0.10);
}
.ris-drawer.open { transform: translateX(0); }

/* Evidence chips — rounded pills */
.ris-chip {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--ris-bg-subtle);
  color: var(--ris-ink-2);
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.01em;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 140ms ease;
}
.ris-chip:hover {
  background: var(--ris-ink);
  color: #FFFFFF;
  border-color: var(--ris-ink);
}

/* Severity bar */
.ris-sev { display: inline-flex; gap: 2px; }
.ris-sev span {
  width: 4px; height: 12px;
  background: var(--ris-hair-strong);
  border-radius: 2px;
}
.ris-sev span.on { background: var(--ris-ink); }
.ris-sev.flag span.on { background: var(--ris-flag); }

/* Confidence bar — filled with the accent gradient */
.ris-conf { display: flex; align-items: center; gap: 10px; }
.ris-conf-track {
  flex: 1;
  height: 4px;
  background: var(--ris-hair);
  position: relative;
  border-radius: 999px;
  overflow: hidden;
}
.ris-conf-fill {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  background: linear-gradient(90deg, var(--ris-accent), var(--ris-accent-2));
  border-radius: 999px;
}

/* Memo prose — reads like a well-typeset article */
.ris-memo {
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  line-height: 1.7;
  color: var(--ris-ink-2);
}
.ris-memo h1 {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 38px;
  line-height: 1.1;
  color: var(--ris-ink);
  margin: 0 0 14px;
  letter-spacing: -0.032em;
}
.ris-memo h2 {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 24px;
  line-height: 1.25;
  color: var(--ris-ink);
  margin: 36px 0 12px;
  letter-spacing: -0.02em;
}
.ris-memo h3 {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ris-mute);
  margin: 28px 0 10px;
}
.ris-memo p { margin: 0 0 16px; }
.ris-memo ul { margin: 0 0 16px; padding-left: 20px; }
.ris-memo li { margin: 0 0 8px; }
.ris-memo strong { color: var(--ris-ink); font-weight: 600; }
.ris-memo em {
  font-style: normal;
  color: var(--ris-accent);
  font-weight: 500;
}
.ris-memo code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9em;
  background: var(--ris-bg-subtle);
  padding: 1px 6px;
  border-radius: 4px;
}

/* Signals explorer table */
.ris-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.ris-table th {
  text-align: left;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ris-mute);
  padding: 12px 14px;
  border-bottom: 1px solid var(--ris-hair-strong);
  background: var(--ris-bg-subtle);
}
.ris-table td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--ris-hair);
  color: var(--ris-ink-2);
  vertical-align: top;
}
.ris-table tr:hover td { background: var(--ris-bg-subtle); }
.ris-table tr { cursor: pointer; transition: background-color 120ms ease; }

/* JSON inspector — keep the dark panel for contrast, but rounder */
.ris-json {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  line-height: 1.6;
  background: #0E0E14;
  color: #D4D4E0;
  padding: 20px;
  border-radius: 12px;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 480px;
  overflow: auto;
}

/* Section collapse header */
.ris-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
  padding: 20px 0;
}
.ris-section-head:hover .ris-section-title { color: var(--ris-accent); }

/* Utilities */
.ris-muted { color: var(--ris-mute); }
.ris-strong { color: var(--ris-ink); }
.ris-grid { display: grid; gap: 16px; }
.ris-stack { display: flex; flex-direction: column; }
.ris-row { display: flex; align-items: center; }
.ris-space-sm { gap: 8px; }
.ris-space-md { gap: 16px; }
.ris-space-lg { gap: 24px; }

/* Responsive */
@media (max-width: 900px) {
  .ris-hero-grid { grid-template-columns: 1fr !important; }
  .ris-pipeline  { flex-direction: column !important; align-items: stretch !important; }
  .ris-link      { width: 2px !important; height: 16px !important; flex: none !important; margin: 0 auto; }
  .ris-two-col   { grid-template-columns: 1fr !important; }
}
`;

/* -------------------------------------------------------------------------
   9. SMALL PRESENTATIONAL HELPERS
   ------------------------------------------------------------------------- */

function SeverityBar({ value, max = 5, flag = false }) {
  return (
    <span className={`ris-sev ${flag ? "flag" : ""}`} aria-label={`severity ${value}/${max}`}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={i < value ? "on" : ""} />
      ))}
    </span>
  );
}

function ConfidenceBar({ value }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className="ris-conf">
      <span className="ris-mono" style={{ fontSize: 11, minWidth: 34, color: "var(--ris-ink)" }}>{pct}%</span>
      <div className="ris-conf-track"><div className="ris-conf-fill" style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

function EvidenceChip({ id, onClick }) {
  return (
    <button className="ris-chip" onClick={() => onClick(id)} title={`View signal ${id}`}>
      {id}
    </button>
  );
}

function SourceIcon({ source_type, size = 13 }) {
  const meta = SOURCE_META[source_type];
  if (!meta) return null;
  const Icon = meta.icon;
  return <Icon size={size} strokeWidth={1.75} style={{ color: "var(--ris-mute)" }} />;
}

function TrendGlyph({ trend }) {
  const map = {
    rising:     { char: "↑", color: "var(--ris-flag)",   label: "rising" },
    falling:    { char: "↓", color: "var(--ris-ok)",     label: "falling" },
    steady:     { char: "→", color: "var(--ris-mute)",   label: "steady" },
    new:        { char: "•", color: "var(--ris-accent)", label: "new" },
  };
  const g = map[trend] || map.steady;
  return (
    <span className="ris-mono" style={{ fontSize: 11, color: g.color, letterSpacing: "0.08em" }}>
      {g.char} {g.label}
    </span>
  );
}

// Tiny markdown renderer for the memo. Intentionally minimal — headings,
// bold, italics, inline code, lists, paragraphs. Avoids pulling a full
// markdown dep for a controlled-input case.
function MemoMarkdown({ markdown }) {
  const html = useMemo(() => mdToHtml(markdown || ""), [markdown]);
  return <div className="ris-memo" dangerouslySetInnerHTML={{ __html: html }} />;
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function inline(s) {
  let t = escapeHtml(s);
  t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/(^|[\s(])_([^_\n]+)_([\s).,;:!?]|$)/g, "$1<em>$2</em>$3");
  // Signal references → clickable chips (we leave them as plain for now;
  // the evidence drawer is driven from structured data, not memo parsing)
  return t;
}
function mdToHtml(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let inList = false;
  let paraBuf = [];
  const flushPara = () => {
    if (paraBuf.length) {
      out.push(`<p>${inline(paraBuf.join(" "))}</p>`);
      paraBuf = [];
    }
  };
  const closeList = () => { if (inList) { out.push("</ul>"); inList = false; } };

  for (let raw of lines) {
    const line = raw;
    if (/^\s*$/.test(line)) { flushPara(); closeList(); continue; }
    if (/^#\s+/.test(line)) { flushPara(); closeList(); out.push(`<h1>${inline(line.replace(/^#\s+/, ""))}</h1>`); continue; }
    if (/^##\s+/.test(line)) { flushPara(); closeList(); out.push(`<h2>${inline(line.replace(/^##\s+/, ""))}</h2>`); continue; }
    if (/^###\s+/.test(line)) { flushPara(); closeList(); out.push(`<h3>${inline(line.replace(/^###\s+/, ""))}</h3>`); continue; }
    if (/^\s*[-*]\s+/.test(line)) {
      flushPara();
      if (!inList) { out.push("<ul>"); inList = true; }
      out.push(`<li>${inline(line.replace(/^\s*[-*]\s+/, ""))}</li>`);
      continue;
    }
    closeList();
    paraBuf.push(line.trim());
  }
  flushPara(); closeList();
  return out.join("\n");
}

/* -------------------------------------------------------------------------
   10. MAJOR COMPONENTS
   ------------------------------------------------------------------------- */

function Header({ mode, setMode, onReset, hasRun }) {
  return (
    <header style={{ borderBottom: "1px solid var(--ris-line)", background: "var(--ris-paper)" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "18px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div className="ris-row ris-space-md">
          <div className="ris-wordmark">
            Remix <em>Intelligence</em> Studio
          </div>
          <div className="ris-pill" style={{ marginLeft: 8 }}>
            <span style={{ width: 6, height: 6, background: "var(--ris-accent)", borderRadius: "50%" }} />
            MVP · v0.1
          </div>
        </div>
        <div className="ris-row ris-space-sm">
          <div className="ris-toggle" role="group" aria-label="Execution mode">
            <button className={mode === "demo" ? "active" : ""} onClick={() => setMode("demo")}>DEMO</button>
            <button className={mode === "live" ? "active" : ""} onClick={() => setMode("live")}>LIVE</button>
          </div>
          {hasRun && (
            <button className="ris-btn-ghost" onClick={onReset} title="Reset run state">
              <RefreshCw size={13} strokeWidth={1.75} />
              Reset
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function HeroPanel({ onRun, running, hasRun, mode }) {
  // Source distribution for the mini-chart
  const dist = useMemo(() => {
    const counts = {};
    SIGNALS.forEach(s => { counts[s.source_type] = (counts[s.source_type] || 0) + 1; });
    const order = ["customer_call", "support_ticket", "product_feedback", "sales_note", "internal_note"];
    return order.map(k => ({ key: k, count: counts[k] || 0, meta: SOURCE_META[k] }));
  }, []);
  const total = SIGNALS.length;

  return (
    <section style={{ borderBottom: "1px solid var(--ris-hair)", background: "var(--ris-paper)" }}>
      <div className="ris-hero-grid" style={{ maxWidth: 1240, margin: "0 auto", padding: "48px 28px 36px", display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: 48, alignItems: "start" }}>
        {/* Left: editorial narrative */}
        <div>
          <div className="ris-eyebrow" style={{ marginBottom: 14 }}>
            This Week's Executive Signal Mix · {COMPANY.week_label}
          </div>
          <h1 className="ris-serif" style={{ fontSize: 58, lineHeight: 1.02, margin: "0 0 18px", letterSpacing: "-0.02em" }}>
            Six agents. <em style={{ color: "var(--ris-accent)" }}>One memo.</em><br/>
            The story beneath the noise.
          </h1>
          <p style={{ fontSize: 15.5, lineHeight: 1.6, color: "var(--ris-ink-2)", maxWidth: 560, margin: "0 0 20px" }}>
            Remix ingests your week's cross-functional signals — customer calls, support tickets,
            product feedback, sales notes, internal updates — and returns what a sharp chief of staff
            would write after a Sunday of reading everything: <span className="ris-strong">themes that recur,
            contradictions that matter, actions with named owners, and the blind spot you haven't seen yet.</span>
          </p>
          <div className="ris-row ris-space-md" style={{ flexWrap: "wrap" }}>
            <div className="ris-pill"><Building2 size={12} strokeWidth={1.75} />{COMPANY.name} · {COMPANY.stage}</div>
            <div className="ris-pill">{COMPANY.category}</div>
          </div>
        </div>

        {/* Right: batch composition + run */}
        <div className="ris-card tint" style={{ padding: 24 }}>
          <div className="ris-eyebrow" style={{ marginBottom: 14 }}>The Batch</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
            <span className="ris-serif" style={{ fontSize: 54, lineHeight: 1, letterSpacing: "-0.02em" }}>{total}</span>
            <span className="ris-muted" style={{ fontSize: 13 }}>raw signals this week</span>
          </div>
          <hr className="ris-divider" style={{ margin: "20px 0 14px" }} />

          <div className="ris-stack" style={{ gap: 10 }}>
            {dist.map(d => {
              const pct = (d.count / total) * 100;
              const Icon = d.meta.icon;
              return (
                <div key={d.key} className="ris-row" style={{ gap: 12 }}>
                  <Icon size={13} strokeWidth={1.75} style={{ color: "var(--ris-mute)", flex: "none" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="ris-row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12.5, color: "var(--ris-ink-2)" }}>{d.meta.label}</span>
                      <span className="ris-mono ris-muted" style={{ fontSize: 11 }}>{d.count}</span>
                    </div>
                    <div style={{ height: 2, background: "var(--ris-hair)", position: "relative" }}>
                      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: "var(--ris-ink)" }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <hr className="ris-divider" style={{ margin: "18px 0" }} />

          <div className="ris-row" style={{ justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontSize: 11.5, color: "var(--ris-mute)", maxWidth: 240, lineHeight: 1.5 }}>
              {mode === "live"
                ? <>Live mode · calls <span className="ris-mono">{MODEL}</span> for each agent.</>
                : <>Demo mode · plays back a hand-audited gold run.</>}
            </div>
            <button
              className="ris-btn"
              onClick={onRun}
              disabled={running}
              style={{ minWidth: 150, justifyContent: "center" }}
            >
              {running ? (<><Loader2 size={14} className="ris-spin" style={{ animation: "risSpin 1s linear infinite" }} />Running…</>)
                       : hasRun ? (<><RefreshCw size={13} strokeWidth={1.75} />Run again</>)
                               : (<><Play size={13} strokeWidth={2} fill="currentColor" />Run weekly mix</>)}
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes risSpin { to { transform: rotate(360deg); } }`}</style>
    </section>
  );
}

function AgentNode({ agent, status, ms }) {
  const Icon = agent.icon;
  const state = status?.state || "idle";
  return (
    <div className={`ris-node ${state}`} style={{ flex: 1, minWidth: 0 }}>
      <div className="ris-row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
        <div className="ris-eyebrow" style={{ color: state === "done" ? "var(--ris-ink)" : undefined }}>
          {String(AGENT_SEQUENCE.findIndex(a => a.id === agent.id) + 1).padStart(2, "0")}
        </div>
        {state === "running" && <Loader2 size={13} style={{ color: "var(--ris-accent)", animation: "risSpin 1s linear infinite" }} />}
        {state === "done"    && <CheckCircle2 size={13} strokeWidth={2} style={{ color: "var(--ris-ink)" }} />}
        {state === "error"   && <XCircle      size={13} strokeWidth={2} style={{ color: "var(--ris-flag)" }} />}
        {state === "idle"    && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ris-hair)" }} />}
      </div>
      <div className="ris-row ris-space-sm" style={{ marginBottom: 4 }}>
        <Icon size={15} strokeWidth={1.75} style={{ color: state === "running" ? "var(--ris-accent)" : "var(--ris-ink)" }} />
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ris-ink)" }}>{agent.label}</div>
      </div>
      <div style={{ fontSize: 11.5, color: "var(--ris-mute)", lineHeight: 1.4 }}>{agent.desc}</div>
      {state === "done" && typeof ms === "number" && (
        <div className="ris-mono" style={{ marginTop: 8, fontSize: 10.5, color: "var(--ris-mute)" }}>
          {(ms / 1000).toFixed(ms < 1000 ? 2 : 1)}s
        </div>
      )}
    </div>
  );
}

function Pipeline({ statuses, timings }) {
  return (
    <section style={{ borderBottom: "1px solid var(--ris-hair)", background: "var(--ris-paper-2)" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "28px 28px" }}>
        <div className="ris-row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
          <div className="ris-eyebrow">The Pipeline</div>
          <div className="ris-eyebrow">Sequential · JSON-typed handoffs</div>
        </div>
        <div className="ris-pipeline ris-row" style={{ gap: 0, alignItems: "stretch" }}>
          {AGENT_SEQUENCE.map((agent, i) => {
            const status = statuses[agent.id];
            const next = AGENT_SEQUENCE[i + 1];
            const nextStatus = next ? statuses[next.id] : null;
            const linkCls = status?.state === "done" ? (nextStatus?.state === "running" ? "active" : "done") : "";
            return (
              <Fragment key={agent.id}>
                <AgentNode agent={agent} status={status} ms={timings[agent.id]} />
                {next && <div className={`ris-link ${linkCls}`} />}
              </Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ThemeCard({ theme, onEvidence }) {
  const evidence = theme.evidence || [];
  const sourceTypes = theme.source_types || [];
  const trendGlyph = {
    rising:  "↑", falling: "↓", steady: "→", new: "•"
  }[theme.trend] || "→";
  return (
    <article className="ris-card raised" style={{ marginBottom: 14 }}>
      <div className="ris-row" style={{ justifyContent: "space-between", gap: 16, marginBottom: 10, alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div className="ris-row ris-space-sm" style={{ marginBottom: 6 }}>
            {theme.noise_flag && (
              <span className="ris-pill" style={{ background: "var(--ris-flag)", color: "var(--ris-paper)", borderColor: "var(--ris-flag)" }}>
                <AlertCircle size={11} /> Noise-flagged
              </span>
            )}
            <TrendGlyph trend={theme.trend} />
          </div>
          <h3 className="ris-serif" style={{ fontSize: 22, lineHeight: 1.25, margin: "0 0 6px", letterSpacing: "-0.01em" }}>
            {theme.title}
          </h3>
          <div className="ris-eyebrow">{theme.id}</div>
        </div>
        <div style={{ textAlign: "right", flex: "none" }}>
          <div className="ris-eyebrow" style={{ marginBottom: 4 }}>Strength</div>
          <SeverityBar value={theme.strength} />
          <div className="ris-mono" style={{ fontSize: 10.5, marginTop: 4, color: "var(--ris-mute)" }}>{theme.strength}/5</div>
        </div>
      </div>

      <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ris-ink-2)", margin: "0 0 12px" }}>
        {theme.summary}
      </p>

      {theme.why_it_matters && (
        <>
          <div className="ris-eyebrow" style={{ marginBottom: 4 }}>Why it matters</div>
          <p style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--ris-ink-2)", margin: "0 0 14px" }}>{theme.why_it_matters}</p>
        </>
      )}

      <hr className="ris-divider" style={{ margin: "12px 0" }} />

      <div className="ris-row" style={{ gap: 18, flexWrap: "wrap", justifyContent: "space-between" }}>
        <div>
          <div className="ris-eyebrow" style={{ marginBottom: 6 }}>Evidence · {evidence.length} signals</div>
          <div className="ris-row" style={{ gap: 4, flexWrap: "wrap" }}>
            {evidence.map(id => <EvidenceChip key={id} id={id} onClick={onEvidence} />)}
          </div>
        </div>
        <div style={{ minWidth: 180 }}>
          <div className="ris-eyebrow" style={{ marginBottom: 6 }}>Sources spanned</div>
          <div className="ris-row ris-space-sm" style={{ flexWrap: "wrap" }}>
            {sourceTypes.map(st => (
              <span key={st} className="ris-row" style={{ gap: 4, fontSize: 11.5, color: "var(--ris-ink-2)" }}>
                <SourceIcon source_type={st} size={12} />
                {SOURCE_META[st]?.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

function ContradictionCard({ c, onEvidence }) {
  return (
    <article className="ris-card raised" style={{ marginBottom: 14 }}>
      <div className="ris-row" style={{ justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div className="ris-eyebrow" style={{ marginBottom: 6 }}>Contradiction · {c.id}</div>
          <h3 className="ris-serif" style={{ fontSize: 22, lineHeight: 1.25, margin: "0 0 6px", letterSpacing: "-0.01em" }}>
            {c.title}
          </h3>
        </div>
        <div style={{ textAlign: "right", flex: "none" }}>
          <div className="ris-eyebrow" style={{ marginBottom: 4 }}>Severity</div>
          <SeverityBar value={c.severity} flag />
          <div className="ris-mono" style={{ fontSize: 10.5, marginTop: 4, color: "var(--ris-mute)" }}>{c.severity}/5</div>
        </div>
      </div>

      <div className="ris-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 10 }}>
        <div style={{ borderLeft: "2px solid var(--ris-hair)", paddingLeft: 12 }}>
          <div className="ris-eyebrow" style={{ marginBottom: 4 }}>Side A</div>
          <div style={{ fontSize: 13, lineHeight: 1.55, color: "var(--ris-ink-2)", marginBottom: 6 }}>{c.side_a?.claim}</div>
          <div className="ris-row" style={{ gap: 4, flexWrap: "wrap" }}>
            {(c.side_a?.evidence || []).map(id => <EvidenceChip key={id} id={id} onClick={onEvidence} />)}
          </div>
        </div>
        <div style={{ borderLeft: "2px solid var(--ris-flag)", paddingLeft: 12 }}>
          <div className="ris-eyebrow" style={{ marginBottom: 4, color: "var(--ris-flag)" }}>Side B</div>
          <div style={{ fontSize: 13, lineHeight: 1.55, color: "var(--ris-ink-2)", marginBottom: 6 }}>{c.side_b?.claim}</div>
          <div className="ris-row" style={{ gap: 4, flexWrap: "wrap" }}>
            {(c.side_b?.evidence || []).map(id => <EvidenceChip key={id} id={id} onClick={onEvidence} />)}
          </div>
        </div>
      </div>

      {c.so_what && (
        <>
          <hr className="ris-divider" style={{ margin: "14px 0" }} />
          <div className="ris-row ris-space-sm" style={{ alignItems: "flex-start" }}>
            <Info size={14} strokeWidth={1.75} style={{ color: "var(--ris-accent)", marginTop: 2, flex: "none" }} />
            <p style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--ris-ink)", margin: 0 }}>
              <span className="ris-eyebrow" style={{ marginRight: 6 }}>So what</span>
              {c.so_what}
            </p>
          </div>
        </>
      )}
    </article>
  );
}

function RecommendationCard({ r, idx, onEvidence }) {
  return (
    <article className="ris-card raised" style={{ marginBottom: 14 }}>
      <div className="ris-row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 14, marginBottom: 12 }}>
        <div className="ris-row ris-space-sm" style={{ alignItems: "flex-start" }}>
          <div className="ris-serif" style={{ fontSize: 40, lineHeight: 1, color: "var(--ris-accent)", flex: "none", width: 42 }}>
            {String(idx + 1).padStart(2, "0")}
          </div>
          <div>
            <h3 className="ris-serif" style={{ fontSize: 22, lineHeight: 1.25, margin: "0 0 6px", letterSpacing: "-0.01em" }}>
              {r.title}
            </h3>
            <div className="ris-row ris-space-sm" style={{ flexWrap: "wrap" }}>
              <span className="ris-pill">Owner · {r.owner}</span>
              <span className="ris-pill">{r.horizon}</span>
              {r.hard_call && <span className="ris-pill" style={{ background: "var(--ris-ink)", color: "var(--ris-paper)", borderColor: "var(--ris-ink)" }}>Hard call</span>}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right", minWidth: 120, flex: "none" }}>
          <div className="ris-eyebrow" style={{ marginBottom: 4 }}>Confidence</div>
          <ConfidenceBar value={r.confidence} />
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <div className="ris-eyebrow" style={{ marginBottom: 4 }}>What</div>
        <p style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--ris-ink-2)", margin: 0 }}>{r.what}</p>
      </div>
      <div style={{ marginBottom: 10 }}>
        <div className="ris-eyebrow" style={{ marginBottom: 4 }}>Why</div>
        <p style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--ris-ink-2)", margin: 0 }}>{r.why}</p>
      </div>
      {r.risk_if_wrong && (
        <div style={{ marginBottom: 10 }}>
          <div className="ris-eyebrow" style={{ marginBottom: 4, color: "var(--ris-flag)" }}>Risk if wrong</div>
          <p style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--ris-ink-2)", margin: 0 }}>{r.risk_if_wrong}</p>
        </div>
      )}

      <hr className="ris-divider" style={{ margin: "12px 0 10px" }} />
      <div className="ris-row" style={{ gap: 14, flexWrap: "wrap", justifyContent: "space-between" }}>
        <div>
          <div className="ris-eyebrow" style={{ marginBottom: 6 }}>Draws from</div>
          <div className="ris-row" style={{ gap: 4, flexWrap: "wrap" }}>
            {(r.links_to_themes || []).map(id => <span key={id} className="ris-chip" style={{ cursor: "default" }}>{id}</span>)}
            {(r.links_to_contradictions || []).map(id => <span key={id} className="ris-chip" style={{ cursor: "default" }}>{id}</span>)}
          </div>
        </div>
        {r.evidence && r.evidence.length > 0 && (
          <div>
            <div className="ris-eyebrow" style={{ marginBottom: 6 }}>Evidence</div>
            <div className="ris-row" style={{ gap: 4, flexWrap: "wrap" }}>
              {r.evidence.map(id => <EvidenceChip key={id} id={id} onClick={onEvidence} />)}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function CritiqueCard({ critique }) {
  return (
    <div className="ris-card raised">
      <div className="ris-row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 20, marginBottom: 16, flexWrap: "wrap" }}>
        <div>
          <div className="ris-eyebrow" style={{ marginBottom: 6 }}>The Critic</div>
          <h3 className="ris-serif" style={{ fontSize: 24, margin: 0, letterSpacing: "-0.01em" }}>Where this memo could be wrong</h3>
        </div>
        <div style={{ minWidth: 220 }}>
          <div className="ris-eyebrow" style={{ marginBottom: 6 }}>Overall confidence</div>
          <ConfidenceBar value={critique.overall_confidence ?? 0} />
        </div>
      </div>

      {critique.caveats?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div className="ris-eyebrow" style={{ marginBottom: 6 }}>Caveats</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.6, color: "var(--ris-ink-2)" }}>
            {critique.caveats.map((c, i) => <li key={i} style={{ marginBottom: 4 }}>{c}</li>)}
          </ul>
        </div>
      )}

      {critique.blind_spot && (
        <div style={{ padding: 14, background: "var(--ris-paper-2)", borderLeft: "2px solid var(--ris-accent)", marginBottom: 14 }}>
          <div className="ris-eyebrow" style={{ marginBottom: 6, color: "var(--ris-accent)" }}>Blind spot</div>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--ris-ink)", margin: 0 }}>{critique.blind_spot}</p>
        </div>
      )}

      <details style={{ marginTop: 8 }}>
        <summary style={{ cursor: "pointer", fontSize: 12.5, color: "var(--ris-mute)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.05em" }}>
          · Per-item notes
        </summary>
        <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
          {critique.theme_notes?.map((n, i) => (
            <div key={`tn${i}`} style={{ borderLeft: "2px solid var(--ris-hair)", paddingLeft: 10, fontSize: 12.5, color: "var(--ris-ink-2)" }}>
              <span className="ris-mono" style={{ color: "var(--ris-mute)" }}>{n.theme_id}</span> · {n.note}
            </div>
          ))}
          {critique.contradiction_notes?.map((n, i) => (
            <div key={`cn${i}`} style={{ borderLeft: "2px solid var(--ris-hair)", paddingLeft: 10, fontSize: 12.5, color: "var(--ris-ink-2)" }}>
              <span className="ris-mono" style={{ color: "var(--ris-mute)" }}>{n.contradiction_id}</span> · {n.note}
            </div>
          ))}
          {critique.recommendation_notes?.map((n, i) => (
            <div key={`rn${i}`} style={{ borderLeft: "2px solid var(--ris-hair)", paddingLeft: 10, fontSize: 12.5, color: "var(--ris-ink-2)" }}>
              <span className="ris-mono" style={{ color: "var(--ris-mute)" }}>{n.recommendation_id}</span> · {n.note}
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

function EvidenceDrawer({ signalId, onClose }) {
  const signal = signalId ? SIGNAL_BY_ID[signalId] : null;
  return (
    <>
      <div className={`ris-drawer-scrim ${signalId ? "open" : ""}`} onClick={onClose} />
      <aside className={`ris-drawer ${signalId ? "open" : ""}`} aria-hidden={!signalId}>
        {signal && (
          <>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--ris-hair)" }}>
              <div className="ris-row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                <div className="ris-row ris-space-sm">
                  <SourceIcon source_type={signal.source_type} size={14} />
                  <span className="ris-eyebrow">{SOURCE_META[signal.source_type]?.label}</span>
                </div>
                <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--ris-mute)", padding: 4 }}>
                  <X size={16} />
                </button>
              </div>
              <div className="ris-serif" style={{ fontSize: 22, lineHeight: 1.25, letterSpacing: "-0.01em" }}>
                {signal.summary}
              </div>
              <div className="ris-mono" style={{ fontSize: 11, color: "var(--ris-mute)", marginTop: 8 }}>
                {signal.id} · {signal.date} · {signal.team}
              </div>
            </div>

            <div style={{ flex: 1, overflow: "auto", padding: "20px 24px" }}>
              {signal.account_name && (
                <DetailRow label="Account">
                  <div>{signal.account_name}</div>
                  <div className="ris-mono" style={{ fontSize: 11, color: "var(--ris-mute)" }}>
                    {signal.account_segment} · {signal.region}
                  </div>
                </DetailRow>
              )}

              <DetailRow label="Topics">
                <div className="ris-row" style={{ gap: 4, flexWrap: "wrap" }}>
                  {(signal.topic_tags || []).map(t => (
                    <span key={t} className="ris-mono" style={{ fontSize: 10.5, padding: "2px 6px", background: "var(--ris-paper-2)", color: "var(--ris-ink-2)" }}>
                      {t}
                    </span>
                  ))}
                </div>
              </DetailRow>

              <DetailRow label="Sentiment / Urgency / Evidence">
                <div className="ris-row ris-space-md" style={{ flexWrap: "wrap" }}>
                  <div><span className="ris-muted" style={{ fontSize: 11 }}>Sentiment</span><div>{signal.sentiment}</div></div>
                  <div><span className="ris-muted" style={{ fontSize: 11 }}>Urgency</span><div><SeverityBar value={signal.urgency} /> <span className="ris-mono" style={{ fontSize: 11 }}>{signal.urgency}/5</span></div></div>
                  <div><span className="ris-muted" style={{ fontSize: 11 }}>Evidence</span><div><SeverityBar value={signal.evidence_strength} /> <span className="ris-mono" style={{ fontSize: 11 }}>{signal.evidence_strength}/5</span></div></div>
                </div>
              </DetailRow>

              {signal.quoted_claims?.length > 0 && (
                <DetailRow label="Quoted claims">
                  <div className="ris-stack" style={{ gap: 10 }}>
                    {signal.quoted_claims.map((q, i) => (
                      <blockquote key={i} style={{ margin: 0, padding: "10px 14px", borderLeft: "2px solid var(--ris-accent)", background: "var(--ris-accent-softer)", borderRadius: "0 8px 8px 0", fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: 14, lineHeight: 1.55, color: "var(--ris-ink)" }}>
                        <Quote size={11} style={{ color: "var(--ris-accent)", marginRight: 4, verticalAlign: "baseline" }} />
                        {q}
                      </blockquote>
                    ))}
                  </div>
                </DetailRow>
              )}

              {signal.metrics && Object.keys(signal.metrics).length > 0 && (
                <DetailRow label="Metrics">
                  <div className="ris-stack" style={{ gap: 4 }}>
                    {Object.entries(signal.metrics).map(([k, v]) => (
                      <div key={k} className="ris-row" style={{ justifyContent: "space-between", gap: 12, fontSize: 12.5 }}>
                        <span className="ris-mono" style={{ color: "var(--ris-mute)" }}>{k}</span>
                        <span className="ris-mono" style={{ color: "var(--ris-ink)" }}>{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </DetailRow>
              )}

              <DetailRow label="Owner">
                <span className="ris-mono" style={{ fontSize: 12 }}>{signal.owner}</span>
              </DetailRow>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function DetailRow({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div className="ris-eyebrow" style={{ marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 13.5, color: "var(--ris-ink-2)" }}>{children}</div>
    </div>
  );
}

function SignalsExplorer({ onEvidence }) {
  const [filter, setFilter] = useState("all");
  const filtered = useMemo(() => {
    if (filter === "all") return SIGNALS;
    return SIGNALS.filter(s => s.source_type === filter);
  }, [filter]);

  const filters = [
    { key: "all", label: `All · ${SIGNALS.length}` },
    ...Object.entries(SOURCE_META).map(([k, v]) => ({
      key: k,
      label: `${v.label} · ${SIGNALS.filter(s => s.source_type === k).length}`,
    })),
  ];

  return (
    <div>
      <div className="ris-row ris-space-sm" style={{ flexWrap: "wrap", marginBottom: 14 }}>
        {filters.map(f => (
          <button
            key={f.key}
            className={`ris-btn-ghost ${filter === f.key ? "" : ""}`}
            onClick={() => setFilter(f.key)}
            style={{
              borderColor: filter === f.key ? "var(--ris-ink)" : "var(--ris-hair)",
              color: filter === f.key ? "var(--ris-ink)" : "var(--ris-mute)",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ overflow: "auto", border: "1px solid var(--ris-hair)" }}>
        <table className="ris-table">
          <thead>
            <tr>
              <th style={{ width: 70 }}>ID</th>
              <th style={{ width: 44 }}>Src</th>
              <th style={{ width: 100 }}>Date</th>
              <th>Summary</th>
              <th style={{ width: 140 }}>Account</th>
              <th style={{ width: 100 }}>Urg / Ev</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} onClick={() => onEvidence(s.id)}>
                <td><span className="ris-mono" style={{ fontSize: 11 }}>{s.id}</span></td>
                <td><SourceIcon source_type={s.source_type} /></td>
                <td className="ris-mono" style={{ fontSize: 11 }}>{s.date}</td>
                <td style={{ maxWidth: 420 }}>
                  <div style={{ color: "var(--ris-ink)", marginBottom: 2 }}>{s.summary}</div>
                  <div className="ris-mono" style={{ fontSize: 10.5, color: "var(--ris-mute)" }}>
                    {(s.topic_tags || []).slice(0, 3).join(" · ")}
                  </div>
                </td>
                <td style={{ fontSize: 12 }}>
                  {s.account_name ? <>
                    <div>{s.account_name}</div>
                    <div className="ris-mono" style={{ fontSize: 10.5, color: "var(--ris-mute)" }}>{s.account_segment}</div>
                  </> : <span className="ris-muted" style={{ fontSize: 11 }}>—</span>}
                </td>
                <td>
                  <div className="ris-row ris-space-sm">
                    <SeverityBar value={s.urgency} />
                  </div>
                  <div className="ris-row ris-space-sm" style={{ marginTop: 2 }}>
                    <SeverityBar value={s.evidence_strength} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AgentInspector({ results, timings }) {
  const [active, setActive] = useState("ingestion");
  const agent = AGENT_SEQUENCE.find(a => a.id === active);
  const result = results[active];
  const ms = timings[active];

  return (
    <div>
      <div className="ris-row ris-space-sm" style={{ flexWrap: "wrap", marginBottom: 14 }}>
        {AGENT_SEQUENCE.map(a => {
          const has = !!results[a.id];
          return (
            <button
              key={a.id}
              className="ris-btn-ghost"
              onClick={() => setActive(a.id)}
              disabled={!has}
              style={{
                borderColor: active === a.id ? "var(--ris-ink)" : "var(--ris-hair)",
                color: active === a.id ? "var(--ris-ink)" : has ? "var(--ris-ink-2)" : "var(--ris-mute)",
                opacity: has ? 1 : 0.45,
              }}
            >
              {a.label}
              {has && timings[a.id] != null && (
                <span className="ris-mono" style={{ fontSize: 10.5, color: "var(--ris-mute)", marginLeft: 6 }}>
                  {(timings[a.id] / 1000).toFixed(1)}s
                </span>
              )}
            </button>
          );
        })}
      </div>

      {result != null ? (
        <>
          <div className="ris-row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
            <div className="ris-eyebrow">{agent?.label} · raw output</div>
            <button
              className="ris-btn-ghost"
              onClick={() => navigator.clipboard?.writeText(typeof result === "string" ? result : JSON.stringify(result, null, 2))}
              style={{ padding: "4px 8px" }}
            >
              <Copy size={11} /> Copy
            </button>
          </div>
          <pre className="ris-json">{typeof result === "string" ? result : JSON.stringify(result, null, 2)}</pre>
        </>
      ) : (
        <div className="ris-muted" style={{ fontSize: 13, padding: 24, textAlign: "center", border: "1px dashed var(--ris-hair)" }}>
          Run the pipeline to inspect {agent?.label} output.
        </div>
      )}
    </div>
  );
}

function CollapsibleSection({ title, eyebrow, defaultOpen = true, children, count }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section>
      <div className="ris-section-head" onClick={() => setOpen(o => !o)}>
        <div>
          {eyebrow && <div className="ris-eyebrow" style={{ marginBottom: 4 }}>{eyebrow}</div>}
          <div className="ris-row ris-space-sm">
            <h2 className="ris-serif ris-section-title" style={{ fontSize: 32, margin: 0, letterSpacing: "-0.015em", transition: "color 150ms ease" }}>
              {title}
            </h2>
            {count != null && (
              <span className="ris-mono" style={{ fontSize: 13, color: "var(--ris-mute)", marginLeft: 4 }}>[{count}]</span>
            )}
          </div>
        </div>
        {open ? <ChevronDown size={18} strokeWidth={1.5} style={{ color: "var(--ris-mute)" }} />
              : <ChevronRight size={18} strokeWidth={1.5} style={{ color: "var(--ris-mute)" }} />}
      </div>
      {open && <div style={{ paddingBottom: 28 }}>{children}</div>}
      <hr className="ris-divider" />
    </section>
  );
}

/* -------------------------------------------------------------------------
   11. APP — top-level orchestration
   ------------------------------------------------------------------------- */

export default function App() {
  const [mode, setMode] = useState("demo");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  // Per-agent status: { state: "idle"|"running"|"done"|"error" }
  const initialStatuses = useMemo(
    () => Object.fromEntries(AGENT_SEQUENCE.map(a => [a.id, { state: "idle" }])),
    []
  );
  const [statuses, setStatuses] = useState(initialStatuses);
  const [timings, setTimings] = useState({});
  const [results, setResults] = useState({});
  const [drawerSignal, setDrawerSignal] = useState(null);

  // Keep refs so orchestrator callbacks don't fight with stale closures
  const statusesRef = useRef(statuses);
  useEffect(() => { statusesRef.current = statuses; }, [statuses]);

  const hasRun = Object.keys(results).length > 0;

  const reset = () => {
    setStatuses(initialStatuses);
    setTimings({});
    setResults({});
    setError(null);
  };

  const run = async () => {
    reset();
    setRunning(true);
    try {
      await runPipeline(SIGNALS, mode, {
        onAgentStart: (id) => {
          setStatuses(prev => ({ ...prev, [id]: { state: "running" } }));
        },
        onAgentDone: (id, out, ms) => {
          setStatuses(prev => ({ ...prev, [id]: { state: "done" } }));
          setTimings(prev => ({ ...prev, [id]: ms }));
          setResults(prev => ({ ...prev, [id]: out }));
        },
        onError: (id, err) => {
          setStatuses(prev => ({ ...prev, [id]: { state: "error" } }));
          setError({ agent: id, message: err?.message || String(err) });
        },
      });
    } catch (e) {
      // onError already captured details with the correct agent name.
      // Use the functional form so we read React's current state, not
      // a stale closure value that will always be null here.
      setError(prev => prev ?? { agent: "unknown", message: e?.message || String(e) });
    } finally {
      setRunning(false);
    }
  };

  // Convenience derived slices
  const themes = results.themes?.themes || [];
  const contradictions = results.contradictions?.contradictions || [];
  const recommendations = results.recommendations?.recommendations || [];
  const critique = results.critic || null;
  const memo = results.memo || null;

  return (
    <div className="ris-root">
      <style>{STYLES}</style>

      <Header mode={mode} setMode={setMode} onReset={reset} hasRun={hasRun} />
      <HeroPanel onRun={run} running={running} hasRun={hasRun} mode={mode} />
      <Pipeline statuses={statuses} timings={timings} />

      {error && (
        <section style={{ maxWidth: 1240, margin: "0 auto", padding: "20px 28px 0" }}>
          <div className="ris-card" style={{ borderColor: "var(--ris-flag)", background: "rgba(166,75,42,0.04)" }}>
            <div className="ris-row ris-space-sm" style={{ alignItems: "flex-start" }}>
              <XCircle size={16} style={{ color: "var(--ris-flag)", flex: "none", marginTop: 2 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="ris-eyebrow" style={{ color: "var(--ris-flag)", marginBottom: 4 }}>
                  Pipeline error · {error.agent}
                </div>
                <div style={{
                  fontSize: 13, color: "var(--ris-ink-2)", marginBottom: 10,
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  wordBreak: "break-word", whiteSpace: "pre-wrap",
                  maxHeight: 200, overflow: "auto",
                }}>
                  {error.message}
                </div>
                <div style={{ fontSize: 12.5, color: "var(--ris-mute)" }}>
                  Switch to <strong>DEMO</strong> to play back a hand-audited gold run, or
                  check the browser console for upstream-response diagnostics.
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <main style={{ maxWidth: 1240, margin: "0 auto", padding: "32px 28px 96px" }}>
        {/* THE MEMO — the headline deliverable */}
        {memo && (
          <CollapsibleSection eyebrow="Deliverable" title="The Memo" defaultOpen={true}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 260px", gap: 40 }} className="ris-two-col">
              <div className="ris-card raised" style={{ padding: "32px 40px", maxWidth: 780 }}>
                <MemoMarkdown markdown={memo} />
              </div>
              <aside style={{ position: "sticky", top: 20, alignSelf: "flex-start" }}>
                <div className="ris-eyebrow" style={{ marginBottom: 10 }}>At a glance</div>
                <div className="ris-stack" style={{ gap: 14 }}>
                  <StatLine label="Themes"           value={themes.length} />
                  <StatLine label="Contradictions"    value={contradictions.length} />
                  <StatLine label="Recommendations"   value={recommendations.length} />
                  <StatLine label="Hard calls"        value={recommendations.filter(r => r.hard_call).length} />
                  <StatLine label="Confidence"        value={critique ? `${Math.round((critique.overall_confidence || 0) * 100)}%` : "—"} />
                </div>
                <hr className="ris-divider" style={{ margin: "16px 0" }} />
                <div style={{ fontSize: 11.5, color: "var(--ris-mute)", lineHeight: 1.5 }}>
                  Generated {mode === "demo" ? "from a hand-audited gold run" : `live via ${MODEL}`}.
                  Every claim ties to a signal; click any <span className="ris-chip" style={{ cursor: "default" }}>sig_000</span> chip below to see the source.
                </div>
              </aside>
            </div>
          </CollapsibleSection>
        )}

        {themes.length > 0 && (
          <CollapsibleSection eyebrow="Layer 2 · Theme agent" title="Themes" count={themes.length} defaultOpen={true}>
            {themes.map(t => <ThemeCard key={t.id} theme={t} onEvidence={setDrawerSignal} />)}
          </CollapsibleSection>
        )}

        {contradictions.length > 0 && (
          <CollapsibleSection eyebrow="Layer 3 · Contradiction agent" title="Contradictions" count={contradictions.length} defaultOpen={true}>
            {contradictions.map(c => <ContradictionCard key={c.id} c={c} onEvidence={setDrawerSignal} />)}
          </CollapsibleSection>
        )}

        {recommendations.length > 0 && (
          <CollapsibleSection eyebrow="Layer 4 · Recommendation agent" title="Recommended Actions" count={recommendations.length} defaultOpen={true}>
            {recommendations.map((r, i) => <RecommendationCard key={r.id} r={r} idx={i} onEvidence={setDrawerSignal} />)}
          </CollapsibleSection>
        )}

        {critique && (
          <CollapsibleSection eyebrow="Layer 5 · Critic agent" title="Self-critique" defaultOpen={true}>
            <CritiqueCard critique={critique} />
          </CollapsibleSection>
        )}

        <CollapsibleSection
          eyebrow="Raw input"
          title="Signals Explorer"
          count={SIGNALS.length}
          defaultOpen={!hasRun}
        >
          <SignalsExplorer onEvidence={setDrawerSignal} />
        </CollapsibleSection>

        {hasRun && (
          <CollapsibleSection eyebrow="Debug" title="Agent Inspector" defaultOpen={false}>
            <AgentInspector results={results} timings={timings} />
          </CollapsibleSection>
        )}

        {!hasRun && !running && (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--ris-mute)", fontSize: 13.5 }}>
            <Sparkles size={16} strokeWidth={1.5} style={{ marginBottom: 8, opacity: 0.6 }} />
            <div>Press <span className="ris-strong">Run weekly mix</span> to compile this week's memo.</div>
            <div style={{ fontSize: 12, marginTop: 6 }}>
              Demo mode is preloaded. Live mode calls <span className="ris-mono">{MODEL}</span> in-browser.
            </div>
          </div>
        )}
      </main>

      <footer style={{ borderTop: "1px solid var(--ris-hair)", background: "var(--ris-paper-2)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div className="ris-eyebrow">Remix Intelligence Studio · MVP · Synthetic data</div>
          <div className="ris-mono" style={{ fontSize: 11, color: "var(--ris-mute)" }}>
            {AGENT_SEQUENCE.length} agents · {SIGNALS.length} signals · model: {MODEL}
          </div>
        </div>
      </footer>

      <EvidenceDrawer signalId={drawerSignal} onClose={() => setDrawerSignal(null)} />
    </div>
  );
}

function StatLine({ label, value }) {
  return (
    <div className="ris-row" style={{ justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid var(--ris-hair)", paddingBottom: 8 }}>
      <span style={{ fontSize: 12, color: "var(--ris-mute)" }}>{label}</span>
      <span className="ris-serif" style={{ fontSize: 22, letterSpacing: "-0.01em" }}>{value}</span>
    </div>
  );
}
