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
- Pipeline Coverage: ${screener.q16 || 'N/A'}
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
- RAPS Score: ${raps.score || 0}%
- Revenue Remaining: $${revenueRemaining}
- Months Remaining: ${raps.monthsRemaining || 0}
- Pipeline Coverage: ${raps.pipelineCoverage || 0}x
- Win Rate: ${winRate}%

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
  "raps_improvement_scenario": "1 paragraph describing a specific improvement scenario",
  "action_plan": {
    "phase1_title": "Critical Fixes (0-30 Days)",
    "phase1_items": ["action 1", "action 2", "action 3"],
    "phase2_title": "Important Improvements (30-60 Days)",
    "phase2_items": ["action 1", "action 2", "action 3"],
    "phase3_title": "Consolidation & Growth (60-90 Days)",
    "phase3_items": ["action 1", "action 2", "action 3"]
  }
}

IMPORTANT: Return ONLY the JSON object, no markdown code blocks or extra text.`

  const apiParams = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
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
