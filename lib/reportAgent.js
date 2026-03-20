import Anthropic from '@anthropic-ai/sdk'

const PILLAR_NAMES = {
  p1: 'Commercial Baseline', p2: 'ICP & Buyer Urgency',
  p3: 'Positioning & Competitive Clarity', p4: 'Sales System Repeatability',
  p5: 'Pipeline Generation', p6: 'Revenue Economics', p7: 'Strategic Constraints',
  p8: 'Organisational Alignment & Capability', p9: 'Systems Readiness & AI Transformation',
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
  return JSON.parse(cleaned.trim())
}

export async function generateDiagnosticReport(data) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const scores = data.scores || {}
  const screener = data.screener_responses || {}
  const diagnostic = data.diagnostic_responses || {}
  const company = screener.q4 || 'Unknown Company'
  const industry = screener.q5 || 'Unknown Industry'

  const pillarScores = scores.pillarScores || {}
  const radScore = scores.radScore || 0
  const maturity = scores.maturityBand || 'Unknown'
  const constraint = scores.primaryConstraint || {}
  const raps = scores.raps || {}

  const pillarSummary = Object.entries(pillarScores)
    .map(([pid, ps]) => `- ${PILLAR_NAMES[pid] || pid}: Score ${ps.score || 0}/100 (avg ${ps.avg || 0}/5)`)
    .join('\n')

  const qualitativeP3 = diagnostic.p3_q12 || 'Not provided'
  const qualitativeP7 = diagnostic.p7_q6 || 'Not provided'
  const qualitativeP8 = diagnostic.p8_q13 || 'Not provided'
  const qualitativeP9 = diagnostic.p9_q13 || 'Not provided'
  const positioning = screener.q12 || 'Not provided'
  const competitors = screener.q13 || 'Not provided'
  const markets = screener.q6 || 'Not provided'

  const winRate = raps.winRate ? (raps.winRate * 100).toFixed(0) : '0'
  const revenueRemaining = raps.revenueRemaining ? Number(raps.revenueRemaining).toLocaleString() : '0'
  const openPipeline = raps.openPipeline ? Number(raps.openPipeline).toLocaleString() : '0'
  const expectedConvertible = raps.expectedConvertible ? Number(Math.round(raps.expectedConvertible)).toLocaleString() : '0'
  const requiredMonthly = raps.requiredMonthlyRevenue ? Number(Math.round(raps.requiredMonthlyRevenue)).toLocaleString() : '0'

  const prompt = `Generate a comprehensive diagnostic report for ${company} (${industry}).

COMPANY DATA:
- Revenue Range: ${screener.q7 || 'N/A'}
- Sales Staff: ${screener.q8 || 'N/A'}
- Marketing Budget: ${screener.q9 || 'N/A'}
- Sales Model: ${screener.q10 || 'N/A'}
- GTM Channels: ${screener.q11 || 'N/A'}
- Positioning: ${positioning}
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
- RAD Modifier: ${raps.radModifierValue > 0 ? '+' : ''}${raps.radModifierValue || 0}

Return a JSON object with these exact keys. Each narrative should be 2-4 sentences. Action items should be specific and actionable (3-5 per phase):

{
  "executive_summary": "2-3 paragraph executive summary of the diagnostic results",
  "pillar_narratives": {
    "p1": "narrative for Commercial Baseline",
    "p2": "narrative for ICP & Buyer Urgency",
    "p3": "narrative for Positioning & Competitive Clarity",
    "p4": "narrative for Sales System Repeatability",
    "p5": "narrative for Pipeline Generation",
    "p6": "narrative for Revenue Economics",
    "p7": "narrative for Strategic Constraints",
    "p8": "narrative for Organisational Alignment & Capability",
    "p9": "narrative for Systems Readiness & AI Transformation"
  },
  "positioning_assessment": "2-3 paragraphs on positioning potency based on the positioning statement, competitors, and P3 scores",
  "strategic_moat_score": <number 1-10>,
  "strategic_moat_narrative": "1-2 paragraphs on strategic moat strength",
  "raps_narrative": "2 paragraphs explaining the RAPS score and what it means for revenue achievement",
  "raps_why_factors": ["bullet 1 explaining a key score driver", "bullet 2", "bullet 3"],
  "raps_must_improve": ["specific actionable improvement 1", "improvement 2", "improvement 3"],
  "raps_improvement_scenario": {
    "current": {"score": ${raps.score || 0}, "label": "${raps.label || 'N/A'}"},
    "improved": {"score": "<projected score if improvements are made>", "label": "<projected label>", "assumptions": "describe the realistic improvements assumed"}
  },
  "action_plan": {
    "phase1_title": "Critical Fixes (0-30 Days)",
    "phase1_items": [{"action": "action description", "pillar": "p4", "constraint_category": "sales_system", "priority": "critical"}],
    "phase2_title": "Important Improvements (30-60 Days)",
    "phase2_items": [{"action": "action description", "pillar": "p3", "constraint_category": "positioning_weakness", "priority": "high"}],
    "phase3_title": "Consolidation & Growth (60-90 Days)",
    "phase3_items": [{"action": "action description", "pillar": "p1", "constraint_category": "commercial_foundation", "priority": "medium"}]
  },
  "company_snapshot": {
    "company": "<company name>",
    "industry": "<industry>",
    "revenue_range": "<revenue range>",
    "sales_staff": "<number>",
    "sales_model": "<model>",
    "markets": "<primary markets>",
    "deal_size": "<typical deal size>",
    "sales_cycle": "<typical sales cycle>"
  },
  "growth_constraint_map": {
    "primary_constraint": "<pillar name>",
    "causal_chain": ["cause 1 description", "leads to cause 2", "leads to effect"],
    "downstream_impacts": ["impact on other pillars/metrics"]
  },
  "org_systems_readiness": "1-2 paragraphs summarizing P8 and P9 findings and their impact on growth system execution",
  "advisory_workstream": {
    "recommended_engagement": "<type of advisory engagement recommended>",
    "focus_areas": ["area 1", "area 2", "area 3"],
    "expected_outcomes": ["outcome 1", "outcome 2"]
  },
  "priority_actions_summary": {
    "fix_first": ["most critical action items from phase 1"],
    "fix_next": ["important items from phase 2"],
    "stabilise": ["consolidation items"],
    "protect": ["items to protect existing strengths (pillars scoring >=80)"]
  },
  "competitive_clarity": {
    "dimensions": {
      "clarity": "<score 1-10>",
      "specificity": "<score 1-10>",
      "buyer_relevance": "<score 1-10>",
      "differentiation": "<score 1-10>",
      "memorability": "<score 1-10>",
      "proof_tension": "<score 1-10>",
      "category_ownership": "<score 1-10>",
      "commercial_sharpness": "<score 1-10>"
    },
    "overall_score": "<average 1-10>",
    "positioning_rewrite": "recommended improved positioning statement",
    "white_space_insight": "1-2 sentences on untapped positioning opportunity"
  },
  "revenue_waterfall": {
    "target": "<number>",
    "invoiced": "<number>",
    "remaining": "<number>",
    "pipeline": "<number>",
    "expected_convertible": "<number>",
    "gap": "<number - remaining minus expected_convertible>"
  }
}

For raps_why_factors: provide 3-5 bullet points explaining the key drivers of the RAPS score (e.g. coverage ratio strength/weakness, time pressure, RAD modifier impact).
For raps_must_improve: provide 3-5 specific, actionable items the company must address to improve their revenue achievement probability.
For raps_improvement_scenario: provide a realistic scenario showing what score could be achieved with specific improvements. The improved score should be a number and label should follow: 75-100="High", 50-74="Moderate", 25-49="Low", <25="Very Low".

Each action item must be an object with: action (description string), pillar (e.g. 'p4'), constraint_category (e.g. 'sales_system', 'positioning_weakness', 'pipeline_constraint', etc.), and priority ('critical', 'high', or 'medium'). Link each action to the relevant pillar it addresses.

For company_snapshot: populate all fields directly from the screener data provided above (company name, industry, revenue range, sales staff, sales model, markets, deal size, sales cycle).
For growth_constraint_map: identify the lowest-scoring pillar as the primary constraint. Trace a causal chain showing how that weak pillar impacts downstream pillars and metrics. List downstream impacts on other pillars or revenue outcomes.
For org_systems_readiness: write 1-2 paragraphs summarizing the P8 (Organisational Alignment) and P9 (Systems Readiness & AI Transformation) findings and how they affect the company's ability to execute its growth system.
For advisory_workstream: recommend the type of advisory engagement (e.g. "90-day Revenue Architecture Sprint"), list 3 focus areas aligned to the weakest pillars, and describe 2 expected outcomes.
For priority_actions_summary: categorize the most important actions into fix_first (critical phase 1 items), fix_next (important phase 2 items), stabilise (consolidation items), and protect (items to safeguard pillars scoring >=80).
For competitive_clarity: score the company's positioning statement across 8 dimensions (clarity, specificity, buyer_relevance, differentiation, memorability, proof_tension, category_ownership, commercial_sharpness) on a 1-10 scale based on P3 diagnostic responses and the positioning statement. Calculate overall_score as the average. Provide a rewritten positioning statement and a white space insight.
For revenue_waterfall: use the RAPS data to populate target (revenue target), invoiced (revenue invoiced), remaining (target minus invoiced), pipeline (open pipeline value), expected_convertible (expected convertible revenue), and gap (remaining minus expected_convertible). Use raw numbers, not formatted strings.

IMPORTANT: Return ONLY the JSON object, no markdown code blocks or extra text.`

  const apiParams = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16384,
    system: 'You are a senior B2B revenue growth diagnostic expert. You produce executive-quality diagnostic reports for CEO/board-level audiences. Your analysis is sharp, data-driven, and actionable. You write in a professional consulting tone — direct, insightful, and strategic. Always return valid JSON.',
    messages: [{ role: 'user', content: prompt }],
  }

  // First attempt
  let response = await client.messages.create(apiParams)
  let text = response.content.filter(b => b.type === 'text').map(b => b.text).join('')

  try {
    return parseJsonResponse(text)
  } catch {
    // Retry once with explicit JSON reminder
    response = await client.messages.create({
      ...apiParams,
      messages: [
        { role: 'user', content: prompt },
        { role: 'assistant', content: text },
        { role: 'user', content: 'Your response was not valid JSON. Please return ONLY the raw JSON object with the exact keys specified above. No markdown, no code blocks, no explanation — just the JSON.' },
      ],
    })
    text = response.content.filter(b => b.type === 'text').map(b => b.text).join('')
    return parseJsonResponse(text)
  }
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
        {"name": "Economic Environment", "findings": ["finding 1", "finding 2", "finding 3"]},
        {"name": "Political & Regulatory", "findings": ["finding 1", "finding 2", "finding 3"]},
        {"name": "Geopolitical Factors", "findings": ["finding 1", "finding 2", "finding 3"]},
        {"name": "Socio-economic Trends", "findings": ["finding 1", "finding 2", "finding 3"]},
        {"name": "Industry Growth Outlook", "findings": ["finding 1", "finding 2", "finding 3"]}
      ],
      "growth_propensity": "High|Medium-High|Medium|Low",
      "key_drivers": "2-3 sentence summary of key growth drivers",
      "risks": "2-3 sentence summary of key risks",
      "strategic_implications": "2-3 sentence strategic recommendation"
    }
  ]
}

Return ONLY JSON, no markdown blocks.`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: 'You are a market research analyst specializing in B2B market intelligence. Provide data-driven market assessments using current information from web search. Return only valid JSON.',
      messages: [{ role: 'user', content: prompt }],
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 10 }],
    })

    const text = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('')

    return parseJsonResponse(text)
  } catch (searchErr) {
    // Web search tool not available on this plan — generate without it
    console.warn('Web search unavailable, generating market report without search:', searchErr.message)
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: 'You are a market research analyst specializing in B2B market intelligence. Provide data-driven market assessments based on your knowledge. Return only valid JSON.',
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('')

    return parseJsonResponse(text)
  }
}
