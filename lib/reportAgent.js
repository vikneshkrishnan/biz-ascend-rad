import Anthropic from '@anthropic-ai/sdk'
import { CAUSAL_LINKAGES, BANNED_PHRASES, CONSTRAINT_TYPE_MAP, CLUSTER_DEFINITIONS } from '@/lib/constants'

const PILLAR_NAMES = {
  p1: 'Commercial Baseline', p2: 'ICP & Buyer Urgency',
  p3: 'Positioning & Competitive Clarity', p4: 'Sales System Repeatability',
  p5: 'Pipeline Generation', p6: 'Revenue Economics', p7: 'Strategic Constraints',
  p8: 'Organisational Alignment & Capability', p9: 'Systems Readiness & AI Transformation',
}

const SYSTEM_PROMPT = `You are a senior B2B revenue growth diagnostic expert producing executive-quality reports for CEO/board-level audiences. Your tone is direct, insight-led, and commercially specific. Never use boilerplate. Every sentence must be grounded in the company's data. Banned phrases: 'In today's competitive landscape', 'It is worth noting', 'As we can see', 'Moving forward', 'In conclusion', 'Needless to say', 'It goes without saying', 'At the end of the day'. Always lead with the conclusion, then support with evidence.`

const MODEL = 'claude-sonnet-4-6'

// --- Structured output schemas ---

const EXECUTIVE_SUMMARY_SCHEMA = {
  name: 'executive_summary',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['paragraphs', 'data_source'],
    properties: {
      paragraphs: { type: 'array', items: { type: 'string' } },
      data_source: { type: 'string' },
    },
  },
}

const PILLAR_NARRATIVE_SCHEMA = {
  name: 'pillar_narrative',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['narrative', 'operationalStrengths', 'frictionPoints', 'respondentSignal', 'positioning_critique', 'data_source'],
    properties: {
      narrative: { type: 'string' },
      operationalStrengths: { type: 'array', items: { type: 'string' } },
      frictionPoints: { type: 'array', items: { type: 'string' } },
      respondentSignal: { type: ['string', 'null'] },
      positioning_critique: { type: ['string', 'null'] },
      data_source: { type: 'string' },
    },
  },
}

const COMPETITIVE_CLARITY_SCHEMA = {
  name: 'competitive_clarity',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['dimensions', 'overall_score', 'positioning_critique', 'positioning_rewrite', 'white_space_insight', 'data_source'],
    properties: {
      dimensions: {
        type: 'object',
        additionalProperties: false,
        required: ['clarity', 'specificity', 'buyer_relevance', 'differentiation', 'memorability', 'proof_tension', 'category_ownership', 'commercial_sharpness'],
        properties: {
          clarity: { type: 'number' },
          specificity: { type: 'number' },
          buyer_relevance: { type: 'number' },
          differentiation: { type: 'number' },
          memorability: { type: 'number' },
          proof_tension: { type: 'number' },
          category_ownership: { type: 'number' },
          commercial_sharpness: { type: 'number' },
        },
      },
      overall_score: { type: 'number' },
      positioning_critique: { type: 'string' },
      positioning_rewrite: { type: 'string' },
      white_space_insight: { type: 'string' },
      data_source: { type: 'string' },
    },
  },
}

const SCORECARD_EXPLANATION_SCHEMA = {
  name: 'scorecard_explanation',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['bullets', 'data_source'],
    properties: {
      bullets: { type: 'array', items: { type: 'string' } },
      data_source: { type: 'string' },
    },
  },
}

const RAPS_NARRATIVE_SCHEMA = {
  name: 'raps_narrative',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['narrative', 'why_factors', 'must_improve', 'scenarios_narrative', 'data_source'],
    properties: {
      narrative: { type: 'string' },
      why_factors: { type: 'array', items: { type: 'string' } },
      must_improve: { type: 'array', items: { type: 'string' } },
      scenarios_narrative: { type: 'string' },
      data_source: { type: 'string' },
    },
  },
}

const ACTION_ITEM_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['action', 'pillar', 'priority', 'owner', 'deliverable', 'success_metric', 'question_reference'],
  properties: {
    action: { type: 'string' },
    pillar: { type: 'string' },
    priority: { type: 'string' },
    owner: { type: 'string' },
    deliverable: { type: 'string' },
    success_metric: { type: 'string' },
    question_reference: { type: 'string' },
  },
}

const ACTION_ROADMAP_SCHEMA = {
  name: 'action_roadmap',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['phase1_title', 'phase1_items', 'phase2_title', 'phase2_items', 'phase3_title', 'phase3_items', 'data_source'],
    properties: {
      phase1_title: { type: 'string' },
      phase1_items: { type: 'array', items: ACTION_ITEM_SCHEMA },
      phase2_title: { type: 'string' },
      phase2_items: { type: 'array', items: ACTION_ITEM_SCHEMA },
      phase3_title: { type: 'string' },
      phase3_items: { type: 'array', items: ACTION_ITEM_SCHEMA },
      data_source: { type: 'string' },
    },
  },
}

const CROSS_PILLAR_SCHEMA = {
  name: 'cross_pillar_interaction',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['causal_links', 'reinforcing_loops', 'narrative', 'data_source'],
    properties: {
      causal_links: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['from_pillar', 'to_pillar', 'mechanism', 'severity'],
          properties: {
            from_pillar: { type: 'string' },
            to_pillar: { type: 'string' },
            mechanism: { type: 'string' },
            severity: { type: 'string' },
          },
        },
      },
      reinforcing_loops: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['pillars', 'description'],
          properties: {
            pillars: { type: 'array', items: { type: 'string' } },
            description: { type: 'string' },
          },
        },
      },
      narrative: { type: 'string' },
      data_source: { type: 'string' },
    },
  },
}

const STRATEGIC_SIGNALS_SCHEMA = {
  name: 'strategic_signals',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['signals', 'narrative', 'diagnostic_awareness', 'data_source'],
    properties: {
      signals: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['pillar', 'type', 'description', 'implication', 'alignment_category'],
          properties: {
            pillar: { type: 'string' },
            type: { type: 'string' },
            description: { type: 'string' },
            implication: { type: 'string' },
            alignment_category: { type: 'string' },
          },
        },
      },
      narrative: { type: 'string' },
      diagnostic_awareness: { type: 'string' },
      data_source: { type: 'string' },
    },
  },
}

const ORG_SYSTEMS_SCHEMA = {
  name: 'org_systems_readiness',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['parts', 'cluster_analysis', 'narrative', 'data_source'],
    properties: {
      parts: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['title', 'content'],
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
          },
        },
      },
      cluster_analysis: {
        type: 'object',
        additionalProperties: false,
        required: ['org_alignment_score', 'systems_readiness_score', 'ai_readiness_index'],
        properties: {
          org_alignment_score: { type: 'number' },
          systems_readiness_score: { type: 'number' },
          ai_readiness_index: { type: ['number', 'null'] },
        },
      },
      narrative: { type: 'string' },
      data_source: { type: 'string' },
    },
  },
}

const ADVISORY_WORKSTREAM_SCHEMA = {
  name: 'advisory_workstream',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['recommended_engagement', 'focus_areas', 'expected_outcomes', 'engagement_framework', 'raps_connection', 'sequence_logic', 'data_source'],
    properties: {
      recommended_engagement: { type: 'string' },
      focus_areas: { type: 'array', items: { type: 'string' } },
      expected_outcomes: { type: 'array', items: { type: 'string' } },
      engagement_framework: { type: 'string' },
      raps_connection: { type: 'array', items: { type: 'string' } },
      sequence_logic: { type: 'string' },
      data_source: { type: 'string' },
    },
  },
}

const CLOSING_OBSERVATION_SCHEMA = {
  name: 'closing_observation',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['closing_narrative', 'data_source'],
    properties: {
      closing_narrative: { type: 'string' },
      data_source: { type: 'string' },
    },
  },
}

const CONSTRAINT_ANALYSIS_SCHEMA = {
  name: 'constraint_analysis',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['summary', 'score_context', 'key_friction_points', 'business_impact', 'downstream_effects', 'recommended_focus', 'revenue_impact_estimation', 'constraint_type', 'data_source'],
    properties: {
      summary: { type: 'string' },
      score_context: { type: 'string' },
      key_friction_points: { type: 'array', items: { type: 'string' } },
      business_impact: { type: 'array', items: { type: 'string' } },
      downstream_effects: { type: 'array', items: { type: 'string' } },
      recommended_focus: { type: 'string' },
      revenue_impact_estimation: { type: 'string' },
      constraint_type: { type: 'string' },
      data_source: { type: 'string' },
    },
  },
}

function parseJsonResponse(text) {
  let cleaned = text.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.split('\n').slice(1).join('\n')
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3)
  }
  if (cleaned.startsWith('json')) {
    cleaned = cleaned.slice(4)
  }
  cleaned = cleaned.trim()

  try {
    return JSON.parse(cleaned)
  } catch {
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1))
    }
    throw new SyntaxError(`No valid JSON found in response: ${cleaned.slice(0, 80)}...`)
  }
}

function buildContext(data) {
  const scores = data.scores || {}
  const screener = data.screener_responses || {}
  const diagnostic = data.diagnostic_responses || {}
  const company = screener.q4 || 'Unknown Company'
  const industry = screener.q5 || 'Unknown Industry'

  const pillarScores = scores.pillarScores || {}
  const radScore = scores.radScore || 0
  const maturity = scores.maturityBand || 'Unknown'
  const constraint = scores.primaryConstraint || {}
  const constraints = scores.constraints || []
  const growthLeaks = scores.growthLeaks || []
  const raps = scores.raps || {}

  const pillarSummary = Object.entries(pillarScores)
    .map(([pid, ps]) => `- ${PILLAR_NAMES[pid] || pid}: Score ${ps.score || 0}/100 (avg ${ps.avg || 0}/5)`)
    .join('\n')

  const winRate = raps.winRate ? (raps.winRate * 100).toFixed(0) : '0'
  const revenueRemaining = raps.revenueRemaining ? Number(raps.revenueRemaining).toLocaleString() : '0'
  const openPipeline = raps.openPipeline ? Number(raps.openPipeline).toLocaleString() : '0'
  const expectedConvertible = raps.expectedConvertible ? Number(Math.round(raps.expectedConvertible)).toLocaleString() : '0'
  const requiredMonthly = raps.requiredMonthlyRevenue ? Number(Math.round(raps.requiredMonthlyRevenue)).toLocaleString() : '0'

  const qualitativeP3 = diagnostic.p3_q12 || 'Not provided'
  const qualitativeP3b = diagnostic.p3_q13 || 'Not provided'
  const qualitativeP7 = diagnostic.p7_q6 || 'Not provided'
  const qualitativeP8 = diagnostic.p8_q13 || 'Not provided'
  const qualitativeP9 = diagnostic.p9_q13 || 'Not provided'
  const positioning = screener.q12 || 'Not provided'
  const competitors = screener.q13 || 'Not provided'
  const markets = screener.q6 || 'Not provided'

  const dataBlock = `COMPANY: ${company} (${industry})

COMPANY DATA:
- Revenue Range: ${screener.q7 || 'N/A'}
- Sales Staff: ${screener.q8 || 'N/A'}
- Marketing Budget: ${screener.q9 || 'N/A'}
- Sales Model: ${screener.q10 || 'N/A'}
- GTM Channels: ${screener.q11 || 'N/A'}
- Positioning Statement: ${positioning}
- Competitors: ${competitors}
- Deal Size: ${screener.q14 || 'N/A'}
- Sales Cycle: ${screener.q15 || 'N/A'}
- Open Pipeline: $${openPipeline}
- Win Rate: ${screener.q17 || 'N/A'}
- Revenue Target: $${screener.q18 || '0'}
- Revenue Invoiced: $${screener.q19 || '0'}
- Markets: ${markets}

SCORES:
- RAD Growth System Score: ${radScore}/100
- Maturity Band: ${maturity}
- Primary Growth Constraint: ${constraint.name || 'N/A'} (score: ${constraint.score || 0})

PILLAR SCORES:
${pillarSummary}

QUALITATIVE RESPONSES:
- Positioning Challenge (P3-Q12): ${qualitativeP3}
- Differentiated Value vs Customers (P3-Q13): ${qualitativeP3b}
- Strategic Constraint (P7-Q6): ${qualitativeP7}
- Organisational Alignment (P8-Q13): ${qualitativeP8}
- Systems & AI Readiness (P9-Q13): ${qualitativeP9}

RAPS DATA:
- RAPS Score: ${raps.score || 0}/100 — ${raps.label || 'N/A'}
- Revenue Remaining: $${revenueRemaining}
- Required Monthly Revenue: $${requiredMonthly}
- Months Remaining: ${raps.monthsRemaining || 0}
- Open Pipeline Value: $${openPipeline}
- Expected Convertible Revenue: $${expectedConvertible}
- Coverage Ratio: ${raps.coverageRatio || 0} (${raps.coverageRating || 'N/A'})
- Win Rate: ${winRate}%
- Base Probability: ${raps.baseProbability || 0}
- RAD Modifier: ${raps.radModifierValue > 0 ? '+' : ''}${raps.radModifierValue || 0}`

  // Build per-pillar question-level detail for narratives
  const pillarQuestionDetails = {}
  for (const pid of Object.keys(PILLAR_NAMES)) {
    const questions = []
    for (const [key, val] of Object.entries(diagnostic)) {
      if (key.startsWith(pid + '_') && typeof val === 'number') {
        questions.push({ id: key, score: val })
      }
    }
    pillarQuestionDetails[pid] = questions
  }

  const isHighPerformer = radScore > 75

  return {
    company, industry, scores, screener, diagnostic,
    pillarScores, radScore, maturity, constraint, constraints, growthLeaks,
    raps, dataBlock, pillarQuestionDetails, positioning, competitors,
    qualitativeP3, qualitativeP3b, qualitativeP7, qualitativeP8, qualitativeP9,
    isHighPerformer, markets,
  }
}

async function callSection(client, sectionName, userPrompt, ctx, schema) {
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      output_config: { format: { type: 'json_schema', schema: schema.schema } },
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: ctx.dataBlock,
              cache_control: { type: 'ephemeral' },
            },
            {
              type: 'text',
              text: userPrompt,
            },
          ],
        },
      ],
    })
    const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('')
    return JSON.parse(text)
  } catch (err) {
    console.error(`[reportAgent] Section "${sectionName}" failed:`, err.message)
    return null
  }
}

async function generateExecutiveSummary(client, ctx) {
  // C2: Get 2 lowest-scoring questions in constraint pillar
  const constraintQuestions = ctx.pillarQuestionDetails[ctx.constraint.id] || []
  const lowestConstraintQs = [...constraintQuestions].sort((a, b) => a.score - b.score).slice(0, 2)
  const lowestQsText = lowestConstraintQs.map(q => `${q.id}: ${q.score}/5`).join(', ') || 'N/A'

  const prompt = `Generate an executive summary for ${ctx.company}.

Requirements:
- Exactly 4 paragraphs, 250-350 words total
- Paragraph 1: Overall RAD score (${ctx.radScore}/100), maturity band (${ctx.maturity}), and what this means for the business. Explicitly state the RAPS score: ${ctx.raps.score || 0}/100 (${ctx.raps.label || 'N/A'})
- Paragraph 2: Top 3 operational strengths with specific evidence from pillar scores
- Paragraph 3: Primary constraint (${ctx.constraint.name || 'N/A'}, score ${ctx.constraint.score || 0}) and its downstream impact. Reference the 2 lowest-scoring questions in this pillar: ${lowestQsText}
- Paragraph 4: Revenue risk (using RAPS data) and the single highest-leverage action to address the primary constraint

Cross-reference these qualitative responses where relevant:
- Positioning Challenge (P3): "${ctx.qualitativeP3}"
- Differentiated Value (P3): "${ctx.qualitativeP3b}"
- Strategic Constraint (P7): "${ctx.qualitativeP7}"
- Organisational Alignment (P8): "${ctx.qualitativeP8}"
- Systems & AI Readiness (P9): "${ctx.qualitativeP9}"

Return JSON:
{
  "paragraphs": ["paragraph 1", "paragraph 2", "paragraph 3", "paragraph 4"],
  "data_source": "ai_synthesis"
}`

  return await callSection(client, 'executive_summary', prompt, ctx, EXECUTIVE_SUMMARY_SCHEMA)
}

async function generateScorecardExplanation(client, ctx) {
  const pillarSummary = Object.entries(ctx.pillarScores)
    .map(([pid, ps]) => `${PILLAR_NAMES[pid] || pid}: ${ps.score || 0}/100`)
    .join(', ')

  const prompt = `Generate 4-6 bullet points explaining what the Executive Scorecard radar chart reveals for ${ctx.company}.

Pillar scores: ${pillarSummary}
Overall RAD Score: ${ctx.radScore}/100 (${ctx.maturity})

Each bullet should be 1-2 sentences. Cover:
- Strongest pillar(s) and what that strength means commercially
- Weakest pillar(s) and the risk they represent
- Notable asymmetries or clusters in the radar shape (e.g. strong on strategy but weak on execution)
- Overall shape interpretation — is it balanced, lopsided, spiked?

Be specific — reference actual pillar names and scores. No generic statements.

Return JSON:
{
  "bullets": ["bullet 1", "bullet 2", ...],
  "data_source": "ai_synthesis"
}`

  return await callSection(client, 'scorecard_explanation', prompt, ctx, SCORECARD_EXPLANATION_SCHEMA)
}

async function generatePillarNarrative(client, ctx, pillarId) {
  const pillarName = PILLAR_NAMES[pillarId]
  const ps = ctx.pillarScores[pillarId] || {}
  const questions = ctx.pillarQuestionDetails[pillarId] || []
  const strengths = questions.filter(q => q.score >= 4).map(q => `${q.id}: ${q.score}/5`)
  const frictions = questions.filter(q => q.score <= 2).map(q => `${q.id}: ${q.score}/5`)

  const qualPillars = { p3: ctx.qualitativeP3, p7: ctx.qualitativeP7, p8: ctx.qualitativeP8, p9: ctx.qualitativeP9 }
  const qualNote = qualPillars[pillarId]
    ? `\nQualitative response for this pillar: "${qualPillars[pillarId]}"`
    : ''

  const p3CritiqueNote = pillarId === 'p3'
    ? `\n- positioning_critique: Generate a focused 100-150 word critique of the current positioning statement: "${ctx.positioning}". Analyse what is wrong, what is missing, and why it fails to differentiate. This is separate from the general narrative.`
    : ''

  const prompt = `Generate a diagnostic narrative for pillar "${pillarName}" (${pillarId}).

Pillar score: ${ps.score || 0}/100 (avg ${ps.avg || 0}/5, ${ps.count || 0} questions)
Questions scoring >= 4 (strengths): ${strengths.length > 0 ? strengths.join(', ') : 'None'}
Questions scoring <= 2 (friction points): ${frictions.length > 0 ? frictions.join(', ') : 'None'}${qualNote}

Requirements:
- 200-350 words
- Score context and maturity interpretation for this pillar
- Operational strengths (reference specific high-scoring areas)
- Friction points (reference specific low-scoring areas and their business impact)
${['p3', 'p7', 'p8', 'p9'].includes(pillarId) ? '- Respondent signal: cross-reference the qualitative response against the quantitative scores — note alignment or tension' : ''}${p3CritiqueNote}

Return JSON:
{
  "narrative": "full narrative text",
  "operationalStrengths": ["strength 1", "strength 2"],
  "frictionPoints": ["friction 1", "friction 2"],
  "respondentSignal": "signal analysis or null if not applicable",
  "positioning_critique": ${pillarId === 'p3' ? '"positioning critique text"' : 'null'},
  "data_source": "diagnostic_scores"
}`

  return await callSection(client, `pillar_${pillarId}`, prompt, ctx, PILLAR_NARRATIVE_SCHEMA)
}

async function generateConstraintAnalysis(client, ctx) {
  const constraintPillars = ctx.constraints.slice(0, 3)
  const constraintDetail = constraintPillars.map(c => {
    const questions = ctx.pillarQuestionDetails[c.id] || []
    const frictions = questions.filter(q => q.score <= 2).map(q => `${q.id}: ${q.score}/5`)
    return `- ${c.name} (${c.id}): score ${c.score}/100, friction points: ${frictions.join(', ') || 'None'}`
  }).join('\n')

  const constraintTypeInfo = CONSTRAINT_TYPE_MAP[ctx.constraint.id] || {}
  const isOptimisation = (ctx.constraint.score || 0) > 75
  const framingNote = isOptimisation
    ? '\nIMPORTANT: The constraint pillar scores above 75%. Reframe this as an "Optimisation Opportunity" rather than a constraint. Focus on fine-tuning and acceleration rather than fixing.'
    : ''

  const revenueImpactRubric = {
    p3: 'Addressing positioning gaps typically improves win rate by 5-10 percentage points, directly increasing pipeline-to-revenue conversion.',
    p5: 'Resolving pipeline constraints typically closes the coverage gap by 20-40%, adding proportional expected convertible revenue.',
    p4: 'Fixing sales system repeatability typically reduces cycle length by 15-25% and improves conversion rates.',
    p2: 'Sharpening ICP targeting typically improves qualified lead rates by 10-15% and shortens sales cycles.',
    p1: 'Strengthening commercial baseline improves forecast accuracy and revenue predictability by 15-25%.',
    p6: 'Improving revenue economics typically improves CAC:LTV ratio and unit economics margins.',
    p7: 'Removing strategic constraints accelerates resource reallocation and initiative completion.',
    p8: 'Resolving org alignment issues typically improves initiative completion rate by 25% and execution speed.',
    p9: 'Improving systems readiness typically reduces manual process overhead by 30-50%.',
  }

  const prompt = `Analyse the primary growth constraint for ${ctx.company}.

Primary constraint: ${ctx.constraint.name || 'N/A'} (score: ${ctx.constraint.score || 0}/100)
Constraint type: ${constraintTypeInfo.type || 'unknown'}
All constraints:
${constraintDetail || 'No constraints identified'}

RAD Score: ${ctx.radScore}/100, Maturity: ${ctx.maturity}${framingNote}

Requirements:
- summary: One sharp sentence describing what this constraint means for the business (max 30 words)
- score_context: What this score level indicates about operational maturity in this area (1-2 sentences)
- key_friction_points: 3-5 specific operational friction points causing this constraint, grounded in question-level scores
- business_impact: 3-4 concrete business consequences of this constraint (revenue, pipeline, deal velocity, etc.)
- downstream_effects: 2-3 effects on other pillars (e.g. "Weak positioning erodes pipeline quality in P5")
- recommended_focus: One sentence describing the single most impactful action to address this constraint
- revenue_impact_estimation: Estimate the revenue impact of addressing this constraint. Rubric: ${revenueImpactRubric[ctx.constraint.id] || 'General improvement expected across growth metrics.'}
- constraint_type: "${constraintTypeInfo.type || 'general'}"

Return JSON:
{
  "summary": "...",
  "score_context": "...",
  "key_friction_points": ["point 1", "point 2", "point 3"],
  "business_impact": ["impact 1", "impact 2", "impact 3"],
  "downstream_effects": ["effect 1", "effect 2"],
  "recommended_focus": "...",
  "revenue_impact_estimation": "...",
  "constraint_type": "...",
  "data_source": "ai_synthesis"
}`

  return await callSection(client, 'constraint_analysis', prompt, ctx, CONSTRAINT_ANALYSIS_SCHEMA)
}

async function generateCompetitiveClarity(client, ctx) {
  const prompt = `Assess the competitive clarity and positioning for ${ctx.company}.

Positioning statement: "${ctx.positioning}"
Competitors: ${ctx.competitors}
P3 pillar score: ${(ctx.pillarScores.p3 || {}).score || 0}/100
Qualitative positioning challenge: "${ctx.qualitativeP3}"
Differentiated value: "${ctx.qualitativeP3b}"

Requirements:
- Score across 8 dimensions (1-10 each) with these anchor rubrics:
  * clarity: 1=completely unclear, 3=vaguely understandable, 5=clear to insiders, 7=clear to outsiders, 10=instantly understood
  * specificity: 1=entirely generic, 3=industry-level, 5=segment-level, 7=use-case specific, 10=quantified outcome
  * buyer_relevance: 1=no buyer language, 3=features listed, 5=benefits stated, 7=pain addressed, 10=buyer would quote it
  * differentiation: 1=identical to competitors, 3=minor variation, 5=one unique angle, 7=distinct approach, 10=category-defining
  * memorability: 1=forgettable, 3=recognisable if prompted, 5=one memorable element, 7=sticky phrase, 10=instantly quotable
  * proof_tension: 1=no evidence, 3=vague claims, 5=some data points, 7=case-study backed, 10=undeniable proof
  * category_ownership: 1=no category, 3=competing in crowded space, 5=niche carved, 7=sub-category leader, 10=category creator
  * commercial_sharpness: 1=no commercial angle, 3=implied value, 5=ROI mentioned, 7=ROI quantified, 10=payback period clear
- Positioning critique: what's wrong with the current positioning (separate from the rewrite)
- Positioning rewrite: improved statement
- White space insight: untapped positioning opportunity

Return JSON:
{
  "dimensions": {
    "clarity": <number>, "specificity": <number>, "buyer_relevance": <number>,
    "differentiation": <number>, "memorability": <number>, "proof_tension": <number>,
    "category_ownership": <number>, "commercial_sharpness": <number>
  },
  "overall_score": <average>,
  "positioning_critique": "what's wrong with current positioning",
  "positioning_rewrite": "improved positioning statement",
  "white_space_insight": "untapped opportunity",
  "data_source": "screener_data"
}`

  return await callSection(client, 'competitive_clarity', prompt, ctx, COMPETITIVE_CLARITY_SCHEMA)
}

async function generateRAPSNarrative(client, ctx) {
  const raps = ctx.raps
  const constraintTypeInfo = CONSTRAINT_TYPE_MAP[ctx.constraint.id] || {}
  const isHighRaps = (raps.score || 0) > 75
  const rapsFraming = isHighRaps
    ? '\nIMPORTANT: RAPS score is above 75. Frame scenarios as "How to Protect & Extend" rather than improvement scenarios. Focus on defending current position and extending advantage.'
    : ''

  const prompt = `Generate a RAPS (Revenue Achievement Probability Score) narrative for ${ctx.company}.

RAPS Score: ${raps.score || 0}/100 — ${raps.label || 'N/A'}
Coverage Ratio: ${raps.coverageRatio || 0} (${raps.coverageRating || 'N/A'})
Revenue Remaining: $${raps.revenueRemaining ? Number(raps.revenueRemaining).toLocaleString() : '0'}
Expected Convertible: $${raps.expectedConvertible ? Number(Math.round(raps.expectedConvertible)).toLocaleString() : '0'}
Months Remaining: ${raps.monthsRemaining || 0}

Primary constraint: ${ctx.constraint.name || 'N/A'} (${ctx.constraint.id || 'N/A'})
Constraint type: ${constraintTypeInfo.type || 'general'}
Constraint impact metric: ${constraintTypeInfo.metric || 'general improvement'}${rapsFraming}

Requirements:
- 150-250 words narrative explaining score drivers
- 3 scenarios calibrated to the primary constraint type:
  * Conservative (quick wins): e.g., for positioning constraint → win rate +5pp; for pipeline → coverage +15%
  * Moderate (systematic fix): full constraint-specific improvements applied
  * Aggressive (transformation): constraint removed + adjacent pillars improved
- 3-5 why_factors explaining key RAPS score drivers
- 3-5 must_improve items

Return JSON:
{
  "narrative": "full RAPS narrative",
  "why_factors": ["factor 1", "factor 2", "factor 3"],
  "must_improve": ["improvement 1", "improvement 2", "improvement 3"],
  "scenarios_narrative": "3 scenarios described with constraint-specific assumptions",
  "data_source": "raps_calculation"
}`

  return await callSection(client, 'raps_narrative', prompt, ctx, RAPS_NARRATIVE_SCHEMA)
}

async function generateActionRoadmap(client, ctx) {
  const constraintList = ctx.constraints.map(c => `${c.name} (${c.id}: ${c.score})`).join(', ')
  const p8Score = ctx.pillarScores.p8?.score || 0

  // Build question-level score summary for grounding
  const questionScoreSummary = Object.entries(ctx.pillarQuestionDetails)
    .map(([pid, questions]) => {
      const lowQs = questions.filter(q => q.score <= 2).map(q => `${q.id}=${q.score}`)
      return lowQs.length > 0 ? `${PILLAR_NAMES[pid]}: ${lowQs.join(', ')}` : null
    })
    .filter(Boolean)
    .join('\n')

  const isAcceleration = ctx.isHighPerformer
  const planTitle = isAcceleration ? 'Acceleration Plan' : '30-60-90 Day Action Roadmap'
  const framingNote = isAcceleration
    ? '\nIMPORTANT: RAD score is above 75%. Frame this as an "Acceleration Plan" focused on extending strengths and capturing opportunities, not fixing problems.'
    : ''

  const prompt = `Generate a ${planTitle} for ${ctx.company}.

Constraints (sorted by severity): ${constraintList || 'None identified'}
Primary constraint: ${ctx.constraint.name || 'N/A'} (${ctx.constraint.score || 0})
RAD Score: ${ctx.radScore}/100
P8 (Organisational Alignment) Score: ${p8Score}/100 — calibrate the ambition and pace of actions accordingly. ${p8Score < 50 ? 'Low org alignment means actions should be simpler and more focused.' : p8Score >= 80 ? 'High org alignment supports ambitious, multi-stream initiatives.' : 'Moderate org alignment — balance ambition with execution capacity.'}${framingNote}

Question-level friction points (scored 1-2 out of 5):
${questionScoreSummary || 'No critical friction points detected.'}

Requirements:
- 3 phases: ${isAcceleration ? 'Quick Wins (0-30 days), Strategic Expansion (30-60 days), Scale & Optimise (60-90 days)' : 'Critical Fixes (0-30 days), Important Improvements (30-60 days), Consolidation & Growth (60-90 days)'}
- 4-5 items per phase (12-15 total)
- Each item must have: action, pillar (e.g. 'p4'), priority ('critical'/'high'/'medium'), owner (role title), deliverable (specific output), success_metric (measurable outcome), question_reference (e.g. "P3 Q3 scored 2/5" — reference the specific question that grounds this action)
- Actions must be specific and commercially grounded, not generic advice

Return JSON:
{
  "phase1_title": "${isAcceleration ? 'Quick Wins (0-30 Days)' : 'Critical Fixes (0-30 Days)'}",
  "phase1_items": [{"action": "...", "pillar": "p4", "priority": "critical", "owner": "CRO", "deliverable": "...", "success_metric": "...", "question_reference": "P4 Q2 scored 2/5"}],
  "phase2_title": "${isAcceleration ? 'Strategic Expansion (30-60 Days)' : 'Important Improvements (30-60 Days)'}",
  "phase2_items": [{"action": "...", "pillar": "p3", "priority": "high", "owner": "CMO", "deliverable": "...", "success_metric": "...", "question_reference": "P3 Q5 scored 1/5"}],
  "phase3_title": "${isAcceleration ? 'Scale & Optimise (60-90 Days)' : 'Consolidation & Growth (60-90 Days)'}",
  "phase3_items": [{"action": "...", "pillar": "p1", "priority": "medium", "owner": "CEO", "deliverable": "...", "success_metric": "...", "question_reference": "P1 Q3 scored 3/5"}],
  "data_source": "ai_synthesis"
}`

  return await callSection(client, 'action_roadmap', prompt, ctx, ACTION_ROADMAP_SCHEMA)
}

async function generateCrossPillarInteraction(client, ctx) {
  // I2: Pre-compute active predefined linkages
  const activeLinkages = CAUSAL_LINKAGES.filter(link => {
    const fromScore = ctx.pillarScores[link.from]?.score || 100
    return fromScore < 65 || link.to === 'all'
  }).map(link => {
    const fromScore = ctx.pillarScores[link.from]?.score || 0
    const toScore = link.to === 'all' ? 'N/A' : (ctx.pillarScores[link.to]?.score || 0)
    return `${PILLAR_NAMES[link.from]} (${fromScore}) → ${link.to === 'all' ? 'All pillars' : PILLAR_NAMES[link.to]} (${toScore}): ${link.label}`
  })

  // Detect reinforcing loops: both pillars < 50%
  const reinforcingPairs = CAUSAL_LINKAGES.filter(link => {
    if (link.to === 'all') return false
    const fromScore = ctx.pillarScores[link.from]?.score || 100
    const toScore = ctx.pillarScores[link.to]?.score || 100
    return fromScore < 50 && toScore < 50
  }).map(link => `${PILLAR_NAMES[link.from]} ↔ ${PILLAR_NAMES[link.to]}`)

  const prompt = `Analyse cross-pillar interactions for ${ctx.company}.

The following predefined causal linkages are ACTIVE based on scores (from_pillar < 65%):
${activeLinkages.length > 0 ? activeLinkages.join('\n') : 'No active causal linkages detected — all source pillars score above 65%.'}

Reinforcing loops detected (both pillars < 50%):
${reinforcingPairs.length > 0 ? reinforcingPairs.join('\n') : 'No reinforcing loops detected.'}

Requirements:
- Use the predefined linkages above as the primary structure — elaborate on the mechanism for each active linkage
- Detect additional reinforcing loops where multiple weak pillars compound each other
- Identify virtuous cycles where strong pillars support each other
- Each causal link should reference specific pillar scores as evidence

Return JSON:
{
  "causal_links": [
    {"from_pillar": "p3", "to_pillar": "p5", "mechanism": "description of how one affects the other", "severity": "high|medium|low"}
  ],
  "reinforcing_loops": [
    {"pillars": ["p3", "p5", "p6"], "description": "description of the reinforcing loop"}
  ],
  "narrative": "2-3 paragraph narrative of cross-pillar dynamics",
  "data_source": "ai_synthesis"
}`

  return await callSection(client, 'cross_pillar_interaction', prompt, ctx, CROSS_PILLAR_SCHEMA)
}

async function generateStrategicSignals(client, ctx) {
  const prompt = `Analyse strategic signals for ${ctx.company} by cross-referencing qualitative responses against quantitative scores.

Qualitative responses available:
- P3 Positioning Challenge: "${ctx.qualitativeP3}" (P3 score: ${ctx.pillarScores.p3?.score || 0}/100)
- P3 Differentiated Value: "${ctx.qualitativeP3b}"
- P7 Strategic Constraint: "${ctx.qualitativeP7}" (P7 score: ${ctx.pillarScores.p7?.score || 0}/100)
- P8 Organisational Alignment: "${ctx.qualitativeP8}" (P8 score: ${ctx.pillarScores.p8?.score || 0}/100)
- P9 Systems & AI Readiness: "${ctx.qualitativeP9}" (P9 score: ${ctx.pillarScores.p9?.score || 0}/100)

Requirements:
- For EACH qualitative response, assign an explicit alignment_category:
  * "Aligned" — respondent's description matches the quantitative score pattern
  * "Partially Aligned" — respondent shows some awareness but misses key issues
  * "Misaligned" — respondent's description contradicts or is blind to the quantitative evidence
- Each signal should note the tension or alignment and its strategic implication
- diagnostic_awareness: One sentence overall assessment of how self-aware the respondent is about their growth system gaps

Return JSON:
{
  "signals": [
    {"pillar": "p3", "type": "alignment|misalignment", "description": "what the signal reveals", "implication": "strategic consequence", "alignment_category": "Aligned|Partially Aligned|Misaligned"}
  ],
  "narrative": "1-2 paragraph synthesis of signal patterns",
  "diagnostic_awareness": "one-sentence assessment of respondent self-awareness",
  "data_source": "qualitative_responses"
}`

  return await callSection(client, 'strategic_signals', prompt, ctx, STRATEGIC_SIGNALS_SCHEMA)
}

async function generateOrgSystemsReadiness(client, ctx) {
  const p8Score = (ctx.pillarScores.p8 || {}).score || 0
  const p9Score = (ctx.pillarScores.p9 || {}).score || 0
  const p8Questions = ctx.pillarQuestionDetails.p8 || []
  const p9Questions = ctx.pillarQuestionDetails.p9 || []

  // AI readiness cluster: p9_q7 through p9_q11 per spec
  const aiQuestions = p9Questions.filter(q => ['p9_q7', 'p9_q8', 'p9_q9', 'p9_q10', 'p9_q11'].includes(q.id))
  const aiReadinessAvg = aiQuestions.length > 0
    ? (aiQuestions.reduce((s, q) => s + q.score, 0) / aiQuestions.length).toFixed(1)
    : 'N/A'

  const prompt = `Generate an Organisational & Systems Readiness assessment for ${ctx.company}.

P8 (Organisational Alignment) score: ${p8Score}/100
P9 (Systems Readiness & AI Transformation) score: ${p9Score}/100
AI Readiness Index (avg of p9_q7 through p9_q11): ${aiReadinessAvg}/5
P8 question scores: ${p8Questions.map(q => `${q.id}=${q.score}`).join(', ') || 'N/A'}
P9 question scores: ${p9Questions.map(q => `${q.id}=${q.score}`).join(', ') || 'N/A'}
Qualitative P8: "${ctx.qualitativeP8}"
Qualitative P9: "${ctx.qualitativeP9}"

Requirements:
- 375-500 words total, 4 parts:
  * Part 1: Organisational alignment assessment (P8 analysis)
  * Part 2: Systems readiness assessment (P9 analysis)
  * Part 3: AI transformation readiness (using AI readiness index from p9_q9, p9_q10, p9_q11)
  * Part 4: Combined execution readiness — can this organisation execute the action roadmap?
- Include cluster score analysis where question groups reveal patterns

Return JSON:
{
  "parts": [
    {"title": "Organisational Alignment", "content": "part 1 text"},
    {"title": "Systems Readiness", "content": "part 2 text"},
    {"title": "AI Transformation Readiness", "content": "part 3 text"},
    {"title": "Combined Execution Readiness", "content": "part 4 text"}
  ],
  "cluster_analysis": {
    "org_alignment_score": ${p8Score},
    "systems_readiness_score": ${p9Score},
    "ai_readiness_index": ${aiReadinessAvg === 'N/A' ? 'null' : aiReadinessAvg}
  },
  "narrative": "combined narrative joining all 4 parts",
  "data_source": "diagnostic_scores"
}`

  return await callSection(client, 'org_systems_readiness', prompt, ctx, ORG_SYSTEMS_SCHEMA)
}

async function generateAdvisoryWorkstream(client, ctx) {
  const constraintList = ctx.constraints.map(c => `${c.name} (score: ${c.score})`).join(', ')
  const prompt = `Recommend an advisory workstream for ${ctx.company}.

RAD Score: ${ctx.radScore}/100 (${ctx.maturity})
RAPS Score: ${ctx.raps.score || 0}/100 (${ctx.raps.label || 'N/A'})
Constraints: ${constraintList || 'None'}
Primary constraint: ${ctx.constraint.name || 'N/A'} (${ctx.constraint.score || 0})

Requirements:
- Constraint-severity anchored: the engagement type and intensity should match the severity of constraints
- Named engagement framework (e.g., "90-Day Revenue Architecture Sprint", "Growth System Diagnostic & Fix", etc.)
- 3-5 focus areas aligned to weakest pillars
- 2-3 expected outcomes with measurable targets
- Engagement framework description
- raps_connection: For each focus area, explain how it connects to RAPS improvement (e.g., "Improving pipeline coverage directly increases RAPS by expanding expected convertible revenue")
- sequence_logic: A narrative explaining WHY the workstreams are sequenced in this order (e.g., "Positioning must be fixed before pipeline because...")

Return JSON:
{
  "recommended_engagement": "named engagement type",
  "focus_areas": ["area 1", "area 2", "area 3"],
  "expected_outcomes": ["outcome 1", "outcome 2"],
  "engagement_framework": "description of the engagement structure and approach",
  "raps_connection": ["connection for area 1", "connection for area 2", "connection for area 3"],
  "sequence_logic": "narrative explaining workstream sequencing",
  "data_source": "ai_synthesis"
}`

  return await callSection(client, 'advisory_workstream', prompt, ctx, ADVISORY_WORKSTREAM_SCHEMA)
}

async function generateClosingObservation(client, ctx) {
  const prompt = `Generate a closing observation for the diagnostic report for ${ctx.company}.

RAD Score: ${ctx.radScore}/100 (${ctx.maturity})
Primary constraint: ${ctx.constraint.name || 'N/A'}

Requirements:
- 150-200 words, exactly 3 paragraphs
- Paragraph 1: Restate the company's overall position — score, band, and what it means in commercial terms
- Paragraph 2: Key opportunity that opens up if the primary constraint is addressed
- Paragraph 3: Direct call to action — what the company should do next
- Tone: confident, forward-looking, commercially specific

Return JSON:
{
  "closing_narrative": "full 3-paragraph closing text",
  "data_source": "ai_synthesis"
}`

  return await callSection(client, 'closing_observation', prompt, ctx, CLOSING_OBSERVATION_SCHEMA)
}

// C3: Diagnostic Overview Interpretation
const DIAGNOSTIC_INTERPRETATION_SCHEMA = {
  name: 'diagnostic_interpretation',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['interpretation', 'data_source'],
    properties: {
      interpretation: { type: 'string' },
      data_source: { type: 'string' },
    },
  },
}

async function generateDiagnosticInterpretation(client, ctx) {
  const pillarSummary = Object.entries(ctx.pillarScores)
    .map(([pid, ps]) => `${PILLAR_NAMES[pid]}: ${ps.score || 0}/100`)
    .join(', ')

  const prompt = `Generate a diagnostic overview interpretation for ${ctx.company}.

RAD Score: ${ctx.radScore}/100 (${ctx.maturity})
Pillar scores: ${pillarSummary}
Primary constraint: ${ctx.constraint.name || 'N/A'} (${ctx.constraint.score || 0})

Requirements:
- 150-200 words, 2-3 paragraphs
- Interpret the overall score pattern — what does the shape of scores tell us?
- Highlight the most significant gap between strongest and weakest pillars
- Connect the pattern to commercial implications

Return JSON:
{
  "interpretation": "full interpretation text",
  "data_source": "diagnostic_scores"
}`

  return await callSection(client, 'diagnostic_interpretation', prompt, ctx, DIAGNOSTIC_INTERPRETATION_SCHEMA)
}

// I1: Company Snapshot Metric Interpretations
const SNAPSHOT_INTERPRETATIONS_SCHEMA = {
  name: 'snapshot_interpretations',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['interpretations', 'data_source'],
    properties: {
      interpretations: {
        type: 'object',
        additionalProperties: false,
        required: ['revenue_band', 'sales_team', 'marketing_budget', 'sales_model', 'deal_size', 'sales_cycle', 'win_rate', 'revenue_target', 'revenue_invoiced'],
        properties: {
          revenue_band: { type: 'string' },
          sales_team: { type: 'string' },
          marketing_budget: { type: 'string' },
          sales_model: { type: 'string' },
          deal_size: { type: 'string' },
          sales_cycle: { type: 'string' },
          win_rate: { type: 'string' },
          revenue_target: { type: 'string' },
          revenue_invoiced: { type: 'string' },
        },
      },
      data_source: { type: 'string' },
    },
  },
}

async function generateSnapshotInterpretations(client, ctx) {
  const sr = ctx.screener
  const prompt = `Generate brief AI interpretations (3-8 words each) for the following company metrics for ${ctx.company}:

- Revenue Band: ${sr.q7 || 'N/A'}
- Sales Team Size: ${sr.q8 || 'N/A'}
- Marketing Budget: ${sr.q9 || 'N/A'}
- Sales Model: ${sr.q10 || 'N/A'}
- Average Deal Size: ${sr.q14 || 'N/A'}
- Average Sales Cycle: ${sr.q15 || 'N/A'}
- Win Rate: ${sr.q17 || 'N/A'}
- Revenue Target: $${sr.q18 || '0'}
- Revenue Invoiced YTD: $${sr.q19 || '0'}

Each interpretation should be a short, commercially insightful phrase (3-8 words) that puts the metric in context. Examples:
- "$1.2M/month required — aggressive pace"
- "Below-average for segment"
- "Healthy conversion indicator"
- "Lean team for revenue target"

Return JSON:
{
  "interpretations": {
    "revenue_band": "...",
    "sales_team": "...",
    "marketing_budget": "...",
    "sales_model": "...",
    "deal_size": "...",
    "sales_cycle": "...",
    "win_rate": "...",
    "revenue_target": "...",
    "revenue_invoiced": "..."
  },
  "data_source": "screener_data"
}`

  return await callSection(client, 'snapshot_interpretations', prompt, ctx, SNAPSHOT_INTERPRETATIONS_SCHEMA)
}

// E2: Banned phrase cleaning
function cleanBannedPhrases(text) {
  if (!text || typeof text !== 'string') return text
  let cleaned = text
  for (const phrase of BANNED_PHRASES) {
    const regex = new RegExp(phrase, 'gi')
    cleaned = cleaned.replace(regex, '')
  }
  // Clean up double spaces and leading/trailing whitespace
  return cleaned.replace(/\s{2,}/g, ' ').trim()
}

function cleanReportText(obj) {
  if (typeof obj === 'string') return cleanBannedPhrases(obj)
  if (Array.isArray(obj)) return obj.map(item => cleanReportText(item))
  if (obj && typeof obj === 'object') {
    const cleaned = {}
    for (const [key, val] of Object.entries(obj)) {
      cleaned[key] = cleanReportText(val)
    }
    return cleaned
  }
  return obj
}

function buildFinalReport(results, ctx) {
  const raps = ctx.raps

  // Executive summary — join paragraphs or use fallback
  const execSummary = results.executive_summary
  const executiveSummaryText = execSummary?.paragraphs
    ? execSummary.paragraphs.join('\n\n')
    : 'Executive summary generation failed.'

  // Pillar narratives — extract narrative strings for backward compat
  const pillarNarratives = {}
  for (const pid of Object.keys(PILLAR_NAMES)) {
    const pn = results.pillar_narratives?.[pid]
    pillarNarratives[pid] = pn?.narrative || `Narrative for ${PILLAR_NAMES[pid]} could not be generated.`
  }

  // Competitive clarity
  const cc = results.competitive_clarity || {}

  // RAPS
  const rapsResult = results.raps || {}

  // Action plan — preserve backward compat shape, add new fields
  const ap = results.action_plan || {}

  // Growth constraint map from cross-pillar interaction
  const cpi = results.cross_pillar_interaction || {}
  const growthConstraintMap = {
    primary_constraint: ctx.constraint.name || 'N/A',
    causal_chain: cpi.causal_links
      ? cpi.causal_links.map(l => `${PILLAR_NAMES[l.from_pillar] || l.from_pillar} → ${PILLAR_NAMES[l.to_pillar] || l.to_pillar}: ${l.mechanism}`)
      : [],
    downstream_impacts: cpi.reinforcing_loops
      ? cpi.reinforcing_loops.map(l => l.description)
      : [],
  }

  // Org & systems readiness — backward compat string + new structured data
  const osr = results.org_systems_readiness || {}
  const orgSystemsReadinessText = osr.narrative || 'Org & systems readiness analysis could not be generated.'

  // Advisory workstream
  const aw = results.advisory_workstream || {}

  // Priority actions summary — derive from action plan
  const phase1Items = ap.phase1_items || []
  const phase2Items = ap.phase2_items || []
  const phase3Items = ap.phase3_items || []
  const highPillars = Object.entries(ctx.pillarScores)
    .filter(([, ps]) => (ps.score || 0) >= 80)
    .map(([pid]) => `Protect ${PILLAR_NAMES[pid]} (${ctx.pillarScores[pid].score}/100)`)

  // Closing observation
  const co = results.closing_observation || {}

  // Strategic moat — derive from competitive clarity overall score
  const moatScore = cc.overall_score || 5
  const moatNarrative = cc.positioning_critique
    ? `${cc.positioning_critique}\n\n${cc.white_space_insight || ''}`
    : 'Strategic moat analysis could not be generated.'

  // Revenue waterfall — computed from RAPS data directly
  const target = Number(ctx.screener.q18) || 0
  const invoiced = Number(ctx.screener.q19) || 0
  const remaining = Math.max(0, target - invoiced)
  const pipeline = raps.openPipeline || 0
  const expectedConv = raps.expectedConvertible || 0
  const gap = remaining - expectedConv

  return {
    // Backward-compatible keys
    executive_summary: executiveSummaryText,
    pillar_narratives: pillarNarratives,
    positioning_assessment: cc.positioning_critique
      ? `${cc.positioning_critique}\n\nRecommended positioning: ${cc.positioning_rewrite || ''}`
      : 'Positioning assessment could not be generated.',
    strategic_moat_score: moatScore,
    strategic_moat_narrative: moatNarrative,
    raps_narrative: rapsResult.narrative || 'RAPS narrative could not be generated.',
    raps_why_factors: rapsResult.why_factors || [],
    raps_must_improve: rapsResult.must_improve || [],
    raps_improvement_scenario: {
      current: { score: raps.score || 0, label: raps.label || 'N/A' },
      improved: { score: Math.min(100, (raps.score || 0) + 15), label: 'Moderate', assumptions: 'Win rate +5pp, pipeline +25%' },
    },
    action_plan: {
      phase1_title: ap.phase1_title || 'Critical Fixes (0-30 Days)',
      phase1_items: phase1Items,
      phase2_title: ap.phase2_title || 'Important Improvements (30-60 Days)',
      phase2_items: phase2Items,
      phase3_title: ap.phase3_title || 'Consolidation & Growth (60-90 Days)',
      phase3_items: phase3Items,
    },
    company_snapshot: {
      company: ctx.company,
      industry: ctx.industry,
      revenue_range: ctx.screener.q7 || 'N/A',
      sales_staff: ctx.screener.q8 || 'N/A',
      sales_model: ctx.screener.q10 || 'N/A',
      markets: ctx.screener.q6 || 'N/A',
      deal_size: ctx.screener.q14 || 'N/A',
      sales_cycle: ctx.screener.q15 || 'N/A',
    },
    growth_constraint_map: growthConstraintMap,
    org_systems_readiness: orgSystemsReadinessText,
    advisory_workstream: {
      recommended_engagement: aw.recommended_engagement || 'N/A',
      focus_areas: aw.focus_areas || [],
      expected_outcomes: aw.expected_outcomes || [],
      engagement_framework: aw.engagement_framework || null,
      raps_connection: aw.raps_connection || [],
      sequence_logic: aw.sequence_logic || null,
    },
    priority_actions_summary: {
      fix_first: phase1Items.map(i => i.action || i),
      fix_next: phase2Items.map(i => i.action || i),
      stabilise: phase3Items.map(i => i.action || i),
      protect: highPillars,
    },
    competitive_clarity: {
      dimensions: cc.dimensions || {},
      overall_score: cc.overall_score || 0,
      positioning_critique: cc.positioning_critique || null,
      positioning_rewrite: cc.positioning_rewrite || '',
      white_space_insight: cc.white_space_insight || '',
    },
    revenue_waterfall: {
      target, invoiced, remaining, pipeline, expected_convertible: expectedConv, gap,
    },

    // New sections
    cross_pillar_interaction: {
      causal_links: cpi.causal_links || [],
      reinforcing_loops: cpi.reinforcing_loops || [],
      narrative: cpi.narrative || null,
      data_source: cpi.data_source || 'ai_synthesis',
    },
    strategic_signals: results.strategic_signals || { signals: [], narrative: null, diagnostic_awareness: null, data_source: 'qualitative_responses' },
    org_systems_readiness_detailed: {
      parts: osr.parts || [],
      cluster_analysis: osr.cluster_analysis || {},
      narrative: osr.narrative || null,
      data_source: osr.data_source || 'diagnostic_scores',
    },
    closing_observation: co.closing_narrative || null,

    // Pillar-level structured data (new, in addition to narrative strings)
    pillar_details: Object.fromEntries(
      Object.keys(PILLAR_NAMES).map(pid => {
        const pn = results.pillar_narratives?.[pid] || {}
        return [pid, {
          operationalStrengths: pn.operationalStrengths || [],
          frictionPoints: pn.frictionPoints || [],
          respondentSignal: pn.respondentSignal || null,
          positioning_critique: pn.positioning_critique || null,
        }]
      })
    ),

    // Constraint analysis (structured)
    constraint_analysis: results.constraint_analysis || null,

    // RAPS scenarios narrative (new)
    raps_scenarios_narrative: rapsResult.scenarios_narrative || null,

    // Scorecard explanation bullets
    scorecard_explanation: results.scorecard_explanation?.bullets || [],

    // C3: Diagnostic interpretation
    diagnostic_interpretation: results.diagnostic_interpretation?.interpretation || null,

    // I1: Snapshot interpretations
    snapshot_interpretations: results.snapshot_interpretations?.interpretations || null,

    // E5: High-performer flag
    isHighPerformer: ctx.isHighPerformer,
  }
}

export function runQAChecks(report) {
  const warnings = []
  const errors = []

  // 1. Specificity: exec summary must reference at least 2 pillar names
  if (report.executive_summary) {
    const pillarRefs = Object.values(PILLAR_NAMES).filter(name => report.executive_summary.includes(name))
    if (pillarRefs.length < 2) warnings.push(`Executive summary references only ${pillarRefs.length} pillar names (expected >= 2)`)
  }

  // 2. Score references: exec summary must contain the RAD score
  if (report.executive_summary && report.isHighPerformer !== undefined) {
    const hasScore = /\d{1,3}\/100/.test(report.executive_summary)
    if (!hasScore) warnings.push('Executive summary does not contain a score reference (X/100)')
  }

  // 3. RAPS arithmetic
  if (report.raps_improvement_scenario?.current && report.raps_improvement_scenario?.improved) {
    if (report.raps_improvement_scenario.improved.score <= report.raps_improvement_scenario.current.score) {
      warnings.push('RAPS improvement scenario shows no improvement over current score')
    }
  }

  // 4. Word count
  if (report.executive_summary) {
    const wordCount = report.executive_summary.split(/\s+/).length
    if (wordCount < 200) warnings.push(`Executive summary is only ${wordCount} words (expected 250-350)`)
    if (wordCount > 400) warnings.push(`Executive summary is ${wordCount} words (expected 250-350)`)
  }

  // 5. Banned phrases
  const textFields = [
    report.executive_summary,
    report.raps_narrative,
    report.closing_observation,
    ...(report.constraint_analysis ? [report.constraint_analysis.summary, report.constraint_analysis.recommended_focus] : []),
    ...Object.values(report.pillar_narratives || {}),
  ].filter(Boolean)

  for (const text of textFields) {
    for (const phrase of BANNED_PHRASES) {
      if (text.toLowerCase().includes(phrase.toLowerCase())) {
        warnings.push(`Banned phrase "${phrase}" found in report text`)
      }
    }
  }

  // 6. Constraint reference
  if (report.constraint_analysis && !report.constraint_analysis.summary) {
    errors.push('Constraint analysis missing summary')
  }

  // 7. Pillar coverage
  const narrativeCount = Object.keys(report.pillar_narratives || {}).length
  if (narrativeCount < 9) errors.push(`Only ${narrativeCount}/9 pillar narratives generated`)

  // 8. Closing observation
  if (!report.closing_observation) warnings.push('Closing observation is missing')

  // 9. Action plan phases
  if (report.action_plan) {
    if (!report.action_plan.phase1_items?.length) warnings.push('Action plan phase 1 has no items')
    if (!report.action_plan.phase2_items?.length) warnings.push('Action plan phase 2 has no items')
    if (!report.action_plan.phase3_items?.length) warnings.push('Action plan phase 3 has no items')
  }

  // 10. Cross-pillar links
  if (report.cross_pillar_interaction?.causal_links?.length < 2) {
    warnings.push('Cross-pillar interaction has fewer than 2 causal links')
  }

  const passed = errors.length === 0
  if (warnings.length > 0) console.warn('[QA] Warnings:', warnings)
  if (errors.length > 0) console.error('[QA] Errors:', errors)

  return { passed, warnings, errors }
}

export async function generateDiagnosticReport(data) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const ctx = buildContext(data)

  // All sections only depend on ctx, not on each other — run everything in parallel
  const [
    executive_summary,
    scorecard_explanation,
    pillarResults,
    constraint_analysis,
    competitive_clarity,
    cross_pillar_interaction,
    raps,
    strategic_signals,
    org_systems_readiness,
    action_plan,
    advisory_workstream,
    closing_observation,
    diagnostic_interpretation,
    snapshot_interpretations,
  ] = await Promise.all([
    generateExecutiveSummary(client, ctx),
    generateScorecardExplanation(client, ctx),
    Promise.all(
      ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9'].map(pid =>
        generatePillarNarrative(client, ctx, pid).then(r => [pid, r])
      )
    ),
    generateConstraintAnalysis(client, ctx),
    generateCompetitiveClarity(client, ctx),
    generateCrossPillarInteraction(client, ctx),
    generateRAPSNarrative(client, ctx),
    generateStrategicSignals(client, ctx),
    generateOrgSystemsReadiness(client, ctx),
    generateActionRoadmap(client, ctx),
    generateAdvisoryWorkstream(client, ctx),
    generateClosingObservation(client, ctx),
    generateDiagnosticInterpretation(client, ctx),
    generateSnapshotInterpretations(client, ctx),
  ])

  const results = {
    executive_summary,
    scorecard_explanation,
    pillar_narratives: Object.fromEntries(pillarResults),
    constraint_analysis,
    competitive_clarity,
    cross_pillar_interaction,
    raps,
    strategic_signals,
    org_systems_readiness,
    action_plan,
    advisory_workstream,
    closing_observation,
    diagnostic_interpretation,
    snapshot_interpretations,
  }

  // E2: Clean banned phrases from all AI-generated text
  const report = cleanReportText(buildFinalReport(results, ctx))

  // E3: QA validation layer
  report.qa_results = runQAChecks(report)

  return report
}

export async function generateMarketReport(data) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  let markets = data.markets || ''
  const industry = data.industry || 'Technology'
  const company = data.company || 'the company'

  if (!markets || markets === 'Not provided') {
    markets = 'United States'
  }

  const countryList = Array.isArray(markets)
    ? markets.slice(0, 3)
    : markets.split(',').map(c => c.trim()).filter(Boolean).slice(0, 3)

  const prompt = `Research and generate a market opportunity report for ${company} in the ${industry} sector for these markets: ${countryList.join(', ')}.

Use web search to find current, real market data for each country. Look for:
- GDP growth, economic outlook, and business environment
- Regulatory landscape and trade policies
- Industry-specific market size, growth rates, and trends
- Competitive landscape and market entry considerations
- Recent developments affecting B2B sales in these markets

For EACH country, provide analysis across 5 macro dimensions. Return JSON:

{
  "countries": [
    {
      "name": "Country Name",
      "dimensions": [
        {"name": "GDP Growth & Economic Outlook", "findings": ["finding 1", "finding 2", "finding 3"]},
        {"name": "Digital Adoption & Technology Infrastructure", "findings": ["finding 1", "finding 2", "finding 3"]},
        {"name": "Regulatory & Trade Environment", "findings": ["finding 1", "finding 2", "finding 3"]},
        {"name": "Sector Investment & Industry Growth", "findings": ["finding 1", "finding 2", "finding 3"]},
        {"name": "Workforce & Talent Availability", "findings": ["finding 1", "finding 2", "finding 3"]}
      ],
      "growth_propensity": "High|Medium-High|Medium|Low",
      "key_drivers": ["driver 1", "driver 2", "driver 3"],
      "key_risk": "primary risk statement",
      "risks": "2-3 sentence summary of key risks",
      "strategic_implications": "2-3 sentence strategic recommendation"
    }
  ],
  "source_urls": ["url1", "url2"]
}

Return ONLY JSON, no markdown blocks.`

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 8192,
      system: 'You are a market research analyst specializing in B2B market intelligence. Provide data-driven market assessments using current information from web search. Return only valid JSON.',
      messages: [{ role: 'user', content: prompt }],
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 10 }],
    })

    // Extract source URLs from web search tool results
    const sourceUrls = []
    for (const block of response.content) {
      if (block.type === 'tool_result' || block.type === 'web_search_tool_result') {
        try {
          const searchContent = typeof block.content === 'string' ? JSON.parse(block.content) : block.content
          if (Array.isArray(searchContent)) {
            for (const item of searchContent) {
              if (item.url) sourceUrls.push(item.url)
            }
          }
        } catch { /* ignore parse errors */ }
      }
    }

    const text = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('')

    const result = parseJsonResponse(text)
    if (sourceUrls.length > 0 && !result.source_urls) {
      result.source_urls = sourceUrls
    }
    return result
  } catch (searchErr) {
    console.warn('Web search unavailable, generating market report without search:', searchErr.message)
    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 8192,
        system: 'You are a market research analyst specializing in B2B market intelligence. Provide data-driven market assessments based on your knowledge. Return only valid JSON.',
        messages: [{ role: 'user', content: prompt }],
      })

      const text = response.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('')

      return parseJsonResponse(text)
    } catch (fallbackErr) {
      console.error('[reportAgent] Market report fallback also failed:', fallbackErr.message)
      return { countries: [] }
    }
  }
}
